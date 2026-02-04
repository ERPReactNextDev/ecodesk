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
  date_updated?: string;

  // needed for role-based filtering
  referenceid?: string;
  manager?: string;
  agent?: string;
}

interface ClosedProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  dateCreatedFilterRange: DateRange | undefined;

  // 🔥 ADD THESE – same data coming from ticket.tsx
  referenceid: string;
  role: string;
}

export function ClosedCard({
  activities,
  loading,
  error,
  dateCreatedFilterRange,
  referenceid,
  role,
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

  const allowedStatuses = [
    "On-Progress",
    "Closed",
    "Endorsed",
    "Converted into Sales",
  ];

  const filteredActivities = useMemo(() => {
    return activities
      // allowed statuses only
      .filter((a) => allowedStatuses.includes(a.status))

      // date range filter
      .filter((a) =>
        isDateInRange(a.date_created, dateCreatedFilterRange)
      )

      // role-based visibility filter (same logic as ticket.tsx)
.filter((a) => {
  if (role === "Admin") {
    return true;
  }

  if (role === "CSR") {
    return a.referenceid === referenceid;
  }

  if (role === "Territory Sales Manager") {
    return a.manager === referenceid;
  }

  if (role === "Territory Sales Associate") {
    return a.agent === referenceid;
  }

  return true;
});
  }, [activities, dateCreatedFilterRange, role, referenceid]);

  const closedCount = useMemo(() => {
    return filteredActivities.filter(
      (a) => a.status === "Closed"
    ).length;
  }, [filteredActivities]);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Closed Tickets</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />

          {showTooltip && (
            <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
              This shows only CLOSED tickets currently visible to you based on your role and active filters.
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!loading && !error && (
          <p className="flex justify-between items-center">
            <span>Total Closed Tickets:</span>
            <strong>
              <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                {closedCount}
              </Badge>
            </strong>
          </p>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="text-sm text-muted-foreground">
        Showing closed tickets based on your current ticket view
      </CardFooter>
    </Card>
  );
}
