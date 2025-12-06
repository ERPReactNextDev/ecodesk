"use client";

import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetTrigger,
} from "@/components/ui/sheet";
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
        <Sheet open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            {/* SheetTrigger can be used elsewhere if needed */}
            <SheetContent side="left" className="w-[400px] p-4 custom-scrollbar overflow-auto">
                <SheetHeader>
                    <SheetTitle>Filter & Sort Activities</SheetTitle>
                </SheetHeader>

                {/* Filter Selects */}
                <div className="space-y-4 my-4">
                    {filterFields.map((field) => {
                        const options = Array.from(
                            new Set(
                                mergedData
                                    .map((item) => (item as any)[field])
                                    .filter((val) => val !== undefined && val !== null && val !== "")
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
                                        handleFilterChange(field, value === "__all__" ? "" : value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="-- All --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">-- All --</SelectItem>
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

                {/* Sorting */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Sort By</label>
                    <Select
                        value={sortField}
                        onValueChange={(value) => setSortField(value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {sortableFields.map((field) => (
                                <SelectItem key={field} value={field} className="capitalize">
                                    {field.replace(/_/g, " ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Sort Order Radio Buttons */}
                <div className="mb-6 flex space-x-6 items-center">
                    <RadioGroup
                        value={sortOrder}
                        onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
                        className="flex space-x-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="asc" id="asc" />
                            <label htmlFor="asc">Ascending</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="desc" id="desc" />
                            <label htmlFor="desc">Descending</label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Buttons */}
                <SheetFooter className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setFilterDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => setFilterDialogOpen(false)}>Apply</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
