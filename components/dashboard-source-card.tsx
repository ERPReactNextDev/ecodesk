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

import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Tooltip component for info explanation
function TooltipInfo({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
            {children}
        </div>
    );
}

interface Activity {
    source?: string;
    date_created?: string;
}

interface SourceListProps {
    activities: Activity[];
    loading: boolean;
    error: string | null;
    dateCreatedFilterRange: DateRange | undefined;
    setDateCreatedFilterRangeAction: React.Dispatch<
        React.SetStateAction<DateRange | undefined>
    >;
}

export function SourceCard({
    activities,
    loading,
    error,
    dateCreatedFilterRange,
}: SourceListProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const isDateInRange = (dateStr: string | undefined, range: DateRange | undefined) => {
        if (!range) return true;
        if (!dateStr) return false;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;

        const { from, to } = range;

        const fromDate = from
            ? new Date(from.getFullYear(), from.getMonth(), from.getDate())
            : null;
        const toDate = to
            ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)
            : null;

        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;

        return true;
    };

    // Filter activities by date range first
    const filteredActivities = useMemo(() => {
        return activities.filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange));
    }, [activities, dateCreatedFilterRange]);

    // Count per source (including duplicates)
    const sourceCountsArray = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredActivities.forEach((a) => {
            if (a.source && a.source.trim() !== "") {
                const src = a.source.trim();
                counts[src] = (counts[src] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count);
    }, [filteredActivities]);

    // Total sources including duplicates count
    const totalSourcesCount = useMemo(() => {
        return filteredActivities.filter((a) => a.source && a.source.trim() !== "").length;
    }, [filteredActivities]);

    // CSV download helper
    const downloadCSV = () => {
        const header = ["Source", "Count"];
        const rows = sourceCountsArray.map(({ source, count }) => [source, count.toString()]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [header, ...rows].map((e) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "source_counts.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Source Usage</CardTitle>
                <div
                    className="relative cursor-pointer text-muted-foreground hover:text-foreground"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    aria-label="Source usage explanation"
                >
                    <Info size={18} />
                    {showTooltip && (
                        <TooltipInfo>
                            This list counts all source activities within the selected date range.{" "}
                            Sources are counted including duplicates, so repeated entries increase the count.
                        </TooltipInfo>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-grow overflow-auto">
                {loading && <p>Loading sources...</p>}
                {error && <p className="text-destructive">{error}</p>}
                {!loading && !error && sourceCountsArray.length === 0 && <p>No source data available</p>}
                {!loading && !error && sourceCountsArray.length > 0 && (
                    <div className="flex flex-col gap-4">
                        {sourceCountsArray.map(({ source, count }) => (
                            <Item variant="outline" key={source}>
                                <ItemContent>
                                    <ItemTitle>{source}</ItemTitle>
                                </ItemContent>
                                <ItemActions>
                                    <Badge variant="outline" className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                                        {count}
                                    </Badge>
                                </ItemActions>
                            </Item>
                        ))}
                    </div>
                )}
            </CardContent>
            <Separator />
            <CardFooter className="flex justify-between items-center text-sm">
                <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                    Total: {totalSourcesCount}
                </Badge>
                <Button
                    onClick={downloadCSV}
                    type="button"
                    aria-label="Download source counts CSV"
                    className="bg-green-500 text-white hover:bg-green-600"
                >
                    Download CSV
                </Button>
            </CardFooter>
        </Card>
    );
}
