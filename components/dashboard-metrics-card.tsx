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


    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "channel-traffic-metrics.csv";

    link.click();

    URL.revokeObjectURL(url);

  }
}));

  /* ---------------- Render ---------------- */
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Channel Traffic</CardTitle>

        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
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
        {loading && <p>Loading activities...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && groupedData.length === 0 && (
          <p className="text-muted-foreground">No data available.</p>
        )}

        {!loading && !error && groupedData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-30 border-r">Channel</TableHead>
                <TableHead className="text-right">Traffic</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Converted</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">ATU</TableHead>
                <TableHead className="text-right">ATV</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupedData.map((r) => (
                <TableRow key={r.channel}>
                  <TableCell className="sticky left-0 bg-white z-30 border-r">{r.channel}</TableCell>
                  <TableCell className="text-right">{r.traffic}</TableCell>
                  <TableCell className="text-right">₱{r.soAmountTotal.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{r.convertedCount}</TableCell>
                  <TableCell className="text-right">{r.qtySoldTotal}</TableCell>
                  <TableCell className="text-right">{Math.round(r.avgTransactionUnit)}</TableCell>
                  <TableCell className="text-right">₱{Math.round(r.avgTransactionValue).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>

            <tfoot className="bg-muted font-semibold">
              <TableRow>
                <TableCell className="sticky left-0 bg-white z-30 border-r">Total</TableCell>
                <TableCell className="text-right">{totalTraffic}</TableCell>
                <TableCell className="text-right">₱{totalSoAmount.toLocaleString()}</TableCell>
                <TableCell className="text-right">{totalConverted}</TableCell>
                <TableCell className="text-right">{totalQtySold}</TableCell>
                <TableCell className="text-right">{Math.round(avgTransactionUnitTotal)}</TableCell>
                <TableCell className="text-right">₱{Math.round(avgTransactionValueTotal).toLocaleString()}</TableCell>
              </TableRow>
            </tfoot>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});
