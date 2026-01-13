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
import { Badge } from "@/components/ui/badge";

interface Activity {
  status: string;
  date_created?: string;
  so_amount: number | string;
  remarks?: string; // 🔥 required for PO Received rule
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

  // 🔥 FILTER: Converted Into Sales BUT NOT PO Received
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (!a.status) return false;
      if (a.status.toLowerCase() !== "converted into sales") return false;
      if (a.remarks?.toLowerCase() === "po received") return false; // 🚫 block PO Received
      return isDateInRange(a.date_created, dateCreatedFilterRange);
    });
  }, [activities, dateCreatedFilterRange]);

  // Count converted tickets
  const convertedCount = filteredActivities.length;

  // Sum SO Amount (safe)
  const totalSoAmount = useMemo(() => {
    return filteredActivities.reduce((sum, a) => {
      const amount =
        typeof a.so_amount === "string"
          ? parseFloat(a.so_amount)
          : a.so_amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [filteredActivities]);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Converted Into Sales Tickets</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
              Shows tickets with status <strong>Converted into Sales</strong>{" "}
              within the selected date range. <br />
              <br />
              Tickets tagged as <strong>PO Received</strong> are excluded from
              conversion and revenue.
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading && <p>Loading activities...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            <p className="flex justify-between items-center">
              <span>Total Converted Tickets:</span>
              <strong>
                <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                  {convertedCount}
                </Badge>
              </strong>
            </p>

            <Separator />

            <p className="flex justify-between items-center">
              <span>Total SO Amount:</span>
              <strong>
                <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                  ₱
                  {totalSoAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Badge>
              </strong>
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter />
    </Card>
  );
}
