"use client";

import React, {
  useState,
  useMemo,
  useImperativeHandle
} from "react";
import { Info } from "lucide-react";
import { type DateRange } from "react-day-picker";

import {
  Card,
  CardContent,
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

/* ---------------- Tooltip ---------------- */
function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-72 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

/* ---------------- Interfaces ---------------- */
interface Activity {
  channel?: string;
  traffic?: string;
  so_amount: string;
  qty_sold: string;
  status: string;
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
export interface MetricsCardRef {
  downloadCSV: () => void;
}

/* ---------------- Date Helper (FIXED) ---------------- */
function isDateInRange(date: Date, range?: DateRange) {
  if (!range) return true;

  const from = range.from
    ? new Date(new Date(range.from).setHours(0, 0, 0, 0))
    : null;

  const to = range.to
    ? new Date(new Date(range.to).setHours(23, 59, 59, 999))
    : null;

  if (from && date < from) return false;
  if (to && date > to) return false;

  return true;
}

/* ---------------- Component ---------------- */
export const MetricsCard = React.forwardRef<
  MetricsCardRef,
  ChannelTableProps
>(function MetricsCard({
  activities,
  loading,
  error,
  dateCreatedFilterRange,
}, ref) {
  const [showTooltip, setShowTooltip] = useState(false);

  /* ---------------- Grouped Data ---------------- */
  const groupedData = useMemo(() => {
    const map: Record<
      string,
      {
        traffic: number;
        soAmountTotal: number;
        qtySoldTotal: number;
        convertedCount: number;
      }
    > = {};

    activities
      .filter((a) => {
        if (!a.channel || !a.date_created) return false;

        const date = new Date(a.date_created);
        if (isNaN(date.getTime())) return false;

        if (!isDateInRange(date, dateCreatedFilterRange)) return false;

        const traffic = a.traffic?.toLowerCase();
        return traffic === "sales" || traffic === "non-sales";
      })
      .forEach((a) => {
        const channel = a.channel!.trim();
        const soAmount = Number(a.so_amount) || 0;
        const qtySold = Number(a.qty_sold) || 0;
        const isConverted =
          a.status?.toLowerCase() === "converted into sales";

        if (!map[channel]) {
          map[channel] = {
            traffic: 0,
            soAmountTotal: 0,
            qtySoldTotal: 0,
            convertedCount: 0,
          };
        }

        map[channel].traffic += 1;
        map[channel].soAmountTotal += soAmount;
        map[channel].qtySoldTotal += qtySold;
        if (isConverted) map[channel].convertedCount += 1;
      });

    return Object.entries(map).map(([channel, v]) => ({
      channel,
      ...v,
      avgTransactionUnit:
        v.convertedCount > 0 ? v.qtySoldTotal / v.convertedCount : 0,
      avgTransactionValue:
        v.convertedCount > 0 ? v.soAmountTotal / v.convertedCount : 0,
    }));
  }, [activities, dateCreatedFilterRange]);

  /* ---------------- Totals ---------------- */
  const totalTraffic = groupedData.reduce((s, r) => s + r.traffic, 0);
  const totalSoAmount = groupedData.reduce((s, r) => s + r.soAmountTotal, 0);
  const totalQtySold = groupedData.reduce((s, r) => s + r.qtySoldTotal, 0);
  const totalConverted = groupedData.reduce((s, r) => s + r.convertedCount, 0);

  const avgTransactionUnitTotal =
    totalConverted > 0 ? totalQtySold / totalConverted : 0;

  const avgTransactionValueTotal =
    totalConverted > 0 ? totalSoAmount / totalConverted : 0;

    useImperativeHandle(ref, () => ({
  downloadCSV() {

    if (!groupedData.length) return;

    const headers = [
      "Channel",
      "Traffic",
      "Amount",
      "Converted",
      "Qty Sold",
      "ATU",
      "ATV"
    ];

    const rows = groupedData.map(r => ({
      Channel: r.channel,
      Traffic: r.traffic,
      Amount: r.soAmountTotal,
      Converted: r.convertedCount,
      "Qty Sold": r.qtySoldTotal,
      ATU: Math.round(r.avgTransactionUnit),
      ATV: Math.round(r.avgTransactionValue)
    }));


    // DATE FILTER TEXT
    let filterText = "All Dates";

    if (dateCreatedFilterRange?.from && dateCreatedFilterRange?.to) {

      const from = new Date(dateCreatedFilterRange.from).toLocaleDateString();

      const to = new Date(dateCreatedFilterRange.to).toLocaleDateString();

      filterText = `${from} - ${to}`;

    }


    // TOTAL ROW
    const totalRow = [
      "TOTAL",
      totalTraffic,
      totalSoAmount,
      totalConverted,
      totalQtySold,
      Math.round(avgTransactionUnitTotal),
      Math.round(avgTransactionValueTotal)
    ];


    const csv = [

      ["Date Filter", filterText].join(","),

      [],

      headers.join(","),

      totalRow.join(","),

      ...rows.map(row =>
        headers.map(h => row[h as keyof typeof row]).join(",")
      )

    ].join("\n");


    downloadStyledWorkbookFromCsv(csv, "channel-traffic-metrics.xlsx");

  }
}));

  /* ---------------- Render ---------------- */
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
      <CardHeader className="flex justify-between items-center pb-3">
        <CardTitle className="text-lg font-semibold">Channel Traffic</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              <div><b>Traffic:</b> Total valid sales & non-sales entries</div>
              <div><b>Amount:</b> Total SO Amount</div>
              <div><b>Qty Sold:</b> Total quantity sold</div>
              <div><b>Converted Sales:</b> Status = Converted into Sales</div>
              <div><b>ATU:</b> Qty Sold ÷ Converted Sales</div>
              <div><b>ATV:</b> Amount ÷ Converted Sales</div>
            </TooltipInfo>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading activities...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && groupedData.length === 0 && (
          <p className="text-sm text-muted-foreground">No data available.</p>
        )}

        {!loading && !error && groupedData.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="sticky left-0 z-30 border-r bg-background font-semibold">Channel</TableHead>
                <TableHead className="text-right font-semibold">Traffic</TableHead>
                <TableHead className="text-right font-semibold">Amount</TableHead>
                <TableHead className="text-right font-semibold">Converted</TableHead>
                <TableHead className="text-right font-semibold">Qty Sold</TableHead>
                <TableHead className="text-right font-semibold">ATU</TableHead>
                <TableHead className="text-right font-semibold">ATV</TableHead>
              </TableRow>
            </TableHeader>

              <TableBody>
                {groupedData.map((r) => (
                  <TableRow key={r.channel} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="sticky left-0 z-30 border-r bg-background font-medium">{r.channel}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.traffic}</TableCell>
                  <TableCell className="text-right tabular-nums">₱{r.soAmountTotal.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.convertedCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.qtySoldTotal}</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(r.avgTransactionUnit)}</TableCell>
                  <TableCell className="text-right tabular-nums">₱{Math.round(r.avgTransactionValue).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>

            <tfoot className="bg-muted/50 font-semibold">
              <TableRow>
                <TableCell className="sticky left-0 z-30 border-r bg-background font-semibold">Total</TableCell>
                <TableCell className="text-right tabular-nums">{totalTraffic}</TableCell>
                <TableCell className="text-right tabular-nums">₱{totalSoAmount.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{totalConverted}</TableCell>
                <TableCell className="text-right tabular-nums">{totalQtySold}</TableCell>
                <TableCell className="text-right tabular-nums">{Math.round(avgTransactionUnitTotal)}</TableCell>
                <TableCell className="text-right tabular-nums">₱{Math.round(avgTransactionValueTotal).toLocaleString()}</TableCell>
              </TableRow>
            </tfoot>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
