"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (val: any) => void;
}

export const ObcCallsFilterDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
}) => {
  const sortOptions = (arr: string[]) =>
    arr.slice().sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const resetFilters = () => {
    setFilters({
      type_client: "All",
      source: "All",
      call_status: "All",
      call_type: "All",
      status: "All",
      tsm: "All",
      manager: "All",
      type_activity: "All",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Filter Outbound Calls</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* TYPE CLIENT */}
          <div className="grid gap-2">
            <Label>Type Client</Label>
            <Select
              value={filters.type_client}
              onValueChange={(v) =>
                setFilters({ ...filters, type_client: v })
              }
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select type client" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {sortOptions([
                  "All",
                  "TSA Client",
                  "Top 50",
                  "Balance 20",
                  "Next 30",
                  "CSR Client",
                ]).map((i) => (
                  <SelectItem key={i} value={i} className="cursor-pointer">
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SOURCE */}
          <div className="grid gap-2">
            <Label>Source</Label>
            <Select
              value={filters.source}
              onValueChange={(v) =>
                setFilters({ ...filters, source: v })
              }
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {sortOptions([
                  "All",
                  "Outbound - Touchbase",
                  "Outbound - Follow-up",
                ]).map((i) => (
                  <SelectItem key={i} value={i} className="cursor-pointer">
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CALL STATUS */}
          <div className="grid gap-2">
            <Label>Call Status</Label>
            <Select
              value={filters.call_status}
              onValueChange={(v) =>
                setFilters({ ...filters, call_status: v })
              }
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select call status" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {sortOptions(["All", "Successful", "Unsuccessful"]).map(
                  (i) => (
                    <SelectItem key={i} value={i} className="cursor-pointer">
                      {i}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* CALL TYPE */}
          <div className="grid gap-2">
            <Label>Call Type</Label>
            <Select
              value={filters.call_type}
              onValueChange={(v) =>
                setFilters({ ...filters, call_type: v })
              }
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select call type" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {sortOptions([
                  "All",
                  "Waiting for Future Projects",
                  "Ringing Only",
                  "No Requirements",
                  "Not Connected With The Company",
                  "With RFQ",
                  "Cannot Be Reached",
                ]).map((i) => (
                  <SelectItem key={i} value={i} className="cursor-pointer">
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* STATUS */}
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                setFilters({ ...filters, status: v })
              }
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {sortOptions(["All", "Assisted", "Not Assisted"]).map(
                  (i) => (
                    <SelectItem key={i} value={i} className="cursor-pointer">
                      {i}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={resetFilters} className="cursor-pointer">
            Clear Filters
          </Button>

          <Button onClick={onClose} className="cursor-pointer">Apply Filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
