"use client";

import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "@/components/ui/table";
import { type DateRange } from "react-day-picker";
import { useImperativeHandle } from "react";

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
        setActivities(json.data || []);
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
        return {
          ...a,
          avgResponseTime: avg(a.responseTimes),
          avgQuotationHandlingTime: avg(a.quotationHandlingTimes),
          avgNonQuotationHandlingTime: avg(a.nonQuotationHandlingTimes),
          avgSPFHandlingTime: avg(a.spfHandlingTimes),
        };
      });
  }, [activities, agents, dateCreatedFilterRange, searchTerm]);

  const formatHoursToHMS = (hours: number) => {
    const totalSeconds = Math.round(hours * 3600); // ROUND instead of floor
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

    const rows = groupedManager.map((a, index) => {
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

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "tsm-sales-conversion.csv";
    link.click();

    URL.revokeObjectURL(url);
  },
}));

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <CardTitle>TSM's and Other Manager List</CardTitle>
        <input
          type="text"
          placeholder="Search Manager..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </CardHeader>

      <CardContent>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && groupedManager.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-30">#</TableHead>
                <TableHead className="sticky left-[20px] bg-white z-30 border-r">TSM Name</TableHead>
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

            <TableHeader className="font-semibold bg-muted/80 border-b">
              <TableCell className="sticky left-0 bg-white z-30">-</TableCell>
              <TableCell className="sticky left-[20px] bg-white z-30 border-r">Total</TableCell>
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
              <TableCell>{formatHoursToHMS(avgTSAResponseTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgNonQuotationHandlingTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgQuotationHandlingTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgSPFHandlingTime)}</TableCell>
            </TableHeader>

            <TableBody>
              {groupedManager.map((a, index) => {
                const inquiryToSalesPercent = a.salesCount > 0 ? (a.convertedSalesCount / a.salesCount) * 100 : 0;
                return (
                  <TableRow key={a.agentName}>
                    <TableCell className="sticky left-0 bg-white z-20">{index + 1}</TableCell>
                    <TableCell className="sticky left-[20px] bg-white z-20 uppercase border-r">{a.agentName}</TableCell>
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
                    <TableCell>{formatHoursToHMS(a.avgResponseTime)}</TableCell>
                    <TableCell>{formatHoursToHMS(a.avgNonQuotationHandlingTime)}</TableCell>
                    <TableCell>{formatHoursToHMS(a.avgQuotationHandlingTime)}</TableCell>
                    <TableCell>{formatHoursToHMS(a.avgSPFHandlingTime)}</TableCell>
                  </TableRow>
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
