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
  CardFooter,
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
  company_name?: string; // assumed to exist
  contact_person?: string;
}

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

interface AgentSalesConversionCardProps {
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
  userReferenceId: string;
  role: string;
}

export interface AgentSalesConversionCardRef {}

const CountTickets: ForwardRefRenderFunction<
  AgentSalesConversionCardRef,
  AgentSalesConversionCardProps
> = ({ dateCreatedFilterRange, userReferenceId, role }, ref) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // Track which agent is expanded
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      setAgentsLoading(true);

      try {
        const res = await fetch("/api/fetch-agent", {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || "Failed to fetch agents");
        }

        const json = await res.json();

        const agentsData = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];

        setAgents(agentsData);
      } catch (err) {
        console.error("Fetch agents error:", err);
        setAgents([]);
      } finally {
        setAgentsLoading(false);
      }
    }
    fetchAgents();
  }, []);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/act-fetch-agent-sales", {
          cache: "no-store",
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Failed to fetch activities");
        }
        const json = await res.json();
        setActivities(json.data || []);
      } catch (err: any) {
        setError(err.message || "Error fetching activities");
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  const isDateInRange = (dateStr?: string, range?: DateRange) => {
    if (!range) return true;
    if (!dateStr) return false;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    const { from, to } = range;

    if (from) {
      const fromStart = new Date(from);
      fromStart.setHours(0, 0, 0, 0);
      if (date < fromStart) return false;
    }

    if (to) {
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      if (date > toEnd) return false;
    }

    return true;
  };

  // Filtered activities by date and role
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (!isDateInRange(a.date_created, dateCreatedFilterRange)) return false;
      if (!a.referenceid || a.referenceid.trim() === "") return false;

      if (role !== "Admin") {
        return a.referenceid === userReferenceId;
      }

      return true;
    });
  }, [activities, dateCreatedFilterRange, role, userReferenceId]);

  // Group activities by agent referenceid and count tickets
  const groupedData = useMemo(() => {
    const map: Record<string, { referenceid: string; totalCount: number }> = {};

    filteredActivities.forEach((a) => {
      const referenceid = a.referenceid!.trim();

      if (!map[referenceid]) {
        map[referenceid] = {
          referenceid,
          totalCount: 0,
        };
      }

      map[referenceid].totalCount += 1;
    });

    return Object.values(map);
  }, [filteredActivities]);

  // Toggle expanded agent on row click
  const toggleExpand = (agentId: string) => {
    setExpandedAgentId((prev) => (prev === agentId ? null : agentId));
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>CSR Tickets Counts</CardTitle>
      </CardHeader>

      <CardContent>
        {!loading && !agentsLoading && !error && groupedData.length > 0 && (
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
                    const agent = agents.find(
                      (a) => a.ReferenceID === row.referenceid
                    );
                    const fullName = agent
                      ? `${agent.Firstname} ${agent.Lastname} ${agent.ReferenceID}`
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

                          <TableCell className="text-right">
                            {row.totalCount}
                          </TableCell>
                        </TableRow>

                        {isExpanded &&
                          filteredActivities
                            .filter((act) => act.referenceid === row.referenceid)
                            .map((act, i) => (
                              <TableRow
                                key={act.date_created + "-" + i}
                                className="bg-muted"
                              >
                                <TableCell />
                                <TableCell>
                                  {act.company_name || "(No company name)"}<br />
                                  {act.contact_person || "(No company name)"}
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

        {loading && <p>Loading activities...</p>}
        {agentsLoading && <p>Loading agents...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {!loading && !agentsLoading && groupedData.length === 0 && (
          <p>No activities found.</p>
        )}
      </CardContent>

      <Separator />
    </Card>
  );
};

export default forwardRef(CountTickets);
