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
        <div className="absolute top-full mt-1 w-80 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
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

    useEffect(() => {
        async function fetchAgents() {
            setAgentsLoading(true);
            try {
                const res = await fetch("/api/fetch-agent");
                if (!res.ok) throw new Error("Failed to fetch agents");
                const data = await res.json();
                setAgents(data);
            } catch (err) {
                console.error(err);
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
                        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
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

        if (from && date < new Date(from.setHours(0, 0, 0, 0))) return false;
        if (to && date > new Date(to.setHours(23, 59, 59, 999))) return false;

        return true;
    };

    const groupedData = useMemo(() => {
        const map: Record<
            string,
            { referenceid: string; salesCount: number; nonSalesCount: number; convertedCount: number; amount: number; qtySold: number }
        > = {};

        activities
            .filter(
                (a) =>
                    isDateInRange(a.date_created, dateCreatedFilterRange) &&
                    a.referenceid &&
                    a.referenceid.trim() !== "" &&
                    (!a.remarks || !["po received"].includes(a.remarks.toLowerCase()))
            )
            .forEach((a) => {
                const referenceid = a.referenceid!.trim();
                const soAmount = Number(a.so_amount ?? 0);
                const traffic = a.traffic?.toLowerCase() ?? "";
                const qtySold = Number(a.qty_sold ?? 0);
                const status = a.status?.toLowerCase() ?? "";

                if (!map[referenceid]) {
                    map[referenceid] = { referenceid, salesCount: 0, nonSalesCount: 0, convertedCount: 0, amount: 0, qtySold: 0 };
                }

                if (traffic === "sales") {
                    map[referenceid].salesCount += 1;
                } else if (traffic === "non-sales") {
                    map[referenceid].nonSalesCount += 1;
                }

                if (status === "converted into sales") {
                    map[referenceid].convertedCount += 1;
                }

                map[referenceid].amount += isNaN(soAmount) ? 0 : soAmount;
                map[referenceid].qtySold += isNaN(qtySold) ? 0 : qtySold;
            });

        return Object.values(map);
    }, [activities, dateCreatedFilterRange]);

    const totalSoAmount = groupedData.reduce((sum, row) => sum + row.amount, 0);

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Agent Sales Conversion Table</CardTitle>

                <div
                    className="relative cursor-pointer text-muted-foreground hover:text-foreground"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    aria-label="Agent sales conversion info"
                >
                    <Info size={18} />
                    {showTooltip && (
                        <TooltipInfo>
                            This list shows total sales amount and count per agent within the
                            selected date range, excluding remarks "PO Received".
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
                                    <TableHead>Agent Name</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="text-right">Non-Sales</TableHead>
                                    <TableHead className="text-right">QTY Sold</TableHead>
                                    <TableHead className="text-right">Converted Sales</TableHead>
                                    <TableHead className="text-right">% Conversion Inquiry to Sales</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedData
                                    .slice()
                                    .sort((a, b) => b.amount - a.amount)
                                    .map(({ referenceid, salesCount, nonSalesCount, convertedCount, amount, qtySold }, index) => {
                                        const agent = agents.find((a) => a.ReferenceID === referenceid);
                                        const fullName = agent ? `${agent.Firstname} ${agent.Lastname}` : "(Unknown Agent)";
                                        const rank = index + 1;

                                        return (
                                            <TableRow key={referenceid} className="hover:bg-muted/50">
                                                <TableCell className="font-medium text-center">{rank}</TableCell>
                                                <TableCell className="capitalize">{fullName}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{salesCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{nonSalesCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{qtySold.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{convertedCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">
                                                    {salesCount === 0
                                                        ? "0.00%"
                                                        : ((convertedCount / salesCount) * 100).toFixed(2) + "%"}
                                                </TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">
                                                    {amount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
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
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {(() => {
                                            const totalSales = groupedData.reduce((sum, row) => sum + row.salesCount, 0);
                                            const totalConverted = groupedData.reduce((sum, row) => sum + row.convertedCount, 0);
                                            if (totalSales === 0) return "0.00%";
                                            return ((totalConverted / totalSales) * 100).toFixed(2) + "%";
                                        })()}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {totalSoAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
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
                    Total Amount:{" "}
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
