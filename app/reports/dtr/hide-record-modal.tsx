"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Do you want to delete this record?</h3>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            No
          </Button>
          <Button variant="destructive" onClick={handleHide} disabled={loading}>
            Yes
          </Button>
        </div>
      </div>
    </div>
  );
};
