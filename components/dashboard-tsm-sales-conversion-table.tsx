"use client";

import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "@/components/ui/table";
import { type DateRange } from "react-day-picker";
import { useImperativeHandle } from "react";
import { downloadStyledWorkbookFromCsv } from "@/lib/download-styled-workbook";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TicketHistoryDialog } from "@/components/ticket-history-dialog";

interface Activity {
  manager?: string;
  referenceid?: string;
  date_created?: string;
  wrap_up?: string;
  so_amount?: number | string;
  status?: string;
  tsa_acknowledge_date?: string;
  ticket_endorsed?: string;
  tsa_handling_time?: string;
  ticket_received?: string;
  remarks?: string;
  customer_status?: string;
  company_name?: string;
  ticket_reference_number?: string;
}

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

interface Props {
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  userReferenceId: string;
  role: string;
}

const SALES_WRAP_UPS = ["Customer Order", "Customer Inquiry Sales", "Follow Up Sales"];

const AgentListCard = forwardRef((_props: Props, ref) => {
  const { role, userReferenceId, dateCreatedFilterRange } = _props;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [companySearchTerm, setCompanySearchTerm] = useState<Record<string, string>>({});
  const [recordFilter, setRecordFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Activity | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/fetch-agent");
        const data = await res.json();
        setAgents(data);
      } catch (err: any) {
        setAgents([]);
        console.error("Failed to fetch agents:", err);
      }
    }
    fetchAgents();
  }, []);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      try {
        const res = await fetch("/api/act-fetch-activity-role", {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": role,
            "x-reference-id": userReferenceId,
          },
        });
        const json = await res.json();
        const filteredActivities = (json.data || []).filter((activity: Activity) => 
          activity.manager && activity.manager.trim() !== ""
        );
        setActivities(filteredActivities);
      } catch (err: any) {
        setError(err.message || "Failed to fetch activities");
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, [role, userReferenceId]);

  // ===== Utility: parse date with forced year 2026 if wrong =====
  const parseDateFixYear = (dateStr?: string) => {
    if (!dateStr) return new Date(NaN);
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date(NaN);
    if (d.getFullYear() < 2026) d.setFullYear(2026);
    return d;
  };

  const isDateInRange = (dateStr?: string, range?: DateRange) => {
    if (!range || !dateStr) return true;
    const date = parseDateFixYear(dateStr);
    if (isNaN(date.getTime())) return false;
    const from = range.from ? new Date(range.from.setHours(0, 0, 0, 0)) : null;
    const to = range.to ? new Date(range.to.setHours(23, 59, 59, 999)) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

  const TSA_RESPONSE_THRESHOLD = 10 / 60; // 10 minutes in hours
  const NON_QUOTATION_HT_THRESHOLD = 8; // 8 hours
  const QUOTATION_HT_THRESHOLD = 4; // 4 hours

  const groupedManager = useMemo(() => {
    const map: Record<string, any> = {};

    activities
      .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
      .forEach((a) => {
        const agentObj = agents.find((ag) => ag.ReferenceID === a.manager);
        const name = agentObj ? `${agentObj.Firstname} ${agentObj.Lastname}` : null;
        if (!name || name.toLowerCase() === "unknown") return;

        if (!map[a.manager || name]) {
          map[a.manager || name] = {
            agentName: name,
            salesCount: 0,
            nonSalesCount: 0,
            amount: 0,
            convertedSalesCount: 0,
            responseTimes: [],
            quotationHandlingTimes: [],
            nonQuotationHandlingTimes: [],
            spfHandlingTimes: [],
            newClientCount: 0,
            newNonBuyingCount: 0,
            existingActiveCount: 0,
            existingInactiveCount: 0,
            newClientConvertedAmount: 0,
            newNonBuyingConvertedAmount: 0,
            existingActiveConvertedAmount: 0,
            existingInactiveConvertedAmount: 0,
            companyTickets: [],
          };
        }

        const wrapUpNormalized = a.wrap_up?.trim() || "";
        if (SALES_WRAP_UPS.includes(wrapUpNormalized)) {
          map[a.manager || name].salesCount += 1;
        } else {
          map[a.manager || name].nonSalesCount += 1;
        }

        const amount = Number(a.so_amount) || 0;
        map[a.manager || name].amount += amount;

        if (a.status === "Converted into Sales") {
          map[a.manager || name].convertedSalesCount += 1;
        }

        switch (a.customer_status?.trim()) {
          case "New Client":
            map[a.manager || name].newClientCount += 1;
            if (a.status === "Converted into Sales") map[a.manager || name].newClientConvertedAmount += amount;
            break;
          case "New Non-Buying":
            map[a.manager || name].newNonBuyingCount += 1;
            if (a.status === "Converted into Sales") map[a.manager || name].newNonBuyingConvertedAmount += amount;
            break;
          case "Existing Active":
            map[a.manager || name].existingActiveCount += 1;
            if (a.status === "Converted into Sales") map[a.manager || name].existingActiveConvertedAmount += amount;
            break;
          case "Existing Inactive":
            map[a.manager || name].existingInactiveCount += 1;
            if (a.status === "Converted into Sales") map[a.manager || name].existingInactiveConvertedAmount += amount;
            break;
        }

        // Collect company and ticket reference information
        if (a.company_name && a.ticket_reference_number) {
          map[a.manager || name].companyTickets.push({
            company_name: a.company_name,
            ticket_reference_number: a.ticket_reference_number,
            activity: a,
          });
        }

        // ----- TSA Response Time -----
        if (a.tsa_acknowledge_date && a.ticket_endorsed) {
          const ack = parseDateFixYear(a.tsa_acknowledge_date).getTime();
          const end = parseDateFixYear(a.ticket_endorsed).getTime();
          if (!isNaN(ack) && !isNaN(end) && ack >= end) {
            map[a.manager || name].responseTimes.push((ack - end) / (1000 * 60 * 60));
          }
        }

        // ----- Quotation / Non-Quotation / SPF Handling -----
        const tsaTime = parseDateFixYear(a.tsa_handling_time).getTime();
        const ticketReceived = parseDateFixYear(a.ticket_received).getTime();
        if (!isNaN(tsaTime) && !isNaN(ticketReceived) && tsaTime >= ticketReceived) {
          const diffHours = (tsaTime - ticketReceived) / (1000 * 60 * 60);

          const remarksLower = a.remarks?.trim().toLowerCase();
          const nonQuotationRemarks = [
            "no stocks / insufficient stocks",
            "item not carried",
            "unable to contact customer",
            "customer request cancellation",
            "accreditation / partnership",
            "no response for client",
            "assisted",
            "dissaproved quotation",
            "for site visit",
            "non standard item",
            "po received",
            "not converted to sales",
            "for occular inspection",
            "waiting for client confirmation",
            "pending quotation"
          ];

          if (remarksLower === "quotation for approval" || remarksLower === "sold") {
            map[a.manager || name].quotationHandlingTimes.push(diffHours);
          } else if (remarksLower === "for spf") {
            map[a.manager || name].spfHandlingTimes.push(diffHours);
          } else if (remarksLower && nonQuotationRemarks.includes(remarksLower)) {
            map[a.manager || name].nonQuotationHandlingTimes.push(diffHours);
          }
        }
      });

    return Object.values(map)
      .filter((a) => a.agentName.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((a) => {
        const avg = (arr: number[]) =>
          arr.length > 0 ? arr.reduce((sum, t) => sum + t, 0) / arr.length : 0;
        const avgResponseTime = avg(a.responseTimes);
        const avgQuotationHandlingTime = avg(a.quotationHandlingTimes);
        const avgNonQuotationHandlingTime = avg(a.nonQuotationHandlingTimes);
        return {
          ...a,
          avgResponseTime,
          avgQuotationHandlingTime,
          avgNonQuotationHandlingTime,
          avgSPFHandlingTime: avg(a.spfHandlingTimes),
        };
      })
      .filter((a) => {
        if (recordFilter === "all") return true;
        if (recordFilter === "clean") {
          return a.avgResponseTime <= TSA_RESPONSE_THRESHOLD &&
                 a.avgNonQuotationHandlingTime <= NON_QUOTATION_HT_THRESHOLD &&
                 a.avgQuotationHandlingTime <= QUOTATION_HT_THRESHOLD;
        }
        if (recordFilter === "tsa-response") {
          return a.avgResponseTime > TSA_RESPONSE_THRESHOLD;
        }
        if (recordFilter === "non-quotation") {
          return a.avgNonQuotationHandlingTime > NON_QUOTATION_HT_THRESHOLD;
        }
        if (recordFilter === "quotation") {
          return a.avgQuotationHandlingTime > QUOTATION_HT_THRESHOLD;
        }
        return true;
      })
  }, [activities, agents, dateCreatedFilterRange, searchTerm, recordFilter]);

  const formatHoursToHMS = (hours: number) => {
    const totalSeconds = Math.round(hours * 3600); // ROUND instead of floor
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getTextColorClass = (value: number, threshold: number, columnName: string) => {
    if (recordFilter === "clean") return "";
    if (recordFilter === "all") {
      return value > threshold ? "text-red-600 font-semibold" : "";
    }
    // For specific filters, only highlight the matching column
    if (recordFilter === "tsa-response" && columnName === "TSA Response Time") {
      return value > threshold ? "text-red-600 font-semibold" : "";
    }
    if (recordFilter === "non-quotation" && columnName === "Non-Quotation HT") {
      return value > threshold ? "text-red-600 font-semibold" : "";
    }
    if (recordFilter === "quotation" && columnName === "Quotation HT") {
      return value > threshold ? "text-red-600 font-semibold" : "";
    }
    return "";
  };

  const shouldHighlightRow = (avgResponseTime: number, avgQuotationHandlingTime: number, avgNonQuotationHandlingTime: number) => {
    const TSA_RESPONSE_THRESHOLD = 10 / 60; // 0:10:00 in hours
    const QUOTATION_HT_THRESHOLD = 4; // 4:00:00 in hours
    const NON_QUOTATION_HT_THRESHOLD = 8; // 8:00:00 in hours

    return avgResponseTime >= TSA_RESPONSE_THRESHOLD ||
           avgQuotationHandlingTime >= QUOTATION_HT_THRESHOLD ||
           avgNonQuotationHandlingTime >= NON_QUOTATION_HT_THRESHOLD;
  };

  const toggleRow = (agentName: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(agentName)) {
        newSet.delete(agentName);
      } else {
        newSet.add(agentName);
      }
      return newSet;
    });
  };

  const totalSales = groupedManager.reduce((sum, a) => sum + a.salesCount, 0);
  const totalNonSales = groupedManager.reduce((sum, a) => sum + a.nonSalesCount, 0);
  const totalAmount = groupedManager.reduce((sum, a) => sum + a.amount, 0);
  const totalConvertedSales = groupedManager.reduce((sum, a) => sum + a.convertedSalesCount, 0);
  const totalInquiryToSalesPercent = totalSales > 0 ? (totalConvertedSales / totalSales) * 100 : 0;

  const AVERAGE = (values: number[]): number =>
    values.length ? values.reduce((s: number, v: number) => s + v, 0) / values.length : 0;

  const avgTSAResponseTime = AVERAGE(
    groupedManager.map(a => a.avgResponseTime).filter(v => v > 0)
  );

  const avgQuotationHandlingTime = AVERAGE(
    groupedManager.map(a => a.avgQuotationHandlingTime).filter(v => v > 0)
  );

  const avgNonQuotationHandlingTime = AVERAGE(
    groupedManager.map(a => a.avgNonQuotationHandlingTime).filter(v => v > 0)
  );

  const avgSPFHandlingTime = AVERAGE(
    groupedManager.map(a => a.avgSPFHandlingTime).filter(v => v > 0)
  );

  useImperativeHandle(ref, () => ({
  downloadCSV() {
    if (!groupedManager || groupedManager.length === 0) return;

    const filteredData = groupedManager;

    const rows = filteredData.map((a, index) => {
      const inquiryToSalesPercent =
        a.salesCount > 0 ? (a.convertedSalesCount / a.salesCount) * 100 : 0;

      return {
        Rank: index + 1,
        "TSM Name": a.agentName,
        Sales: a.salesCount,
        "Non-Sales": a.nonSalesCount,
        Total: a.salesCount + a.nonSalesCount,
        Amount: a.amount,
        "Converted into Sales": a.convertedSalesCount,
        "% Inquiry to Sales": inquiryToSalesPercent.toFixed(2) + "%",

        "New Client": a.newClientCount,
        "New Non Buying": a.newNonBuyingCount,
        "Existing Active": a.existingActiveCount,
        "Existing Inactive": a.existingInactiveCount,

        "New Client (Converted)": a.newClientConvertedAmount,
        "New Non-Buying (Converted)": a.newNonBuyingConvertedAmount,
        "Existing Active (Converted)": a.existingActiveConvertedAmount,
        "Existing Inactive (Converted)": a.existingInactiveConvertedAmount,

        "TSA Response Time": formatHoursToHMS(a.avgResponseTime),
        "Non-Quotation HT": formatHoursToHMS(a.avgNonQuotationHandlingTime),
        "Quotation HT": formatHoursToHMS(a.avgQuotationHandlingTime),
        "SPF Handling Duration": formatHoursToHMS(a.avgSPFHandlingTime),
      };
    });

    const headers = [
      "Rank",
      "TSM Name",
      "Sales",
      "Non-Sales",
      "Total",
      "Amount",
      "Converted into Sales",
      "% Inquiry to Sales",
      "New Client",
      "New Non Buying",
      "Existing Active",
      "Existing Inactive",
      "New Client (Converted)",
      "New Non-Buying (Converted)",
      "Existing Active (Converted)",
      "Existing Inactive (Converted)",
      "TSA Response Time",
      "Non-Quotation HT",
      "Quotation HT",
      "SPF Handling Duration",
    ];

    let filterText = "All Dates";
    if (dateCreatedFilterRange?.from && dateCreatedFilterRange?.to) {
      const from = new Date(dateCreatedFilterRange.from).toLocaleDateString();
      const to = new Date(dateCreatedFilterRange.to).toLocaleDateString();
      filterText = `${from} - ${to}`;
    }

    const totalRow = [
      "",
      "TOTAL",
      totalSales,
      totalNonSales,
      totalSales + totalNonSales,
      totalAmount,
      totalConvertedSales,
      totalInquiryToSalesPercent.toFixed(2) + "%",

      groupedManager.reduce((sum, a) => sum + a.newClientCount, 0),
      groupedManager.reduce((sum, a) => sum + a.newNonBuyingCount, 0),
      groupedManager.reduce((sum, a) => sum + a.existingActiveCount, 0),
      groupedManager.reduce((sum, a) => sum + a.existingInactiveCount, 0),

      groupedManager.reduce((sum, a) => sum + a.newClientConvertedAmount, 0),
      groupedManager.reduce((sum, a) => sum + a.newNonBuyingConvertedAmount, 0),
      groupedManager.reduce((sum, a) => sum + a.existingActiveConvertedAmount, 0),
      groupedManager.reduce((sum, a) => sum + a.existingInactiveConvertedAmount, 0),

      formatHoursToHMS(avgTSAResponseTime),
      formatHoursToHMS(avgNonQuotationHandlingTime),
      formatHoursToHMS(avgQuotationHandlingTime),
      formatHoursToHMS(avgSPFHandlingTime),
    ];

    const csv = [
      ["Date Filter", filterText].join(","),
      [],
      headers.join(","),
      totalRow.join(","),
      ...rows.map((row) =>
        headers.map((h) => row[h as keyof typeof row]).join(",")
      ),
    ].join("\n");

    // Apply red font formatting based on current filter
    let downloadOptions;
    if (recordFilter === "all") {
      downloadOptions = {
        redFontColumns: ["TSA Response Time", "Non-Quotation HT", "Quotation HT"],
        thresholds: {
          "TSA Response Time": TSA_RESPONSE_THRESHOLD,
          "Non-Quotation HT": NON_QUOTATION_HT_THRESHOLD,
          "Quotation HT": QUOTATION_HT_THRESHOLD,
        },
      };
    } else if (recordFilter === "tsa-response") {
      downloadOptions = {
        redFontColumns: ["TSA Response Time"],
        thresholds: {
          "TSA Response Time": TSA_RESPONSE_THRESHOLD,
        },
      };
    } else if (recordFilter === "non-quotation") {
      downloadOptions = {
        redFontColumns: ["Non-Quotation HT"],
        thresholds: {
          "Non-Quotation HT": NON_QUOTATION_HT_THRESHOLD,
        },
      };
    } else if (recordFilter === "quotation") {
      downloadOptions = {
        redFontColumns: ["Quotation HT"],
        thresholds: {
          "Quotation HT": QUOTATION_HT_THRESHOLD,
        },
      };
    } else if (recordFilter === "clean") {
      downloadOptions = undefined;
    }

    downloadStyledWorkbookFromCsv(csv, "tsm-sales-conversion.xlsx", downloadOptions);
  },
}));

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <CardTitle>TSM's and Other Manager List</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={recordFilter}
            onChange={(e) => setRecordFilter(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Records</option>
            <option value="clean">Clean Records</option>
            <option value="tsa-response">TSA Response Time (&gt;10 min.)</option>
            <option value="non-quotation">Non-Quotation HT (&gt;8 hrs.)</option>
            <option value="quotation">Quotation HT (&gt;4 hrs.)</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && groupedManager.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-30">#</TableHead>
                <TableHead className="sticky left-5 bg-white z-30 border-r">TSM Name</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Non-Sales</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Converted into Sales</TableHead>
                <TableHead>% Inquiry to Sales</TableHead>
                <TableHead>New Client</TableHead>
                <TableHead>New Non Buying</TableHead>
                <TableHead>Existing Active</TableHead>
                <TableHead>Existing Inactive</TableHead>
                <TableHead>New Client (Converted)</TableHead>
                <TableHead>New Non-Buying (Converted)</TableHead>
                <TableHead>Existing Active (Converted)</TableHead>
                <TableHead>Existing Inactive (Converted)</TableHead>
                <TableHead>TSA Response Time</TableHead>
                <TableHead>Non-Quotation HT</TableHead>
                <TableHead>Quotation HT</TableHead>
                <TableHead>SPF Handling Duration</TableHead>
              </TableRow>
            </TableHeader>

            <TableRow className="font-semibold bg-muted/80 border-b">
              <TableCell className="sticky left-0 bg-white z-30">-</TableCell>
              <TableCell className="sticky left-5 bg-white z-30 border-r">Total</TableCell>
              <TableCell>{totalSales}</TableCell>
              <TableCell>{totalNonSales}</TableCell>
              <TableCell>{totalSales + totalNonSales}</TableCell>
              <TableCell>₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>{totalConvertedSales}</TableCell>
              <TableCell>{totalInquiryToSalesPercent.toFixed(2)}%</TableCell>
              <TableCell>{groupedManager.reduce((sum, a) => sum + a.newClientCount, 0)}</TableCell>
              <TableCell>{groupedManager.reduce((sum, a) => sum + a.newNonBuyingCount, 0)}</TableCell>
              <TableCell>{groupedManager.reduce((sum, a) => sum + a.existingActiveCount, 0)}</TableCell>
              <TableCell>{groupedManager.reduce((sum, a) => sum + a.existingInactiveCount, 0)}</TableCell>
              <TableCell>₱{groupedManager.reduce((sum, a) => sum + a.newClientConvertedAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>₱{groupedManager.reduce((sum, a) => sum + a.newNonBuyingConvertedAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>₱{groupedManager.reduce((sum, a) => sum + a.existingActiveConvertedAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>₱{groupedManager.reduce((sum, a) => sum + a.existingInactiveConvertedAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className={getTextColorClass(avgTSAResponseTime, TSA_RESPONSE_THRESHOLD, "TSA Response Time")}>{formatHoursToHMS(avgTSAResponseTime)}</TableCell>
              <TableCell className={getTextColorClass(avgNonQuotationHandlingTime, NON_QUOTATION_HT_THRESHOLD, "Non-Quotation HT")}>{formatHoursToHMS(avgNonQuotationHandlingTime)}</TableCell>
              <TableCell className={getTextColorClass(avgQuotationHandlingTime, QUOTATION_HT_THRESHOLD, "Quotation HT")}>{formatHoursToHMS(avgQuotationHandlingTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgSPFHandlingTime)}</TableCell>
            </TableRow>

            <TableBody>
              {groupedManager.map((a, index) => {
                const inquiryToSalesPercent = a.salesCount > 0 ? (a.convertedSalesCount / a.salesCount) * 100 : 0;
                const isExpanded = expandedRows.has(a.agentName);
                return (
                  <React.Fragment key={a.agentName}>
                    <TableRow key={a.agentName} className="group">
                      <TableCell className="sticky left-0 bg-white z-20">{index + 1}</TableCell>
                      <TableCell className={`sticky left-5 z-20 uppercase border-r bg-white`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRow(a.agentName)}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            <span>{a.agentName}</span>
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>{a.salesCount}</TableCell>
                      <TableCell>{a.nonSalesCount}</TableCell>
                      <TableCell>{a.salesCount + a.nonSalesCount}</TableCell>
                      <TableCell>₱{a.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>{a.convertedSalesCount}</TableCell>
                      <TableCell>{inquiryToSalesPercent.toFixed(2)}%</TableCell>
                      <TableCell>{a.newClientCount}</TableCell>
                      <TableCell>{a.newNonBuyingCount}</TableCell>
                      <TableCell>{a.existingActiveCount}</TableCell>
                      <TableCell>{a.existingInactiveCount}</TableCell>
                      <TableCell>₱{a.newClientConvertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>₱{a.newNonBuyingConvertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>₱{a.existingActiveConvertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>₱{a.existingInactiveConvertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className={getTextColorClass(a.avgResponseTime, TSA_RESPONSE_THRESHOLD, "TSA Response Time")}>{formatHoursToHMS(a.avgResponseTime)}</TableCell>
                      <TableCell className={getTextColorClass(a.avgNonQuotationHandlingTime, NON_QUOTATION_HT_THRESHOLD, "Non-Quotation HT")}>{formatHoursToHMS(a.avgNonQuotationHandlingTime)}</TableCell>
                      <TableCell className={getTextColorClass(a.avgQuotationHandlingTime, QUOTATION_HT_THRESHOLD, "Quotation HT")}>{formatHoursToHMS(a.avgQuotationHandlingTime)}</TableCell>
                      <TableCell>{formatHoursToHMS(a.avgSPFHandlingTime)}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={21} className="bg-gray-50 p-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-700">Companies & Ticket References:</h4>
                            {a.companyTickets && a.companyTickets.length > 0 ? (
                              <>
                                <input
                                  type="text"
                                  placeholder="Search companies..."
                                  value={companySearchTerm[a.agentName] || ''}
                                  onChange={(e) => setCompanySearchTerm(prev => ({ ...prev, [a.agentName]: e.target.value }))}
                                  className="border rounded-md px-3 py-2 text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="max-h-60 overflow-y-auto border rounded-md bg-white">
                                  {a.companyTickets
                                    .filter((ticket: any) => 
                                      ticket.company_name.toLowerCase().includes((companySearchTerm[a.agentName] || '').toLowerCase()) ||
                                      ticket.ticket_reference_number.toLowerCase().includes((companySearchTerm[a.agentName] || '').toLowerCase())
                                    )
                                    .map((ticket: any, idx: number) => (
                                      <div key={idx} className="p-3 border-b last:border-b-0 hover:bg-gray-50 flex flex-col items-start">
                                        <div className="font-medium text-sm">{ticket.company_name}</div>
                                        <div className="text-gray-600 text-xs">{ticket.ticket_reference_number}</div>
                                        <TicketHistoryDialog item={ticket.activity} />
                                      </div>
                                    ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-gray-500 text-sm">No company data available</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!loading && !error && groupedManager.length === 0 && <p>No agents found.</p>}
      </CardContent>
    </Card>
  );
});

export default AgentListCard;
