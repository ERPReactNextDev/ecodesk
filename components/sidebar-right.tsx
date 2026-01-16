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
import { Button } from "@/components/ui/button";
import { useFormat } from "@/contexts/FormatContext";
import { type DateRange } from "react-day-picker";
import { Meeting } from "@/components/meeting";
import { DateFilterModal } from "@/components/date-filter-modal";

const STORAGE_KEY = "date-filter-dialog";

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
  const [dateFilterOpen, setDateFilterOpen] = React.useState(false);
  const [dateFilterFlag, setDateFilterFlag] = React.useState<0 | 1>(0);

  const [userDetails, setUserDetails] = React.useState({
    ReferenceID: "",
    Firstname: "",
    Lastname: "",
    Position: "",
    Email: "",
    Role: "",   // 👈 add
    profilePicture: "",
  });


  /* ================= HELPERS ================= */
  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /* ================= FORCE RESTORE ON EVERY PAGE ================= */
  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);

      if (parsed?.from && parsed?.to) {
        setDateCreatedFilterRangeAction({
          from: new Date(parsed.from),
          to: new Date(parsed.to),
        });
        setDateFilterFlag(1);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [setDateCreatedFilterRangeAction]);

  /* ================= ALWAYS PERSIST (FIXED) ================= */
  React.useEffect(() => {
    if (!dateCreatedFilterRange?.from || !dateCreatedFilterRange?.to) {
      setDateFilterFlag(0);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const today = new Date();

    const isOnlyToday =
      isSameDay(dateCreatedFilterRange.from, today) &&
      isSameDay(dateCreatedFilterRange.to, today);

    // 🚫 TODAY ONLY = NOT A FILTER
    if (isOnlyToday) {
      setDateFilterFlag(0);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // ✅ REAL FILTER
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        from: dateCreatedFilterRange.from.toISOString(),
        to: dateCreatedFilterRange.to.toISOString(),
      })
    );

    setDateFilterFlag(1);
  }, [dateCreatedFilterRange]);

  /* ================= CLEAR (MANUAL ONLY) ================= */
  function clearDateFilter() {
    setDateCreatedFilterRangeAction(undefined);
    setDateFilterFlag(0);
    localStorage.removeItem(STORAGE_KEY);
  }

  /* ================= TIME + DATE ================= */
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
    const i = setInterval(updateTime, 1000);
    return () => clearInterval(i);
  }, [timeFormat, dateFormat]);

  /* ================= USER INFO ================= */
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
          Role: data.Role || "",     // 👈 add
          profilePicture: data.profilePicture || "",
        });

      });
  }, [userId]);

  return (
    <>
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

        <SidebarContent className="space-y-2">
          <DatePicker
            selectedDateRange={dateCreatedFilterRange}
            onDateSelectAction={(range) => {
              setDateCreatedFilterRangeAction(range);
            }}
          />

          <div className="pr-2 pl-2 space-y-2">
            {dateFilterFlag === 1 && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={clearDateFilter}
              >
                Clear Date Filter
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full cursor-pointer"
              onClick={() => setDateFilterOpen(true)}
            >
              Advanced Date Filter
            </Button>
          </div>

          <SidebarSeparator />

          <Card className="border-0 shadow-none">
            <CardContent>
              <Meeting referenceid={userDetails.ReferenceID} />
            </CardContent>
          </Card>
        </SidebarContent>

        <SidebarFooter>
          <div className="border-t pt-2 text-center text-xs">
            <div>{time}</div>
            <div className="text-[11px]">{date}</div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <DateFilterModal
        open={dateFilterOpen}
        onClose={() => setDateFilterOpen(false)}
        dateCreatedFilterRange={dateCreatedFilterRange}
        setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
        setDateFilterFlag={setDateFilterFlag}
      />
    </>
  );
}
