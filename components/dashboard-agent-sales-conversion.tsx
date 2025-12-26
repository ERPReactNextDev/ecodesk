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
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemFooter,
    ItemHeader,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item";

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

const AgentSalesConversionCard: ForwardRefRenderFunction<
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
            { referenceid: string; count: number; amount: number }
        > = {};

        activities
            .filter(
                (a) =>
                    isDateInRange(a.date_created, dateCreatedFilterRange) &&
                    a.referenceid &&
                    a.referenceid.trim() !== "" &&
                    (!a.remarks ||
                        !["po received", "po received"].includes(a.remarks.toLowerCase()))
            )
            .forEach((a) => {
                const referenceid = a.referenceid!.trim();
                const soAmount = Number(a.so_amount ?? 0);

                if (!map[referenceid]) {
                    map[referenceid] = { referenceid, count: 0, amount: 0 };
                }

                map[referenceid].count += 1;
                map[referenceid].amount += isNaN(soAmount) ? 0 : soAmount;
            });

        return Object.values(map);
    }, [activities, dateCreatedFilterRange]);

    const totalSoAmount = groupedData.reduce((sum, row) => sum + row.amount, 0);

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Agent Sales Conversion</CardTitle>

                <div
                    className="relative cursor-pointer text-muted-foreground hover:text-foreground"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    aria-label="Agent sales conversion info"
                >
                    <Info size={18} />
                    {showTooltip && (
                        <TooltipInfo>
                            This list shows total sales amount and count per agent within
                            the selected date range, excluding remarks "PO Received".
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
                    <div className="flex flex-col space-y-2">
                        {groupedData
                            .slice() // clone so we don't mutate original
                            .sort((a, b) => b.amount - a.amount)
                            .map(({ referenceid, count, amount }, index) => {
                                const agent = agents.find((a) => a.ReferenceID === referenceid);
                                const fullName = agent
                                    ? `${agent.Firstname} ${agent.Lastname}`
                                    : "(Unknown Agent)";
                                const rank = index + 1;

                                return (
                                    <Item key={referenceid} variant="outline">
                                        <ItemHeader className="flex justify-between items-center">
                                            {/* Left side: Rank badge + full name */}
                                            <div className="flex items-center space-x-2">
                                                <Badge className="w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground font-bold">
                                                    {rank}
                                                </Badge>
                                                <span className="font-semibold capitalize">{fullName}</span>
                                            </div>

                                            {/* Right side: Sales badge */}
                                            <Badge className="font-mono tabular-nums px-3 rounded-full">
                                                Sales:{" "}
                                                {amount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </Badge>
                                        </ItemHeader>
                                    </Item>

                                );
                            })}
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

export default forwardRef(AgentSalesConversionCard);
