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

  filters: Partial<Record<FilterField, string>>;
  handleFilterChange: (field: FilterField, value: string) => void;

  sortField: string;
  setSortField: (field: string) => void;

  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;

  mergedData: any[];
  sortableFields: string[];
}

const filterFields: FilterField[] = [
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Filter & Sort Activities</DialogTitle>
        </DialogHeader>

        {/* FILTERS — GRID (NOT VERTICAL) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          {filterFields.map((field) => {
            const options = Array.from(
              new Set(
                mergedData
                  .map((item) => (item as any)[field])
                  .filter(
                    (val) => val !== undefined && val !== null && val !== ""
                  )
              )
            ).sort();

            return (
              <div key={field}>
                <label className="block text-sm font-medium capitalize mb-1">
                  {field.replace(/_/g, " ")}
                </label>

                <Select
                  value={filters[field] || "__all__"}
                  onValueChange={(value) =>
                    handleFilterChange(
                      field,
                      value === "__all__" ? "" : value
                    )
                  }
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="-- All --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="cursor-pointer">-- All --</SelectItem>
                    {options.map((opt) => (
                      <SelectItem key={opt} value={opt} className="cursor-pointer">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        {/* SORTING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Sort By
            </label>
            <Select
              value={sortField}
              onValueChange={(value) => setSortField(value)}
            >
              <SelectTrigger className="w-full cursor-pointer">
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
                <RadioGroupItem value="asc" id="asc" className="cursor-pointer"/>
                <label htmlFor="asc">Ascending</label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="desc" id="desc" className="cursor-pointer"/>
                <label htmlFor="desc">Descending</label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setFilterDialogOpen(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button onClick={() => setFilterDialogOpen(false)} className="cursor-pointer">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
