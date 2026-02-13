"use client";

import React, { useEffect, useState, useCallback } from "react";
import { type DateRange } from "react-day-picker";

interface Ticket {
    _id: string;
    referenceid: string;
    account_reference_number: string;
    status: string;
    activity_reference_number: string;
    date_created: string;
    date_updated: string;
    agent: string;
    channel: string;
    client_segment: string;
    client_specs: string;
    close_reason: string;
    counter_offer: string;
    customer_status: string;
    customer_type: string;
    delivery_date: string;
    department: string;
    gender: string;
    inquiry: string;
    item_code: string;
    item_description: string;
    manager: string;
    payment_date: string;
    payment_terms: string;
    po_number: string;
    po_source: string;
    qty_sold: string;
    quotation_amount: string;
    quotation_number: string;
    remarks: string;
    so_amount: string;
    so_date: string;
    so_number: string;
    source: string;
    source_company: string;
    ticket_endorsed: string;
    ticket_received: string;
    ticket_reference_number: string;
    traffic: string;
    tsa_acknowledge_date: string;
    tsa_handling_time: string;
    tsm_acknowledge_date: string;
    tsm_handling_time: string;
    wrap_up: string;
    company_name: string;
    contact_number: string;
    contact_person: string;
    email_address: string;
    hr_acknowledge_date: string;
}

interface TicketProps {
    referenceid: string;
    role: string;
    dateCreatedFilterRange?: DateRange;
    setDateCreatedFilterRangeAction?: React.Dispatch<
        React.SetStateAction<DateRange | undefined>
    >;
}

export const Checker: React.FC<TicketProps> = ({
    referenceid,
    role,
    dateCreatedFilterRange,
}) => {
    const [activities, setActivities] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterReference, setFilterReference] = useState<string>("All");
    const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const columns = [
        "referenceid",
        "ticket_received",
        "ticket_endorsed",
        "company_name",
        "contact_person",
        "gender",
        "contact_number",
        "address",
        "email_address",
        "channel",
        "wrap_up",
        "source",
        "source_company",
        "customer_type",
        "customer_status",
        "status",
        "item_description",
        "quotation_number",
        "quotation_amount",

        "so_number",
        "so_amount",
        "qty_sold",
        "delivery_date",
        "manager",
        "agent",
        "tsa_acknowledge_date",
        "tsa_handling_time",
        "tsm_acknowledge_date",
        "tsm_handling_time",

        "activity_reference_number",
        "date_created",
        "date_updated",
        "client_segment",
        "client_specs",
        "close_reason",
        "counter_offer",
        "department",
        "inquiry",
        "item_code",
        "payment_date",
        "payment_terms",
        "po_number",
        "po_source",
        "remarks",
        "so_date",
        "ticket_reference_number",
        "traffic",
        "hr_acknowledge_date",
    ];

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/act-fetch-activity-role", {
                method: "GET",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-role": role,
                    "x-reference-id": referenceid,
                },
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to fetch activities");
            }

            const json = await res.json();
            setActivities(json.data || []);
        } catch (err: any) {
            setError(err.message || "Error fetching activities");
        } finally {
            setLoading(false);
        }
    }, [role, referenceid]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const uniqueReferenceIds = Array.from(new Set(activities.map((a) => a.referenceid)));

    // Apply filters: referenceId + dateCreated
    const filteredActivities = activities
        .filter((a) => {
            const matchesReference = filterReference === "All" || a.referenceid === filterReference;

            let matchesDate = true;
            if (dateCreatedFilterRange?.from || dateCreatedFilterRange?.to) {
                const createdDate = new Date(a.date_created);

                if (dateCreatedFilterRange.from) {
                    const fromDate = new Date(dateCreatedFilterRange.from);
                    fromDate.setHours(0, 0, 0, 0);
                    if (createdDate < fromDate) matchesDate = false;
                }

                if (dateCreatedFilterRange.to) {
                    const toDate = new Date(dateCreatedFilterRange.to);
                    toDate.setHours(23, 59, 59, 999);
                    if (createdDate > toDate) matchesDate = false;
                }
            }

            return matchesReference && matchesDate;
        })
        .filter((a) => {
            if (!searchQuery) return true;

            const lowerQuery = searchQuery.toLowerCase();
            // check all columns for match
            return columns.some((field) => {
                const value = (a as any)[field];
                return value && value.toString().toLowerCase().includes(lowerQuery);
            });
        });

    const handleCellChange = async (activityId: string, field: string, value: string) => {
        // Update local state first for instant feedback
        setActivities((prev) =>
            prev.map((a) =>
                a._id === activityId
                    ? { ...a, [field]: value }
                    : a
            )
        );

        // Trim activityId to avoid accidental spaces causing "Activity not found"
        const trimmedId = activityId.trim();

        try {
            const res = await fetch("/api/act-update-activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ _id: trimmedId, updates: { [field]: value } }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Update failed (HTTP error):", res.status, data.error || data);
                // Optionally, revert local change if needed
                return;
            }

            if (data.error) {
                console.error("Update failed (API error):", data.error);
                // Optionally, revert local change if needed
                return;
            }

            console.log(`Update successful for ${field} of activity ${trimmedId}`);
        } catch (err) {
            console.error("Error updating activity:", err);
            // Optionally, revert local change if needed
        }
    };

    const totalColumns = columns.length;
    const totalActivities = filteredActivities.length;

    if (loading) return <div>Loading activities...</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;
    if (activities.length === 0) return <div>No activities found.</div>;

    return (
        <div>
            {/* Summary */}
            <div className="mb-2 text-sm font-semibold">
                Showing {totalActivities} activities | {totalColumns} columns
            </div>

            {/* ReferenceID Filter */}
            <div className="mb-2 flex items-center space-x-4">
                {/* ReferenceID Filter */}
                <div className="flex items-center space-x-2">
                    <label className="font-semibold text-sm">Filter by ReferenceID:</label>
                    <select
                        value={filterReference}
                        onChange={(e) => setFilterReference(e.target.value)}
                        className="border px-2 py-1 text-sm"
                    >
                        <option value="All">All</option>
                        {uniqueReferenceIds.map((ref) => (
                            <option key={ref} value={ref}>
                                {ref}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search Bar */}
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border px-2 py-1 text-sm w-64"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-[80vh]">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="border p-3"
                                    style={{ minWidth: "180px" }} // fixed width per column
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredActivities.map((act) => (
                            <tr
                                key={act._id}
                                className={`even:bg-gray-50 ${focusedRowId === act._id ? "bg-green-200" : ""
                                    }`}
                            >
                                {columns.map((field) => (
                                    <td key={field} className="border p-2">
                                        <input
                                            type="text"
                                            value={((act as any)[field] as string) || ""}
                                            onChange={(e) =>
                                                handleCellChange(act._id, field, e.target.value)
                                            }
                                            onFocus={() => setFocusedRowId(act._id)}
                                            onBlur={() => setFocusedRowId(null)}
                                            className="w-full text-sm border px-2 py-1"
                                            style={{ minWidth: "180px" }}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
