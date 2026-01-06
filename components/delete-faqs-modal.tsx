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

interface DeleteFaqsModalProps {
  open: boolean;
  onClose: () => void;
  faqId: string;
  onDeleted: (id: string) => void;
}

export function DeleteFaqsModal({
  open,
  onClose,
  faqId,
  onDeleted,
}: DeleteFaqsModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/faqs-hide-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faqId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("FAQ record hidden successfully");

      onDeleted(faqId);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to hide FAQ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete FAQs Record</DialogTitle>
          <DialogDescription>
            Do you want to delete this FAQs record?
            <br />
            This action will hide it from the application.
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
