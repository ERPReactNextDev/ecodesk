"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface CancelDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelDialog({ onConfirm, onCancel }: CancelDialogProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-md p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-black">
          Are you sure you want to cancel this activity?
        </h3>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} className="cursor-pointer">
            No, keep editing
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="cursor-pointer">
            Yes, cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
