"use client";

import React, { useState, useMemo } from "react";
import { Info } from "lucide-react";
import { type DateRange } from "react-day-picker";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="absolute top-full mt-1 w-80 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

interface Activity {
  channel?: string;
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

export function WeeklyInboundCard({
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

  // Helper to get week number (1-4) based on date of month
  // Days 1-7: Week 1, 8-14: Week 2, 15-21: Week 3, 22+: Week 4 (includes day 29-31)
  function getWeekNumber(date: Date) {
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  }

  // Group channels and count per week (merging week 5+ to week 4)
  const groupedData = useMemo(() => {
    type WeekCounts = { [week: number]: number }; // e.g. {1: 3, 2: 5, 3: 2, 4: 7}

    const map: Record<string, WeekCounts> = {};

    activities
      .filter(
        (a) =>
          isDateInRange(a.date_created, dateCreatedFilterRange) &&
          a.channel &&
          a.channel.trim() !== ""
      )
      .forEach((a) => {
        const channel = a.channel!.trim();
        const date = a.date_created ? new Date(a.date_created) : null;
        if (!date) return;

        const weekNum = getWeekNumber(date);

        if (!map[channel]) {
          map[channel] = { 1: 0, 2: 0, 3: 0, 4: 0 };
        }

        // Add count to correct week (merging week 5+ to 4)
        map[channel][weekNum] = (map[channel][weekNum] || 0) + 1;
      });

    return Object.entries(map).map(([channel, weeks]) => ({
      channel,
      week1: weeks[1] || 0,
      week2: weeks[2] || 0,
      week3: weeks[3] || 0,
      week4: weeks[4] || 0,
      total: (weeks[1] || 0) + (weeks[2] || 0) + (weeks[3] || 0) + (weeks[4] || 0),
    }));
  }, [activities, dateCreatedFilterRange]);

  // Calculate total counts per week for footer
  const totals = groupedData.reduce(
    (acc, curr) => {
      acc.week1 += curr.week1;
      acc.week2 += curr.week2;
      acc.week3 += curr.week3;
      acc.week4 += curr.week4;
      acc.total += curr.total;
      return acc;
    },
    { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Channel Count by Week</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              <div>
                Counts per channel broken down by week of the month (Week 1 = days 1-7, Week 2 = days 8-14, Week 3 = days 15-21,
                Week 4 = days 22-end of month including days 29+).
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
                <TableHead className="text-right">Week 1</TableHead>
                <TableHead className="text-right">Week 2</TableHead>
                <TableHead className="text-right">Week 3</TableHead>
                <TableHead className="text-right">Week 4+</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupedData.map((row) => (
                <TableRow key={row.channel}>
                  <TableCell className="font-medium pt-4 pb-4 text-left">{row.channel}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.week1}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.week2}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.week3}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.week4}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>

            <tfoot className="bg-gray-100 font-semibold">
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{totals.week1}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{totals.week2}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{totals.week3}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{totals.week4}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{totals.total}</TableCell>
              </TableRow>
            </tfoot>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
