"use client";

import React, { useState, useMemo } from "react";
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

// Tooltip component
function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-80 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

interface Activity {
  wrap_up: string;
  date_created?: string;
}

interface WrapUpWeeklyCardProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  customWeekMapping: { [date: string]: number | undefined };
}

export function WrapUpWeeklyCard({
  activities,
  loading,
  error,
  selectedMonth,
  selectedYear,
  customWeekMapping,
}: WrapUpWeeklyCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isInSelectedMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  };

  const getWeekNumber = (date: Date): number | undefined => {
    const key = date.toISOString().slice(0, 10);
    return customWeekMapping[key];
  };

  const groupedData = useMemo(() => {
    type WeekCounts = { [week: number]: number };
    const map: Record<string, WeekCounts & { unassigned: number }> = {};

    activities
      .filter((a) => a.wrap_up && a.wrap_up.trim() !== "" && isInSelectedMonth(a.date_created))
      .forEach((a) => {
        const wrap_up = a.wrap_up!.trim();
        const date = a.date_created ? new Date(a.date_created) : null;
        if (!date) return;

        const weekNum = getWeekNumber(date);

        if (!map[wrap_up]) map[wrap_up] = { 1: 0, 2: 0, 3: 0, 4: 0, unassigned: 0 };

        if (weekNum && weekNum >= 1 && weekNum <= 4) {
          map[wrap_up][weekNum] += 1;
        } else {
          map[wrap_up].unassigned += 1;
        }
      });

    return Object.entries(map).map(([wrap_up, counts]) => {
      const week1 = counts[1] || 0;
      const week2 = counts[2] || 0;
      const week3 = counts[3] || 0;
      const week4 = counts[4] || 0;
      const total = week1 + week2 + week3 + week4 + counts.unassigned;

      return { wrap_up, week1, week2, week3, week4, unassigned: counts.unassigned, total };
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
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Wrap-Up Count by Week</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              Counts per wrap-up broken down by assigned weekss in the selected month. Unassigned activities are included in totals.
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
                <TableHead>Wrap-Up</TableHead>
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
                <TableRow key={row.wrap_up}>
                  <TableCell className="font-medium pt-4 pb-4 text-left">{row.wrap_up}</TableCell>
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