import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Filter } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { AddRecordModal } from "@/components/reports-tracking-add-dialog";
import { EditRecordModal } from "@/components/reports-tracking-edit-dialog";
import { ReportsTrackingFilterDialog } from "@/components/reports-tracking-filter-dialog";
import { HideRecordModal } from "@/components/reports-tracking-delete-dialog";

export interface RecordType {
    _id: string;
    company_name: string;
    customer_name: string;
    contact_number: string;
    ticket_type: string;
    ticket_concern: string;
    department: string;
    sales_agent: string;
    tsm: string;
    status: string;
    date_created: string;
    nature_of_concern?: string;
    remarks?: string;
    endorsed_date?: string;
    closed_date?: string;
    isActive?: boolean;
    referenceid: string;
}

interface DTRProps {
    referenceid: string;
    role: string;
    dateCreatedFilterRange: DateRange | undefined;
    setDateCreatedFilterRangeAction: React.Dispatch<
        React.SetStateAction<DateRange | undefined>
    >;
}

export function DTR({
    referenceid,
    role,
    dateCreatedFilterRange,
    setDateCreatedFilterRangeAction,
}: DTRProps) {
    /* STATES */
    const defaultFilters = {
        ticketType: "All",
        ticketConcern: "All",
        department: "All",
        salesAgent: "All",
        tsm: "All",
        status: "All",
    };

    const [records, setRecords] = useState<RecordType[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filters, setFilters] = useState<typeof defaultFilters>(defaultFilters);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);
    const [hideModalOpen, setHideModalOpen] = useState(false);
    const [recordToHide, setRecordToHide] = useState<RecordType | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [agents, setAgents] = useState<
        Array<{ ReferenceID: string; Firstname: string; Lastname: string }>
    >([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const rowsPerPage = 10;

    /* Fetch records */
    useEffect(() => {
        // If admin, do not pass referenceid (fetch all)
        const url =
            role === "Admin"
                ? `/api/d-tracking-fetch-record`
                : `/api/d-tracking-fetch-record?referenceid=${encodeURIComponent(referenceid)}`;

        fetch(url)
            .then((res) => res.json())
            .then((json) => {
                console.log("API response data:", json.data);

                if (json.success && Array.isArray(json.data)) {
                    // Convert _id (ObjectId) to string for React usage
                    const recordsWithId = json.data
                        .filter((r: any) => r.isActive !== false)
                        .map((r: any) => ({
                            ...r,
                            _id: r._id?.toString() ?? r.id ?? `temp-id-${Math.random()}`,
                        }));

                    setRecords(recordsWithId);
                }
            })
            .catch(console.error);
    }, [referenceid, role]);


    const isDateInRange = (dateStr: string, range: DateRange | undefined) => {
        if (!range) return true;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;

        const { from, to } = range;

        const fromDate = from
            ? new Date(from.getFullYear(), from.getMonth(), from.getDate())
            : null;
        const toDate = to
            ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)
            : null;

        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;

        return true;
    };

    /* Filtered and searched records */
    const filteredRecords = useMemo(() => {
        return records.filter((r) => {
            // Search term filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const match = [
                    r.company_name,
                    r.customer_name,
                    r.contact_number,
                    r.ticket_type,
                    r.ticket_concern,
                    r.department,
                    r.sales_agent,
                    r.tsm,
                    r.status,
                    r.nature_of_concern,
                    r.remarks,
                ].some((f) => f?.toLowerCase().includes(term));
                if (!match) return false;
            }

            // Filter checks
            if (filters.ticketType !== "All" && r.ticket_type !== filters.ticketType)
                return false;
            if (filters.ticketConcern !== "All" && r.ticket_concern !== filters.ticketConcern)
                return false;
            if (filters.department !== "All" && r.department !== filters.department)
                return false;
            if (filters.salesAgent !== "All" && r.sales_agent !== filters.salesAgent)
                return false;
            if (filters.tsm !== "All" && r.tsm !== filters.tsm) return false;
            if (filters.status !== "All" && r.status !== filters.status) return false;

            // Use isDateInRange function for date filter
            if (!isDateInRange(r.date_created, dateCreatedFilterRange)) return false;

            return true;
        });
    }, [records, searchTerm, filters, dateCreatedFilterRange]);

    const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    /* CSV Download */
    const handleDownloadCSV = () => {
        const headers = [
            "Company",
            "Customer Name",
            "Contact Number",
            "Ticket Type",
            "Ticket Concern",
            "Department",
            "Sales Agent",
            "TSM",
            "Status",
            "Nature of Concern",
            "Endorsed Date",
            "Closed Date",
            "Date Created",
        ];
        const csv = [
            headers.join(","),
            ...filteredRecords.map((r) =>
                [
                    r.company_name,
                    r.customer_name,
                    r.contact_number,
                    r.ticket_type,
                    r.ticket_concern,
                    r.department,
                    r.sales_agent,
                    r.tsm,
                    r.status,
                    r.nature_of_concern ?? "",
                    r.endorsed_date ?? "",
                    r.closed_date ?? "",
                    r.date_created ?? "",
                ]
                    .map((v) => `"${v}"`)
                    .join(",")
            ),
        ].join("\n");

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        link.download = "d_tracking.csv";
        link.click();
    };

    /* Search highlight helper */
    const highlightMatch = (text: string) => {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, "gi");
        const parts = text?.split(regex) || [];
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === searchTerm.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-100">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "-" : d.toLocaleString();
    };

    useEffect(() => {
        async function fetchAgents() {
            setAgentsLoading(true);
            try {
                const res = await fetch("/api/fetch-agent");
                if (!res.ok) throw new Error("Failed to fetch agents");
                const data = await res.json();
                setAgents(data); // assuming data is array of agents
            } catch (err) {
                console.error(err);
                setAgents([]);
            } finally {
                setAgentsLoading(false);
            }
        }
        fetchAgents();
    }, []);

    const getAgentNameByReferenceID = (
        refId: string | null | undefined
    ): string => {
        if (!refId) return "-";
        const agent = agents.find((a) => a.ReferenceID === refId);
        return agent ? `${agent.Firstname} ${agent.Lastname}` : "-";
    };

    return (
        <>
            {/* SEARCH LEFT, ACTIONS RIGHT */}
            <div className="flex flex-wrap justify-between gap-2 items-center">
                <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full flex-1"
                />

                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setFilterModalOpen(true)}>
                        <Filter /> Filter
                    </Button>
                    <Button onClick={() => setAddModalOpen(true)}>Add Record</Button>
                    <Button
                        className="bg-green-500 text-white hover:bg-green-600"
                        onClick={handleDownloadCSV}
                    >
                        Download CSV
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <div className="pt-6 space-y-4 overflow-auto">
                <Table className="min-w-[1200px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Actions</TableHead>
                            <TableHead>CSR Agent</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Contact Number</TableHead>
                            <TableHead>Ticket Type</TableHead>
                            <TableHead>Ticket Concern</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Sales Agent</TableHead>
                            <TableHead>TSM</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRecords.map((r, i) => (
                            <TableRow key={r._id ?? `${r.company_name}-${r.date_created}-${i}`}>
                                <TableCell className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedRecord(r);
                                            setEditModalOpen(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            setRecordToHide(r);
                                            setHideModalOpen(true);
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                                <TableCell className="uppercase">{getAgentNameByReferenceID(r.referenceid)}</TableCell>
                                <TableCell className="uppercase">{highlightMatch(r.company_name)}</TableCell>
                                <TableCell className="capitalize">{highlightMatch(r.customer_name)}</TableCell>
                                <TableCell>{highlightMatch(r.contact_number)}</TableCell>
                                <TableCell>{highlightMatch(r.ticket_type)}</TableCell>
                                <TableCell>{highlightMatch(r.ticket_concern)}</TableCell>
                                <TableCell>{highlightMatch(r.department)}</TableCell>
                                <TableCell>{highlightMatch(r.sales_agent)}</TableCell>
                                <TableCell>{highlightMatch(r.tsm)}</TableCell>
                                <TableCell>{highlightMatch(r.status)}</TableCell>
                                <TableCell>{formatDate(r.date_created)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-end gap-2 mt-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center gap-2 px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <ReportsTrackingFilterDialog
                isOpen={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                filters={filters}
                setFilters={setFilters}
            />
            <AddRecordModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                referenceid={referenceid}
                onSave={(r) => setRecords((p) => [r, ...p])}
            />
            <EditRecordModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                record={selectedRecord}
                onSave={(u) =>
                    setRecords((p) => p.map((r) => (r._id === u._id ? u : r)))
                }
            />
            <HideRecordModal
                isOpen={hideModalOpen}
                onClose={() => setHideModalOpen(false)}
                record={recordToHide}
                onHide={(u) => setRecords((p) => p.filter((r) => r._id !== u._id))}
            />
        </>
    );
}
