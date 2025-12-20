"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HideModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any | null;
  onSave: (updated: any) => void;
}

export const CustomerDatabaseHideModal: React.FC<HideModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
}) => {
  // Optional: for extra cancel confirmation dialog (not currently used)
  // const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirmHide = async () => {
    if (!account?.id) {
      alert("Account id is missing. Cannot update status.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/com-update-status-remove", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account.id,
          referenceid: account.referenceid,
          status: "Removed", // set status to inactive
          date_updated: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update status");

      onSave(data.data);
      onClose();
      toast.success("Account successfully deactivated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
    //after 0.2s refresh the app\customer-database\customer-database-hide-modal.tsx
  };

  // Close modal immediately on Cancel click
  const handleCancelClick = () => {
    onClose();
  };

  if (!isOpen || !account) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
        onClick={handleCancelClick} // clicking outside modal closes it
      >
        {/* Modal content */}
        <div
          className="bg-white rounded-md p-6 max-w-md w-full shadow-lg"
          onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        >
          <h2 className="text-lg font-semibold mb-4">Deactivate Account</h2>
          <p className="mb-4 text-sm">
            Are you sure you want to deactivate the account{" "}
            <strong>{account.company_name ?? "-"}</strong>?
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelClick}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmHide} disabled={loading}>
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
