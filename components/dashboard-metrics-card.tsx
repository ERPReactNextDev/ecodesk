"use client";

import React, { useState, useMemo } from "react";
import { Info } from "lucide-react";
import { type DateRange } from "react-day-picker";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Tooltip component
function TooltipInfo({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute top-full mt-1 w-72 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
            {children}
        </div>
    );
}

interface Activity {
    channel?: string;
    traffic?: string;
    so_amount: string;
    qty_sold: string;
    status: string;
    date_created?: string;
}

interface ChannelTableProps {
    activities: Activity[];
    loading: boolean;
    error: string | null;
    dateCreatedFilterRange: DateRange | undefined;
    setDateCreatedFilterRangeAction: React.Dispatch<
        React.SetStateAction<DateRange | undefined>
    >;
}

export function MetricsCard({
    activities,
    loading,
    error,
    dateCreatedFilterRange,
    setDateCreatedFilterRangeAction,
}: ChannelTableProps) {
    const [showTooltip, setShowTooltip] = useState(false);

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

    /** Group data grouped by channel */
    const groupedData = useMemo(() => {
        const map: Record<
            string,
            {
                traffic: number;
                soAmountTotal: number;
                qtySoldTotal: number;
                convertedCount: number;
            }
        > = {};

        activities
            .filter(
                (a) =>
                    isDateInRange(a.date_created, dateCreatedFilterRange) &&
                    a.channel &&
                    a.channel.trim() !== "" &&
                    (a.traffic?.toLowerCase() === "sales" || a.traffic?.toLowerCase() === "non-sales")
            )
            .forEach((a) => {
                const channel = a.channel!.trim();
                const soAmount = Number(a.so_amount) || 0;
                const qtySold = Number(a.qty_sold) || 0;
                const isConverted = a.status?.toLowerCase() === "converted into sales";

                if (!map[channel]) {
                    map[channel] = {
                        traffic: 0,
                        soAmountTotal: 0,
                        qtySoldTotal: 0,
                        convertedCount: 0,
                    };
                }

                map[channel].traffic += 1;
                map[channel].soAmountTotal += soAmount;
                map[channel].qtySoldTotal += qtySold;
                if (isConverted) map[channel].convertedCount += 1;
            });

        return Object.entries(map).map(([channel, values]) => {
            // Calculate averages safely
            const avgTransactionUnit =
                values.convertedCount > 0
                    ? values.qtySoldTotal / values.convertedCount
                    : 0;

            const avgTransactionValue =
                values.convertedCount > 0
                    ? values.soAmountTotal / values.convertedCount
                    : 0;

            return {
                channel,
                traffic: values.traffic,
                soAmountTotal: values.soAmountTotal,
                qtySoldTotal: values.qtySoldTotal,
                convertedCount: values.convertedCount,
                avgTransactionUnit,
                avgTransactionValue,
            };
        });
    }, [activities, dateCreatedFilterRange]);

    const totalTraffic = groupedData.reduce((sum, row) => sum + row.traffic, 0);
    const totalSoAmount = groupedData.reduce(
        (sum, row) => sum + row.soAmountTotal,
        0
    );
    const totalQtySold = groupedData.reduce((sum, row) => sum + row.qtySoldTotal, 0);
    const totalConverted = groupedData.reduce(
        (sum, row) => sum + row.convertedCount,
        0
    );

    const avgTransactionUnitTotal =
        totalConverted > 0 ? totalQtySold / totalConverted : 0;

    const avgTransactionValueTotal =
        totalConverted > 0 ? totalSoAmount / totalConverted : 0;

    const channelPriority = [
        "Google Maps",
        "Website",
        "FB Main",
        "FB ES Home",
        "Viber",
        "Text Message",
        "Shopify",
        "Voice Call",
        "Email",
        "Whatsapp",
    ];

    const sortedGroupedData = groupedData.slice().sort((a, b) => {
        const indexA = channelPriority.indexOf(a.channel);
        const indexB = channelPriority.indexOf(b.channel);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Channel Traffic</CardTitle>

                <div
                    className="relative cursor-pointer text-muted-foreground hover:text-foreground"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <Info size={18} />
                    {showTooltip && (
                        <TooltipInfo>
                            <div>
                                <strong>Traffic:</strong> Number of sales entries with traffic labeled "sales".
                            </div>
                            <div>
                                <strong>Amount:</strong> Sum of sales order amounts (SO Amount) from valid sales traffic.
                            </div>
                            <div>
                                <strong>Qty Sold:</strong> Total quantity sold from valid sales traffic.
                            </div>
                            <div>
                                <strong>Converted Sales:</strong> Count of statuses marked as "converted into sales".
                            </div>
                            <div>
                                <strong>ATU (Average Transaction Unit):</strong> Total Qty Sold ÷ Total Converted Sales (Units sold per conversion).
                            </div>
                            <div>
                                <strong>ATV (Average Transaction Value):</strong> Total Amount ÷ Total Converted Sales (Money earned per conversion).
                            </div>
                        </TooltipInfo>
                    )}

                </div>
            </CardHeader>

            <CardContent>
                {loading && <p>Loading activities...</p>}
                {error && <p className="text-destructive">{error}</p>}

                {!loading && !error && groupedData.length === 0 && (
                    <p className="text-muted-foreground">No data available.</p>
                )}

                {!loading && !error && groupedData.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Channel</TableHead>
                                <TableHead className="text-right">Traffic</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Converted Sales</TableHead>
                                <TableHead className="text-right">Qty Sold</TableHead>
                                <TableHead className="text-right">ATU</TableHead>
                                <TableHead className="text-right">ATV</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableHeader className="bg-gray-100 font-semibold">
                            <TableRow>
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">{totalTraffic}</TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                    ₱{totalSoAmount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                    {totalConverted.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                    {totalQtySold.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                    {Math.round(avgTransactionUnitTotal).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                    ₱{Math.round(avgTransactionValueTotal).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sortedGroupedData.map((row) => (
                                <TableRow key={row.channel}>
                                    <TableCell className="font-medium pt-4 pb-4 text-left">{row.channel}</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">{row.traffic}</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">₱{row.soAmountTotal.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">{row.convertedCount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">{row.qtySoldTotal.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">{Math.round(row.avgTransactionUnit).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono tabular-nums">₱{Math.round(row.avgTransactionValue).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>

                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
