"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: {
    close_reason: string;
    counter_offer: string;
    client_specs: string;
  }) => void;
  loading?: boolean;

  // Autofill
  close_reason?: string;
  counter_offer?: string;
  client_specs?: string;
}

export const DoneDialog: React.FC<DoneDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  close_reason,
  counter_offer,
  client_specs,
}) => {
  const [closeReason, setCloseReason] = useState("");
  const [counterOffer, setCounterOffer] = useState("");
  const [clientSpecs, setClientSpecs] = useState("");

  // Autofill when dialog opens
  useEffect(() => {
    if (open) {
      setCloseReason(close_reason || "");
      setCounterOffer(counter_offer || "");
      setClientSpecs(client_specs || "");
    }
  }, [open, close_reason, counter_offer, client_specs]);

  // Auto dash logic for "Same Specs Provided"
  useEffect(() => {
    if (closeReason === "Same Specs Provided") {
      setCounterOffer("-");
      setClientSpecs("-");
    } else {
      if (counterOffer === "-") setCounterOffer("");
      if (clientSpecs === "-") setClientSpecs("");
    }
  }, [closeReason]);

  // Validation — same as Sheet Ticket
  const isValid =
    closeReason.trim() !== "" &&
    (closeReason === "Same Specs Provided" ||
      closeReason !== "Counter Offer" ||
      (counterOffer.trim() !== "" && clientSpecs.trim() !== ""));

  const handleConfirm = () => {
    if (!isValid) return;

    onConfirm({
      close_reason: closeReason.trim(),
      counter_offer: counterOffer.trim(),
      client_specs: clientSpecs.trim(),
    });

    setCloseReason("");
    setCounterOffer("");
    setClientSpecs("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Transaction as Closed</DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              Are you sure you want to mark this transaction as Closed? It will
              remain in the list but its status will be updated. You can reopen
              the ticket later if needed.
            </p>

            {/* 🔴 RED CLOSING PANEL */}
            <div className="w-full border border-red-300 rounded-md px-3 py-2 text-sm !bg-[#fff5f5]">
              <h4 className="font-semibold text-sm text-red-600">
                On Closing of Ticket (Required)
              </h4>

              {/* 1. Close Reason */}
              <div className="space-y-1">
                <Label className="text-red-700">1. Close Reason *</Label>
                <select
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="w-full border border-red-300 rounded-md px-3 py-2 text-sm bg-[#fffafa]"
                >
                  <option value="">Select a reason</option>
                  <option value="Same Specs Provided">Same Specs Provided</option>
                  <option value="Counter Offer">Counter Offer</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Client Declined">Client Declined</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* 2 & 3 — ONLY for Counter Offer */}
              {closeReason === "Counter Offer" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-red-700">
                      2. Add Counter Offer *
                    </Label>
                    <Textarea
                      value={counterOffer}
                      onChange={(e) => setCounterOffer(e.target.value)}
                      placeholder="Enter counter offer..."
                      className="border-red-300 focus:ring-red-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-red-700">3. Client Specs *</Label>
                    <Textarea
                      value={clientSpecs}
                      onChange={(e) => setClientSpecs(e.target.value)}
                      placeholder="Enter client specifications..."
                      className="border-red-300 focus:ring-red-300 bg-[#fff5f5]"
                    />
                  </div>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Updating..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
