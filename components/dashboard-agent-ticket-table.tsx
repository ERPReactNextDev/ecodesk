"use client";

import React, {
  useState,
  useMemo,
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
} from "react";
import { type DateRange } from "react-day-picker";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Activity {
  referenceid?: string;
  date_created?: string;
  company_name?: string;
  contact_person?: string;
}

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

interface CountTicketsProps {
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
  userReferenceId: string;
  role: string;
}

export interface CountTicketsRef {}

const CountTickets: ForwardRefRenderFunction<CountTicketsRef, CountTicketsProps> =
  ({ dateCreatedFilterRange, role }, ref) => {
    // -----------------------------
    // 1️⃣ Render guard for Admin
    // -----------------------------
    if (role !== "Admin") return null; // only Admin can see the card

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [agents, setAgents] = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);

    const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

    // -----------------------------
    // 2️⃣ Fetch agents
    // -----------------------------
    useEffect(() => {
      async function fetchAgents() {
        setAgentsLoading(true);
        try {
          const res = await fetch("/api/fetch-agent", { cache: "no-store" });
          if (!res.ok) throw new Error("Failed to fetch agents");
          const json = await res.json();
          const agentsData = Array.isArray(json) ? json : json?.data ?? [];
          setAgents(agentsData);
        } catch (err) {
          console.error(err);
          setAgents([]);
        } finally {
          setAgentsLoading(false);
        }
      }
      fetchAgents();
    }, []);

    // -----------------------------
    // 3️⃣ Fetch activities
    // -----------------------------
    useEffect(() => {
      async function fetchActivities() {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/act-fetch-agent-sales", { cache: "no-store" });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json?.error || "Failed to fetch activities");
          }
          const json = await res.json();
          setActivities(json.data ?? []);
        } catch (err: any) {
          setError(err.message || "Error fetching activities");
        } finally {
          setLoading(false);
        }
      }
      fetchActivities();
    }, []);

    // -----------------------------
    // 4️⃣ Date filter helper
    // -----------------------------
    const isDateInRange = (dateStr?: string, range?: DateRange) => {
      if (!range) return true;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;

      const { from, to } = range;
      if (from && date < new Date(from.setHours(0, 0, 0, 0))) return false;
      if (to && date > new Date(to.setHours(23, 59, 59, 999))) return false;
      return true;
    };

    // -----------------------------
    // 5️⃣ Filter activities by date (all activities, Admin only)
    // -----------------------------
    const filteredActivities = useMemo(() => {
      return activities.filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange));
    }, [activities, dateCreatedFilterRange]);

    // -----------------------------
    // 6️⃣ Group activities by agent referenceid
    // -----------------------------
    const groupedData = useMemo(() => {
      const map: Record<string, { referenceid: string; totalCount: number }> = {};
      filteredActivities.forEach((a) => {
        const referenceid = a.referenceid!.trim();
        if (!map[referenceid]) {
          map[referenceid] = { referenceid, totalCount: 0 };
        }
        map[referenceid].totalCount += 1;
      });
      return Object.values(map);
    }, [filteredActivities]);

    const toggleExpand = (agentId: string) => {
      setExpandedAgentId((prev) => (prev === agentId ? null : agentId));
    };

    // -----------------------------
    // 7️⃣ Render component
    // -----------------------------
    return (
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>CSR Tickets Counts</CardTitle>
        </CardHeader>

        <CardContent>
          {loading && <p>Loading activities...</p>}
          {agentsLoading && <p>Loading agents...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {!loading && !agentsLoading && groupedData.length === 0 && (
            <p>No activities found.</p>
          )}

          {!loading && !agentsLoading && groupedData.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>CSR</TableHead>
                    <TableHead className="text-right">Count Ticket</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {groupedData
                    .slice()
                    .sort((a, b) => b.totalCount - a.totalCount)
                    .map((row, index) => {
                      const agent = agents.find((a) => a.ReferenceID === row.referenceid);
                      const fullName = agent
                        ? `${agent.Firstname} ${agent.Lastname} (${agent.ReferenceID})`
                        : "(Unknown Agent)";
                      const isExpanded = expandedAgentId === row.referenceid;

                      return (
                        <React.Fragment key={row.referenceid}>
                          <TableRow
                            className="cursor-pointer"
                            onClick={() => toggleExpand(row.referenceid)}
                          >
                            <TableCell className="text-center">
                              <Badge>{index + 1}</Badge>
                            </TableCell>

                            <TableCell>{fullName}</TableCell>
                            <TableCell className="text-right">{row.totalCount}</TableCell>
                          </TableRow>

                          {isExpanded &&
                            filteredActivities
                              .filter((act) => act.referenceid === row.referenceid)
                              .map((act, i) => (
                                <TableRow key={act.date_created + "-" + i} className="bg-muted">
                                  <TableCell />
                                  <TableCell>
                                    {act.company_name || "(No company name)"}<br />
                                    {act.contact_person || "(No contact person)"}
                                  </TableCell>
                                  <TableCell className="text-right">1</TableCell>
                                </TableRow>
                              ))}
                        </React.Fragment>
                      );
                    })}
                </TableBody>

                <tfoot>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-semibold">
                      Total Tickets:
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {groupedData.reduce((sum, row) => sum + row.totalCount, 0)}
                    </TableCell>
                  </TableRow>
                </tfoot>
              </Table>
            </div>
          )}
        </CardContent>

        <Separator />
      </Card>
    );
  };

export default forwardRef(CountTickets);