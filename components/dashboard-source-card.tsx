"use client";

import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
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
import { downloadStyledWorkbookFromCsv } from "@/lib/download-styled-workbook";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

interface Activity {
  source?: string | null;
  date_created?: string | null;
}

interface SourceListProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  dateCreatedFilterRange: DateRange | undefined;
}

export interface SourceCardRef {
  downloadCSV: () => void;
}

const SourceCard = forwardRef<SourceCardRef, SourceListProps>(
  ({ activities, loading, error, dateCreatedFilterRange }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const isDateInRange = (
      dateStr: string | undefined | null,
      range: DateRange | undefined
    ) => {
      if (!range) return true;
      if (!dateStr) return false;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;

      const { from, to } = range;

      const fromDate = from
        ? new Date(from.getFullYear(), from.getMonth(), from.getDate())
        : null;

      const toDate = to
        ? new Date(
          to.getFullYear(),
          to.getMonth(),
          to.getDate(),
          23,
          59,
          59,
          999
        )
        : null;

      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;

      return true;
    };

    const filteredActivities = useMemo(() => {
      return (activities || []).filter((a) =>
        isDateInRange(a?.date_created, dateCreatedFilterRange)
      );
    }, [activities, dateCreatedFilterRange]);

    const sourceCountsArray = useMemo(() => {
      const counts: Record<string, number> = {};

      filteredActivities.forEach((a) => {
        const rawSource = a?.source;

        // allow everything except truly empty / dash
        if (rawSource === null || rawSource === undefined) return;

        const src = rawSource.toString().trim();

        if (src.length === 0 || src === "-") return;

        counts[src] = (counts[src] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
    }, [filteredActivities]);


    const totalSourcesCount = useMemo(() => {
      return filteredActivities.filter((a) => {
        const s = a?.source?.toString().trim();
        return s && s !== "-";
      }).length;
    }, [filteredActivities]);

useImperativeHandle(ref, () => ({
  downloadCSV() {
    if (!sourceCountsArray || sourceCountsArray.length === 0) return;

    const rows = sourceCountsArray.map((row, index) => ({
      Rank: index + 1,
      Source: row.source,
      Count: row.count,
    }));

    const headers = ["Rank", "Source", "Count"];

    let filterText = "All Dates";
    if (dateCreatedFilterRange?.from && dateCreatedFilterRange?.to) {
      const from = new Date(dateCreatedFilterRange.from).toLocaleDateString();
      const to = new Date(dateCreatedFilterRange.to).toLocaleDateString();
      filterText = `${from} - ${to}`;
    }

    const totalRow = [
      "",
      "TOTAL",
      totalSourcesCount
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

    downloadStyledWorkbookFromCsv(csv, "source-distribution.xlsx");
  },
}));

    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle className="text-lg font-semibold">Where Customer Find Us</CardTitle>

          <div
            className="relative cursor-pointer text-muted-foreground hover:text-foreground"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={18} />

            {showTooltip && (
              <TooltipInfo>
                This list counts all source activities within the selected date
                range. Sources are counted including duplicates, so repeated
                entries increase the count.
              </TooltipInfo>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-grow overflow-auto pb-3">
          {loading && <p className="text-sm text-muted-foreground">Loading sources...</p>}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && sourceCountsArray.length === 0 && (
            <p className="text-sm text-muted-foreground">No source data available</p>
          )}

          {!loading && !error && sourceCountsArray.length > 0 && (
            <div className="flex flex-col gap-4">
              {sourceCountsArray.map(({ source, count }) => (
                <Item variant="outline" key={source}>
                  <ItemContent>
                    <ItemTitle>{source}</ItemTitle>
                  </ItemContent>

                  <ItemActions>
                    <Badge
                      variant="outline"
                      className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums"
                    >
                      {count}
                    </Badge>
                  </ItemActions>
                </Item>
              ))}
            </div>
          )}
        </CardContent>

        <Separator className="my-2" />

        <CardFooter className="flex justify-end items-center text-sm pt-3">
          <Badge className="h-12 min-w-12 rounded-full px-4 font-mono tabular-nums text-lg font-semibold bg-primary/10 text-primary border-primary/20">
            Total: {totalSourcesCount}
          </Badge>
        </CardFooter>
      </Card>
    );
  }
);

export default SourceCard;
