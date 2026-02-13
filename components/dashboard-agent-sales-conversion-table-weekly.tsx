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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---------------- Tooltip ---------------- */
function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-80 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

/* ---------------- Interfaces ---------------- */
interface Activity {
  referenceid?: string;
  date_created?: string;
  date_updated?: string;
  so_amount?: number | string;
  remarks?: string;
  wrap_up?: string; // ✅ IMPORTANT
  qty_sold: number | string;
  status: string;
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
}

export interface AgentSalesConversionCardRef {}

/* ---------------- Helpers ---------------- */
function getWeekNumber(date: Date) {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function getSalesDate(a: any): Date | null {
  const raw =
    a.tsmHandlingTime ||
    a.tsm_handling_time ||
    a.ticketEndorsed ||
    a.ticket_endorsed ||
    a.date_updated;

  if (!raw) return null;

  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;

  return d;
}

/* ---------------- Component ---------------- */
const AgentSalesTableCard: ForwardRefRenderFunction<
  AgentSalesConversionCardRef,
  AgentSalesConversionCardProps
> = ({ dateCreatedFilterRange }, ref) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  /* -------- Fetch Agents -------- */
  useEffect(() => {
    async function fetchAgents() {
      setAgentsLoading(true);
      try {
        const res = await fetch("/api/fetch-agent");
        if (!res.ok) throw new Error("Failed to fetch agents");
        setAgents(await res.json());
      } catch {
        setAgents([]);
      } finally {
        setAgentsLoading(false);
      }
    }
    fetchAgents();
  }, []);

  /* -------- Fetch Activities -------- */
  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/act-fetch-agent-sales", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch activities");
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

  /* -------- Date Filter -------- */
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

  /* -------- Grouped Data -------- */
  const groupedData = useMemo(() => {
    const SALES_WRAP_UPS = [
      "customer order",
      "customer inquiry sales",
      "follow up sales",
    ];

    const map: Record<
      string,
      {
        referenceid: string;
        salesCount: number;
        nonSalesCount: number;
        convertedCount: number;
        qtySold: number;
        week1: number;
        week2: number;
        week3: number;
        week4: number;
      }
    > = {};

    activities
      .map((a) => ({ a, salesDate: getSalesDate(a) }))
      .filter(
        ({ a, salesDate }) =>
          salesDate &&
          isDateInRange(salesDate.toISOString(), dateCreatedFilterRange) &&
          a.referenceid
      )
      .forEach(({ a, salesDate }) => {
        const ref = a.referenceid!.trim();
        const amount = Number(a.so_amount ?? 0);
        const qty = Number(a.qty_sold ?? 0);
        const status = a.status?.toLowerCase() ?? "";
        const wrapUp = a.wrap_up?.toLowerCase().trim() ?? "";
        const week = getWeekNumber(salesDate!);

        if (!map[ref]) {
          map[ref] = {
            referenceid: ref,
            salesCount: 0,
            nonSalesCount: 0,
            convertedCount: 0,
            qtySold: 0,
            week1: 0,
            week2: 0,
            week3: 0,
            week4: 0,
          };
        }

        // ✅ SALES / NON-SALES RULES
        if (wrapUp === "po received") {
          map[ref].nonSalesCount++;
        } else if (SALES_WRAP_UPS.includes(wrapUp)) {
          map[ref].salesCount++;
        } else {
          map[ref].nonSalesCount++;
        }

        // ✅ CONVERTED SALES
        if (status === "converted into sales") {
          map[ref].convertedCount++;
          map[ref].qtySold += isNaN(qty) ? 0 : qty;

          if (!isNaN(amount)) {
            if (week === 1) map[ref].week1 += amount;
            if (week === 2) map[ref].week2 += amount;
            if (week === 3) map[ref].week3 += amount;
            if (week === 4) map[ref].week4 += amount;
          }
        }
      });

    return Object.values(map);
  }, [activities, dateCreatedFilterRange]);

  const totalSoAmount = groupedData.reduce(
    (sum, r) => sum + r.week1 + r.week2 + r.week3 + r.week4,
    0
  );

  /* ---------------- Render ---------------- */
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Weekly Agent Sales Conversion</CardTitle>

        <div
          className="relative cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              Weekly sales amount based on <b>date_updated</b>.
            </TooltipInfo>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {(loading || agentsLoading) && <p>Loading...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && groupedData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Non-Sales</TableHead>
                <TableHead className="text-right">QTY Sold</TableHead>
                <TableHead className="text-right">Converted Sales</TableHead>
                <TableHead className="text-right">Week 1</TableHead>
                <TableHead className="text-right">Week 2</TableHead>
                <TableHead className="text-right">Week 3</TableHead>
                <TableHead className="text-right">Week 4+</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupedData
                .sort(
                  (a, b) =>
                    b.week1 + b.week2 + b.week3 + b.week4 -
                    (a.week1 + a.week2 + a.week3 + a.week4)
                )
                .map((row, i) => {
                  const agent = agents.find(
                    (a) => a.ReferenceID === row.referenceid
                  );

                  return (
                    <TableRow key={row.referenceid}>
                      <TableCell>
                        <Badge className="h-10 min-w-10 rounded-full px-3 font-mono">
                          {i + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {agent
                          ? `${agent.Firstname} ${agent.Lastname}`
                          : "(Unknown)"}
                      </TableCell>
                      <TableCell className="text-right">{row.salesCount}</TableCell>
                      <TableCell className="text-right">
                        {row.nonSalesCount}
                      </TableCell>
                      <TableCell className="text-right">{row.qtySold}</TableCell>
                      <TableCell className="text-right">
                        {row.convertedCount}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{row.week1.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{row.week2.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{row.week3.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{row.week4.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-end">
        <Badge className="h-10 px-4 font-mono">
          Total Amount: ₱
          {totalSoAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </Badge>
      </CardFooter>
    </Card>
  );
};

export default forwardRef(AgentSalesTableCard);
