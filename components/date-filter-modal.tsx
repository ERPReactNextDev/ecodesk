"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { type DateRange } from "react-day-picker";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

interface DateFilterModalProps {
  open: boolean;
  onClose: () => void;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
  setDateFilterFlag: React.Dispatch<React.SetStateAction<0 | 1>>;
}

export function DateFilterModal({
  open,
  onClose,
  dateCreatedFilterRange,
  setDateCreatedFilterRangeAction,
  setDateFilterFlag,
}: DateFilterModalProps) {
  const [filterKey, setFilterKey] = React.useState(0);

  /* ================= MONTH + YEAR ================= */
  const [fromMonth, setFromMonth] = React.useState<number | null>(null);
  const [fromMonthYear, setFromMonthYear] = React.useState<number | null>(null);
  const [toMonth, setToMonth] = React.useState<number | null>(null);
  const [toMonthYear, setToMonthYear] = React.useState<number | null>(null);

  /* ================= YEAR ================= */
  const [yearFrom, setYearFrom] = React.useState<number | null>(null);
  const [yearTo, setYearTo] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!dateCreatedFilterRange) {
      setFromMonth(null);
      setFromMonthYear(null);
      setToMonth(null);
      setToMonthYear(null);
      setYearFrom(null);
      setYearTo(null);
      setDateFilterFlag(0);
      setFilterKey((k) => k + 1);
    }
  }, [dateCreatedFilterRange, setDateFilterFlag]);

  function confirmMonthYearRange() {
    if (
      fromMonth === null ||
      fromMonthYear === null ||
      toMonth === null ||
      toMonthYear === null
    )
      return;

    setYearFrom(null);
    setYearTo(null);

    const from = startOfMonth(new Date(fromMonthYear, fromMonth));
    const to = endOfMonth(new Date(toMonthYear, toMonth));

    setDateCreatedFilterRangeAction({ from, to });
    setDateFilterFlag(1);
    onClose();
  }

  function clearMonthYearRange() {
    setFromMonth(null);
    setFromMonthYear(null);
    setToMonth(null);
    setToMonthYear(null);
    setYearFrom(null);
    setYearTo(null);
    setDateCreatedFilterRangeAction(undefined);
    setDateFilterFlag(0);
    setFilterKey((k) => k + 1);
  }

  function confirmYearRange() {
    if (yearFrom === null || yearTo === null) return;

    setFromMonth(null);
    setFromMonthYear(null);
    setToMonth(null);
    setToMonthYear(null);

    const from = startOfYear(new Date(yearFrom, 0));
    const to = endOfYear(new Date(yearTo, 0));

    setDateCreatedFilterRangeAction({ from, to });
    setDateFilterFlag(1);
    onClose();
  }

  function clearYearRange() {
    setYearFrom(null);
    setYearTo(null);
    setFromMonth(null);
    setFromMonthYear(null);
    setToMonth(null);
    setToMonthYear(null);
    setDateCreatedFilterRangeAction(undefined);
    setDateFilterFlag(0);
    setFilterKey((k) => k + 1);
  }

  function clearAll() {
    clearMonthYearRange();
    setDateFilterFlag(0);
  }

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const years = Array.from({ length: 60 }).map(
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Date Filter</DialogTitle>
        </DialogHeader>

        {/* ================= MONTH + YEAR ================= */}
        <div key={`month-${filterKey}`} className="space-y-3">
          <div className="text-xs font-medium">Filter by Month & Year</div>

          <div className="text-xs">From</div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={fromMonth !== null ? String(fromMonth) : undefined}
              onValueChange={(v) => setFromMonth(Number(v))}
            >
              <SelectTrigger className="w-full h-10">
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

            <Select
              value={fromMonthYear !== null ? String(fromMonthYear) : undefined}
              onValueChange={(v) => setFromMonthYear(Number(v))}
            >
              <SelectTrigger className="w-full h-10">
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
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={toMonth !== null ? String(toMonth) : undefined}
              onValueChange={(v) => setToMonth(Number(v))}
            >
              <SelectTrigger className="w-full h-10">
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

            <Select
              value={toMonthYear !== null ? String(toMonthYear) : undefined}
              onValueChange={(v) => setToMonthYear(Number(v))}
            >
              <SelectTrigger className="w-full h-10">
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
            className="w-full h-10"
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
        </div>

        {/* ================= YEAR ================= */}
        <div key={`year-${filterKey}`} className="space-y-3 pt-4">
          <div className="text-xs font-medium">Filter by Year</div>

          <Select
            value={yearFrom !== null ? String(yearFrom) : undefined}
            onValueChange={(v) => setYearFrom(Number(v))}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="From Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={yearTo !== null ? String(yearTo) : undefined}
            onValueChange={(v) => setYearTo(Number(v))}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="To Year" />
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
            className="w-full h-10"
            disabled={yearFrom === null || yearTo === null}
            onClick={confirmYearRange}
          >
            Apply Year Range
          </Button>
        </div>

        <DialogFooter className="flex gap-2 pt-4">
          <Button variant="destructive" className="flex-1" onClick={clearAll}>
            Clear All Filters
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
