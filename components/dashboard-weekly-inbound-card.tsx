"use client";

import React, { useMemo, useState, forwardRef, useImperativeHandle } from "react";
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
import { downloadStyledWorkbookFromCsv } from "@/lib/download-styled-workbook";

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
  selectedWeeks: number[];
}

export const WeeklyInboundCard = forwardRef(function WeeklyInboundCard({
  activities,
  loading,
  error,
  selectedMonth,
  selectedYear,
  selectedWeeks,
}: WeeklyInboundCardProps, ref: any) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isInSelectedMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  };

  const getWeekFromDate = (date: Date): number => {
    const dayOfMonth = date.getDate();
    if (dayOfMonth <= 7) return 1;
    if (dayOfMonth <= 14) return 2;
    if (dayOfMonth <= 21) return 3;
    if (dayOfMonth <= 28) return 4;
    return 5;
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

        const weekNum = getWeekFromDate(date);

        // Only count if week is selected
        if (!selectedWeeks.includes(weekNum)) return;

        const weekKey = `week${weekNum}`;

        if (!map[channel]) map[channel] = { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 };
        map[channel][weekKey] = (map[channel][weekKey] || 0) + 1;
      });

    return Object.entries(map).map(([channel, weeks]) => {
      const week1 = weeks.week1 || 0;
      const week2 = weeks.week2 || 0;
      const week3 = weeks.week3 || 0;
      const week4 = weeks.week4 || 0;
      const week5 = weeks.week5 || 0;
      const total = week1 + week2 + week3 + week4 + week5;
      return { channel, week1, week2, week3, week4, week5, total };
    });
  }, [activities, selectedMonth, selectedYear, selectedWeeks]);

  const totals = groupedData.reduce(
    (acc, curr) => {
      acc.week1 += curr.week1;
      acc.week2 += curr.week2;
      acc.week3 += curr.week3;
      acc.week4 += curr.week4;
      acc.week5 += curr.week5;
      acc.total += curr.total;
      return acc;
    },
    { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0, total: 0 }
  );

  const downloadCSV = () => {
    const headers = ["Channel", ...selectedWeeks.map(w => `Week ${w}`), "Total"];

    const rows = groupedData.map((r) => [
      r.channel,
      ...selectedWeeks.map(w => r[`week${w}` as keyof typeof r] as number),
      r.total,
    ]);

    const csv = [
      [`Month`, `${selectedMonth + 1}`].join(","),
      [`Year`, `${selectedYear}`].join(","),
      [],
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      [],
      ["Total", ...selectedWeeks.map(w => totals[`week${w}` as keyof typeof totals] as number), totals.total].join(","),
    ].join("\n");

    downloadStyledWorkbookFromCsv(csv, "weekly-inbound-channel-count.xlsx");
  };

  useImperativeHandle(ref, () => ({
    downloadCSV,
  }));

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
      <CardHeader className="flex items-center gap-2 pb-3">
        <CardTitle className="text-lg font-semibold">Channel Count by Week</CardTitle>
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

      <CardContent className="pb-3">
        {loading && <p className="text-sm text-muted-foreground">Loading activities...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && groupedData.length === 0 && (
          <p className="text-sm text-muted-foreground">No data available.</p>
        )}

        {!loading && !error && groupedData.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left sticky left-0 z-30 border-r bg-background">Channel</TableHead>
                {selectedWeeks.includes(1) && <TableHead className="text-right">Week 1</TableHead>}
                {selectedWeeks.includes(2) && <TableHead className="text-right">Week 2</TableHead>}
                {selectedWeeks.includes(3) && <TableHead className="text-right">Week 3</TableHead>}
                {selectedWeeks.includes(4) && <TableHead className="text-right">Week 4</TableHead>}
                {selectedWeeks.includes(5) && <TableHead className="text-right">Week 5</TableHead>}
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>

              <TableBody>
                {groupedData.map((row) => (
                  <TableRow key={row.channel}>
                    <TableCell className="font-medium pt-4 pb-4 text-left sticky left-0 z-20 border-r bg-background">{row.channel}</TableCell>
                  {selectedWeeks.includes(1) && <TableCell className="text-right font-mono tabular-nums">{row.week1}</TableCell>}
                  {selectedWeeks.includes(2) && <TableCell className="text-right font-mono tabular-nums">{row.week2}</TableCell>}
                  {selectedWeeks.includes(3) && <TableCell className="text-right font-mono tabular-nums">{row.week3}</TableCell>}
                  {selectedWeeks.includes(4) && <TableCell className="text-right font-mono tabular-nums">{row.week4}</TableCell>}
                  {selectedWeeks.includes(5) && <TableCell className="text-right font-mono tabular-nums">{row.week5}</TableCell>}
                  <TableCell className="text-right font-mono tabular-nums">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>

            <tfoot className="bg-gray-100 font-semibold">
              <TableRow>
                <TableCell className="sticky left-0 z-20 border-r bg-background">Total</TableCell>
                {selectedWeeks.includes(1) && <TableCell className="text-right font-mono tabular-nums">{totals.week1}</TableCell>}
                {selectedWeeks.includes(2) && <TableCell className="text-right font-mono tabular-nums">{totals.week2}</TableCell>}
                {selectedWeeks.includes(3) && <TableCell className="text-right font-mono tabular-nums">{totals.week3}</TableCell>}
                {selectedWeeks.includes(4) && <TableCell className="text-right font-mono tabular-nums">{totals.week4}</TableCell>}
                {selectedWeeks.includes(5) && <TableCell className="text-right font-mono tabular-nums">{totals.week5}</TableCell>}
                <TableCell className="text-right font-mono tabular-nums">{totals.total}</TableCell>
              </TableRow>
            </tfoot>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});