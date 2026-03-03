"use client";

import React, { useState, useEffect, useMemo, forwardRef, ForwardRefRenderFunction } from "react";
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
    customWeekMapping: { [date: string]: number | undefined };
}

export interface AgentSalesWeeklyCardRef { }

/* ---------------- Helpers ---------------- */
function formatDateKey(dateStr: string) {
    return new Date(dateStr).toISOString().slice(0, 10);
}

function getWeekFromMapping(dateStr: string, mapping: { [date: string]: number | undefined }) {
    return mapping[formatDateKey(dateStr)] ?? undefined;
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
> = ({ activities, loading, error, selectedMonth, selectedYear, customWeekMapping }, ref) => {
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
                total: number;
                qtySold: number;
                convertedCount: number;
                unassigned: number;
            }
        > = {};

        activities
            .filter((a) => a.date_created && isDateInMonthYear(a.date_created, selectedMonth, selectedYear))
            .forEach((a) => {
                const agent = agents.find((ag) => ag.ReferenceID === a.referenceid);
                const agentName = agent ? `${agent.Firstname} ${agent.Lastname}` : a.referenceid ?? "Unknown";

                const week = getWeekFromMapping(a.date_created!, customWeekMapping);
                const amount = safeNumber(a.so_amount);
                const qty = safeNumber(a.qty_sold);

                if (!map[agentName]) {
                    map[agentName] = {
                        name: agentName,
                        week1: 0,
                        week2: 0,
                        week3: 0,
                        week4: 0,
                        total: 0,
                        qtySold: 0,
                        convertedCount: 0,
                        unassigned: 0,
                    };
                }

                // Add to weekly amount
                if (week && week >= 1 && week <= 4) {
                    const key = `week${week}` as "week1" | "week2" | "week3" | "week4";
                    map[agentName][key] += amount;

                    // ✅ Count qtySold only if it belongs to a week
                    map[agentName].qtySold += qty;
                } else {
                    map[agentName].unassigned += amount;
                }

                map[agentName].total += amount;

                // ✅ Only count converted sales if it belongs to an assigned week
                const statusNormalized = a.status?.trim().toLowerCase();
                if (statusNormalized === "converted into sales") {
                    if (week && week >= 1 && week <= 4) map[agentName].convertedCount++;
                }
            });

        return Object.values(map);
    }, [activities, agents, agentsLoading, selectedMonth, selectedYear, customWeekMapping]);

    const totalSoAmount = groupedData.reduce((sum, r) => sum + r.total, 0);

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
                            Weekly sales amount based on assigned weeks from the custom mapping.
                        </TooltipInfo>
                    )}
                </div>
            </CardHeader>

            <CardContent className="overflow-auto">
                {(loading || agentsLoading) && <p>Loading...</p>}
                {error && <p className="text-destructive">{error}</p>}

                {!loading && !agentsLoading && groupedData.length > 0 && (
                    <Table className="min-w-[1200px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-white z-30">#</TableHead>
                                <TableHead className="sticky left-[50px] bg-white z-30">Agent</TableHead>
                                <TableHead className="text-right">Week 1</TableHead>
                                <TableHead className="text-right">Week 2</TableHead>
                                <TableHead className="text-right">Week 3</TableHead>
                                <TableHead className="text-right">Week 4</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">QTY Sold</TableHead>
                                <TableHead className="text-right">Converted Sales</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {groupedData.map((row, index) => (
                                <TableRow key={row.name}>
                                    <TableCell className="sticky left-0 bg-white z-20">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[50px] bg-white z-20">{row.name}</TableCell>
                                    <TableCell className="text-right">{row.week1}</TableCell>
                                    <TableCell className="text-right">{row.week2}</TableCell>
                                    <TableCell className="text-right">{row.week3}</TableCell>
                                    <TableCell className="text-right">{row.week4}</TableCell>
                                    <TableCell className="text-right">{row.total}</TableCell>
                                    <TableCell className="text-right">{row.qtySold}</TableCell>
                                    <TableCell className="text-right">{row.convertedCount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>

                        <tfoot>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell className="sticky left-0 bg-white z-20">Total</TableCell>
                                <TableCell className="sticky left-[50px] bg-white z-20">-</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week1, 0)}</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week2, 0)}</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week3, 0)}</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.week4, 0)}</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.total, 0)}</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.qtySold, 0)}</TableCell>
                                <TableCell className="text-right">{groupedData.reduce((sum, r) => sum + r.convertedCount, 0)}</TableCell>
                            </TableRow>
                        </tfoot>
                    </Table>
                )}
            </CardContent>

            <Separator />

            <CardFooter className="flex justify-end">
                <Badge className="h-10 px-4 font-mono">
                    Total Amount: ₱{totalSoAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Badge>
            </CardFooter>
        </Card>
    );
};

export default forwardRef(AgentSalesTableWeeklyCard);