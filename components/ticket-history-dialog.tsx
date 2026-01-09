"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/* ✅ Strongly typed item */
interface TicketHistoryItem {
  ticket_reference_number?: string;
  status?: string;
  date_created?: string;

  contact_person?: string;
  contact_number?: string;
  email_address?: string;
  company_name?: string;

  ticket_received?: string;
  ticket_endorsed?: string;

  /* ✅ NEW FIELDS */
  tsm_acknowledge_date?: string;
  tsa_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_handling_time?: string;

  traffic?: string;
  channel?: string;
  source_company?: string;
  source?: string;
  wrap_up?: string;
  department?: string;
  manager?: string;
  agent?: string;
  customer_type?: string;
  customer_status?: string;

  remarks?: string;
  inquiry?: string;

  po_number?: string;
  so_number?: string;
  so_amount?: string;
  qty_sold?: string;
  quotation_number?: string;
  quotation_amount?: string;
  payment_terms?: string;
  po_source?: string;
  payment_date?: string;
  delivery_date?: string;

  close_reason?: string;
  counter_offer?: string;
  client_specs?: string;
}

interface Props {
  item: TicketHistoryItem;
}

/* helper */
const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
};

const STATUS_STYLES: Record<string, string> = {
  "On-Progress": "bg-blue-100 text-blue-700 border-blue-300",
  "Closed": "bg-gray-200 text-gray-700 border-gray-300",
  "Endorsed": "bg-purple-100 text-purple-700 border-purple-300",
  "Converted into Sales": "bg-green-100 text-green-700 border-green-300",
};


export function TicketHistoryDialog({ item }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 cursor-pointer"
      >
        View Ticket History
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ticket History</span>

              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold
                  ${STATUS_STYLES[item.status ?? ""] ?? "bg-slate-100 text-slate-700 border-slate-300"}`}
              >
                {item.status || "-"}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* HEADER */}
          <div className="space-y-1 text-sm">
            <p className="uppercase font-semibold">
              Ticket #: {item.ticket_reference_number || "-"}
            </p>
            <p className="text-muted-foreground">
              Created on {formatDateTime(item.date_created)}
            </p>
          </div>

          <Separator className="my-4" />

          {/* CONTACT INFO */}
          <section className="space-y-2">
            <h3 className="font-semibold text-sm">Contact Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p><strong>Contact Person:</strong> {item.contact_person || "-"}</p>
              <p><strong>Contact Number:</strong> {item.contact_number || "-"}</p>
              <p><strong>Email Address:</strong> {item.email_address || "-"}</p>
              <p>
                  <strong>Company:</strong>{" "}
                  {item.company_name &&
                  item.company_name !== item.contact_person
                    ? item.company_name
                    : "-"}
                </p>
            </div>
          </section>

          <Separator className="my-4" />

          {/* TICKET DETAILS */}
          <section className="space-y-2">
            <h3 className="font-semibold text-sm">Ticket Details</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p><strong>Ticket Received:</strong> {formatDateTime(item.ticket_received)}</p>
              <p><strong>Ticket Endorsed:</strong> {formatDateTime(item.ticket_endorsed)}</p>

              {/* ✅ NEW FIELDS */}
              <p><strong>TSM Acknowledge Date:</strong> {formatDateTime(item.tsm_acknowledge_date)}</p>
              <p><strong>TSA Acknowledge Date:</strong> {formatDateTime(item.tsa_acknowledge_date)}</p>
              <p><strong>TSM Handling Time:</strong> {formatDateTime(item.tsm_handling_time)}</p>
              <p><strong>TSA Handling Time:</strong> {formatDateTime(item.tsa_handling_time)}</p>

              <p><strong>Traffic:</strong> {item.traffic || "-"}</p>
              <p><strong>Channel:</strong> {item.channel || "-"}</p>
              <p><strong>Source Company:</strong> {item.source_company || "-"}</p>
              <p><strong>Source:</strong> {item.source || "-"}</p>
              <p><strong>Wrap Up:</strong> {item.wrap_up || "-"}</p>
              <p><strong>Department:</strong> {item.department || "-"}</p>
              <p><strong>Manager:</strong> {item.manager || "-"}</p>
              <p><strong>Agent:</strong> {item.agent || "-"}</p>
              <p><strong>Customer Type:</strong> {item.customer_type || "-"}</p>
              <p><strong>Customer Status:</strong> {item.customer_status || "-"}</p>
            </div>
          </section>

          {/* REMARKS / INQUIRY */}
          {(item.remarks || item.inquiry) && (
            <>
              <Separator className="my-4" />
              <section className="space-y-2">
                <h3 className="font-semibold text-sm">Remarks & Inquiry</h3>
                {item.remarks && (
                  <p className="text-xs"><strong>Remarks:</strong> {item.remarks}</p>
                )}
                {item.inquiry && (
                  <p className="text-xs"><strong>Inquiry:</strong> {item.inquiry}</p>
                )}
              </section>
            </>
          )}

          {/* CLOSURE DETAILS */}
          {item.status === "Closed" && (
            <>
              <Separator className="my-4" />
              <section className="space-y-2 bg-muted p-3 rounded-lg">
                <h3 className="font-semibold text-sm">Closure Details</h3>
                <p className="text-xs"><strong>Close Reason:</strong> {item.close_reason || "-"}</p>
                <p className="text-xs"><strong>Counter Offer:</strong> {item.counter_offer || "-"}</p>
                <p className="text-xs"><strong>Client Specs:</strong> {item.client_specs || "-"}</p>
              </section>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
