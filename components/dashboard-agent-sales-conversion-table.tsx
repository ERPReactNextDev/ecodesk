"use client";

import React, {
  useState,
  useMemo,
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
} from "react";
import { Info } from "lucide-react";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full right-0 mt-1 w-180 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

interface Activity {
  referenceid?: string;
  date_created?: string;
  so_amount?: number | string;
  remarks?: string;
  traffic: string;
  qty_sold: number | string;
  status: string;

  // from Sheet Ticket
  customer_status?: string;
  ticket_received?: string;
  ticket_endorsed?: string;
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

const MAX_RESPONSE_TIME_MS = 24 * 60 * 60 * 1000; // 24 hours

const AgentSalesTableCard: ForwardRefRenderFunction<
  AgentSalesConversionCardRef,
  AgentSalesConversionCardProps
> = ({ dateCreatedFilterRange, userReferenceId, role }, ref) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

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

        // Support both { data: [...] } and raw array
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

    // IMPORTANT: clone dates, DO NOT mutate originals
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

  const groupedData = useMemo(() => {
    const map: Record<
      string,
      {
        referenceid: string;
        salesCount: number;
        nonSalesCount: number;
        convertedCount: number;
        amount: number;
        qtySold: number;

        newClientSales: number;
        newNonBuyingSales: number;
        existingActiveSales: number;
        existingInactiveSales: number;

        responseTimeTotal: number;
        responseCount: number;
      }
    > = {};

    activities
      .filter((a) => {
        if (!isDateInRange(a.date_created, dateCreatedFilterRange))
          return false;
        if (!a.referenceid || a.referenceid.trim() === "") return false;

        if (role !== "Admin") {
          return a.referenceid === userReferenceId;
        }

        return true;
      })
      .forEach((a) => {
        const referenceid = a.referenceid!.trim();
        const soAmount = Number(a.so_amount ?? 0);
        const traffic = a.traffic?.toLowerCase() ?? "";
        const qtySold = Number(a.qty_sold ?? 0);
        const status = a.status?.toLowerCase() ?? "";
        const remarks = a.remarks?.toLowerCase() ?? "";
        const customerStatus = a.customer_status;
        const received = a.ticket_received;
        const endorsed = a.ticket_endorsed;

        if (!map[referenceid]) {
          map[referenceid] = {
            referenceid,
            salesCount: 0,
            nonSalesCount: 0,
            convertedCount: 0,
            amount: 0,
            qtySold: 0,

            newClientSales: 0,
            newNonBuyingSales: 0,
            existingActiveSales: 0,
            existingInactiveSales: 0,

            responseTimeTotal: 0,
            responseCount: 0,
          };
        }

        // Sales per customer status
        if (status === "converted into sales" && remarks !== "po received") {
          if (customerStatus === "New Client") {
            map[referenceid].newClientSales += isNaN(soAmount) ? 0 : soAmount;
          }

          if (customerStatus === "New Non-Buying") {
            map[referenceid].newNonBuyingSales += isNaN(soAmount)
              ? 0
              : soAmount;
          }

          if (customerStatus === "Existing Active") {
            map[referenceid].existingActiveSales += isNaN(soAmount)
              ? 0
              : soAmount;
          }

          if (customerStatus === "Existing Inactive") {
            map[referenceid].existingInactiveSales += isNaN(soAmount)
              ? 0
              : soAmount;
          }
        }

        // CSR RESPONSE TIME
        if (
          received &&
          endorsed &&
          isDateInRange(received, dateCreatedFilterRange) &&
          isDateInRange(endorsed, dateCreatedFilterRange)
        ) {
          const r = new Date(received);
          const e = new Date(endorsed);

          if (!isNaN(r.getTime()) && !isNaN(e.getTime()) && e >= r) {
            const diff = e.getTime() - r.getTime();
            if (diff <= MAX_RESPONSE_TIME_MS) {
              map[referenceid].responseTimeTotal += diff;
              map[referenceid].responseCount += 1;
            }
          }
        }

        // 🔒 NORMALIZE TRAFFIC (IMPORTANT)
        const normalizedTraffic = (a.traffic || "").toLowerCase().trim();

        // PO RECEIVED rule
        if (remarks === "po received") {
          // Always count as NON-SALES inquiry
          map[referenceid].nonSalesCount += 1;
        } else if (normalizedTraffic === "sales") {
          map[referenceid].salesCount += 1;
        } else {
          // 🔥 DEFAULT FALLBACK
          // Anything else = Non-Sales
          map[referenceid].nonSalesCount += 1;
        }

        // Conversion counting
        if (status === "converted into sales") {
          map[referenceid].convertedCount += 1;
          map[referenceid].amount += isNaN(soAmount) ? 0 : soAmount;
          map[referenceid].qtySold += isNaN(qtySold) ? 0 : qtySold;
        }
      });

    return Object.values(map);
  }, [activities, dateCreatedFilterRange, role, userReferenceId]);

