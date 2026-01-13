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
    traffic: string;
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

export interface AgentSalesConversionCardRef { }

/* ---------------- Helpers ---------------- */
function getWeekNumber(date: Date) {
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
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
            .filter(
                (a) =>
                    isDateInRange(a.date_created, dateCreatedFilterRange) &&
                    a.referenceid &&
                    a.date_updated 
            )
            .forEach((a) => {
            const ref = a.referenceid!.trim();
            const amount = Number(a.so_amount ?? 0);
            const qty = Number(a.qty_sold ?? 0);
            const traffic = a.traffic?.toLowerCase() ?? "";
            const status = a.status?.toLowerCase() ?? "";
            const remarks = a.remarks?.toLowerCase() ?? "";
            const updatedDate = new Date(a.date_updated!);
            if (isNaN(updatedDate.getTime())) return;

            const week = getWeekNumber(updatedDate);

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

            // 🔥 PO RECEIVED → NON-SALES ONLY
            if (remarks === "po received") {
                map[ref].nonSalesCount++;
                return; // 🚫 no weekly revenue
            }

            if (traffic === "sales") map[ref].salesCount++;
            if (traffic === "non-sales") map[ref].nonSalesCount++;

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
                                        <TableRow key={row.referenceid} className="hover:bg-muted/50">
                                            <TableCell>
                                                <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">{i + 1}</Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {agent
                                                    ? `${agent.Firstname} ${agent.Lastname}`
                                                    : "(Unknown)"}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums text-right">
                                                {row.salesCount}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums text-right">
                                                {row.nonSalesCount}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums text-right">
                                                {row.qtySold}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums text-right">
                                                {row.convertedCount}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums text-right">
                                                ₱{row.week1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums text-right">
                                                ₱{row.week2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums text-right">
                                                ₱{row.week3.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="font-mono tabular-nums text-right">
                                                ₱{row.week4.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                        <tfoot>
                            <TableRow className="bg-muted/30 font-semibold">
                                <TableCell className="text-center">-</TableCell>
                                <TableCell className="text-right">Total</TableCell>
                                <TableCell className="font-mono tabular-nums text-right">
                                    {groupedData.reduce((sum, row) => sum + row.salesCount, 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-mono tabular-nums text-right">
                                    {groupedData.reduce((sum, row) => sum + row.nonSalesCount, 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-mono tabular-nums text-right">
                                    {groupedData.reduce((sum, row) => sum + row.qtySold, 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-mono tabular-nums text-right">
                                    {groupedData.reduce((sum, row) => sum + row.convertedCount, 0).toLocaleString()}
                                </TableCell>

                                {/* Week 1 Total */}
                                <TableCell className="font-mono tabular-nums text-right">
                                    ₱{groupedData.reduce((sum, row) => sum + row.week1, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>

                                {/* Week 2 Total */}
                                <TableCell className="font-mono tabular-nums text-right">
                                    ₱{groupedData.reduce((sum, row) => sum + row.week2, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>

                                {/* Week 3 Total */}
                                <TableCell className="font-mono tabular-nums text-right">
                                    ₱{groupedData.reduce((sum, row) => sum + row.week3, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>

                                {/* Week 4 Total */}
                                <TableCell className="font-mono tabular-nums text-right">
                                    ₱{groupedData.reduce((sum, row) => sum + row.week4, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        </tfoot>

                    </Table>
                )}
            </CardContent>

            <Separator />

            <CardFooter className="flex justify-end">
                <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                    Total Amount:{" "}
                    ₱{totalSoAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </Badge>
            </CardFooter>
        </Card>
    );
};

export default forwardRef(AgentSalesTableCard);
