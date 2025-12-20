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

interface Activity {
  status: string;
  date_created?: string;
}

interface EndorsedProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
}

export function EndorsedCard({
  activities,
  loading,
  error,
  dateCreatedFilterRange,
}: EndorsedProps) {
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

  // Count total activities with status "Endorsed" (case-insensitive) AND within date range
  const endorsedCount = useMemo(() => {
    return activities.filter(
      (a) =>
        a.status &&
        a.status.toLowerCase() === "endorsed" &&
        isDateInRange(a.date_created, dateCreatedFilterRange)
    ).length;
  }, [activities, dateCreatedFilterRange]);

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Endorsed Tickets</CardTitle>
          <div
            className="relative cursor-pointer text-muted-foreground hover:text-foreground"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Endorsed activities count explanation"
          >
            <Info size={18} />
            {showTooltip && (
              <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
                This shows the total number of activities with status "Endorsed"
                within the selected date range.
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading && <p>Loading activities...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!loading && !error && (
            <p>
              Total Endorsed activities: <strong>{endorsedCount}</strong>
            </p>
          )}
        </CardContent>

        <Separator />

        <CardFooter className="text-sm text-muted-foreground">
          Showing total activities with status Endorsed
        </CardFooter>
      </Card>
    </>
  );
}
