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

/* ✅ Typed SKU ticket record */
interface SkuTicketItem {
  ticket_reference_number?: string;
  status?: string;
  date_created?: string;

  /* SKU */
  item_code?: string;
  item_description?: string;
  qty_sold?: string;
  so_number?: string;
  so_amount?: string;

  /* Customer */
  company_name?: string;
  contact_person?: string;
  contact_number?: string;
  email_address?: string;

  /* Ticket meta */
  department?: string;
  manager?: string;
  agent?: string;
  traffic?: string;
  channel?: string;
  wrap_up?: string;

  /* ✅ NEW FIELDS */
  tsm_acknowledge_date?: string;
  tsa_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_handling_time?: string;
  hr_acknowledge_date?: string;

  /* Remarks */
  remarks?: string;
  inquiry?: string;

  /* Closure */
  close_reason?: string;
  counter_offer?: string;
  client_specs?: string;
}

interface Props {
  item: SkuTicketItem;
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

export function ReportsSkuTicketDialog({ item }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* TRIGGER */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
      >
        View SKU Ticket
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>SKU Ticket Details</span>

              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold
                  ${STATUS_STYLES[item.status ?? ""] ?? "bg-slate-100 text-slate-700 border-slate-300"}`}
              >
                {item.status || "N/A"}
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

          {/* SKU INFORMATION */}
          <section className="space-y-2">
            <h3 className="font-semibold text-sm">SKU Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p><strong>Item Code:</strong> {item.item_code || "-"}</p>
              <p><strong>Item Description:</strong> {item.item_description || "-"}</p>
              <p><strong>Quantity Sold:</strong> {item.qty_sold || "-"}</p>
              <p><strong>SO Number:</strong> {item.so_number || "-"}</p>
              <p><strong>SO Amount:</strong> {item.so_amount || "-"}</p>
            </div>
          </section>

          <Separator className="my-4" />

          {/* CUSTOMER INFO */}
          <section className="space-y-2">
            <h3 className="font-semibold text-sm">Customer Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p>
                <strong>Company:</strong>{" "}
                {item.company_name &&
                item.company_name !== item.contact_person
                  ? item.company_name
                  : "-"}
              </p>
              <p><strong>Contact Person:</strong> {item.contact_person || "-"}</p>
              <p><strong>Contact Number:</strong> {item.contact_number || "-"}</p>
              <p><strong>Email Address:</strong> {item.email_address || "-"}</p>
            </div>
          </section>

          <Separator className="my-4" />

          {/* TICKET META */}
          <section className="space-y-2">
            <h3 className="font-semibold text-sm">Ticket Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p><strong>Department:</strong> {item.department || "-"}</p>
              <p><strong>Manager:</strong> {item.manager || "-"}</p>
              <p><strong>Agent:</strong> {item.agent || "-"}</p>
              <p><strong>Traffic:</strong> {item.traffic || "-"}</p>
              <p><strong>Channel:</strong> {item.channel || "-"}</p>
              <p><strong>Wrap Up:</strong> {item.wrap_up || "-"}</p>
            </div>
          </section>

          <Separator className="my-4" />

          {/* ✅ ACKNOWLEDGE & HANDLING */}
          <section className="space-y-2">
            <h3 className="font-semibold text-sm">Acknowledge & Handling</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p><strong>Date Created:</strong> {formatDateTime(item.date_created)}</p>
              <p><strong>TSM Acknowledgement Date:</strong> {formatDateTime(item.tsm_acknowledge_date)}</p>
              <p><strong>TSA Acknowledgement Date:</strong> {formatDateTime(item.tsa_acknowledge_date)}</p>
              <p><strong>TSM Handling Time:</strong> {formatDateTime(item.tsm_handling_time)}</p>
              <p><strong>TSA Handling Time:</strong> {formatDateTime(item.tsa_handling_time)}</p>
              {item.wrap_up === "Job Applicants" && (
                <p>
                  <strong>HR Acknowledgement Date:</strong>{" "}
                  {formatDateTime(item.hr_acknowledge_date)}
                </p>
              )}
            </div>
          </section>

          {/* REMARKS */}
          {(item.remarks || item.inquiry) && (
            <>
              <Separator className="my-4" />
              <section className="space-y-2">
                <h3 className="font-semibold text-sm">Remarks</h3>
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
