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
  customer_type?: string;
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

export interface CustomerTypeCardRef {
  downloadCSV: () => void;
}

/* ================= COMPONENT ================= */
const CustomerTypeCard = forwardRef<CustomerTypeCardRef, ChannelTableProps>(
  ({ activities, loading, error, dateCreatedFilterRange }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);

    /* ================= DATE FILTER ================= */
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
        ? new Date(
            to.getFullYear(),
            to.getMonth(),
            to.getDate(),
            23,
            59,
            59,
            999,
          )
        : null;

      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;

      return true;
    };

    /* ================= CORE LOGIC ================= */
    const { displayData, jobApplicationCount } = useMemo(() => {
      const summary: Record<string, number> = {};
      let jobApps = 0;

      activities
        .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
        .forEach((a) => {
          const ct = a.customer_type?.trim();

          if (!ct || ct === "-") {
            // count as job application (not included in summary)
            jobApps += 1;
          } else {
            summary[ct] = (summary[ct] ?? 0) + 1;
          }
        });

      return {
        displayData: Object.entries(summary).map(([customer_type, count]) => ({
          customer_type,
          count,
        })),
        jobApplicationCount: jobApps,
      };
    }, [activities, dateCreatedFilterRange]);

    const totalCount =
      displayData.reduce((sum, row) => sum + row.count, 0) + jobApplicationCount;

    /* ================= CSV EXPORT ================= */
    useImperativeHandle(ref, () => ({
      downloadCSV: () => {
        const headers = ["Customer Type", "Count"];

        const rows = displayData.map((row) => [
          row.customer_type,
          row.count.toString(),
        ]);

        // Add job applications as a separate row
        if (jobApplicationCount > 0) {
          rows.push(["Count of Job Applications", jobApplicationCount.toString()]);
        }

        const csvContent =
          [headers, ...rows]
            .map((row) =>
              row.map((item) => `"${item.replace(/"/g, '""')}"`).join(","),
            )
            .join("\n") + "\n";

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "customer_type_summary.csv");
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
          <CardTitle>Customer Type Distribution</CardTitle>

          <div
            className="relative cursor-pointer text-muted-foreground hover:text-foreground"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={18} />
            {showTooltip && (
              <TooltipInfo>
                This card shows the number of tickets per customer type. The
                count exactly matches the filtered tickets list. Entries without
                a customer type or with "-" are counted separately as job
                applications.
              </TooltipInfo>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-grow overflow-auto">
          {loading && <p>Loading activities...</p>}
          {error && <p className="text-destructive">{error}</p>}

          {!loading && !error && displayData.length === 0 && jobApplicationCount === 0 && (
            <p className="text-muted-foreground">No data available.</p>
          )}

          {!loading && !error && (
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
                    <TableCell className="font-medium py-4">
                      {row.customer_type}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums"
                      >
                        {row.count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Show job applications as a separate row */}
                {jobApplicationCount > 0 && (
                  <TableRow key="job-applications">
                    <TableCell className="font-medium py-4 italic text-muted-foreground">
                      Count of Job Applications
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums"
                      >
                        {jobApplicationCount}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )}
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
  },
);

export default CustomerTypeCard;
