"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

type WeekPickerProps = {
  selectedMonth: number;
  selectedYear: number;
  selectedWeeks: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onWeeksChange: (weeks: number[]) => void;
};

function getWeekRanges(month: number, year: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const ranges = [
    { week: 1, start: 1, end: Math.min(7, daysInMonth) },
    { week: 2, start: 8, end: Math.min(14, daysInMonth) },
    { week: 3, start: 15, end: Math.min(21, daysInMonth) },
    { week: 4, start: 22, end: Math.min(28, daysInMonth) },
    ...(daysInMonth > 28 ? [{ week: 5, start: 29, end: daysInMonth }] : []),
  ];
  return ranges;
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function WeekPickerPopover(props: WeekPickerProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Select Weeks
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border bg-background shadow-xl">
          <WeekPicker {...props} />
        </div>
      )}
    </div>
  );
}

export function WeekPicker({
  selectedMonth,
  selectedYear,
  selectedWeeks,
  onMonthChange,
  onYearChange,
  onWeeksChange,
}: WeekPickerProps) {
const [search, setSearch] = React.useState("");
const monthResults = React.useMemo(() => {
  if (!search.trim()) return [];

  const q = search.toLowerCase();

  const results: { month: number; year: number; label: string }[] = [];

  for (
    let year = new Date().getFullYear() - 5;
    year <= new Date().getFullYear() + 5;
    year++
  ) {
    MONTH_NAMES.forEach((month, index) => {
      const label = `${month} ${year}`;

      if (
        month.toLowerCase().includes(q) ||
        year.toString().includes(q) ||
        label.toLowerCase().includes(q)
      ) {
        results.push({
          month: index,
          year,
          label,
        });
      }
    });
  }

  return results.slice(0, 8);
}, [search]);
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); // 0=Sun
  const weekRanges = getWeekRanges(selectedMonth, selectedYear);

  // Build calendar grid: 6 rows x 7 cols
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  function getWeekForDay(day: number): number | null {
    const found = weekRanges.find((r) => day >= r.start && day <= r.end);
    return found ? found.week : null;
  }

  function toggleWeek(week: number) {
    onWeeksChange(
      selectedWeeks.includes(week)
        ? selectedWeeks.filter((w) => w !== week)
        : [...selectedWeeks, week]
    );
  }

  function prevMonth() {
    if (selectedMonth === 0) {
      onMonthChange(11);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  }

  function nextMonth() {
    if (selectedMonth === 11) {
      onMonthChange(0);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  }

  // When month/year changes, reset to all weeks selected
  React.useEffect(() => {
    const allWeeks = weekRanges.map((r) => r.week);
    onWeeksChange(allWeeks);
  }, [selectedMonth, selectedYear]);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    selectedMonth === today.getMonth() &&
    selectedYear === today.getFullYear();

  return (
    <div className="p-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium">
          {MONTH_NAMES[selectedMonth]} {selectedYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

<div className="relative mb-3">
  <Search
    size={15}
    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
  />

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search month or year..."
    className="w-full rounded-md border bg-background pl-8 pr-2 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
  />

  {search && (
    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto rounded-md border bg-background shadow-lg z-50">
      {monthResults.length ? (
        monthResults.map((item) => (
          <button
            key={`${item.month}-${item.year}`}
            onClick={() => {
              onMonthChange(item.month);
              onYearChange(item.year);
              setSearch("");
            }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
          >
            {item.label}
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No results
        </div>
      )}
    </div>
  )}
</div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex flex-col gap-[2px]">
        {rows.map((row, rowIndex) => {
          // Determine which week this row belongs to
          const firstDay = row.find((d) => d !== null);
          const week = firstDay != null ? getWeekForDay(firstDay) : null;
          const isSelected = week !== null && selectedWeeks.includes(week!);

          return (
            <div
              key={rowIndex}
              onClick={() => week !== null && toggleWeek(week!)}
              className={`grid grid-cols-7 rounded-md cursor-pointer transition-colors ${
                isSelected
                  ? "bg-orange-400 text-white"
                  : "hover:bg-muted"
              }`}
            >
              {row.map((day, colIndex) => (
                <div
                  key={colIndex}
                  className={`text-center text-sm py-1 rounded-md ${
                    day === null
                      ? "text-muted-foreground/30"
                      : isSelected
                      ? "text-white font-medium"
                      : isToday(day!)
                      ? "font-bold text-primary"
                      : "text-foreground"
                  } ${
                    isToday(day!) && isSelected
                      ? "ring-2 ring-white ring-offset-1 ring-offset-orange-400 rounded-full"
                      : ""
                  }`}
                >
                  {day ?? ""}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Week legend */}
      <div className="mt-3 flex flex-col gap-1">
        {weekRanges.map(({ week, start, end }) => (
          <button
            key={week}
            onClick={() => toggleWeek(week)}
            className={`flex items-center justify-between text-xs px-2 py-1 rounded transition-colors ${
              selectedWeeks.includes(week)
                ? "bg-orange-400 text-white font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span>Week {week}</span>
            <span className="opacity-80">
              {MONTH_NAMES[selectedMonth].slice(0, 3)} {start}–{end}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}