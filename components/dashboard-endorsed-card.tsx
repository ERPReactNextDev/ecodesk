"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Info } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TicketHistoryDialog } from "@/components/ticket-history-dialog";

interface Activity {
  _id?: string;
  referenceid?: string;
  account_reference_number?: string;
  status: string;
  company_name?: string;
  contact_person?: string;
  contact_number?: string;
  email_address?: string;
  type_client?: string;
  address?: string;
  activity_reference_number?: string;
  date_created?: string;
  date_updated?: string;
  agent?: string;
  channel?: string;
  client_segment?: string;
  customer_status?: string;
  customer_type?: string;
  delivery_date?: string;
  department?: string;
  department_head?: string;
  gender?: string;
  handling_csr?: string;
  hr_acknowledge_date?: string;
  inquiry?: string;
  inquiry_received?: string;
  item_code?: string;
  item_description?: string;
  manager?: string;
  payment_date?: string;
  payment_terms?: string;
  po_number?: string;
  po_source?: string;
  qty_sold?: string;
  quotation_amount?: string;
  quotation_number?: string;
  remarks?: string;
  response_to_inquiry?: string;
  so_amount?: string;
  so_date?: string;
  so_number?: string;
  source?: string;
  source_company?: string;
  ticket_endorsed?: string;
  ticket_received?: string;
  ticket_reference_number?: string;
  traffic?: string;
  tsa_acknowledge_date?: string;
  tsa_handling_time?: string;
  tsm_acknowledge_date?: string;
  tsm_handling_time?: string;
  wrap_up?: string;
  client_specs?: string;
  close_reason?: string;
  counter_offer?: string;
  admin_remarks?: string;
}