  const totalSoAmount = groupedData.reduce((sum, row) => sum + row.amount, 0);
  const totalSales = groupedData.reduce((s, r) => s + r.salesCount, 0);
  const totalConverted = groupedData.reduce((s, r) => s + r.convertedCount, 0);
  const totalQty = groupedData.reduce((s, r) => s + r.qtySold, 0);
  const totalAmount = groupedData.reduce((s, r) => s + r.amount, 0);
  const totalNewClient = groupedData.reduce((s, r) => s + r.newClientSales, 0);
  const totalNewNonBuying = groupedData.reduce(
    (s, r) => s + r.newNonBuyingSales,
    0,
  );
  const totalExistingActive = groupedData.reduce(
    (s, r) => s + r.existingActiveSales,
    0,
  );
  const totalExistingInactive = groupedData.reduce(
    (s, r) => s + r.existingInactiveSales,
    0,
  );
  const totalResponseTime = groupedData.reduce(
    (s, r) => s + r.responseTimeTotal,
    0,
  );
  const totalResponseCount = groupedData.reduce(
    (s, r) => s + r.responseCount,
    0,
  );

  const totalConversionPct =
    totalSales === 0 ? 0 : (totalConverted / totalSales) * 100;

  const totalAveUnit = totalConverted === 0 ? 0 : totalQty / totalConverted;

  const totalAveValue = totalConverted === 0 ? 0 : totalAmount / totalConverted;

  const totalAveResponse =
    totalResponseCount === 0 ? 0 : totalResponseTime / totalResponseCount;

