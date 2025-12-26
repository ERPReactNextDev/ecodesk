"use client";

import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  ForwardRefRenderFunction,
} from "react";
import { Info } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { type DateRange } from "react-day-picker";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Tooltip component for info
function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

interface Activity {
  channel?: string;
  date_created?: string;
}

interface ChannelBarChartProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
}

export interface ChannelCardRef {
  downloadCSV: () => void;
}

const chartConfig = {
  label: {
    color: "var(--foreground)",
  },
  bar: {
    color: "var(--color-desktop)",
  },
} satisfies ChartConfig;

const ChannelCard: ForwardRefRenderFunction<ChannelCardRef, ChannelBarChartProps> = (
  { activities, loading, error, dateCreatedFilterRange },
  ref
) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const isDateInRange = (dateStr: string | undefined, range: DateRange | undefined) => {
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

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange));
  }, [activities, dateCreatedFilterRange]);

  const channelCountsArray = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredActivities.forEach((a) => {
      if (a.channel && a.channel.trim() !== "") {
        const ch = a.channel.trim();
        counts[ch] = (counts[ch] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredActivities]);

  const totalChannelsCount = useMemo(() => {
    return filteredActivities.filter((a) => a.channel && a.channel.trim() !== "").length;
  }, [filteredActivities]);

  // CSV download helper
  const downloadCSV = () => {
    const header = ["Channel", "Count"];
    const rows = channelCountsArray.map(({ channel, count }) => [channel, count.toString()]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "channel_counts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Expose downloadCSV to parent via ref
  useImperativeHandle(ref, () => ({
    downloadCSV,
  }));

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Channel Usage</CardTitle>
        <div
          className="relative cursor-pointer text-muted-foreground hover:text-foreground"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="Channel usage explanation"
        >
          <Info size={18} />
          {showTooltip && (
            <TooltipInfo>
              This chart counts all channel activities within the selected date range.{" "}
              Channels are counted including duplicates, so repeated entries increase the count.
            </TooltipInfo>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!loading && !error && channelCountsArray.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <BarChart
              data={channelCountsArray}
              layout="vertical"
              margin={{ right: 16, left: 0 }}
              width={400}
              height={250}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="channel"
                type="category"
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="count" fill="var(--color-desktop)" radius={4}>
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <p>No channel data available</p>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-end items-center text-sm">
        <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
          Total: {totalChannelsCount}
        </Badge>
      </CardFooter>
    </Card>
  );
};

export default forwardRef(ChannelCard);
