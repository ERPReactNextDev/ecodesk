"use client";

import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { type DateRange } from "react-day-picker";

interface Activity {
  agent?: string;
  referenceid?: string;
  date_created?: string;
  wrap_up?: string;
  so_amount?: number | string;
  status?: string;
  tsa_acknowledge_date?: string;
  ticket_endorsed?: string;
  tsa_handling_time?: string; // new
  ticket_received?: string; // new
  remarks?: string; // new
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

  const isDateInRange = (dateStr?: string, range?: DateRange) => {
    if (!range || !dateStr) return true;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const from = range.from ? new Date(range.from.setHours(0, 0, 0, 0)) : null;
    const to = range.to ? new Date(range.to.setHours(23, 59, 59, 999)) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

  const groupedAgents = useMemo(() => {
    const map: Record<
      string,
      {
        agentName: string;
        salesCount: number;
        nonSalesCount: number;
        amount: number;
        convertedSalesCount: number;
        responseTimes: number[];
        quotationHandlingTimes: number[]; // new
        nonQuotationHandlingTimes: number[]; // NEW
        spfHandlingTimes: number[]; // ✅ NEW

      }
    > = {};

    activities
      .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
      .forEach((a) => {
        const agentObj = agents.find((ag) => ag.ReferenceID === a.agent);
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
            quotationHandlingTimes: [], // new
            nonQuotationHandlingTimes: [],
            spfHandlingTimes: [],
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

        if (a.tsa_acknowledge_date && a.ticket_endorsed) {
          const ack = new Date(a.tsa_acknowledge_date).getTime();
          const end = new Date(a.ticket_endorsed).getTime();
          if (!isNaN(ack) && !isNaN(end) && ack >= end) {
            const diffHours = (ack - end) / (1000 * 60 * 60);
            map[a.agent || name].responseTimes.push(diffHours);
          }
        }

        // Compute Quotation Handling Time
        if (
          a.tsa_handling_time &&
          a.ticket_received &&
          (a.remarks === "Quotation For Approval" || a.remarks === "Sold")
        ) {
          const tsaTime = new Date(a.tsa_handling_time).getTime();
          const ticketReceived = new Date(a.ticket_received).getTime();
          if (!isNaN(tsaTime) && !isNaN(ticketReceived) && tsaTime >= ticketReceived) {
            const diffHours = (tsaTime - ticketReceived) / (1000 * 60 * 60);
            map[a.agent || name].quotationHandlingTimes.push(diffHours);
          }
        }

        // Compute Non-Quotation Handling Time
        if (
          a.tsa_handling_time &&
          a.ticket_received &&
          a.remarks &&
          a.remarks !== "Quotation For Approval" &&
          a.remarks !== "Sold" &&
          a.remarks !== "For SPF"
        ) {
          const tsaTime = new Date(a.tsa_handling_time).getTime();
          const ticketReceived = new Date(a.ticket_received).getTime();
          if (!isNaN(tsaTime) && !isNaN(ticketReceived) && tsaTime >= ticketReceived) {
            const diffHours = (tsaTime - ticketReceived) / (1000 * 60 * 60);
            map[a.agent || name].nonQuotationHandlingTimes.push(diffHours);
          }
        }

        // ✅ Compute SPF Handling Duration
        if (
          a.tsa_handling_time &&
          a.ticket_received &&
          a.remarks === "For SPF"
        ) {
          const tsaTime = new Date(a.tsa_handling_time).getTime();
          const ticketReceived = new Date(a.ticket_received).getTime();
          if (!isNaN(tsaTime) && !isNaN(ticketReceived) && tsaTime >= ticketReceived) {
            const diffHours = (tsaTime - ticketReceived) / (1000 * 60 * 60);
            map[a.agent || name].spfHandlingTimes.push(diffHours);
          }
        }
      });

    return Object.values(map)
      .filter((a) => a.agentName.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((a) => {
        const avgResponseTime =
          a.responseTimes.length > 0
            ? a.responseTimes.reduce((sum, t) => sum + t, 0) / a.responseTimes.length
            : 0;

        const avgQuotationHandlingTime =
          a.quotationHandlingTimes.length > 0
            ? a.quotationHandlingTimes.reduce((sum, t) => sum + t, 0) / a.quotationHandlingTimes.length
            : 0;

        const avgNonQuotationHandlingTime =
          a.nonQuotationHandlingTimes.length > 0
            ? a.nonQuotationHandlingTimes.reduce((sum, t) => sum + t, 0) /
            a.nonQuotationHandlingTimes.length
            : 0;

        const avgSPFHandlingTime =
          a.spfHandlingTimes.length > 0
            ? a.spfHandlingTimes.reduce((sum, t) => sum + t, 0) /
            a.spfHandlingTimes.length
            : 0;

        return { ...a, avgResponseTime, avgQuotationHandlingTime, avgNonQuotationHandlingTime, avgSPFHandlingTime };
      });
  }, [activities, agents, dateCreatedFilterRange, searchTerm]);

  function formatHoursToHMS(hoursDecimal: number) {
    const totalSeconds = Math.round(hoursDecimal * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const totalSales = groupedAgents.reduce((sum, a) => sum + a.salesCount, 0);
  const totalNonSales = groupedAgents.reduce((sum, a) => sum + a.nonSalesCount, 0);
  const totalAmount = groupedAgents.reduce((sum, a) => sum + a.amount, 0);
  const totalConvertedSales = groupedAgents.reduce((sum, a) => sum + a.convertedSalesCount, 0);
  const totalInquiryToSalesPercent =
    totalSales > 0 ? (totalConvertedSales / totalSales) * 100 : 0;

  const allTSAResponseTimes = groupedAgents.flatMap(
    (a) => a.responseTimes ?? []
  );

  const avgTSAResponseTime =
    allTSAResponseTimes.length > 0
      ? allTSAResponseTimes.reduce((sum, t) => sum + t, 0) /
      allTSAResponseTimes.length
      : 0;

  const allQuotationHandlingTimes = groupedAgents.flatMap(
    (a) => a.quotationHandlingTimes ?? []
  );

  const avgQuotationHandlingTime =
    allQuotationHandlingTimes.length > 0
      ? allQuotationHandlingTimes.reduce((sum, t) => sum + t, 0) /
      allQuotationHandlingTimes.length
      : 0;

  const allNonQuotationHandlingTimes = groupedAgents.flatMap(
    (a) => a.nonQuotationHandlingTimes ?? []
  );

  const avgNonQuotationHandlingTime =
    allNonQuotationHandlingTimes.length > 0
      ? allNonQuotationHandlingTimes.reduce((sum, t) => sum + t, 0) /
      allNonQuotationHandlingTimes.length
      : 0;

  const allSPFHandlingTimes = groupedAgents.flatMap(
    (a) => a.spfHandlingTimes ?? []
  );

  const avgSPFHandlingTime =
    allSPFHandlingTimes.length > 0
      ? allSPFHandlingTimes.reduce((sum, t) => sum + t, 0) /
      allSPFHandlingTimes.length
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <CardTitle>Agent List</CardTitle>
        <input
          type="text"
          placeholder="Search Agent..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </CardHeader>

      <CardContent>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && groupedAgents.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Agent Name</TableHead>
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

            <TableBody>
              <TableRow className="font-semibold bg-muted/20">
                <TableCell>-</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>{totalSales}</TableCell>
                <TableCell>{totalNonSales}</TableCell>
                <TableCell>{totalSales + totalNonSales}</TableCell>
                <TableCell>
                  ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{totalConvertedSales}</TableCell>
                <TableCell>{totalInquiryToSalesPercent.toFixed(2)}%</TableCell>
                <TableCell>{formatHoursToHMS(avgTSAResponseTime)}</TableCell>
                <TableCell>{formatHoursToHMS(avgNonQuotationHandlingTime)}</TableCell>
                <TableCell>{formatHoursToHMS(avgQuotationHandlingTime)}</TableCell>
                <TableCell>{formatHoursToHMS(avgSPFHandlingTime)}</TableCell>

              </TableRow>

              {groupedAgents.map((a, index) => {
                const inquiryToSalesPercent =
                  a.salesCount > 0 ? (a.convertedSalesCount / a.salesCount) * 100 : 0;
                return (
                  <TableRow key={a.agentName}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{a.agentName}</TableCell>
                    <TableCell>{a.salesCount}</TableCell>
                    <TableCell>{a.nonSalesCount}</TableCell>
                    <TableCell>{a.salesCount + a.nonSalesCount}</TableCell>
                    <TableCell>
                      ₱{a.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{a.convertedSalesCount}</TableCell>
                    <TableCell>{inquiryToSalesPercent.toFixed(2)}%</TableCell>
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

        {!loading && !error && groupedAgents.length === 0 && <p>No agents found.</p>}
      </CardContent>
    </Card>
  );
});

export default AgentListCard;
