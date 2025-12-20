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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Tooltip component
function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-80 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

interface Activity {
  customer_type: string;
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

export function CustomerTypeCard({
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

  // Group by customer_type + company_name + contact_person and count occurrences
  const groupedData = useMemo(() => {
    const map: Record<
      string,
      {
        customer_type: string;
        company_name: string;
        contact_person?: string;
        count: number;
      }
    > = {};

    activities
      .filter(
        (a) =>
          isDateInRange(a.date_created, dateCreatedFilterRange) &&
          a.customer_type &&
          a.customer_type.trim() !== "" &&
          a.company_name &&
          a.company_name.trim() !== ""
      )
      .forEach((a) => {
        const customer_type = a.customer_type!.trim();
        const company_name = a.company_name.trim();
        const contact_person = a.contact_person?.trim();
        const key = `${customer_type}|${company_name}|${contact_person ?? ""}`;

        if (!map[key]) {
          map[key] = { customer_type, company_name, contact_person, count: 0 };
        }
        map[key].count += 1;
      });

    return Object.values(map);
  }, [activities, dateCreatedFilterRange]);

  // For display in the table: group by customer_type only (sum counts)
  const displayData = useMemo(() => {
    const summary: Record<string, number> = {};
    groupedData.forEach(({ customer_type, count }) => {
      summary[customer_type] = (summary[customer_type] ?? 0) + count;
    });
    return Object.entries(summary).map(([customer_type, count]) => ({
      customer_type,
      count,
    }));
  }, [groupedData]);

  const totalCount = displayData.reduce((sum, row) => sum + row.count, 0);

  // CSV download handler includes company_name and contact_person
  const handleDownloadCSV = () => {
    const headers = [
      "Customer Type",
      "Company Name",
      "Contact Person",
      "Count",
    ];
    const rows = groupedData.map(
      ({ customer_type, company_name, contact_person, count }) => [
        customer_type,
        company_name,
        contact_person ?? "",
        count.toString(),
      ]
    );

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((item) => `"${item.replace(/"/g, '""')}"`) // escape double quotes
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "customer_type.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Customer Type Distribution</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              This table shows the count of activities grouped by customer type within the selected date range.
            </TooltipInfo>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-auto">
        {loading && <p>Loading activities...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && displayData.length === 0 && (
          <p className="text-muted-foreground">No data available.</p>
        )}

        {!loading && !error && displayData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Type</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {displayData.map((row) => (
                <TableRow key={row.customer_type}>
                  <TableCell className="font-medium pt-4 pb-4 text-left">
                    {row.customer_type}
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
      <CardFooter className="flex justify-between">
        <Badge className="h-10 min-w-10 rounded-full px-1 font-mono tabular-nums">
          {totalCount}
        </Badge>
        <Button
          onClick={handleDownloadCSV}
          disabled={loading || groupedData.length === 0}
          className="bg-green-500 text-white hover:bg-green-600"
        >
          Download CSV
        </Button>
      </CardFooter>
    </Card>
  );
}
