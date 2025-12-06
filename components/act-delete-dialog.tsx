"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToDeleteCount: number;
  deleting: boolean;
  onConfirm: () => void;
}

export const ActDeleteDialog: React.FC<ActDeleteDialogProps> = ({
  open,
  onOpenChange,
  selectedToDeleteCount,
  deleting,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedToDeleteCount} activities?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
