"use client";

import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { type DateRange } from "react-day-picker";

interface Activity {
  department_head?: string;
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

  // ===== Grouped by agentName only to avoid duplicates =====
  const groupedManager = useMemo(() => {
    const map: Record<string, any> = {};

    activities
      .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
      .forEach((a) => {
        const agentObj = agents.find((ag) => ag.ReferenceID === a.department_head);
        const name = agentObj ? `${agentObj.Firstname} ${agentObj.Lastname}` : a.department_head || "Unknown";
        const key = name.toLowerCase().trim();
        if (!map[key]) {
          map[key] = {
            agentName: name,
            responseTimes: [],
            quotationHandlingTimes: [],
            nonQuotationHandlingTimes: [],
            spfHandlingTimes: [],
          };
        }

        // TSA Response Time
        if (a.tsa_acknowledge_date && a.ticket_endorsed) {
          const ack = parseDateFixYear(a.tsa_acknowledge_date).getTime();
          const end = parseDateFixYear(a.ticket_endorsed).getTime();
          if (!isNaN(ack) && !isNaN(end) && ack >= end) {
            map[key].responseTimes.push((ack - end) / (1000 * 60 * 60));
          }
        }

        // Quotation / Non-Quotation / SPF Handling
        const tsaTime = parseDateFixYear(a.tsa_handling_time).getTime();
        const ticketReceived = parseDateFixYear(a.ticket_received).getTime();
        if (!isNaN(tsaTime) && !isNaN(ticketReceived) && tsaTime >= ticketReceived) {
          const diffHours = (tsaTime - ticketReceived) / (1000 * 60 * 60);
          const remarksLower = a.remarks?.trim().toLowerCase() || "";
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
            "pending quotation",
          ];

          if (remarksLower === "quotation for approval" || remarksLower === "sold") {
            map[key].quotationHandlingTimes.push(diffHours);
          } else if (remarksLower === "for spf") {
            map[key].spfHandlingTimes.push(diffHours);
          } else if (nonQuotationRemarks.includes(remarksLower)) {
            map[key].nonQuotationHandlingTimes.push(diffHours);
          }
        }
      });

    // Compute averages
    return Object.values(map).map((a) => {
      const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
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
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const AVERAGE = (values: number[]) =>
    values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;

  const avgTSAResponseTime = AVERAGE(groupedManager.map(a => a.avgResponseTime).filter(v => v > 0));
  const avgQuotationHandlingTime = AVERAGE(groupedManager.map(a => a.avgQuotationHandlingTime).filter(v => v > 0));
  const avgNonQuotationHandlingTime = AVERAGE(groupedManager.map(a => a.avgNonQuotationHandlingTime).filter(v => v > 0));

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <CardTitle>Departmental Heads</CardTitle>
        <input
          type="text"
          placeholder="Search Head..."
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
                <TableHead>#</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>TSA Response Time</TableHead>
                <TableHead>Non-Quotation HT</TableHead>
                <TableHead>Quotation HT</TableHead>
              </TableRow>
            </TableHeader>

            <TableHeader className="font-semibold bg-muted/80 border-b">
              <TableCell>-</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>{formatHoursToHMS(avgTSAResponseTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgNonQuotationHandlingTime)}</TableCell>
              <TableCell>{formatHoursToHMS(avgQuotationHandlingTime)}</TableCell>
            </TableHeader>

            <TableBody>
              {groupedManager.map((a, index) => (
                <TableRow key={a.agentName}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="uppercase">{a.agentName}</TableCell>
                  <TableCell>{formatHoursToHMS(a.avgResponseTime)}</TableCell>
                  <TableCell>{formatHoursToHMS(a.avgNonQuotationHandlingTime)}</TableCell>
                  <TableCell>{formatHoursToHMS(a.avgQuotationHandlingTime)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && !error && groupedManager.length === 0 && <p>No agents found.</p>}
      </CardContent>
    </Card>
  );
});

export default AgentListCard;
