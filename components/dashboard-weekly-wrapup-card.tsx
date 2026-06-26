"use client";

import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadStyledWorkbookFromCsv } from "@/lib/download-styled-workbook";

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
  selectedWeeks: number[];
}

export const WrapUpWeeklyCard = forwardRef<any, WrapUpWeeklyCardProps>(
  (
    {
      activities,
      loading,
      error,
      selectedMonth,
      selectedYear,
      selectedWeeks,
    },
    ref,
  ) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const isInSelectedMonth = (dateStr?: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    };

    const getWeekFromDate = (date: Date): number => {
      const dayOfMonth = date.getDate();
      if (dayOfMonth <= 7) return 1;
      if (dayOfMonth <= 14) return 2;
      if (dayOfMonth <= 21) return 3;
      if (dayOfMonth <= 28) return 4;
      return 5;
    };

    const WRAP_UP_LIST = [
      "Customer Order",
      "Customer Inquiry Sales",
      "Customer Inquiry Non-Sales",
      "Follow Up Sales",
      "Follow Up Non-Sales",
      "After Sales",
      "Customer Complaint",
      "Customer Feedback/Recommendation",
      "Job Applicants",
      "Supplier/Vendor Product Offer",
      "Internal Whistle Blower",
      "Threats/Extortion/Intimidation",
      "Supplier Accredited Request",
      "Internal Concern",
      "Others",
      "Inquiry",
    ];

    const groupedData = useMemo(() => {
      type WeekCounts = { [week: number]: number };
      const map: Record<string, WeekCounts> = {};

      // Initialize all wrap-ups with zero counts
      WRAP_UP_LIST.forEach((wrap) => {
        map[wrap] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      });

      // Only consider activities in the selected month/year
      activities.forEach((a) => {
        const wrap = a.wrap_up?.trim();
        if (!wrap || !WRAP_UP_LIST.includes(wrap)) return;

        const wrap_up = wrap;
        if (!a.date_created) return;

        const date = new Date(a.date_created);
        if (
          date.getMonth() !== selectedMonth ||
          date.getFullYear() !== selectedYear
        ) {
          // Skip activities outside selected month/year
          return;
        }

        const weekNum = getWeekFromDate(date);

        // Only count if week is selected
        if (!selectedWeeks.includes(weekNum)) return;

        map[wrap_up][weekNum] += 1;
      });

      // Convert map to array for table
      return Object.entries(map).map(([wrap_up, counts]) => {
        const week1 = counts[1] ?? 0;
        const week2 = counts[2] ?? 0;
        const week3 = counts[3] ?? 0;
        const week4 = counts[4] ?? 0;
        const week5 = counts[5] ?? 0;
        const total = week1 + week2 + week3 + week4 + week5;

        return {
          wrap_up,
          week1,
          week2,
          week3,
          week4,
          week5,
          total,
        };
      });
    }, [activities, selectedMonth, selectedYear, selectedWeeks]);

    const totals = groupedData.reduce(
      (acc, curr) => {
        // Skip Inquiry in totals
        if (curr.wrap_up === "Inquiry") return acc;

        acc.week1 += curr.week1;
        acc.week2 += curr.week2;
        acc.week3 += curr.week3;
        acc.week4 += curr.week4;
        acc.week5 += curr.week5;
        acc.total += curr.total;

        return acc;
      },
      { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0, total: 0 },
    );

    useImperativeHandle(ref, () => ({
      downloadCSV() {
        if (!groupedData || groupedData.length === 0) return;

        const weekHeaders = selectedWeeks.map(w => `Week ${w}`);
        const rows = groupedData.map((row, index) => {
          return {
            Rank: index + 1,
            "Wrap-Up": row.wrap_up,
            ...Object.fromEntries(selectedWeeks.map(w => [`Week ${w}`, row[`week${w}` as keyof typeof row] as number])),
            Total: row.total,
          };
        });

        const headers = [
          "Rank",
          "Wrap-Up",
          ...weekHeaders,
          "Total",
        ];

        // SAME DATE FILTER LOGIC STYLE AS TSA EXPORT
        let filterText = "All Dates";
        if (selectedMonth !== undefined && selectedYear !== undefined) {
          const firstDay = new Date(selectedYear, selectedMonth, 1);
          const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

          const from = firstDay.toLocaleDateString();
          const to = lastDay.toLocaleDateString();

          filterText = `${from} - ${to}`;
        }

        // TOTAL ROW
        const totalRow = [
          "",
          "TOTAL",
          ...selectedWeeks.map(w => totals[`week${w}` as keyof typeof totals] as number),
          totals.total,
        ];

        const csv = [
          ["Date Filter", filterText].join(","),
          [],
          headers.join(","),
          totalRow.join(","),
          ...rows.map((row) =>
            headers.map((h) => row[h as keyof typeof row]).join(","),
          ),
        ].join("\n");

        downloadStyledWorkbookFromCsv(csv, "weekly-wrapup-distribution.xlsx");
      },
    }));

    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle className="text-lg font-semibold">Wrap-Up Count by Week</CardTitle>

          <div
            className="relative cursor-pointer text-muted-foreground hover:text-foreground"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={18} />
            {showTooltip && (
              <TooltipInfo>
                Counts per wrap-up broken down by assigned weeks in the
                selected month. Unassigned activities are included in totals.
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wrap-Up</TableHead>
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
                  <TableRow key={row.wrap_up}>
                    <TableCell className="font-medium pt-4 pb-4 text-left">
                      {row.wrap_up}
                    </TableCell>
                    {selectedWeeks.includes(1) && <TableCell className="text-right font-mono tabular-nums">{row.week1}</TableCell>}
                    {selectedWeeks.includes(2) && <TableCell className="text-right font-mono tabular-nums">{row.week2}</TableCell>}
                    {selectedWeeks.includes(3) && <TableCell className="text-right font-mono tabular-nums">{row.week3}</TableCell>}
                    {selectedWeeks.includes(4) && <TableCell className="text-right font-mono tabular-nums">{row.week4}</TableCell>}
                    {selectedWeeks.includes(5) && <TableCell className="text-right font-mono tabular-nums">{row.week5}</TableCell>}
                    <TableCell className="text-right font-mono tabular-nums">
                      {row.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <tfoot className="bg-gray-100 font-semibold">
                <TableRow>
                  <TableCell>Total</TableCell>
                  {selectedWeeks.includes(1) && <TableCell className="text-right font-mono tabular-nums">{totals.week1}</TableCell>}
                  {selectedWeeks.includes(2) && <TableCell className="text-right font-mono tabular-nums">{totals.week2}</TableCell>}
                  {selectedWeeks.includes(3) && <TableCell className="text-right font-mono tabular-nums">{totals.week3}</TableCell>}
                  {selectedWeeks.includes(4) && <TableCell className="text-right font-mono tabular-nums">{totals.week4}</TableCell>}
                  {selectedWeeks.includes(5) && <TableCell className="text-right font-mono tabular-nums">{totals.week5}</TableCell>}
                  <TableCell className="text-right font-mono tabular-nums">
                    {totals.total}
                  </TableCell>
                </TableRow>
              </tfoot>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  },
);