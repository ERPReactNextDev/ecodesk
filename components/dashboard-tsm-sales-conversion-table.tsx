"use client";

import React, {
    useState,
    useMemo,
    forwardRef,
    useImperativeHandle,
    useEffect,
} from "react";
import { Info } from "lucide-react";
import { type DateRange } from "react-day-picker";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

function TooltipInfo({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute top-full right-0 mt-1 w-180 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
            {children}
        </div>
    );
}

function formatHHMMSS(totalMinutes: number): string {
    if (!totalMinutes || totalMinutes <= 0) return "00:00:00";

    // totalMinutes already rounded earlier (safeDiffMinutes)
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function normalizeRemarks(remarks?: string): string {
    return remarks?.trim().toLowerCase() ?? "";
}

function computeResponseSeconds(
    ticket_endorsed?: string,
    tsa_acknowledge_date?: string
): number | null {
    if (!ticket_endorsed || !tsa_acknowledge_date) return null;

    const endorsed = new Date(ticket_endorsed);
    const ack = new Date(tsa_acknowledge_date);

    if (isNaN(endorsed.getTime()) || isNaN(ack.getTime())) return null;
    if (ack < endorsed) return null;

    return Math.floor((ack.getTime() - endorsed.getTime()) / 1000);
}

function computeHandlingSeconds(
    tsa_acknowledge_date?: string,
    tsa_handling_time?: string
): number | null {
    if (!tsa_acknowledge_date || !tsa_handling_time) return null;

    const ack = new Date(tsa_acknowledge_date);
    const handle = new Date(tsa_handling_time);

    if (isNaN(ack.getTime()) || isNaN(handle.getTime())) return null;
    if (handle < ack) return null;

    return Math.floor((handle.getTime() - ack.getTime()) / 1000);
}

function computeNonQuotationSeconds(
    ticket_received?: string,
    tsa_handling_time?: string,
    remarks?: string
): number | null {
    const r = normalizeRemarks(remarks);

    if (!ticket_received || !tsa_handling_time) return null;

    if (r === "quotation for approval") return null;
    if (r === "for spf") return null;

    const received = new Date(ticket_received);
    const handle = new Date(tsa_handling_time);

    if (isNaN(received.getTime()) || isNaN(handle.getTime())) return null;
    if (handle < received) return null;

    return Math.floor((handle.getTime() - received.getTime()) / 1000);
}




interface Activity {
    manager?: string;
    date_created?: string;
    date_updated?: string;

    so_amount?: number | string;
    remarks?: string;
    traffic: string;
    qty_sold: number | string;
    status: string;
    customer_status: string;

    ticket_received?: string;
    ticket_endorsed?: string;
    wrap_up?: string;

    // ✅ TSA timestamps (Excel-based)
    tsa_acknowledge_date?: string;
    tsa_handling_time?: string;
}


interface Agent {
    ReferenceID: string;
    Firstname: string;
    Lastname: string;
}

interface AgentSalesConversionCardProps {
    dateCreatedFilterRange: DateRange | undefined;
    setDateCreatedFilterRangeAction: React.Dispatch<
        React.SetStateAction<DateRange | undefined>
    >;

    // ✅ SAME AS ticket.tsx / TSA table
    role: string;
    userReferenceId: string;
}

export interface AgentSalesConversionCardRef {
    downloadCSV: () => void;
}

const AgentSalesTableCard = forwardRef<AgentSalesConversionCardRef, AgentSalesConversionCardProps>(({
    dateCreatedFilterRange,
    role,
    userReferenceId,
}, ref) => {

    const [showTooltip, setShowTooltip] = useState(false);

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [managers, setManagers] = useState<Agent[]>([]);
    const [managersLoading, setManagersLoading] = useState(false);

    useEffect(() => {
        async function fetchManagers() {
            setManagersLoading(true);
            try {
                const res = await fetch("/api/fetch-agent");
                if (!res.ok) throw new Error("Failed to fetch managers");
                const data = await res.json();
                setManagers(data);
            } catch (err) {
                console.error(err);
                setManagers([]);
            } finally {
                setManagersLoading(false);
            }
        }
        fetchManagers();
    }, []);

    useEffect(() => {
        async function fetchActivities() {
            setLoading(true);
            setError(null);
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

                if (!res.ok) {
                    const json = await res.json();
                    throw new Error(json.error || "Failed to fetch activities");
                }

                const json = await res.json();

                // ✅ SAME STATUS FILTER AS ticket.tsx
                const allowedStatuses = [
                    "On-Progress",
                    "Closed",
                    "Endorsed",
                    "Converted into Sales",
                ];

                setActivities(
                    (json.data || []).filter((a: any) =>
                        allowedStatuses.includes(a.status)
                    )
                );
            } catch (err: any) {
                setError(err.message || "Failed to fetch activities");
            } finally {
                setLoading(false);
            }
        }

        fetchActivities();
    }, [role, userReferenceId]);


    const isDateInRange = (dateStr?: string, range?: DateRange) => {
        if (!range) return true;
        if (!dateStr) return false;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;

        const { from, to } = range;

        if (from && date < new Date(from.setHours(0, 0, 0, 0))) return false;
        if (to && date > new Date(to.setHours(23, 59, 59, 999))) return false;

        return true;
    };


    const NON_QUOTATION_WRAPUPS = [
        "no stocks",
        "insufficient stocks",
        "unable to contact customer",
        "item not carried",
        "waiting for client confirmation",
        "pending for payment",
        "customer requested cancellation",
        "accreditation/partnership",
        "no response from client",
        "assisted",
        "for site visit",
        "non standard item",
        "po received",
        "pending quotation",
        "for occular inspection",
    ];

    const groupedData = useMemo(() => {
        const map: Record<
            string,
            {
                manager: string;
                salesCount: number;
                nonSalesCount: number;
                convertedCount: number;
                amount: number;
                qtySold: number;
                newClientCount: number,
                newNonBuyingCount: number,
                ExistingActiveCount: number,
                ExistingInactive: number,
                newClientConvertedAmount: number;
                newNonBuyingConvertedAmount: number;
                newExistingActiveConvertedAmount: number;
                newExistingInactiveConvertedAmount: number;
                totalResponseSeconds: number;
                responseCount: number;

                totalHandlingSeconds: number;
                handlingCount: number;

                totalNonQuotationSeconds: number;
                nonQuotationCount: number;
            }
        > = {};

        activities
            .filter(
                (a) =>
                    isDateInRange(a.ticket_received, dateCreatedFilterRange) &&
                    a.manager &&
                    a.manager.trim() !== "" &&
                    (!a.remarks || !["po received"].includes(a.remarks.toLowerCase()))
            )
            .forEach((a) => {

                const manager = a.manager!.trim();

                const wrap = a.wrap_up?.toLowerCase().trim() || "";
                const status = a.status?.toLowerCase() || "";

                // Init
                if (!map[manager]) {
                    map[manager] = {
                        manager,
                        salesCount: 0,
                        nonSalesCount: 0,
                        convertedCount: 0,
                        amount: 0,
                        qtySold: 0,
                        newClientCount: 0,
                        newNonBuyingCount: 0,
                        ExistingActiveCount: 0,
                        ExistingInactive: 0,
                        newClientConvertedAmount: 0,
                        newNonBuyingConvertedAmount: 0,
                        newExistingActiveConvertedAmount: 0,
                        newExistingInactiveConvertedAmount: 0,
                        totalResponseSeconds: 0,
                        responseCount: 0,

                        totalHandlingSeconds: 0,
                        handlingCount: 0,

                        totalNonQuotationSeconds: 0,
                        nonQuotationCount: 0,
                    };
                }

                // TSA RESPONSE TIME
                const responseSeconds = computeResponseSeconds(
                    a.ticket_endorsed,
                    a.tsa_acknowledge_date
                );

                if (responseSeconds !== null) {
                    map[manager].totalResponseSeconds += responseSeconds;
                    map[manager].responseCount++;
                }

                // TSA HANDLING TIME (Quotation only)
                if (status === "quotation for approval") {
                    const handlingSeconds = computeHandlingSeconds(
                        a.tsa_acknowledge_date,
                        a.tsa_handling_time
                    );

                    if (handlingSeconds !== null) {
                        map[manager].totalHandlingSeconds += handlingSeconds;
                        map[manager].handlingCount++;
                    }
                }

                // TSA NON-QUOTATION TIME
                const nonQuotationSeconds = computeNonQuotationSeconds(
                    a.ticket_received,
                    a.tsa_handling_time,
                    a.remarks
                );

                if (nonQuotationSeconds !== null) {
                    map[manager].totalNonQuotationSeconds += nonQuotationSeconds;
                    map[manager].nonQuotationCount++;
                }

                const soAmount = Number(a.so_amount ?? 0);
                const traffic = a.traffic?.toLowerCase() ?? "";
                const qtySold = Number(a.qty_sold ?? 0);
                const customerStatus = a.customer_status?.toLowerCase() ?? "";



                // Counts
                if (traffic === "sales") map[manager].salesCount += 1;
                else if (traffic === "non-sales") map[manager].nonSalesCount += 1;

                if (status === "converted into sales") map[manager].convertedCount += 1;

                if (customerStatus === "new client") map[manager].newClientCount += 1;
                if (customerStatus === "new non-buying") map[manager].newNonBuyingCount += 1;
                if (customerStatus === "existing active") map[manager].ExistingActiveCount += 1;
                if (customerStatus === "existing inactive") map[manager].ExistingInactive += 1;

                // Totals
                map[manager].amount += isNaN(soAmount) ? 0 : soAmount;
                map[manager].qtySold += isNaN(qtySold) ? 0 : qtySold;

                // Converted amounts
                if (customerStatus === "new client" && status === "converted into sales")
                    map[manager].newClientConvertedAmount += soAmount;

                if (customerStatus === "new non-buying" && status === "converted into sales")
                    map[manager].newNonBuyingConvertedAmount += soAmount;

                if (customerStatus === "existing active" && status === "converted into sales")
                    map[manager].newExistingActiveConvertedAmount += soAmount;

                if (customerStatus === "existing inactive" && status === "converted into sales")
                    map[manager].newExistingInactiveConvertedAmount += soAmount;

            });

        return Object.values(map);
    }, [activities, dateCreatedFilterRange]);

    const totalSoAmount = groupedData.reduce((sum, row) => sum + row.amount, 0);

    useImperativeHandle(ref, () => ({
        downloadCSV: () => {
            const headers = [
                "Rank",
                "TSM Name",
                "Sales",
                "Non-Sales",
                "Total Amount",
                "QTY Sold",
                "Converted Sales",
                "% Conversion Inquiry to Sales",
                "New Client",
                "New Non-Buying",
                "Existing Active",
                "Existing Inactive",
                "New Client (Converted To Sales)",
                "New Non-Buying (Converted To Sales)",
                "Existing Active (Converted To Sales)",
                "Existing Inactive (Converted To Sales)",
            ];

            const rows = groupedData
                .slice()
                .sort((a, b) => b.amount - a.amount)
                .map((row, index) => {
                    const managerDetails = managers.find(
                        (m) => m.ReferenceID === row.manager
                    );

                    const fullName = managerDetails
                        ? `${managerDetails.Firstname} ${managerDetails.Lastname}`
                        : "(Unknown Manager)";

                    const totalInquiry = row.salesCount + row.nonSalesCount;

                    const conversionRate =
                        totalInquiry === 0
                            ? "0.00%"
                            : ((row.convertedCount / totalInquiry) * 100).toFixed(2) + "%";

                    return [
                        (index + 1).toString(),
                        fullName,
                        row.salesCount.toString(),
                        row.nonSalesCount.toString(),
                        row.amount.toFixed(2),
                        row.qtySold.toString(),
                        row.convertedCount.toString(),
                        conversionRate,
                        row.newClientCount.toString(),
                        row.newNonBuyingCount.toString(),
                        row.ExistingActiveCount.toString(),
                        row.ExistingInactive.toString(),
                        row.newClientConvertedAmount.toFixed(2),
                        row.newNonBuyingConvertedAmount.toFixed(2),
                        row.newExistingActiveConvertedAmount.toFixed(2),
                        row.newExistingInactiveConvertedAmount.toFixed(2),
                    ];
                });

            const csvContent =
                [headers, ...rows]
                    .map((row) =>
                        row
                            .map((item) =>
                                `"${String(item).replace(/"/g, '""')}"`
                            )
                            .join(",")
                    )
                    .join("\n") + "\n";

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "tsm_sales_conversion.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },
    }));

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Territory Sales Manager Conversion</CardTitle>

                <div
                    className="relative cursor-pointer text-muted-foreground hover:text-foreground"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    aria-label="Agent sales conversion info"
                >
                    <Info size={18} />
                    {showTooltip && (
                        <TooltipInfo>
                            <div className="space-y-2">
                                <p className="font-semibold">Column Computation Guide</p>

                                <p>
                                    <strong>Sales</strong> – Count of activities where <em>traffic</em> is <em>Sales</em>.
                                </p>

                                <p>
                                    <strong>Non-Sales</strong> – Count of activities where <em>traffic</em> is <em>Non-Sales</em>.
                                </p>

                                <p>
                                    <strong>QTY Sold</strong> – Total quantity sold per agent (sum of <em>qty_sold</em>).
                                </p>

                                <p>
                                    <strong>Converted Sales</strong> – Count of activities with <em>status</em> "Converted into Sales".
                                </p>

                                <p>
                                    <strong>% Conversion Inquiry to Sales</strong> – (Converted Sales ÷ Sales) × 100%.
                                </p>

                                <p>
                                    <strong>Avg Transaction Unit</strong> – (QTY Sold ÷ Converted Sales).
                                </p>

                                <p>
                                    <strong>Avg Transaction Value</strong> – (Total Amount ÷ Converted Sales).
                                </p>

                                <p>
                                    <strong>Total Amount</strong> – Sum of all sales order amounts (<em>so_amount</em>) per agent.
                                </p>

                                <p>
                                    <strong>New Client</strong> – Count of activities with <em>customer_status</em> "New Client".
                                </p>

                                <p>
                                    <strong>New Client (Converted To Sales)</strong> – Total <em>so_amount</em> for "New Client" with status "Converted into Sales".
                                </p>

                                <p>
                                    <strong>New Non-Buying</strong> – Count of activities with <em>customer_status</em> "New Non-Buying".
                                </p>

                                <p>
                                    <strong>New Non-Buying (Converted To Sales)</strong> – Total <em>so_amount</em> for "New Non-Buying" with status "Converted into Sales".
                                </p>

                                <p>
                                    <strong>Existing Active</strong> – Count of activities with <em>customer_status</em> "Existing Active".
                                </p>

                                <p>
                                    <strong>Existing Active (Converted To Sales)</strong> – Total <em>so_amount</em> for "Existing Active" with status "Converted into Sales".
                                </p>

                                <p>
                                    <strong>Existing Inactive</strong> – Count of activities with <em>customer_status</em> "Existing Inactive".
                                </p>

                                <p>
                                    <strong>Existing Inactive (Converted To Sales)</strong> – Total <em>so_amount</em> for "Existing Inactive" with status "Converted into Sales".
                                </p>

                                <p className="italic text-xs">
                                    Note: All computations exclude records with remark <em>"PO Received"</em> and are filtered by the selected date range.
                                </p>
                            </div>
                        </TooltipInfo>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {(loading || managersLoading) && <p>Loading data...</p>}
                {error && <p className="text-destructive">{error}</p>}

                {!loading && !managersLoading && !error && groupedData.length === 0 && (
                    <p className="text-muted-foreground">No data available.</p>
                )}

                {!loading && !managersLoading && !error && groupedData.length > 0 && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Rank</TableHead>
                                    <TableHead>Agent Name</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="text-right">Non-Sales</TableHead>
                                    <TableHead className="text-left">Amount</TableHead>
                                    <TableHead className="text-right">QTY Sold</TableHead>
                                    <TableHead className="text-right">Converted Sales</TableHead>
                                    <TableHead className="text-right">% Conversion Inquiry to Sales</TableHead>
                                    <TableHead className="text-right">New Client</TableHead>
                                    <TableHead className="text-right">New Non-Buying</TableHead>
                                    <TableHead className="text-right">Existing Active</TableHead>
                                    <TableHead className="text-right">Existing Inactive</TableHead>
                                    <TableHead className="text-right">New Client (Converted To Sales)</TableHead>
                                    <TableHead className="text-right">New Non-Buying (Converted To Sales)</TableHead>
                                    <TableHead className="text-right">Existing Active (Converted To Sales)</TableHead>
                                    <TableHead className="text-right">Existing Inactive (Converted To Sales)</TableHead>
                                    <TableHead className="text-right">TSA Response Time</TableHead>
                                    <TableHead className="text-right">TSA Handling Time</TableHead>
                                    <TableHead className="text-right">TSA Non-Quotation</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedData
                                    .slice()
                                    .sort((a, b) => b.amount - a.amount)
                                    .map(({
                                        manager,
                                        salesCount,
                                        nonSalesCount,
                                        convertedCount,
                                        newClientCount,
                                        qtySold,
                                        amount,
                                        newNonBuyingCount,
                                        ExistingActiveCount,
                                        ExistingInactive,
                                        newClientConvertedAmount,
                                        newNonBuyingConvertedAmount,
                                        newExistingActiveConvertedAmount,
                                        newExistingInactiveConvertedAmount,
                                        totalResponseSeconds,
                                        responseCount,
                                        totalHandlingSeconds,
                                        handlingCount,
                                        totalNonQuotationSeconds,
                                        nonQuotationCount,
                                    }, index) => {
                                        const managerDetails = managers.find((a) => a.ReferenceID === manager);
                                        const fullName = managerDetails ? `${managerDetails.Firstname} ${managerDetails.Lastname}` : "(Unknown Agent)";
                                        const rank = index + 1;
                                        const avgAck =
                                            responseCount === 0
                                                ? "-"
                                                : Math.floor(totalResponseSeconds / responseCount / 60);

                                        const avgHandling =
                                            handlingCount === 0
                                                ? "-"
                                                : Math.floor(totalHandlingSeconds / handlingCount / 60);

                                        const avgNonQuotation =
                                            nonQuotationCount === 0
                                                ? "-"
                                                : Math.floor(totalNonQuotationSeconds / nonQuotationCount / 60);

                                        return (
                                            <TableRow key={manager} className="hover:bg-muted/50">
                                                <TableCell className="font-medium text-center"><Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">{rank}</Badge></TableCell>
                                                <TableCell className="capitalize">{fullName}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{salesCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{nonSalesCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-left">
                                                    ₱{amount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{qtySold.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{convertedCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">
                                                    {(() => {
                                                        const totalInquiry = salesCount + nonSalesCount;

                                                        return totalInquiry === 0
                                                            ? "0.00%"
                                                            : ((convertedCount / totalInquiry) * 100).toFixed(2) + "%";
                                                    })()}
                                                </TableCell>

                                                <TableCell className="font-mono tabular-nums text-right">{newClientCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{newNonBuyingCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{ExistingActiveCount.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">{ExistingInactive.toLocaleString()}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">
                                                    ₱{newClientConvertedAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">
                                                    ₱{newNonBuyingConvertedAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">
                                                    ₱{newExistingActiveConvertedAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-mono tabular-nums text-right">
                                                    ₱{newExistingInactiveConvertedAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {avgAck === "-" ? "-" : formatHHMMSS(avgAck)}
                                                </TableCell>

                                                <TableCell className="text-right font-mono">
                                                    {avgHandling === "-" ? "-" : formatHHMMSS(avgHandling)}
                                                </TableCell>

                                                <TableCell className="text-right font-mono">
                                                    {avgNonQuotation === "-" ? "-" : formatHHMMSS(avgNonQuotation)}
                                                </TableCell>


                                            </TableRow>
                                        );
                                    })}
                            </TableBody>

                            <tfoot>
                                <TableRow className="bg-muted/30 font-semibold">
                                    <TableCell className="text-center">-</TableCell>
                                    <TableCell className="text-right">Total</TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {groupedData.reduce((sum, row) => sum + row.salesCount, 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {groupedData.reduce((sum, row) => sum + row.nonSalesCount, 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        ₱{totalSoAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {groupedData.reduce((sum, row) => sum + row.qtySold, 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {groupedData.reduce((sum, row) => sum + row.convertedCount, 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {(() => {
                                            const totalInquiry = groupedData.reduce(
                                                (sum, row) => sum + row.salesCount + row.nonSalesCount,
                                                0
                                            );

                                            const totalConverted = groupedData.reduce(
                                                (sum, row) => sum + row.convertedCount,
                                                0
                                            );

                                            return totalInquiry === 0
                                                ? "0.00%"
                                                : ((totalConverted / totalInquiry) * 100).toFixed(2) + "%";
                                        })()}
                                    </TableCell>

                                    <TableCell className="font-mono tabular-nums text-right">
                                        {groupedData.reduce((sum, row) => sum + row.newClientCount, 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {groupedData.reduce((sum, row) => sum + row.newNonBuyingCount, 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        {groupedData.reduce((sum, row) => sum + row.ExistingActiveCount, 0).toLocaleString()}
                                    </TableCell>

                                    <TableCell className="font-mono tabular-nums text-right">
                                        {groupedData.reduce((sum, row) => sum + row.ExistingInactive, 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        ₱{groupedData.reduce((sum, row) => sum + row.newClientConvertedAmount, 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        ₱{groupedData.reduce((sum, row) => sum + row.newNonBuyingConvertedAmount, 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        ₱{groupedData.reduce((sum, row) => sum + row.newExistingActiveConvertedAmount, 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums text-right">
                                        ₱{groupedData.reduce((sum, row) => sum + row.newExistingInactiveConvertedAmount, 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </TableCell>
                                </TableRow>
                            </tfoot>
                        </Table>
                    </div>
                )}
            </CardContent>

            <Separator />

            <CardFooter className="flex justify-end">
                <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                    Total Amount:{" "}
                    ₱{totalSoAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </Badge>
            </CardFooter>
        </Card>
    );
});

export default AgentSalesTableCard;

