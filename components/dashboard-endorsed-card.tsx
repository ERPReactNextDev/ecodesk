"use client";

import React, { useState, useMemo } from "react";
import { Info } from "lucide-react";
import { type DateRange } from "react-day-picker";
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

export function EndorsedCard({
  activities,
  loading,
  error,
  dateCreatedFilterRange,
}: EndorsedProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [endorsedDialogOpen, setEndorsedDialogOpen] = useState(false);

  const isDateInRange = (
    dateStr: string | undefined,
    range: DateRange | undefined
  ) => {
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

  // Count total activities with status "Endorsed" (case-insensitive) AND within date range
  const endorsedCount = useMemo(() => {
    return activities.filter(
      (a) =>
        a.status &&
        a.status.toLowerCase() === "endorsed" &&
        isDateInRange(a.date_created, dateCreatedFilterRange)
    ).length;
  }, [activities, dateCreatedFilterRange]);

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
              <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
                This shows the total number of activities with status "Endorsed"
                within the selected date range.
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {!loading && !error && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Total Endorsed Tickets:</span>
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
          <div className="text-xs">Showing total activities with status Endorsed</div>
        </CardFooter>
      </Card>

      <Dialog open={endorsedDialogOpen} onOpenChange={setEndorsedDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Endorsed Tickets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {activities
              .filter(
                (a) =>
                  a.status &&
                  a.status.toLowerCase() === "endorsed" &&
                  isDateInRange(a.date_created, dateCreatedFilterRange)
              )
              .map((activity) => (
                <div
                  key={activity._id || activity.ticket_reference_number}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">
                      {activity.company_name || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ticket #: {activity.ticket_reference_number || "-"}
                    </p>
                  </div>
                  <TicketHistoryDialog item={activity} />
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
