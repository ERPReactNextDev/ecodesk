"use client";

import React, { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { Info } from "lucide-react";
import { type DateRange } from "react-day-picker";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { downloadStyledWorkbookFromCsv } from "@/lib/download-styled-workbook";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Tooltip component
function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-80 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

interface Activity {
  gender?: string;
  company_name: string;
  contact_person?: string;
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

export interface InboundTrafficCardRef {
  downloadCSV: () => void;
}

const InboundTrafficGenderCard = forwardRef<InboundTrafficCardRef, ChannelTableProps>(({
    activities,
    loading,
    error,
    dateCreatedFilterRange,
}, ref) => {  
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

  // Group only by gender and count occurrences
  const groupedData = useMemo(() => {
    const map: Record<string, { gender: string; count: number }> = {};

    activities
      .filter(
        (a) =>
          isDateInRange(a.date_created, dateCreatedFilterRange) &&
          a.gender &&
          a.gender.trim() !== ""
      )
      .forEach((a) => {
        const gender = a.gender!.trim();

        if (!map[gender]) {
          map[gender] = { gender, count: 0 };
        }

        map[gender].count += 1;
      });

    return Object.values(map);
  }, [activities, dateCreatedFilterRange]);

  const totalCount = groupedData.reduce((sum, row) => sum + row.count, 0);

useImperativeHandle(ref, () => ({
  downloadCSV() {
    if (!groupedData || groupedData.length === 0) return;

    const rows = groupedData.map((row, index) => ({
      Rank: index + 1,
      Gender: row.gender,
      Count: row.count,
    }));

    const headers = ["Rank", "Gender", "Count"];

    let filterText = "All Dates";
    if (dateCreatedFilterRange?.from && dateCreatedFilterRange?.to) {
      const from = new Date(dateCreatedFilterRange.from).toLocaleDateString();
      const to = new Date(dateCreatedFilterRange.to).toLocaleDateString();
      filterText = `${from} - ${to}`;
    }

    const totalRow = [
      "",
      "TOTAL",
      totalCount
    ];

    const csv = [
      ["Date Filter", filterText].join(","),
      [],
      headers.join(","),
      totalRow.join(","),
      ...rows.map((row) =>
        headers.map((h) => row[h as keyof typeof row]).join(",")
      ),
    ].join("\n");

    downloadStyledWorkbookFromCsv(csv, "inbound-traffic-gender.xlsx");
  },
}));

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
      <CardHeader className="flex justify-between items-center pb-3">
        <CardTitle className="text-lg font-semibold">Inbound Traffic by Gender</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              This table shows the count of activities grouped by gender within the selected date range.
            </TooltipInfo>
          )}
        </div>
      </CardHeader>

      <CardContent className="grow overflow-auto pb-3">
        {loading && <p className="text-sm text-muted-foreground">Loading activities...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && groupedData.length === 0 && (
          <p className="text-sm text-muted-foreground">No data available.</p>
        )}

        {!loading && !error && groupedData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupedData.map((row) => (
                <TableRow key={row.gender}>
                  <TableCell className="font-medium pt-4 pb-4 text-left">{row.gender}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                      {row.count}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <Separator className="my-2" />
      <CardFooter className="flex justify-end pt-3">
        <Badge className="h-12 min-w-12 rounded-full px-4 font-mono tabular-nums text-lg font-semibold bg-primary/10 text-primary border-primary/20">
         Total: {totalCount}
        </Badge>
      </CardFooter>
    </Card>
  );
});

export default InboundTrafficGenderCard;
