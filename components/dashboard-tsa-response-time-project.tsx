"use client";

import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { type DateRange } from "react-day-picker";
import { useImperativeHandle } from "react";
import { downloadStyledWorkbookFromCsv } from "@/lib/download-styled-workbook";

interface Activity {
  agent?: string;
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
  type_of_sales?: string;
}

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
  type_of_sales?: string;
}

interface Props {
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  userReferenceId: string;
  role: string;
}

const SALES_WRAP_UPS = ["Customer Order", "Customer Inquiry Sales", "Follow Up Sales"];

const TSAResponseTimeProjectCard = forwardRef((_props: Props, ref) => {
  const { role, userReferenceId, dateCreatedFilterRange } = _props;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordFilter, setRecordFilter] = useState<string>("all");

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
          activity.agent && activity.agent.trim() !== ""
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

  const groupedAgents = useMemo(() => {
    const map: Record<string, any> = {};

    activities
      .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
      .forEach((a) => {
        // Filter by type_of_sales = PROJECT
        const agentObj = agents.find((ag) => ag.ReferenceID === a.agent);
        const typeOfSales = agentObj?.type_of_sales?.toUpperCase() || "PROJECT";
        
        if (typeOfSales !== "PROJECT") return;

        const name = agentObj ? `${agentObj.Firstname} ${agentObj.Lastname}` : null;
        if (!name || name.toLowerCase() === "unknown") return;

        if (!map[a.agent || name]) {
          map[a.agent || name] = {
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
          };
        }

        const wrapUpNormalized = a.wrap_up?.trim() || "";
        if (SALES_WRAP_UPS.includes(wrapUpNormalized)) {
          map[a.agent || name].salesCount += 1;
        } else {
          map[a.agent || name].nonSalesCount += 1;
        }

        const amount = Number(a.so_amount) || 0;
        map[a.agent || name].amount += amount;

        if (a.status === "Converted into Sales") {
          map[a.agent || name].convertedSalesCount += 1;
        }

        switch (a.customer_status?.trim()) {
          case "New Client":
            map[a.agent || name].newClientCount += 1;
            if (a.status === "Converted into Sales") map[a.agent || name].newClientConvertedAmount += amount;
            break;
          case "New Non-Buying":
            map[a.agent || name].newNonBuyingCount += 1;
            if (a.status === "Converted into Sales") map[a.agent || name].newNonBuyingConvertedAmount += amount;
            break;
          case "Existing Active":
            map[a.agent || name].existingActiveCount += 1;
            if (a.status === "Converted into Sales") map[a.agent || name].existingActiveConvertedAmount += amount;
            break;
          case "Existing Inactive":
            map[a.agent || name].existingInactiveCount += 1;
            if (a.status === "Converted into Sales") map[a.agent || name].existingInactiveConvertedAmount += amount;
            break;
        }

        // ----- TSA Response Time -----
        if (a.tsa_acknowledge_date && a.ticket_endorsed) {
          const ack = parseDateFixYear(a.tsa_acknowledge_date).getTime();
          const end = parseDateFixYear(a.ticket_endorsed).getTime();
          if (!isNaN(ack) && !isNaN(end) && ack >= end) {
            map[a.agent || name].responseTimes.push((ack - end) / (1000 * 60 * 60));
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
            map[a.agent || name].quotationHandlingTimes.push(diffHours);
          } else if (remarksLower === "for spf") {
            map[a.agent || name].spfHandlingTimes.push(diffHours);
          } else if (remarksLower && nonQuotationRemarks.includes(remarksLower)) {
            map[a.agent || name].nonQuotationHandlingTimes.push(diffHours);
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
      });
  }, [activities, agents, dateCreatedFilterRange, searchTerm, recordFilter]);

  const formatHoursToHMS = (hours: number) => {
    const totalSeconds = Math.round(hours * 3600);
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

  const totalSales = groupedAgents.reduce((sum, a) => sum + a.salesCount, 0);
  const totalNonSales = groupedAgents.reduce((sum, a) => sum + a.nonSalesCount, 0);
  const totalAmount = groupedAgents.reduce((sum, a) => sum + a.amount, 0);
  const totalConvertedSales = groupedAgents.reduce((sum, a) => sum + a.convertedSalesCount, 0);
  const totalInquiryToSalesPercent = totalSales > 0 ? (totalConvertedSales / totalSales) * 100 : 0;

  const AVERAGE = (values: number[]): number =>
    values.length ? values.reduce((s: number, v: number) => s + v, 0) / values.length : 0;

  const avgTSAResponseTime = AVERAGE(
    groupedAgents.map(a => a.avgResponseTime).filter(v => v > 0)
  );

  const avgQuotationHandlingTime = AVERAGE(
    groupedAgents.map(a => a.avgQuotationHandlingTime).filter(v => v > 0)
  );

  const avgNonQuotationHandlingTime = AVERAGE(
    groupedAgents.map(a => a.avgNonQuotationHandlingTime).filter(v => v > 0)
  );

  const avgSPFHandlingTime = AVERAGE(
    groupedAgents.map(a => a.avgSPFHandlingTime).filter(v => v > 0)
  );

  useImperativeHandle(ref, () => ({
  downloadCSV() {
    if (!groupedAgents || groupedAgents.length === 0) return;

    const rows = groupedAgents.map((a, index) => {
      const inquiryToSalesPercent =
        a.salesCount > 0 ? (a.convertedSalesCount / a.salesCount) * 100 : 0;

      return {
        Rank: index + 1,
        "TSA Name": a.agentName,
        Sales: a.salesCount,
        "Non-Sales": a.nonSalesCount,
        Total: a.salesCount + a.nonSalesCount,
        Amount: a.amount,
        "Converted into Sales": a.convertedSalesCount,
        "% Inquiry to Sales": inquiryToSalesPercent.toFixed(2) + "%",
        "TSA Response Time": formatHoursToHMS(a.avgResponseTime),
        "Non-Quotation HT": formatHoursToHMS(a.avgNonQuotationHandlingTime),
        "Quotation HT": formatHoursToHMS(a.avgQuotationHandlingTime),
        "SPF Handling Duration": formatHoursToHMS(a.avgSPFHandlingTime),
      };
    });

    const headers = [
      "Rank",
      "TSA Name",
      "Sales",
      "Non-Sales",
      "Total",
      "Amount",
      "Converted into Sales",
      "% Inquiry to Sales",
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
      formatHoursToHMS(avgTSAResponseTime),
      formatHoursToHMS(avgNonQuotationHandlingTime),
      formatHoursToHMS(avgQuotationHandlingTime),
      formatHoursToHMS(avgSPFHandlingTime),
    ];

    const csv = [
      ["Date Filter", filterText],
      ["Type", "PROJECT"],
      [],
      headers.join(","),
      totalRow.join(","),
      ...rows.map((row) =>
        headers.map((h) => row[h as keyof typeof row]).join(",")
      ),
    ].join("\n");

    const downloadOptions = {
      redFontColumns: ["TSA Response Time", "Non-Quotation HT", "Quotation HT"],
      thresholds: {
        "TSA Response Time": TSA_RESPONSE_THRESHOLD,
        "Non-Quotation HT": NON_QUOTATION_HT_THRESHOLD,
        "Quotation HT": QUOTATION_HT_THRESHOLD,
      },
    };

    downloadStyledWorkbookFromCsv(csv, "tsa-response-time-project.xlsx", downloadOptions);
  },
}));

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <CardTitle>Average Response Time Per TSA (Project)</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search TSA..."
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
        {!loading && !error && groupedAgents.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-30">#</TableHead>
                <TableHead className="sticky left-5 z-30 border-r">TSA Name</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Non-Sales</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Converted into Sales</TableHead>
                <TableHead>% Inquiry to Sales</TableHead>
                <TableHead>TSA Response Time</TableHead>
                <TableHead>Non-Quotation HT</TableHead>
                <TableHead>Quotation HT</TableHead>
                <TableHead>SPF Handling Duration</TableHead>
              </TableRow>
            </TableHeader>

            <TableRow className="font-semibold bg-muted/80 border-b">
              <TableCell className="sticky left-0 z-30">-</TableCell>
              <TableCell className="sticky left-5 z-30 border-r">Total</TableCell>
              <TableCell>{totalSales}</TableCell>
              <TableCell>{totalNonSales}</TableCell>
              <TableCell>{totalSales + totalNonSales}</TableCell>
              <TableCell>₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>{totalConvertedSales}</TableCell>
              <TableCell>{totalInquiryToSalesPercent.toFixed(2)}%</TableCell>
              <TableCell className={getTextColorClass(avgTSAResponseTime, TSA_RESPONSE_THRESHOLD, "TSA Response Time")}>{formatHoursToHMS(avgTSAResponseTime)}</TableCell>
              <TableCell className={getTextColorClass(avgNonQuotationHandlingTime, NON_QUOTATION_HT_THRESHOLD, "Non-Quotation HT")}>{formatHoursToHMS(avgNonQuotationHandlingTime)}</TableCell>
              <TableCell className={getTextColorClass(avgQuotationHandlingTime, QUOTATION_HT_THRESHOLD, "Quotation HT")}>{formatHoursToHMS(avgQuotationHandlingTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgSPFHandlingTime)}</TableCell>
            </TableRow>

            <TableBody>
              {groupedAgents.map((a, index) => {
                const inquiryToSalesPercent = a.salesCount > 0 ? (a.convertedSalesCount / a.salesCount) * 100 : 0;
                return (
                  <TableRow key={a.agentName}>
                    <TableCell className="sticky left-0 z-20">{index + 1}</TableCell>
                    <TableCell className={`sticky left-5 z-20 uppercase border-r`}>{a.agentName}</TableCell>
                    <TableCell>{a.salesCount}</TableCell>
                    <TableCell>{a.nonSalesCount}</TableCell>
                    <TableCell>{a.salesCount + a.nonSalesCount}</TableCell>
                    <TableCell>₱{a.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{a.convertedSalesCount}</TableCell>
                    <TableCell>{inquiryToSalesPercent.toFixed(2)}%</TableCell>
                    <TableCell className={getTextColorClass(a.avgResponseTime, TSA_RESPONSE_THRESHOLD, "TSA Response Time")}>{formatHoursToHMS(a.avgResponseTime)}</TableCell>
                    <TableCell className={getTextColorClass(a.avgNonQuotationHandlingTime, NON_QUOTATION_HT_THRESHOLD, "Non-Quotation HT")}>{formatHoursToHMS(a.avgNonQuotationHandlingTime)}</TableCell>
                    <TableCell className={getTextColorClass(a.avgQuotationHandlingTime, QUOTATION_HT_THRESHOLD, "Quotation HT")}>{formatHoursToHMS(a.avgQuotationHandlingTime)}</TableCell>
                    <TableCell>{formatHoursToHMS(a.avgSPFHandlingTime)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!loading && !error && groupedAgents.length === 0 && <p>No TSA found for Project sales.</p>}
      </CardContent>
    </Card>
  );
});

export default TSAResponseTimeProjectCard;
