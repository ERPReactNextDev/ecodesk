"use client";

import React, { useState, useEffect, useMemo, forwardRef, ForwardRefRenderFunction, useImperativeHandle } from "react";
import { Info } from "lucide-react";

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
import { downloadStyledWorkbookFromCsv } from "@/lib/download-styled-workbook";
import { normalizeName } from "@/lib/name-utils";

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
    agent_id?: string;
    date_created?: string;
    so_amount?: number | string;
    qty_sold?: number | string;
    wrap_up?: string;
    status: string;
}

interface Agent {
    ReferenceID: string;
    Firstname: string;
    Lastname: string;
}

interface AgentSalesWeeklyCardProps {
    activities: Activity[];
    loading: boolean;
    error: string | null;
    selectedMonth: number;
    selectedYear: number;
    selectedWeeks: number[];
}

export interface AgentSalesWeeklyCardRef {
  downloadCSV: () => void;
}

/* ---------------- Helpers ---------------- */
function formatDateKey(dateStr: string) {
    return new Date(dateStr).toISOString().slice(0, 10);
}

function getWeekFromDate(dateStr: string) {
    const date = new Date(dateStr);
    const dayOfMonth = date.getDate();
    if (dayOfMonth <= 7) return 1;
    if (dayOfMonth <= 14) return 2;
    if (dayOfMonth <= 21) return 3;
    if (dayOfMonth <= 28) return 4;
    return 5;
}

function isDateInMonthYear(dateStr: string | undefined, month: number, year: number) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === month && d.getFullYear() === year;
}

function safeNumber(value?: string | number): number {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
}

/* ---------------- Component ---------------- */
const AgentSalesTableWeeklyCard: ForwardRefRenderFunction<
    AgentSalesWeeklyCardRef,
    AgentSalesWeeklyCardProps
> = ({ activities, loading, error, selectedMonth, selectedYear, selectedWeeks }, ref) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

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

    /* ---------------- Group Activities ---------------- */
    const groupedData = useMemo(() => {
        if (agentsLoading) return [];

        const map: Record<
            string,
            {
                name: string;
                week1: number;
                week2: number;
                week3: number;
                week4: number;
                week5: number;
                total: number;
                qtySold: number;
                convertedCount: number;
            }
        > = {};

        activities
            .filter((a) => a.date_created && isDateInMonthYear(a.date_created, selectedMonth, selectedYear))
            .forEach((a) => {
                const agent = agents.find((ag) => ag.ReferenceID === a.referenceid);
                const agentName = agent ? `${normalizeName(agent.Firstname)} ${normalizeName(agent.Lastname)}` : a.referenceid ?? "Unknown";

                const week = getWeekFromDate(a.date_created!);
                const amount = safeNumber(a.so_amount);
                const qty = safeNumber(a.qty_sold);

                if (!map[agentName]) {
                    map[agentName] = {
                        name: agentName,
                        week1: 0,
                        week2: 0,
                        week3: 0,
                        week4: 0,
                        week5: 0,
                        total: 0,
                        qtySold: 0,
                        convertedCount: 0,
                    };
                }

                // Add to weekly amount only if week is selected
                if (week && selectedWeeks.includes(week)) {
                    const key = `week${week}` as "week1" | "week2" | "week3" | "week4" | "week5";
                    map[agentName][key] += amount;
                    map[agentName].qtySold += qty;
                    map[agentName].total += amount;

                    // Count converted sales
                    const statusNormalized = a.status?.trim().toLowerCase();
                    if (statusNormalized === "converted into sales") {
                        map[agentName].convertedCount++;
                    }
                }
            });

        return Object.values(map);
    }, [activities, agents, agentsLoading, selectedMonth, selectedYear, selectedWeeks]);

    const totalSoAmount = groupedData.reduce((sum, r) => sum + r.total, 0);

const downloadCSV = () => {
  if (!groupedData.length) return;

  const headers = [
    "Rank",
    "Agent",
    ...selectedWeeks.map(w => `Week ${w}`),
    "Total",
    "QTY Sold",
    "Converted Sales",
  ];

  const rows = groupedData.map((r, index) => [
    index + 1,
    r.name,
    ...selectedWeeks.map(w => r[`week${w}` as keyof typeof r] as number),
    r.total,
    r.qtySold,
    r.convertedCount,
  ]);

  const csv = [
    ["Month", selectedMonth + 1].join(","),
    ["Year", selectedYear].join(","),
    [],
    headers.join(","),
    ...rows.map((r) => r.join(",")),
    [],
    [
      "TOTAL",
      "",
      ...selectedWeeks.map(w => groupedData.reduce((sum, r) => sum + (r[`week${w}` as keyof typeof r] as number), 0)),
      groupedData.reduce((sum, r) => sum + r.total, 0),
      groupedData.reduce((sum, r) => sum + r.qtySold, 0),
      groupedData.reduce((sum, r) => sum + r.convertedCount, 0),
    ].join(","),
  ].join("\n");

  downloadStyledWorkbookFromCsv(csv, "weekly-agent-sales-conversion.xlsx");
};

