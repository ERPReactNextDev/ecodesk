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
import { Badge } from "@/components/ui/badge"

interface Activity {
  status: string;
  date_created?: string;
  date_updated?: string;   // ← add this
}

interface ClosedProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
}

export function ClosedCard({
  activities,
  loading,
  error,
  dateCreatedFilterRange,
}: ClosedProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isDateInRange = (
    dateStr: string | undefined,
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
      ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)
      : null;

    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;

    return true;
  };

  // Count total activities with status "closed" (case-insensitive) AND within date range
const closedCount = useMemo(() => {
  return activities.filter(
    (a) =>
a.status === "Closed" &&
isDateInRange(a.date_created, dateCreatedFilterRange)
  ).length;
}, [activities, dateCreatedFilterRange]);

  return (
    <>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle className="text-lg font-semibold">Closed Tickets</CardTitle>
          <div
            className="relative cursor-pointer text-muted-foreground hover:text-foreground"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Closed activities count explanation"
          >
            <Info size={18} />
            {showTooltip && (
              <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
                This shows the total number of activities with status "Closed"
                within the selected date range.
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {!loading && !error && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total Closed Tickets:</span>
              <Badge className="h-12 min-w-12 rounded-full px-4 font-mono tabular-nums text-lg font-semibold bg-primary/10 text-primary border-primary/20">
                {closedCount}
              </Badge>
            </div>
          )}
        </CardContent>

        <Separator className="my-2" />

        <CardFooter className="text-sm text-muted-foreground pt-3">
          <div className="text-xs">Showing total activities with status Closed</div>
        </CardFooter>
      </Card>
    </>
  );
}
