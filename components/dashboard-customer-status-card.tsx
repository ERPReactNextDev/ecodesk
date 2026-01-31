"use client";

import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
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

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/* ================= TOOLTIP ================= */
function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-80 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

/* ================= TYPES ================= */
interface Activity {
  customer_status?: string;
  company_name?: string;
  contact_person?: string;
  date_created?: string;
}

interface CustomerStatusCardProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
}

export interface CustomerStatusCardRef {
  downloadCSV: () => void;
}

/* ================= COMPONENT ================= */
const CustomerStatusCard = forwardRef<
  CustomerStatusCardRef,
  CustomerStatusCardProps
>(({ activities, loading, error, dateCreatedFilterRange }, ref) => {
  const [showTooltip, setShowTooltip] = useState(false);

  /* ================= DATE FILTER (SAME AS ticket.tsx STYLE) ================= */
  const isDateInRange = (dateStr?: string, range?: DateRange) => {
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

  /* ================= FILTER + GROUP (LIKE act-filter-dialog logic) ================= */
  const groupedData = useMemo(() => {
    const map: Record<string, number> = {};

    activities
      .filter(
        (a) =>
          a.customer_status &&
          a.customer_status.trim() !== "" &&
          isDateInRange(a.date_created, dateCreatedFilterRange),
      )
      .forEach((a) => {
        const status = a.customer_status!.trim();
        map[status] = (map[status] || 0) + 1;
      });

    return Object.entries(map).map(([customer_status, count]) => ({
      customer_status,
      count,
    }));
  }, [activities, dateCreatedFilterRange]);

  const totalCount = groupedData.reduce(
    (sum, row) => sum + row.count,
    0,
  );

  /* ================= CSV EXPORT ================= */
  useImperativeHandle(ref, () => ({
    downloadCSV: () => {
      if (!groupedData.length) return;

      const headers = ["Customer Status", "Count"];
      const rows = groupedData.map((r) => [
        r.customer_status,
        String(r.count),
      ]);

      const csvContent =
        [headers, ...rows]
          .map((row) =>
            row
              .map((cell) => `"${cell.replace(/"/g, '""')}"`)
              .join(","),
          )
          .join("\n") + "\n";

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "customer_status.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  }));

  /* ================= UI ================= */
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Customer Status Distribution</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              Displays ticket records grouped by <b>Customer Status</b>, using
              the same activity data shown in the Ticket list.
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
                <TableHead>Customer Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupedData.map((row) => (
                <TableRow key={row.customer_status}>
                  <TableCell className="font-medium">
                    {row.customer_status}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className="h-9 min-w-9 rounded-full px-3 font-mono tabular-nums"
                    >
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
        <Badge className="h-9 min-w-9 rounded-full px-3 font-mono tabular-nums">
          Total: {totalCount}
        </Badge>
      </CardFooter>
    </Card>
  );
});

export default CustomerStatusCard;
