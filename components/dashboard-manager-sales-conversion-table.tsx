"use client";

import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "@/components/ui/table";
import { type DateRange } from "react-day-picker";

interface Activity {
    department_head?: string;
    referenceid?: string;
    date_created?: string;
    wrap_up?: string;
    so_amount?: number | string;
    status?: string;
    tsa_acknowledge_date?: string;
    ticket_endorsed?: string;
    tsa_handling_time?: string;
    ticket_received?: string;
    remarks?: string;
    customer_status?: string;
    ticket_reference_number?: string;
}

interface Agent {
    ReferenceID: string;
    Firstname: string;
    Lastname: string;
}

interface Props {
    dateCreatedFilterRange: DateRange | undefined;
    setDateCreatedFilterRangeAction: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
    userReferenceId: string;
    role: string;
}

const SALES_WRAP_UPS = ["Customer Order", "Customer Inquiry Sales", "Follow Up Sales"];

const AgentListCard = forwardRef((_props: Props, ref) => {
    const { role, userReferenceId, dateCreatedFilterRange } = _props;

    const [agents, setAgents] = useState<Agent[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAgents() {
            try {
                const res = await fetch("/api/fetch-agent");
                const data = await res.json();
                setAgents(data);
            } catch (err: any) {
                setAgents([]);
                console.error("Failed to fetch agents:", err);
            }
        }
        fetchAgents();
    }, []);

    useEffect(() => {
        async function fetchActivities() {
            setLoading(true);
            try {
                const res = await fetch("/api/act-fetch-activity-role", {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-role": role,
                        "x-reference-id": userReferenceId,
                    },
                });
                const json = await res.json();
                setActivities(json.data || []);
            } catch (err: any) {
                setError(err.message || "Failed to fetch activities");
            } finally {
                setLoading(false);
            }
        }
        fetchActivities();
    }, [role, userReferenceId]);

    // ===== Utility: parse date with forced year 2026 if wrong =====
    const parseDateFixYear = (dateStr?: string) => {
        if (!dateStr) return new Date(NaN);
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return new Date(NaN);
        if (d.getFullYear() < 2026) d.setFullYear(2026);
        return d;
    };

    const isDateInRange = (dateStr?: string, range?: DateRange) => {
        if (!range || !dateStr) return true;
        const date = parseDateFixYear(dateStr);
        if (isNaN(date.getTime())) return false;
        const from = range.from ? new Date(range.from.setHours(0, 0, 0, 0)) : null;
        const to = range.to ? new Date(range.to.setHours(23, 59, 59, 999)) : null;
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
    };

    const groupedAgents = useMemo(() => {
        const map: Record<string, any> = {};

        activities
            .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
            .forEach((a) => {
                // ⛔ SKIP agad pag null / undefined / empty ang department_head
                if (!a.department_head?.trim()) return;

                const agentObj = agents.find(
                    (ag) => ag.ReferenceID === a.department_head
                );

                const name = agentObj
                    ? `${agentObj.Firstname} ${agentObj.Lastname}`
                    : null;

                if (!name || name.toLowerCase() === "unknown") return;

                if (!map[a.department_head]) {
                    map[a.department_head] = {
                        agentName: name,
                        responseTimes: [],
                        quotationHandlingTimes: [],
                        nonQuotationHandlingTimes: [],
                        spfHandlingTimes: [],
                        tickets: [],
                    };
                }

                // ----- TSA Response Time -----
                if (a.tsa_acknowledge_date && a.ticket_endorsed) {
                    const ack = parseDateFixYear(a.tsa_acknowledge_date).getTime();
                    const end = parseDateFixYear(a.ticket_endorsed).getTime();

                    if (!isNaN(ack) && !isNaN(end) && ack >= end) {
                        map[a.department_head].responseTimes.push(
                            (ack - end) / (1000 * 60 * 60)
                        );
                    }
                }

                // ----- Ticket Reference Numbers -----
                if (a.ticket_reference_number) {
                    map[a.department_head].tickets.push(
                        a.ticket_reference_number
                    );
                }

                // ----- Quotation / Non-Quotation / SPF Handling -----
                const tsaTime = parseDateFixYear(a.tsa_handling_time).getTime();
                const ticketReceived = parseDateFixYear(a.ticket_received).getTime();

                if (!isNaN(tsaTime) && !isNaN(ticketReceived) && tsaTime >= ticketReceived) {
                    const diffHours =
                        (tsaTime - ticketReceived) / (1000 * 60 * 60);

                    const remarksLower = a.remarks?.trim().toLowerCase();

                    const nonQuotationRemarks = [
                        "no stocks / insufficient stocks",
                        "item not carried",
                        "unable to contact customer",
                        "customer request cancellation",
                        "accreditation / partnership",
                        "no response for client",
                        "assisted",
                        "dissaproved quotation",
                        "for site visit",
                        "non standard item",
                        "po received",
                        "not converted to sales",
                        "for occular inspection",
                        "waiting for client confirmation",
                        "pending quotation",
                    ];

                    if (
                        remarksLower === "quotation for approval" ||
                        remarksLower === "sold"
                    ) {
                        map[a.department_head].quotationHandlingTimes.push(diffHours);
                    } else if (remarksLower === "for spf") {
                        map[a.department_head].spfHandlingTimes.push(diffHours);
                    } else if (
                        remarksLower &&
                        nonQuotationRemarks.includes(remarksLower)
                    ) {
                        map[a.department_head].nonQuotationHandlingTimes.push(diffHours);
                    }
                }
            });

        return Object.values(map)
            .filter((a) =>
                a.agentName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((a) => {
                const avg = (arr: number[]) =>
                    arr.length
                        ? arr.reduce((sum, t) => sum + t, 0) / arr.length
                        : 0;

                return {
                    ...a,
                    avgResponseTime: avg(a.responseTimes),
                    avgQuotationHandlingTime: avg(a.quotationHandlingTimes),
                    avgNonQuotationHandlingTime: avg(a.nonQuotationHandlingTimes),
                    avgSPFHandlingTime: avg(a.spfHandlingTimes),
                };
            });
    }, [activities, agents, dateCreatedFilterRange, searchTerm]);

    const formatHoursToHMS = (hours: number) => {
        const totalSeconds = Math.round(hours * 3600); // ROUND instead of floor
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const AVERAGE = (values: number[]): number =>
        values.length ? values.reduce((s: number, v: number) => s + v, 0) / values.length : 0;

    const avgTSAResponseTime = AVERAGE(
        groupedAgents.map(a => a.avgResponseTime).filter(v => v > 0)
    );

    const avgQuotationHandlingTime = AVERAGE(
        groupedAgents.map(a => a.avgQuotationHandlingTime).filter(v => v > 0)
    );

    const avgNonQuotationHandlingTime = AVERAGE(
        groupedAgents.map(a => a.avgNonQuotationHandlingTime).filter(v => v > 0)
    );

    const avgSPFHandlingTime = AVERAGE(
        groupedAgents.map(a => a.avgSPFHandlingTime).filter(v => v > 0)
    );

    React.useImperativeHandle(ref, () => ({

downloadCSV() {

    if (!groupedAgents.length) return;

    const headers = [
        "Rank",
        "Department Head",
        "TSA Response Time",
        "Non Quotation HT",
        "Quotation HT",
        "SPF HT",
        "Ticket Count"
    ];

    const rows = groupedAgents.map((a, index) => ({

        Rank: index + 1,

        "Department Head": a.agentName,

        "TSA Response Time": formatHoursToHMS(a.avgResponseTime),

        "Non Quotation HT": formatHoursToHMS(a.avgNonQuotationHandlingTime),

        "Quotation HT": formatHoursToHMS(a.avgQuotationHandlingTime),

        "SPF HT": formatHoursToHMS(a.avgSPFHandlingTime),

        "Ticket Count": a.tickets.length

    }));


    // FORMAT DATE FILTER
    let filterText = "All Dates";

    if (dateCreatedFilterRange?.from && dateCreatedFilterRange?.to) {

        const from = new Date(dateCreatedFilterRange.from).toLocaleDateString();

        const to = new Date(dateCreatedFilterRange.to).toLocaleDateString();

        filterText = `${from} - ${to}`;

    }


    // TOTAL ROW
    const totalRow = [

        "",

        "TOTAL",

        formatHoursToHMS(avgTSAResponseTime),

        formatHoursToHMS(avgNonQuotationHandlingTime),

        formatHoursToHMS(avgQuotationHandlingTime),

        formatHoursToHMS(avgSPFHandlingTime),

        groupedAgents.reduce((s, a) => s + a.tickets.length, 0)

    ];


    const csv = [

        ["Date Filter", filterText].join(","),

        [],

        headers.join(","),

        totalRow.join(","),

        ...rows.map(row =>

            headers.map(h => row[h as keyof typeof row]).join(",")

        )

    ].join("\n");


    const blob = new Blob([csv], {

        type: "text/csv;charset=utf-8;"

    });

    const url = URL.createObjectURL(blob);


    const link = document.createElement("a");

    link.href = url;

    link.download = "department-head-sales.csv";

    link.click();


    URL.revokeObjectURL(url);

}

}));

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle>Department Head's</CardTitle>
                <input
                    type="text"
                    placeholder="Search Agent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border rounded-md px-3 py-1 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </CardHeader>

            <CardContent>
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-600">{error}</p>}
                {!loading && !error && groupedAgents.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Agent Name</TableHead>
                                <TableHead>TSA Response Time</TableHead>
                                <TableHead>Non-Quotation HT</TableHead>
                                <TableHead>Quotation HT</TableHead>
                                <TableHead>SPF Handling Duration</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableHeader className="font-semibold bg-muted/80 border-b">
                            <TableCell>-</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>{formatHoursToHMS(avgTSAResponseTime)}</TableCell>
                            <TableCell>{formatHoursToHMS(avgNonQuotationHandlingTime)}</TableCell>
                            <TableCell>{formatHoursToHMS(avgQuotationHandlingTime)}</TableCell>
                            <TableCell>{formatHoursToHMS(avgSPFHandlingTime)}</TableCell>
                        </TableHeader>

                        <TableBody>
                            {groupedAgents.map((a, index) => {
                                const isOpen = expandedAgent === a.agentName;

                                return (
                                    <React.Fragment key={a.agentName}>
                                        {/* MAIN ROW */}
                                        <TableRow
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() =>
                                                setExpandedAgent(isOpen ? null : a.agentName)
                                            }
                                        >
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="uppercase font-semibold">
                                                {a.agentName}
                                            </TableCell>
                                            <TableCell>{formatHoursToHMS(a.avgResponseTime)}</TableCell>
                                            <TableCell>{formatHoursToHMS(a.avgNonQuotationHandlingTime)}</TableCell>
                                            <TableCell>{formatHoursToHMS(a.avgQuotationHandlingTime)}</TableCell>
                                            <TableCell>{formatHoursToHMS(a.avgSPFHandlingTime)}</TableCell>
                                        </TableRow>

                                        {/* ACCORDION ROW */}
                                        {isOpen && (
                                            <TableRow className="bg-muted/30">
                                                <TableCell colSpan={6} className="p-4">
                                                    <p className="font-semibold mb-2">
                                                        Ticket Reference Numbers
                                                    </p>

                                                    {a.tickets.length > 0 ? (
                                                        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                            {a.tickets.map((t: string, i: number) => (
                                                                <li
                                                                    key={i}
                                                                    className="px-2 py-1 border rounded bg-background"
                                                                >
                                                                    {t}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-muted-foreground text-sm">
                                                            No tickets found.
                                                        </p>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}

                {!loading && !error && groupedAgents.length === 0 && <p>No agents found.</p>}
            </CardContent>
        </Card>
    );
});

export default AgentListCard;
