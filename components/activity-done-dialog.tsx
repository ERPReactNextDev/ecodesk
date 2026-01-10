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

  // Auto logic for "Same Specs Provided"
  useEffect(() => {
    if (closeReason === "Same Specs Provided") {
      setCounterOffer("-");
      setClientSpecs("-");
    } else {
      if (counterOffer === "-") setCounterOffer("");
      if (clientSpecs === "-") setClientSpecs("");
    }
  }, [closeReason]);
  

  const isValid =
    closeReason.trim() !== "" &&
    (closeReason === "Same Specs Provided" ||
      (counterOffer.trim() !== "" && clientSpecs.trim() !== ""));

  const handleConfirm = () => {
    if (!isValid) return;

    onConfirm({
      close_reason: closeReason.trim(),
      counter_offer: counterOffer.trim(),
      client_specs: clientSpecs.trim(),
    });

    // Reset after submit
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

            {/* Close Reason */}
            <div className="space-y-1">
              <Label>1. Close Reason *</Label>
              <select
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
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

            {/* Counter Offer & Client Specs */}
            {closeReason !== "Same Specs Provided" && (
              <>
                <div className="space-y-1">
                  <Label>2. Add Counter Offer *</Label>
                  <Textarea
                    value={counterOffer}
                    onChange={(e) => setCounterOffer(e.target.value)}
                    placeholder="Enter counter offer..."
                  />
                </div>

                <div className="space-y-1">
                  <Label>3. Client Specs *</Label>
                  <Textarea
                    value={clientSpecs}
                    onChange={(e) => setClientSpecs(e.target.value)}
                    placeholder="Enter client specifications..."
                  />
                </div>
              </>
            )}
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

          <Button onClick={handleConfirm} disabled={!isValid || loading}>
            {loading ? "Updating..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
