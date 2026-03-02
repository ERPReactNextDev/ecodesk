"use client";

import React, { useMemo, useState } from "react";
import { Info } from "lucide-react";

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

interface WeeklyInboundCardProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  customWeekMapping: { [date: string]: number | undefined };
}

export function WeeklyInboundCard({
  activities,
  loading,
  error,
  selectedMonth,
  selectedYear,
  customWeekMapping,
}: WeeklyInboundCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isInSelectedMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  };

  const getWeekNumber = (date: Date): number | undefined => {
    const key = date.toISOString().slice(0, 10);
    return customWeekMapping[key]; // undefined if not assigned
  };

  const groupedData = useMemo(() => {
    type WeekCounts = { [week: string]: number };
    const map: Record<string, WeekCounts> = {};

    activities
      .filter((a) => a.channel && a.channel.trim() !== "" && isInSelectedMonth(a.date_created))
      .forEach((a) => {
        const channel = a.channel!.trim();
        const date = a.date_created ? new Date(a.date_created) : null;
        if (!date) return;

        let weekNum = getWeekNumber(date);
        const weekKey = weekNum && weekNum >= 1 && weekNum <= 4 ? `week${weekNum}` : "unassigned";

        if (!map[channel]) map[channel] = { week1: 0, week2: 0, week3: 0, week4: 0, unassigned: 0 };
        map[channel][weekKey] = (map[channel][weekKey] || 0) + 1;
      });

    return Object.entries(map).map(([channel, weeks]) => {
      const week1 = weeks.week1 || 0;
      const week2 = weeks.week2 || 0;
      const week3 = weeks.week3 || 0;
      const week4 = weeks.week4 || 0;
      const unassigned = weeks.unassigned || 0;
      const total = week1 + week2 + week3 + week4 + unassigned;
      return { channel, week1, week2, week3, week4, unassigned, total };
    });
  }, [activities, selectedMonth, selectedYear, customWeekMapping]);

  const totals = groupedData.reduce(
    (acc, curr) => {
      acc.week1 += curr.week1;
      acc.week2 += curr.week2;
      acc.week3 += curr.week3;
      acc.week4 += curr.week4;
      acc.unassigned += curr.unassigned;
      acc.total += curr.total;
      return acc;
    },
    { week1: 0, week2: 0, week3: 0, week4: 0, unassigned: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <CardTitle>Channel Count by Week</CardTitle>
        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              Counts per channel broken down by week of the month. Unassigned dates are shown in "Unassigned".
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
                <TableHead className="text-right">Week 4</TableHead>
                <TableHead className="text-right">Unassigned</TableHead>
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
                  <TableCell className="text-right font-mono tabular-nums">{row.unassigned}</TableCell>
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
                <TableCell className="text-right font-mono tabular-nums">{totals.unassigned}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{totals.total}</TableCell>
              </TableRow>
            </tfoot>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}