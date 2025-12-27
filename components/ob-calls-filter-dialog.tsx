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
  // Helper to sort options alphabetically, case-insensitive
  const sortOptions = (arr: string[]) =>
    arr.slice().sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Filter Outbound Calls</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* TYPE CLIENT */}
          <div className="flex flex-col gap-1">
            <Label>Type Client</Label>
            <Select
              value={filters.type_client}
              onValueChange={(v) => setFilters({ ...filters, type_client: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type client" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions(["All", "TSA Client", "Top 50", "Balance 20", "Next 30", "CSR Client"]).map(
                  (i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* SOURCE */}
          <div className="flex flex-col gap-1">
            <Label>Source</Label>
            <Select
              value={filters.source}
              onValueChange={(v) => setFilters({ ...filters, source: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions(["All", "Outbound - Touchbase", "Outbound - Follow-up"]).map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CALL STATUS */}
          <div className="flex flex-col gap-1">
            <Label>Call Status</Label>
            <Select
              value={filters.call_status}
              onValueChange={(v) => setFilters({ ...filters, call_status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select call status" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions(["All", "Successful", "Unsuccessful"]).map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CALL TYPE */}
          <div className="flex flex-col gap-1">
            <Label>Call Type</Label>
            <Select
              value={filters.call_type}
              onValueChange={(v) => setFilters({ ...filters, call_type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select call type" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions(["All", "Waiting for Future Projects", "Ringing Only","No Requirements", "Not Connected With The Company", "With RFQ", "Cannot Be Reached"]).map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* STATUS */}
          <div className="flex flex-col gap-1">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters({ ...filters, status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions(["All", "Assisted", "Not Assisted"]).map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                type_client: "All",
                source: "All",
                call_status: "All",
                call_type: "All",
                status: "All",
              })
            }
          >
            Clear Filters
          </Button>

          <Button onClick={onClose}>Apply Filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
