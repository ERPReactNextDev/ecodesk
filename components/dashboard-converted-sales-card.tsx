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
  so_amount: number | string;
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

export function ConvertedSalesCard({
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

  // Filtered activities with status "converted into sales" and date range
  const filteredActivities = useMemo(() => {
    return activities.filter(
      (a) =>
        a.status &&
        a.status.toLowerCase() === "converted into sales" &&
        isDateInRange(a.date_created, dateCreatedFilterRange)
    );
  }, [activities, dateCreatedFilterRange]);

  // Count total activities
  const endorsedCount = filteredActivities.length;

  // Sum so_amount (convert string to number safely)
  const totalSoAmount = useMemo(() => {
    return filteredActivities.reduce((sum, a) => {
      const amount = typeof a.so_amount === "string" ? parseFloat(a.so_amount) : a.so_amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [filteredActivities]);

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Converted Into Sales Tickets</CardTitle>
          <div
            className="relative cursor-pointer text-muted-foreground hover:text-foreground"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Endorsed activities count explanation"
          >
            <Info size={18} />
            {showTooltip && (
              <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
                This shows the total number of activities with status "Converted into Sales" within the selected date range,
                and the sum of their SO Amounts.
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading && <p>Loading activities...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!loading && !error && (
            <>
              <p>
                Total Converted activities: <strong>{endorsedCount}</strong>
              </p>
              <p>
                Total SO Amount: <strong>₱{totalSoAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
