"use client";

import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "@/components/ui/table";
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

  const groupedAgents = useMemo(() => {
    const map: Record<string, any> = {};

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
    const totalSeconds = Math.floor(hours * 3600); // NOT round
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
              <TableCell>-</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>{totalSales}</TableCell>
              <TableCell>{totalNonSales}</TableCell>
              <TableCell>{totalSales + totalNonSales}</TableCell>
              <TableCell>₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>{totalConvertedSales}</TableCell>
              <TableCell>{totalInquiryToSalesPercent.toFixed(2)}%</TableCell>
              <TableCell>{groupedAgents.reduce((sum, a) => sum + a.newClientCount, 0)}</TableCell>
              <TableCell>{groupedAgents.reduce((sum, a) => sum + a.newNonBuyingCount, 0)}</TableCell>
              <TableCell>{groupedAgents.reduce((sum, a) => sum + a.existingActiveCount, 0)}</TableCell>
              <TableCell>{groupedAgents.reduce((sum, a) => sum + a.existingInactiveCount, 0)}</TableCell>
              <TableCell>₱{groupedAgents.reduce((sum, a) => sum + a.newClientConvertedAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>₱{groupedAgents.reduce((sum, a) => sum + a.newNonBuyingConvertedAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>₱{groupedAgents.reduce((sum, a) => sum + a.existingActiveConvertedAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>₱{groupedAgents.reduce((sum, a) => sum + a.existingInactiveConvertedAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>{formatHoursToHMS(avgTSAResponseTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgNonQuotationHandlingTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgQuotationHandlingTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgSPFHandlingTime)}</TableCell>
            </TableHeader>

            <TableBody>
              {groupedAgents.map((a, index) => {
                const inquiryToSalesPercent = a.salesCount > 0 ? (a.convertedSalesCount / a.salesCount) * 100 : 0;
                return (
                  <TableRow key={a.agentName}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{a.agentName}</TableCell>
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

        {!loading && !error && groupedAgents.length === 0 && <p>No agents found.</p>}
      </CardContent>
    </Card>
  );
});

export default AgentListCard;
