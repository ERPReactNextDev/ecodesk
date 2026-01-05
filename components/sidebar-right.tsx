"use client";

import * as React from "react";
import { DatePicker } from "@/components/date-picker";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useFormat } from "@/contexts/FormatContext";
import { type DateRange } from "react-day-picker";
import { Meeting } from "@/components/meeting";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

type SidebarRightProps = React.ComponentProps<typeof Sidebar> & {
  userId?: string;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
};

export function SidebarRight({
  userId,
  dateCreatedFilterRange,
  setDateCreatedFilterRangeAction,
  ...props
}: SidebarRightProps) {
  const { timeFormat, dateFormat } = useFormat();

  const [time, setTime] = React.useState("");
  const [date, setDate] = React.useState("");
  const [calendarKey, setCalendarKey] = React.useState("init");

  /* ================= MONTH + YEAR RANGE ================= */
  const [fromMonth, setFromMonth] = React.useState<number | null>(null);
  const [fromMonthYear, setFromMonthYear] = React.useState<number | null>(null);
  const [toMonth, setToMonth] = React.useState<number | null>(null);
  const [toMonthYear, setToMonthYear] = React.useState<number | null>(null);

  /* ================= YEAR RANGE ================= */
  const [yearFrom, setYearFrom] = React.useState<number | null>(null);
  const [yearTo, setYearTo] = React.useState<number | null>(null);
  const [filterKey, setFilterKey] = React.useState(0);

  const [userDetails, setUserDetails] = React.useState({
    ReferenceID: "",
    Firstname: "",
    Lastname: "",
    Position: "",
    Email: "",
    profilePicture: "",
  });

  /* ================= TIME ================= */
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: timeFormat === "12h",
        })
      );

      if (dateFormat === "short") {
        setDate(now.toLocaleDateString("en-US"));
      } else if (dateFormat === "iso") {
        setDate(now.toISOString().split("T")[0]);
      } else {
        setDate(
          now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        );
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeFormat, dateFormat]);

  /* ================= USER ================= */
  React.useEffect(() => {
    if (!userId) return;
    fetch(`/api/user?id=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        setUserDetails({
          ReferenceID: data.ReferenceID || "",
          Firstname: data.Firstname || "",
          Lastname: data.Lastname || "",
          Position: data.Position || "",
          Email: data.Email || "",
          profilePicture: data.profilePicture || "",
        });
      });
  }, [userId]);

  /* ================= DATE PICKER ================= */
  function handleDateRangeSelect(range: DateRange | undefined) {
    setDateCreatedFilterRangeAction(range);
  }

  /* ================= MONTH + YEAR CONFIRM ================= */
  function confirmMonthYearRange() {
    if (
      fromMonth === null ||
      fromMonthYear === null ||
      toMonth === null ||
      toMonthYear === null
    )
      return;

    // clear year-only filter
    setYearFrom(null);
    setYearTo(null);

    const from = startOfMonth(new Date(fromMonthYear, fromMonth));
    const to = endOfMonth(new Date(toMonthYear, toMonth));

    setDateCreatedFilterRangeAction({ from, to });
    setCalendarKey(`month-${fromMonthYear}-${toMonthYear}`);
  }

  function clearMonthYearRange() {
    // clear month range
    setFromMonth(null);
    setFromMonthYear(null);
    setToMonth(null);
    setToMonthYear(null);

    // clear year range
    setYearFrom(null);
    setYearTo(null);

    // clear date picker highlight
    setDateCreatedFilterRangeAction(undefined);

    // force UI reset
    setFilterKey((k) => k + 1);
    setCalendarKey(`clear-all-${Date.now()}`);
  }


  /* ================= YEAR RANGE CONFIRM ================= */
  function confirmYearRange() {
    if (yearFrom === null || yearTo === null) return;

    // clear month filter
    setFromMonth(null);
    setFromMonthYear(null);
    setToMonth(null);
    setToMonthYear(null);

    const from = startOfYear(new Date(yearFrom, 0));
    const to = endOfYear(new Date(yearTo, 0));

    setDateCreatedFilterRangeAction({ from, to });
    setCalendarKey(`year-${yearFrom}-${yearTo}`);
  }

  function clearYearRange() {
    // clear year range
    setYearFrom(null);
    setYearTo(null);

    // clear month range
    setFromMonth(null);
    setFromMonthYear(null);
    setToMonth(null);
    setToMonthYear(null);

    // clear date picker highlight
    setDateCreatedFilterRangeAction(undefined);

    // force UI reset
    setFilterKey((k) => k + 1);
    setCalendarKey(`clear-all-${Date.now()}`);
  }

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const years = Array.from({ length: 60 }).map(
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      {...props}
    >
      <SidebarHeader className="h-16 border-b">
        <NavUser
          user={{
            name:
              `${userDetails.Firstname} ${userDetails.Lastname}`.trim() ||
              "Unknown User",
            position: userDetails.Position,
            email: userDetails.Email,
            avatar: userDetails.profilePicture || "/avatars/shadcn.jpg",
          }}
          userId={userId ?? ""}
        />
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar space-y-4">
        <DatePicker
          key={calendarKey}
          selectedDateRange={dateCreatedFilterRange}
          onDateSelectAction={handleDateRangeSelect}
        />

        {/* ================= MONTH + YEAR RANGE ================= */}
        <div key={`month-${filterKey}`} className="px-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Filter by Month and Year
          </div>

          <div className="text-xs">From</div>
          <div className="flex gap-2">
            <Select onValueChange={(v) => setFromMonth(Number(v))}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months
                  .map((m, i) => ({ m, i }))
                  .filter(({ i }) => {
                    if (fromMonth === null || fromMonthYear === null || toMonthYear === null)
                      return true;

                    // same year → restrict months
                    if (toMonthYear === fromMonthYear) {
                      return i >= fromMonth;
                    }

                    // different year → allow all months
                    return true;
                  })
                  .map(({ m, i }) => (
                    <SelectItem key={m} value={String(i)}>
                      {m}
                    </SelectItem>
                ))}

              </SelectContent>
            </Select>

            <Select onValueChange={(v) => setFromMonthYear(Number(v))}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs">To</div>
          <div className="flex gap-2">
            <Select onValueChange={(v) => setToMonth(Number(v))}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={m} value={String(i)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => setToMonthYear(Number(v))}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
              {years
                .filter((y) => fromMonthYear === null || y >= fromMonthYear)
                .map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            className="w-full"
            disabled={
              fromMonth === null ||
              fromMonthYear === null ||
              toMonth === null ||
              toMonthYear === null
            }
            onClick={confirmMonthYearRange}
          >
            Apply Month & Year Range
          </Button>

          {fromMonth !== null && toMonth !== null && (
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={clearMonthYearRange}
            >
              Clear Month & Year Filter
            </Button>
          )}
        </div>

{/* ================= YEAR RANGE ================= */}
<div key={`year-${filterKey}`} className="px-3 space-y-2">
  <div className="text-xs font-medium text-muted-foreground">
    Filter by Year
  </div>

  {/* FROM */}
  <div className="text-xs">From</div>
  <Select onValueChange={(v) => setYearFrom(Number(v))}>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select Year" />
    </SelectTrigger>
    <SelectContent>
      {years.map((y) => (
        <SelectItem key={y} value={String(y)}>
          {y}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {/* TO */}
  <div className="text-xs">To</div>
  <Select onValueChange={(v) => setYearTo(Number(v))}>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select Year" />
    </SelectTrigger>
    <SelectContent>
      {years
        .filter((y) => yearFrom === null || y >= yearFrom)
        .map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>

  <Button
    size="sm"
    className="w-full"
    disabled={yearFrom === null || yearTo === null}
    onClick={confirmYearRange}
  >
    Apply Year Range
  </Button>

  {yearFrom !== null && yearTo !== null && (
    <Button
      size="sm"
      variant="destructive"
      className="w-full"
      onClick={clearYearRange}
    >
      Clear Year Filter
    </Button>
  )}
</div>



        <SidebarSeparator className="mx-0" />

        <Card className="border-0 shadow-none">
          <CardContent>
            <Meeting referenceid={userDetails.ReferenceID} />
          </CardContent>
        </Card>
      </SidebarContent>

      <SidebarFooter>
        <div className="mt-2 border-t pt-2 text-center text-xs">
          <div>{time}</div>
          <div className="text-[11px]">{date}</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
