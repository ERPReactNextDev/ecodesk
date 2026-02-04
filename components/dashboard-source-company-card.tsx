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
  source_company: string;
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


export interface SourceCompanyCardRef {
  downloadCSV: () => void;
}

const SourceCompanyCard = forwardRef<SourceCompanyCardRef, ChannelTableProps>(({
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

  // Count all activities grouped by source_company
  const groupedData = useMemo(() => {
    const countMap: Record<string, number> = {};

    activities
      .filter(
        (a) =>
          isDateInRange(a.date_created, dateCreatedFilterRange) &&
          a.source_company &&
          a.source_company.trim() !== ""
      )
      .forEach((a) => {
        const source_company = a.source_company!.trim();
        countMap[source_company] = (countMap[source_company] ?? 0) + 1;
      });

    return Object.entries(countMap).map(([source_company, count]) => ({
      source_company,
      count,
    }));
  }, [activities, dateCreatedFilterRange]);

  const totalCount = groupedData.reduce((sum, row) => sum + row.count, 0);

  useImperativeHandle(ref, () => ({
    downloadCSV: () => {
      const headers = ["Source Company", "Count"];

      const rows = groupedData.map(({ source_company, count }) => [
        source_company,
        count.toString(),
      ]);

      const csvContent =
        [headers, ...rows]
          .map((row) =>
            row
              .map((item) => `"${item.replace(/"/g, '""')}"`) // escape quotes
              .join(",")
          )
          .join("\n") + "\n";

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "source_company.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }));

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Company Distribution</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              This table shows the count of activities grouped by source company within the selected date range.
            </TooltipInfo>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-auto">
        {loading && <p>Loading activities...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && groupedData.length === 0 && (
          <p className="text-muted-foreground">No data available.</p>
        )}

        {!loading && !error && groupedData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Company</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupedData.map((row) => (
                <TableRow key={row.source_company}>
                  <TableCell className="font-medium pt-4 pb-4 text-left">
                    {row.source_company}
                  </TableCell>
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
      <Separator />
      <CardFooter className="flex justify-end">
        <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
          Total: {totalCount}
        </Badge>
      </CardFooter>
    </Card>
  );
});

export default SourceCompanyCard;
