"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Import your Dialog components

interface HideRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  onHide: (updatedRecord: any) => void;
}

export const HideRecordModal: React.FC<HideRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onHide,
}) => {
  const [loading, setLoading] = useState(false);

  const handleHide = async () => {
    if (!record) return;
    setLoading(true);

    try {
      const res = await fetch("/api/d-tracking-hide-record", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record._id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Record hidden successfully");
        onHide({ ...record, isActive: false });
        onClose();
      } else {
        toast.error(data.error || "Failed to hide record");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to hide record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this record?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleHide} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
