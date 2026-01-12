"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  recordId: string;
  onDeleted: (id: string) => void;
}

export function DepartmentalCsrDeleteModal({
  open,
  onClose,
  recordId,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/departmental-csr-hide-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("CSR record hidden successfully");

      onDeleted(recordId);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to hide record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete CSR Record</DialogTitle>
          <DialogDescription>
            Do you want to delete this CSR record?
            <br />
            This action will hide it from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
