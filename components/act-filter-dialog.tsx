"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import type { FilterField } from "@/types";

interface ActFilterDialogProps {
  filterDialogOpen: boolean;
  setFilterDialogOpen: (open: boolean) => void;

  filters: Partial<Record<FilterField | "referenceid", string>>;
  handleFilterChange: (field: FilterField | "referenceid", value: string) => void;

  sortField: string;
  setSortField: (field: string) => void;

  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;

  mergedData: any[];
  sortableFields: string[];
}

// Extend allowed fields to include referenceid (agent)
type ExtendedFilterField = FilterField | "referenceid";

const filterFields: ExtendedFilterField[] = [
  "referenceid",        // 👈 NEW: Filter by Agent
  "source_company",
  "source",
  "wrap_up",
  "traffic",
  "department",
  "channel",
  "customer_status",
  "customer_type",
  "remarks",
  "status",
];

export const ActFilterDialog: React.FC<ActFilterDialogProps> = ({
  filterDialogOpen,
  setFilterDialogOpen,
  filters,
  handleFilterChange,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  mergedData,
  sortableFields,
}) => {
  return (
    <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
      <DialogContent className="w-[90vh] max-w-none flex flex-col">
        <DialogHeader>
          <DialogTitle>Filter & Sort Activities</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            {filterFields.map((field) => {
              const options = Array.from(
                new Set(
                  mergedData
                    .map((item) => (item as any)[field])
                    .filter(
                      (val) =>
                        val !== undefined &&
                        val !== null &&
                        val !== ""
                    )
                )
              ).sort();

              return (
                <div key={field}>
                  <label className="block text-sm font-medium capitalize mb-1">
                    {field === "referenceid"
                      ? "Agent"
                      : field.replace(/_/g, " ")}
                  </label>

                  <Select
                    value={(filters as any)[field] || "__all__"}
                    onValueChange={(value) =>
                      handleFilterChange(
                        field as any,
                        value === "__all__" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- All --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">
                        -- All --
                      </SelectItem>
                      {options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 my-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Sort By
              </label>
              <Select
                value={sortField}
                onValueChange={setSortField}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortableFields.map((field) => (
                    <SelectItem
                      key={field}
                      value={field}
                      className="capitalize"
                    >
                      {field.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Sort Order
              </label>
              <RadioGroup
                value={sortOrder}
                onValueChange={(value) =>
                  setSortOrder(value as "asc" | "desc")
                }
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="asc" id="asc" />
                  <label htmlFor="asc">Ascending</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="desc" id="desc" />
                  <label htmlFor="desc">Descending</label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setFilterDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={() => setFilterDialogOpen(false)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