  const formatMs = (ms: number) => {
    const totalSeconds = Math.round(ms / 1000);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  const totalRowResponseAverage =
    totalResponseCount === 0 ? 0 : totalResponseTime / totalResponseCount;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>CSR Sales Conversion Table</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="Agent sales conversion info"
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              <div className="space-y-2">
                <p className="font-semibold">Column Computation Guide</p>

                <p>
                  <strong>Sales</strong> – Count of activities where traffic is{" "}
                  <em>Sales</em>.
                </p>

                <p>
                  <strong>Non-Sales</strong> – Count of activities where traffic
                  is <em>Non-Sales</em>.
                </p>

                <p>
                  <strong>QTY Sold</strong> – Total quantity sold per agent.
                </p>

                <p>
                  <strong>Converted Sales</strong> – Count of activities with
                  status Converted into Sales.
                </p>

                <p>
                  <strong>% Conversion Inquiry to Sales</strong> – (
                  <em>Converted Sales ÷ Sales</em>) × 100
                </p>

                <p>
                  <strong>Avg Transaction Unit</strong> – (
                  <em>QTY Sold ÷ Converted Sales</em>) × 100
                </p>

                <p>
                  <strong>Avg Transaction Value</strong> –
                  <em>Total Amount ÷ Converted Sales</em>
                </p>

                <p>
                  <strong>Total Amount</strong> – Sum of all sales order amounts
                  per agent.
                </p>

                <p className="italic text-xs">
                  Note: All computations exclude records with remark{" "}
                  <em>"PO Received"</em>
                  and are filtered by the selected date range.
                </p>
              </div>
            </TooltipInfo>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {(loading || agentsLoading) && <p>Loading data...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !agentsLoading && !error && groupedData.length === 0 && (
          <p className="text-muted-foreground">No data available.</p>
        )}

        {!loading && !agentsLoading && !error && groupedData.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>CSR</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Non-Sales</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">
                    Converted to Sale
                  </TableHead>
                  <TableHead className="text-right">% Conversion</TableHead>
                  <TableHead className="text-right">Ave. Unit</TableHead>
                  <TableHead className="text-right">Ave. Value</TableHead>
                  <TableHead className="text-right">New Client</TableHead>
                  <TableHead className="text-right">New-Non Buying</TableHead>
                  <TableHead className="text-right">Existing Active</TableHead>
                  <TableHead className="text-right">
                    Existing Inactive
                  </TableHead>
                  <TableHead className="text-right">
                    CSR Response Time
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {groupedData
                  .slice()
                  .sort((a, b) => b.amount - a.amount)
                  .map((row, index) => {
                    const agent = agents.find(
                      (a) => a.ReferenceID === row.referenceid,
                    );
                    const fullName = agent
                      ? `${agent.Firstname} ${agent.Lastname}`
                      : "(Unknown Agent)";

                    const avgResponse =
                      row.responseCount === 0
                        ? 0
                        : row.responseTimeTotal / row.responseCount;

                    return (
                      <TableRow key={row.referenceid}>
                        <TableCell className="text-center">
                          <Badge>{index + 1}</Badge>
                        </TableCell>

                        <TableCell>{fullName}</TableCell>

                        <TableCell className="text-right">
                          {row.salesCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.nonSalesCount}
                        </TableCell>

                        <TableCell className="text-right">
                          ₱{row.amount.toLocaleString()}
                        </TableCell>

                        <TableCell className="text-right">
                          {row.qtySold}
                        </TableCell>

                        <TableCell className="text-right">
                          {row.convertedCount}
                        </TableCell>

                        <TableCell className="text-right">
                          {row.salesCount === 0
                            ? "0.00%"
                            : (
                                (row.convertedCount / row.salesCount) *
                                100
                              ).toFixed(2) + "%"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.convertedCount === 0
                            ? "0.00"
                            : (row.qtySold / row.convertedCount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.convertedCount === 0
                            ? "0.00"
                            : (row.amount / row.convertedCount).toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right">
                          ₱{row.newClientSales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱{row.newNonBuyingSales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱{row.existingActiveSales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱{row.existingInactiveSales.toLocaleString()}
                        </TableCell>

                        <TableCell className="text-right">
                          {formatMs(avgResponse)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>

              <tfoot>
                <TableRow className="font-semibold bg-muted/40">
                  <TableCell />
                  <TableCell>Total</TableCell>

                  <TableCell className="text-right">{totalSales}</TableCell>
                  <TableCell className="text-right">
                    {groupedData.reduce((s, r) => s + r.nonSalesCount, 0)}
                  </TableCell>

                  <TableCell className="text-right">
                    ₱{totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{totalQty}</TableCell>
                  <TableCell className="text-right">{totalConverted}</TableCell>

                  <TableCell className="text-right">
                    {totalConversionPct.toFixed(2)}%
                  </TableCell>

                  <TableCell className="text-right">{totalAveUnit}</TableCell>

                  <TableCell className="text-right">
                    {totalAveValue.toFixed(2)}
                  </TableCell>

                  <TableCell className="text-right">
                    ₱{totalNewClient.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₱{totalNewNonBuying.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₱{totalExistingActive.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₱{totalExistingInactive.toLocaleString()}
                  </TableCell>

                  <TableCell className="text-right">
                    {formatMs(totalRowResponseAverage)}
                  </TableCell>
                </TableRow>
              </tfoot>
            </Table>
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-end">
        <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
          Total Amount: ₱
          {totalSoAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Badge>
      </CardFooter>
    </Card>
  );
};

export default forwardRef(AgentSalesTableCard);
