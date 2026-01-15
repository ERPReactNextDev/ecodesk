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

interface Activity {
    agent?: string;
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

    // ✅ TSA timing fields (these already exist in DB)
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
}

export interface AgentSalesConversionCardRef {
    downloadCSV: () => void;
}

const AgentSalesTableCard = forwardRef<AgentSalesConversionCardRef, AgentSalesConversionCardProps>(({
    dateCreatedFilterRange,
}, ref) => {

    const [showTooltip, setShowTooltip] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [agents, setAgents] = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);

    useEffect(() => {
        async function fetchAgents() {
            setAgentsLoading(true);
            try {
                const res = await fetch("/api/fetch-agent");
                if (!res.ok) throw new Error("Failed to fetch agents");
                const data = await res.json();
                setAgents(data);
            } catch (err) {
                console.error(err);
                setAgents([]);
            } finally {
                setAgentsLoading(false);
            }
        }
        fetchAgents();
    }, []);

    useEffect(() => {
        async function fetchActivities() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/act-fetch-agent-sales", {
                    cache: "no-store",
                    headers: {
                        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                        Pragma: "no-cache",
                        Expires: "0",
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
        }
        fetchActivities();
    }, []);

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

    function safeDiffMinutes(start?: string, end?: string): number {
        if (!start || !end) return 0;

    const s = new Date(start);
    const e = new Date(end);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;

        const diff = (e.getTime() - s.getTime()) / 60000;

        // ❌ Reject negative or zero
        if (diff <= 0) return 0;

        // ❌ Reject anything longer than 8 hours (corporate KPI rule)
        if (diff > 480) return 0;

        return Math.round(diff);
}


function formatHHMMSS(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0:00:00";

  const seconds = Math.round(totalMinutes * 60);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
    const NON_QUOTATION_REMARKS = [
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
                agent: string;
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
                tsaResponseTotal: number;
                tsaResponseCount: number;
                tsaQuotationTotal: number;
                tsaQuotationCount: number;
                tsaNonQuotationTotal: number;
                tsaNonQuotationCount: number;
                spfTotal: 0,
                spfCount: 0,
            }
        > = {};

        activities
        .filter(
            (a) =>
            isDateInRange(
                a.ticket_received || a.ticket_endorsed || a.date_updated || a.date_created,
                dateCreatedFilterRange
            ) &&
            a.agent &&
            a.agent.trim() !== ""
        )

.forEach((a) => {
  const agent = a.agent!.trim();
  const soAmount = Number(a.so_amount ?? 0);
  const traffic = a.traffic?.toLowerCase() ?? "";
  const qtySold = Number(a.qty_sold ?? 0);
  const status = a.status?.toLowerCase() ?? "";
  const customerStatus = a.customer_status?.toLowerCase() ?? "";

    const tsaResponseTime = safeDiffMinutes(
        a.ticket_received,
        a.tsa_acknowledge_date
    );


const remark = a.remarks?.toLowerCase().trim() || "";

// ---- NON-QUOTATION ----
const NON_QUOTATION_REMARKS = [
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

// ---- QUOTATION ----
const QUOTATION_REMARKS = [
  "quotation for approval",
  "disapproved quotation",
];

const isNonQuotation =
  status === "closed" &&
    NON_QUOTATION_REMARKS.some(r => remark.includes(r));

const isQuotation =
    status === "quotation for approval" ||
    status === "converted into sales";

// ---- TIME COMPUTATION ----
    const isSPF =
        remark.includes("spf") &&
        status === "closed";

    const tsaNonQuotationTime =
        isNonQuotation
            ? safeDiffMinutes(a.tsa_acknowledge_date, a.tsa_handling_time)
            : 0;

    const tsaQuotationTime =
        isQuotation
            ? safeDiffMinutes(a.tsa_acknowledge_date, a.tsa_handling_time)
            : 0;

    const spfTime =
        isSPF
            ? safeDiffMinutes(a.tsa_acknowledge_date, a.tsa_handling_time)
            : 0;







  // ✅ INIT FIRST
  if (!map[agent]) {
    map[agent] = {
      agent,
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

    tsaResponseTotal: 0,
    tsaResponseCount: 0,
    tsaQuotationTotal: 0,
    tsaQuotationCount: 0,
    tsaNonQuotationTotal: 0,
    tsaNonQuotationCount: 0,

        spfTotal: 0,
        spfCount: 0,
    };
  }

  // ✅ CSR ACCUMULATION (SAFE)
    if (tsaResponseTime > 0) {
    map[agent].tsaResponseTotal += tsaResponseTime;
    map[agent].tsaResponseCount += 1;
    }

    if (tsaQuotationTime > 0) {
    map[agent].tsaQuotationTotal += tsaQuotationTime;
    map[agent].tsaQuotationCount += 1;
    }

    if (tsaNonQuotationTime > 0) {
    map[agent].tsaNonQuotationTotal += tsaNonQuotationTime;
    map[agent].tsaNonQuotationCount += 1;
    }

    if (spfTime > 0) {
    map[agent].spfTotal += spfTime;
    map[agent].spfCount += 1;
    }


  // existing logic
  if (traffic === "sales") map[agent].salesCount += 1;
  else if (traffic === "non-sales") map[agent].nonSalesCount += 1;

  if (status === "converted into sales") map[agent].convertedCount += 1;

  if (customerStatus === "new client") map[agent].newClientCount += 1;
  if (customerStatus === "new non-buying") map[agent].newNonBuyingCount += 1;
  if (customerStatus === "existing active") map[agent].ExistingActiveCount += 1;
  if (customerStatus === "existing inactive") map[agent].ExistingInactive += 1;

  map[agent].amount += isNaN(soAmount) ? 0 : soAmount;
  map[agent].qtySold += isNaN(qtySold) ? 0 : qtySold;

  if (customerStatus === "new client" && status === "converted into sales") {
    map[agent].newClientConvertedAmount += soAmount;
  }

  if (customerStatus === "new non-buying" && status === "converted into sales") {
    map[agent].newNonBuyingConvertedAmount += soAmount;
  }

  if (customerStatus === "existing active" && status === "converted into sales") {
    map[agent].newExistingActiveConvertedAmount += soAmount;
  }

  if (customerStatus === "existing inactive" && status === "converted into sales") {
    map[agent].newExistingInactiveConvertedAmount += soAmount;
  }
});


        return Object.values(map);
    }, [activities, dateCreatedFilterRange]);

    const totalSoAmount = groupedData.reduce((sum, row) => sum + row.amount, 0);

    useImperativeHandle(ref, () => ({
        downloadCSV: () => {
            const headers = [
                "Rank",
                "Agent Name",
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
                    const agentDetails = agents.find(
                        (a) => a.ReferenceID === row.agent
                    );
                    const fullName = agentDetails
                        ? `${agentDetails.Firstname} ${agentDetails.Lastname}`
                        : "(Unknown Agent)";

                    const conversionRate =
                        row.salesCount === 0
                            ? "0.00%"
                            : ((row.convertedCount / row.salesCount) * 100).toFixed(2) + "%";

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
            link.download = "tsa_sales_conversion.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },
    }));

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Territory Sales Associate Conversion</CardTitle>

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
                {(loading || agentsLoading) && <p>Loading data...</p>}
                {error && <p className="text-destructive">{error}</p>}

                {!loading && !agentsLoading && !error && groupedData.length === 0 && (
                    <p className="text-muted-foreground">No data available.</p>
                )}

                {!loading && !agentsLoading && !error && groupedData.length > 0 && (
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
                                    <TableHead className="text-right">TSAs Response Time</TableHead>
                                    <TableHead className="text-right">Quotation HT</TableHead>
                                    <TableHead className="text-right">Non Quotation HT</TableHead>
                                    <TableHead className="text-right">SPF HD</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedData
                                    .slice()
                                    .sort((a, b) => b.amount - a.amount)
                                    .map(({
                                    agent,
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

                                        tsaResponseTotal,
                                        tsaResponseCount,
                                        tsaQuotationTotal,
                                        tsaQuotationCount,
                                        tsaNonQuotationTotal,
                                        tsaNonQuotationCount,
                                        spfTotal,
                                        spfCount,
                                    }, index) => {

                                        const agentDetails = agents.find((a) => a.ReferenceID === agent);
                                        const fullName = agentDetails ? `${agentDetails.Firstname} ${agentDetails.Lastname}` : "(Unknown Agent)";
                                        const rank = index + 1;
                                        const avgResponse =
                                            tsaResponseCount === 0 ? "-" : Math.round(tsaResponseTotal / tsaResponseCount);

                                        const avgQuotation =
                                            tsaQuotationCount === 0 ? "-" : Math.round(tsaQuotationTotal / tsaQuotationCount);

                                        const avgNonQuotation =
                                            tsaNonQuotationCount === 0 ? "-" : Math.round(tsaNonQuotationTotal / tsaNonQuotationCount);

                                        const avgSPF =
                                        spfCount === 0 ? "-" : Math.round(spfTotal / spfCount);



                                        return (
                                            <TableRow key={agent} className="hover:bg-muted/50">
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
                                                    {salesCount === 0
                                                        ? "0.00%"
                                                        : ((convertedCount / salesCount) * 100).toFixed(2) + "%"}
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
                                                    {avgResponse === "-" ? "-" : formatHHMMSS(avgResponse)}
                                                </TableCell>

                                                <TableCell className="text-right font-mono">
                                                    {avgQuotation === "-" ? "-" : formatHHMMSS(avgQuotation)}
                                                </TableCell>

                                                <TableCell className="text-right font-mono">
                                                    {avgNonQuotation === "-" ? "-" : formatHHMMSS(avgNonQuotation)}
                                                </TableCell>

                                                <TableCell className="text-right font-mono">
                                                    {avgSPF === "-" ? "-" : formatHHMMSS(avgSPF)}
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
                                            const totalSales = groupedData.reduce((sum, row) => sum + row.salesCount, 0);
                                            const totalConverted = groupedData.reduce((sum, row) => sum + row.convertedCount, 0);
                                            if (totalSales === 0) return "0.00%";
                                            return ((totalConverted / totalSales) * 100).toFixed(2) + "%";
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