useImperativeHandle(ref, () => ({
  downloadCSV() {
    if (!groupedData || groupedData.length === 0) return;

    const weekHeaders = selectedWeeks.map(w => `Week ${w}`);
    const rows = groupedData.map((r, index) => ({
      Rank: index + 1,
      Agent: r.name,
      ...Object.fromEntries(selectedWeeks.map(w => [`Week ${w}`, r[`week${w}` as keyof typeof r] as number])),
      Total: r.total,
      "QTY Sold": r.qtySold,
      "Converted Sales": r.convertedCount,
    }));

    const headers = [
      "Rank",
      "Agent",
      ...weekHeaders,
      "Total",
      "QTY Sold",
      "Converted Sales",
    ];

    // DATE FILTER TEXT (same logic as TSA export)
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

    const from = firstDay.toLocaleDateString();
    const to = lastDay.toLocaleDateString();

    const filterText = `${from} - ${to}`;

    // TOTAL ROW
    const totalRow = [
      "",
      "TOTAL",
      ...selectedWeeks.map(w => groupedData.reduce((sum, r) => sum + (r[`week${w}` as keyof typeof r] as number), 0)),
      groupedData.reduce((sum, r) => sum + r.total, 0),
      groupedData.reduce((sum, r) => sum + r.qtySold, 0),
      groupedData.reduce((sum, r) => sum + r.convertedCount, 0),
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

    downloadStyledWorkbookFromCsv(csv, "weekly-agent-sales-conversion.xlsx");
  },
}));

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
            <CardHeader className="flex justify-between items-center pb-3">
                <CardTitle className="text-lg font-semibold">Weekly Agent Sales Conversion</CardTitle>
                <div
                    className="relative cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <Info size={18} />
                    {showTooltip && (
                        <TooltipInfo>
                            Weekly sales amount based on assigned weeks from the custom mapping.
                        </TooltipInfo>
                    )}
                </div>
            </CardHeader>

            <CardContent className="overflow-auto pb-3">
                {(loading || agentsLoading) && <p className="text-sm text-muted-foreground">Loading...</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}

                {!loading && !agentsLoading && groupedData.length > 0 && (
                    <Table className="min-w-[1200px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 z-30">#</TableHead>
                                <TableHead className="sticky left-[50px] z-30">Agent</TableHead>
                                {selectedWeeks.includes(1) && <TableHead className="text-right">Week 1</TableHead>}
                                {selectedWeeks.includes(2) && <TableHead className="text-right">Week 2</TableHead>}
                                {selectedWeeks.includes(3) && <TableHead className="text-right">Week 3</TableHead>}
                                {selectedWeeks.includes(4) && <TableHead className="text-right">Week 4</TableHead>}
                                {selectedWeeks.includes(5) && <TableHead className="text-right">Week 5</TableHead>}
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">QTY Sold</TableHead>
                                <TableHead className="text-right">Converted Sales</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {groupedData.map((row, index) => (
                                <TableRow key={row.name}>
                                    <TableCell className="sticky left-0 z-20">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[50px] z-20">{row.name}</TableCell>
                                    {selectedWeeks.includes(1) && <TableCell className="text-right">{row.week1.toLocaleString()}</TableCell>}
                                    {selectedWeeks.includes(2) && <TableCell className="text-right">{row.week2.toLocaleString()}</TableCell>}
                                    {selectedWeeks.includes(3) && <TableCell className="text-right">{row.week3.toLocaleString()}</TableCell>}
                                    {selectedWeeks.includes(4) && <TableCell className="text-right">{row.week4.toLocaleString()}</TableCell>}
                                    {selectedWeeks.includes(5) && <TableCell className="text-right">{row.week5.toLocaleString()}</TableCell>}
                                    <TableCell className="text-right">{row.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">{row.qtySold.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{row.convertedCount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>

                        <tfoot>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell className="sticky left-0 z-20">Total</TableCell>
                                <TableCell className="sticky left-[50px] z-20">-</TableCell>
                                {selectedWeeks.includes(1) && <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week1, 0).toLocaleString()}</TableCell>}
                                {selectedWeeks.includes(2) && <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week2, 0).toLocaleString()}</TableCell>}
                                {selectedWeeks.includes(3) && <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week3, 0).toLocaleString()}</TableCell>}
                                {selectedWeeks.includes(4) && <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week4, 0).toLocaleString()}</TableCell>}
                                {selectedWeeks.includes(5) && <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week5, 0).toLocaleString()}</TableCell>}
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.qtySold, 0).toLocaleString()}</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.convertedCount, 0).toLocaleString()}</TableCell>
                            </TableRow>
                        </tfoot>
                    </Table>
                )}
            </CardContent>

            <Separator className="my-2" />

            <CardFooter className="flex justify-end pt-3">
                <Badge className="h-12 min-w-12 rounded-full px-4 font-mono tabular-nums text-lg font-semibold bg-primary/10 text-primary border-primary/20">
                    Total Amount: ₱{totalSoAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Badge>
            </CardFooter>
        </Card>
    );
};

export default forwardRef(AgentSalesTableWeeklyCard);