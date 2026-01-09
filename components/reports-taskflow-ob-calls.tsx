"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type DateRange } from "react-day-picker";
import { ObcCallsFilterDialog } from "@/components/reports-taskflow-ob-calls-filter-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

/* ================= TYPES ================= */
interface Company {
    id: string;
    account_reference_number: string;
    company_name: string;
    contact_person: string;
    contact_number: string;
    email_address: string;
    type_client?: string;
}

type RecordType = {
    activity_reference_number?: string;
    referenceid?: string;
    tsm?: string;
    manager?: string;
    type_client?: string;
    source?: string;
    type_activity?: string;
    call_status?: string;
    call_type?: string;
    remarks?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    date_created?: string;
    account_reference_number?: string;
};

interface OBCallsProps {
    dateCreatedFilterRange: DateRange | undefined;
    setDateCreatedFilterRangeAction: React.Dispatch<
        React.SetStateAction<DateRange | undefined>
    >;
}

const PAGE_SIZE = 20;

const defaultFilters = {
    type_client: "All",
    source: "All",
    type_activity: "All",
    call_status: "All",
    call_type: "All",
    status: "All",
    tsm: "All",
    manager: "All",
};

/* ================= COMPONENT ================= */
export function OBCalls({
    dateCreatedFilterRange,
    setDateCreatedFilterRangeAction,
}: OBCallsProps) {
    /* ---------- STATE ---------- */
    const [records, setRecords] = useState<RecordType[]>([]);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(defaultFilters);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [errorCompanies, setErrorCompanies] = useState<string | null>(null);
    const [agents, setAgents] = useState<
        Array<{ ReferenceID: string; Firstname: string; Lastname: string }>
    >([]);
    const [agentsLoading, setAgentsLoading] = useState(false);

    const isFilterActive =
        JSON.stringify(filters) !== JSON.stringify(defaultFilters) || !!search;

    /* ---------- HELPERS ---------- */
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "-" : d.toLocaleString();
    };

    const highlightMatch = (text?: string) => {
        if (!text) return "-";
        if (!search) return text;

        return text
            .split(new RegExp(`(${search})`, "gi"))
            .map((part, i) =>
                part.toLowerCase() === search.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-100">
                        {part}
                    </mark>
                ) : (
                    part
                )
            );
    };

    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        setErrorCompanies(null);

        try {
            const res = await fetch("/api/com-fetch-account", {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    Pragma: "no-cache",
                    Expires: "0",
                },
            });
            if (!res.ok) throw new Error("Failed to fetch company data");
            const data = await res.json();
            setCompanies(data.data || []);
        } catch (err: any) {
            setErrorCompanies(err.message || "Error fetching company data");
        } finally {
            setLoadingCompanies(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const companyMap = useMemo(() => {
        const map: Record<string, Company> = {};
        companies.forEach((c) => {
            map[c.account_reference_number] = c;
        });
        return map;
    }, [companies]);

    const getCompanyName = (accountRef?: string) => {
        if (!accountRef) return "-";
        return companyMap[accountRef]?.company_name ?? accountRef;
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

    /* ---------- FETCH DATA ---------- */
    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch("/api/ob-calls-fetch-activity")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch records");
                return res.json();
            })
            .then((json) => setRecords(json.data || []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

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

    /* ---------- FILTER + SEARCH ---------- */
    const filtered = useMemo(() => {
        return records.filter((r) => {
            /* ---- DATE CREATED FILTER ---- */
            const matchesDate =
                !dateCreatedFilterRange ||
                (r.date_created && isDateInRange(r.date_created, dateCreatedFilterRange));

            if (!matchesDate) return false;

            /* ---- OTHER FILTERS ---- */
            const matchesFilters =
                (filters.type_client === "All" || r.type_client === filters.type_client) &&
                (filters.source === "All" || r.source === filters.source) &&
                (filters.type_activity === "All" || r.type_activity === filters.type_activity) &&
                (filters.call_status === "All" || r.call_status === filters.call_status) &&
                (filters.call_type === "All" || r.call_type === filters.call_type) &&
                (filters.status === "All" || r.status === filters.status) &&
                (filters.tsm === "All" || r.tsm === filters.tsm) &&
                (filters.manager === "All" || r.manager === filters.manager);

            if (!matchesFilters) return false;

            /* ---- SEARCH ---- */
            if (!search) return true;

            const lowerSearch = search.toLowerCase();

            // Custom fields to check (including company name)
            const fieldsToSearch = [
                getCompanyName(r.account_reference_number),
                r.referenceid,
                r.tsm,
                r.manager,
                r.type_client,
                r.source,
                r.type_activity,
                r.call_status,
                r.call_type,
                r.remarks,
                r.status,
            ];

            return fieldsToSearch.some((field) =>
                field?.toString().toLowerCase().includes(lowerSearch)
            );
        });
    }, [records, filters, search, dateCreatedFilterRange, companyMap]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    /* ---------- CSV ---------- */
    const handleDownloadCSV = () => {
        const headers = [
            "Company Name",
            "ReferenceID",
            "TSM",
            "Manager",
            "Type Client",
            "Source",
            "Type Activity",
            "Call Status",
            "Call Type",
            "Remarks",
            "Status",
            "Start Date",
            "End Date",
            "Date Created",
        ];

        const rows = filtered.map((r) =>
            [
                getCompanyName(r.account_reference_number),
                getAgentNameByReferenceID(r.referenceid),
                getAgentNameByReferenceID(r.tsm),
                getAgentNameByReferenceID(r.manager),
                r.type_client,
                r.source,
                r.type_activity,
                r.call_status,
                r.call_type,
                r.remarks,
                r.status,
                r.start_date,
                r.end_date,
                r.date_created,
            ]
                .map((v) => `"${v ?? "-"}"`)
                .join(",")
        );

        const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
            type: "text/csv",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "outbound_calls.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ================= UI ================= */
    return (
        <main className="flex flex-col gap-4 p-4">
            {/* SEARCH + ACTIONS */}
            <div className="flex flex-wrap justify-between gap-2 items-center">
                <Input
                    placeholder="Search outbound calls..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="max-full flex-1"
                />

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setFilterDialogOpen(true)} className="cursor-pointer">
                        Filters
                    </Button>

                    <Button
                        className="bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                        onClick={handleDownloadCSV}
                    >
                        Download CSV
                    </Button>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-20">
                    <Spinner className="size-8" />
                </div>
            )}

            {error && <p className="text-destructive">{error}</p>}

            {!loading && paginated.length > 0 && (
                <div className="pt-6 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company Name</TableHead>
                                <TableHead>Agent Name</TableHead>
                                <TableHead>TSM</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead>Type Client</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Type Activity</TableHead>
                                <TableHead>Call Status</TableHead>
                                <TableHead>Call Type</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Date Created</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginated.map((r, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        {highlightMatch(getCompanyName(r.account_reference_number))}
                                    </TableCell>

                                    <TableCell>{getAgentNameByReferenceID(r.referenceid)}</TableCell>
                                    <TableCell>{getAgentNameByReferenceID(r.tsm)}</TableCell>
                                    <TableCell>{getAgentNameByReferenceID(r.manager)}</TableCell>
                                    <TableCell>{highlightMatch(r.type_client)}</TableCell>
                                    <TableCell>{highlightMatch(r.source)}</TableCell>
                                    <TableCell>{highlightMatch(r.type_activity)}</TableCell>
                                    <TableCell>{highlightMatch(r.call_status)}</TableCell>
                                    <TableCell>{highlightMatch(r.call_type)}</TableCell>
                                    <TableCell className="capitalize">{highlightMatch(r.remarks)}</TableCell>
                                    <TableCell>{highlightMatch(r.status)}</TableCell>
                                    <TableCell>{formatDate(r.start_date)}</TableCell>
                                    <TableCell>{formatDate(r.end_date)}</TableCell>
                                    <TableCell>{formatDate(r.date_created)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {/* Pagination */}
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center items-center gap-3 text-sm">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="cursor-pointer"
                            >
                                Prev
                            </Button>

                            <span>
                                Page {page} / {totalPages}
                            </span>

                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="cursor-pointer"
                            >
                                Next
                            </Button>
                        </div>
                    )}

                </div>
            )}

            <ObcCallsFilterDialog
                isOpen={filterDialogOpen}
                onClose={() => setFilterDialogOpen(false)}
                filters={filters}
                setFilters={setFilters}
            />
        </main>
    );
}
