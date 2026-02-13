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
import { Input } from "@/components/ui/input";

interface DoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: {
    close_reason: string;
    counter_offer: string;
    client_specs: string;
    tsm_acknowledge_date: string;
    tsm_handling_time: string;
    tsa_acknowledge_date: string;
    tsa_handling_time: string;
  }) => void;
  loading?: boolean;

  close_reason?: string;
  counter_offer?: string;
  client_specs?: string;

  tsm_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_acknowledge_date?: string;
  tsa_handling_time?: string;
}

export const DoneDialog: React.FC<DoneDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  close_reason,
  counter_offer,
  client_specs,

  tsm_acknowledge_date,
  tsm_handling_time,
  tsa_acknowledge_date,
  tsa_handling_time,
}) => {
  const [closeReason, setCloseReason] = useState("");
  const [counterOffer, setCounterOffer] = useState("");
  const [clientSpecs, setClientSpecs] = useState("");

  const [tsmAcknowledgeDate, setTsmAcknowledgeDate] = useState("");
  const [tsmHandlingTime, setTsmHandlingTime] = useState("");

  const [tsaAcknowledgeDate, setTsaAcknowledgeDate] = useState("");
  const [tsaHandlingTime, setTsaHandlingTime] = useState("");

  const [tsmTimeError, setTsmTimeError] = useState<string | null>(null);
  const [tsaTimeError, setTsaTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCloseReason(close_reason || "");
      setCounterOffer(counter_offer || "");
      setClientSpecs(client_specs || "");

      setTsmAcknowledgeDate(tsm_acknowledge_date || "");
      setTsmHandlingTime(tsm_handling_time || "");

      setTsaAcknowledgeDate(tsa_acknowledge_date || "");
      setTsaHandlingTime(tsa_handling_time || "");
    }
  }, [
    open,
    close_reason,
    counter_offer,
    client_specs,
    tsm_acknowledge_date,
    tsm_handling_time,
    tsa_acknowledge_date,
    tsa_handling_time,
  ]);

  useEffect(() => {
    if (closeReason === "Same Specs Provided") {
      setCounterOffer("-");
      setClientSpecs("-");
    } else {
      if (counterOffer === "-") setCounterOffer("");
      if (clientSpecs === "-") setClientSpecs("");
    }
  }, [closeReason]);

  useEffect(() => {
    if (!tsmAcknowledgeDate || !tsmHandlingTime) {
      setTsmTimeError(null);
      return;
    }

    const ack = new Date(tsmAcknowledgeDate);
    const handle = new Date(tsmHandlingTime);

    if (handle < ack) {
      setTsmTimeError(
        "TSM Handling Time cannot be earlier than TSM Acknowledgement Time.",
      );
    } else {
      setTsmTimeError(null);
    }
  }, [tsmAcknowledgeDate, tsmHandlingTime]);

  useEffect(() => {
    if (!tsaAcknowledgeDate || !tsaHandlingTime) {
      setTsaTimeError(null);
      return;
    }

    const ack = new Date(tsaAcknowledgeDate);
    const handle = new Date(tsaHandlingTime);

    if (handle < ack) {
      setTsaTimeError(
        "TSA Handling Time cannot be earlier than TSA Acknowledgement Time.",
      );
    } else {
      setTsaTimeError(null);
    }
  }, [tsaAcknowledgeDate, tsaHandlingTime]);

  const isValidCloseReason =
    closeReason.trim() !== "" &&
    (closeReason === "Same Specs Provided" ||
      closeReason !== "Counter Offer" ||
      (counterOffer.trim() !== "" && clientSpecs.trim() !== ""));

  const handleConfirm = () => {
    if (!isValidCloseReason) return;

    onConfirm({
      close_reason: closeReason.trim(),
      counter_offer: counterOffer.trim(),
      client_specs: clientSpecs.trim(),
      tsm_acknowledge_date: tsmAcknowledgeDate,
      tsm_handling_time: tsmHandlingTime,
      tsa_acknowledge_date: tsaAcknowledgeDate,
      tsa_handling_time: tsaHandlingTime,
    });

    setCloseReason("");
    setCounterOffer("");
    setClientSpecs("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 🔥 MAIN CHANGE HERE – FLEX + MAX HEIGHT */}
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mark Transaction as Closed</DialogTitle>
        </DialogHeader>

        {/* 🔥 SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto pr-2">
          <DialogDescription className="space-y-4">
            <p>
              Are you sure you want to mark this transaction as Closed? It will
              remain in the list but its status will be updated.
            </p>

            <div className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm bg-blue-50">
              <h4 className="font-semibold text-sm text-blue-700">
                Handling Time Details (Required)
              </h4>

              <div className="space-y-2 mt-2">
                <Label>TSM Acknowledgement Date *</Label>
                <Input
                  type="datetime-local"
                  value={tsmAcknowledgeDate}
                  onChange={(e) => setTsmAcknowledgeDate(e.target.value)}
                />

                <Label>TSM Handling Time *</Label>
                <Input
                  type="datetime-local"
                  value={tsmHandlingTime}
                  onChange={(e) => setTsmHandlingTime(e.target.value)}
                />
                {tsmTimeError && (
                  <p className="text-sm text-red-600">{tsmTimeError}</p>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <Label>TSA Acknowledgement Date *</Label>
                <Input
                  type="datetime-local"
                  value={tsaAcknowledgeDate}
                  onChange={(e) => setTsaAcknowledgeDate(e.target.value)}
                />

                <Label>TSA Handling Time *</Label>
                <Input
                  type="datetime-local"
                  value={tsaHandlingTime}
                  onChange={(e) => setTsaHandlingTime(e.target.value)}
                />
                {tsaTimeError && (
                  <p className="text-sm text-red-600">{tsaTimeError}</p>
                )}
              </div>
            </div>

            <div className="w-full border border-red-300 rounded-md px-3 py-2 text-sm bg-red-50">
              <h4 className="font-semibold text-sm text-red-600">
                On Closing of Ticket (Required)
              </h4>

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

              {closeReason === "Counter Offer" && (
                <>
                  <Label>2. Add Counter Offer *</Label>
                  <Textarea
                    value={counterOffer}
                    onChange={(e) => setCounterOffer(e.target.value)}
                  />

                  <Label>3. Client Specs *</Label>
                  <Textarea
                    value={clientSpecs}
                    onChange={(e) => setClientSpecs(e.target.value)}
                  />
                </>
              )}
            </div>
          </DialogDescription>
        </div>

        {/* FOOTER REMAINS STICKY */}
        <DialogFooter className="pt-2">
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>

          <Button
            onClick={handleConfirm}
            disabled={
              loading || !!tsmTimeError || !!tsaTimeError || !isValidCloseReason
            }
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Updating..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