interface EndorsedProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function EndorsedCard({
  activities,
  loading,
  error,
  dateCreatedFilterRange,
}: EndorsedProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [endorsedDialogOpen, setEndorsedDialogOpen] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [adminRemarksByKey, setAdminRemarksByKey] = useState<
    Record<string, string>
  >({});
  const [savedAdminRemarksByKey, setSavedAdminRemarksByKey] = useState<
    Record<string, string>
  >({});
  const [savingAdminRemarksByKey, setSavingAdminRemarksByKey] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!endorsedDialogOpen) return;

    const roles = [
      "Territory Sales Associate",
      "Territory Sales Manager",
      "Manager",
      "Admin",
      "Staff",
    ];

    Promise.all(
      roles.map((role) =>
        fetch(`/api/fetch-users-by-role?role=${encodeURIComponent(role)}`)
          .then((response) => response.json())
          .then((json) => json.data || [])
          .catch(() => [])
      )
    ).then((results) => {
      const map: Record<string, string> = {};
      results.flat().forEach((user: any) => {
        if (user.ReferenceID) {
          map[user.ReferenceID] = `${user.Firstname} ${user.Lastname}`.trim();
        }
      });
      setUserMap(map);
    });
  }, [endorsedDialogOpen]);

  useEffect(() => {
    if (!endorsedDialogOpen) return;

    const initialRemarksByKey: Record<string, string> = {};

    activities.forEach((activity) => {
      const key = activity._id || activity.ticket_reference_number;
      if (!key) return;
      initialRemarksByKey[key] = activity.admin_remarks || "";
    });

    setAdminRemarksByKey((prev) => {
      const next = { ...prev };

      Object.entries(initialRemarksByKey).forEach(([key, value]) => {
        if (!(key in next)) {
          next[key] = value;
        }
      });

      return next;
    });

    setSavedAdminRemarksByKey((prev) => ({
      ...initialRemarksByKey,
      ...prev,
    }));
  }, [activities, endorsedDialogOpen]);

  const isDateInRange = (
    dateStr: string | undefined,
    range: DateRange | undefined
  ) => {
    if (!range) return true;
    if (!dateStr) return false;

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return false;

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

  const endorsedActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.status &&
          activity.status.toLowerCase() === "endorsed" &&
          isDateInRange(activity.date_created, dateCreatedFilterRange)
      ),
    [activities, dateCreatedFilterRange]
  );

  const endorsedCount = endorsedActivities.length;

  const getActivityKey = useCallback(
    (activity: Activity) =>
      activity._id || activity.ticket_reference_number || "",
    []
  );

  const getAdminRemarksValue = useCallback(
    (activity: Activity) => {
      const key = getActivityKey(activity);
      return key ? (adminRemarksByKey[key] ?? activity.admin_remarks ?? "") : "";
    },
    [adminRemarksByKey, getActivityKey]
  );

  const handleAdminRemarksChange = useCallback(
    (activity: Activity, value: string) => {
      const key = getActivityKey(activity);
      if (!key) return;

      setAdminRemarksByKey((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [getActivityKey]
  );

  const handleSaveAdminRemarks = useCallback(
    async (activity: Activity) => {
      const key = getActivityKey(activity);

      if (!key || !activity._id) {
        toast.error("Hindi ma-save ang admin remarks dahil walang activity ID.");
        return;
      }

      const adminRemarks = adminRemarksByKey[key] ?? activity.admin_remarks ?? "";

      setSavingAdminRemarksByKey((prev) => ({
        ...prev,
        [key]: true,
      }));

      try {
        const response = await fetch("/api/act-save-activity", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _id: activity._id,
            admin_remarks: adminRemarks,
          }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.error || "Failed to save admin remarks.");
        }

        setAdminRemarksByKey((prev) => ({
          ...prev,
          [key]: adminRemarks,
        }));
        setSavedAdminRemarksByKey((prev) => ({
          ...prev,
          [key]: adminRemarks,
        }));

        toast.success("Admin remarks saved.");
      } catch (saveError) {
        toast.error(
          saveError instanceof Error
            ? saveError.message
            : "Failed to save admin remarks."
        );
      } finally {
        setSavingAdminRemarksByKey((prev) => ({
          ...prev,
          [key]: false,
        }));
      }
    },
    [adminRemarksByKey, getActivityKey]
  );

  return (
    <>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle className="text-lg font-semibold">Open Tickets</CardTitle>
          <div
            className="relative cursor-pointer text-muted-foreground hover:text-foreground"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Endorsed activities count explanation"
          >
            <Info size={18} />
            {showTooltip && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
                This shows the total number of activities with status
                "Endorsed" within the selected date range.
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {loading && (
            <div className="text-sm text-muted-foreground">
              Loading endorsed tickets...
            </div>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}

          {!loading && !error && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Endorsed Tickets:
                </span>
                <Badge className="h-12 min-w-12 rounded-full px-4 font-mono tabular-nums text-lg font-semibold bg-primary/10 text-primary border-primary/20">
                  {endorsedCount}
                </Badge>
              </div>

              <Button
                onClick={() => setEndorsedDialogOpen(true)}
                className="w-full hover:bg-primary/5 hover:text-primary transition-all duration-200"
                variant="outline"
              >
                Show Endorsed ticket
              </Button>
            </div>
          )}
        </CardContent>

        <Separator className="my-2" />

        <CardFooter className="text-sm text-muted-foreground pt-3">
          <div className="text-xs">
            Showing total activities with status Endorsed
          </div>
        </CardFooter>
      </Card>

      <Dialog open={endorsedDialogOpen} onOpenChange={setEndorsedDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Endorsed Tickets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!loading && !error && endorsedActivities.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-base font-medium">No endorsed tickets found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting the selected date range to view more records.
                </p>
              </div>
            )}

            {endorsedActivities.map((activity) => (
              <div
                key={activity._id || activity.ticket_reference_number}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-lg">
                    {activity.company_name || "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ticket #: {activity.ticket_reference_number || "-"}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">TSA:</span>{" "}
                      {activity.agent
                        ? userMap[activity.agent] || activity.agent
                        : "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Endorsed:
                      </span>{" "}
                      {formatDateTime(activity.ticket_endorsed)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Endorsed By:</span>{" "}
                      {activity.referenceid
                        ? (userMap[activity.referenceid] || activity.referenceid)
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row items-start gap-3">
                  <div className="shrink-0">
                    <TicketHistoryDialog item={activity} />
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      {!activity._id && (
                        <span className="text-xs text-destructive">Missing activity ID</span>
                      )}
                    </div>

                    <Textarea
                      value={getAdminRemarksValue(activity)}
                      onChange={(event) =>
                        handleAdminRemarksChange(activity, event.target.value)
                      }
                      placeholder="Add admin remarks here"
                      className="min-h-10 h-10 resize-none bg-background"
                    />

                    <div className="flex items-center justify-end mt-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveAdminRemarks(activity)}
                        disabled={
                          !activity._id ||
                          savingAdminRemarksByKey[getActivityKey(activity)] ||
                          getAdminRemarksValue(activity) ===
                            (savedAdminRemarksByKey[getActivityKey(activity)] ??
                              activity.admin_remarks ??
                              "")
                        }
                      >
                        {savingAdminRemarksByKey[getActivityKey(activity)]
                          ? "Saving..."
                          : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
