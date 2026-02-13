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

interface Activity {
  referenceid?: string;
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
  company_name?: string;
  contact_person?: string;
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

const AgentSalesTableCard = forwardRef<
  AgentSalesConversionCardRef,
  AgentSalesConversionCardProps
>(({ dateCreatedFilterRange, role, userReferenceId }, ref) => {
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
            allowedStatuses.includes(a.status),
          ),
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

  function safeDiffMinutes(start?: string, end?: string): number {
    if (!start || !end) return 0;

    const s = new Date(start);
    const e = new Date(end);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;

    const diff = (e.getTime() - s.getTime()) / 60000;

    if (diff <= 0) return 0;
    if (diff > 480) return 0; // 8 hours max

    return Math.round(diff);
  }

  // ===== EXACT SHEET-TICKET LOGIC FUNCTIONS =====
  function normalizeRemarks(remarks?: string): string {
    return remarks?.trim().toLowerCase() ?? "";
  }

  const EXCLUDED_WRAPUPS = [
    "customerfeedback/recommendation",
    "job inquiry",
    "job applicants",
    "supplier/vendor product offer",
    "internal whistle blower",
    "threats / extortion / intimidation",
    "prank call",
  ];

  function isExcludedWrapUp(wrapUp?: string): boolean {
    return EXCLUDED_WRAPUPS.includes((wrapUp || "").trim().toLowerCase());
  }

  function computeTsaHandlingTimeAligned(a: Activity): number | null {
    if (isExcludedWrapUp(a.wrap_up)) return null;

    if (!a.ticket_received || !a.tsa_handling_time) return null;

    const start = new Date(a.ticket_received);
    const end = new Date(a.tsa_handling_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    if (end < start) return null;

    return Math.floor((end.getTime() - start.getTime()) / 60000);
  }

  function getBaseHandlingTime(a: Activity): number | null {
    const tsaHT = computeTsaHandlingTimeAligned(a);
    if (tsaHT !== null) return tsaHT;

    return null;
  }

  function computeNonQuotationHTAligned(a: Activity): number | null {
    if (isExcludedWrapUp(a.wrap_up)) return null;

    const base = getBaseHandlingTime(a);
    if (base === null) return null;

    const list = [
      "NO STOCKS / INSUFFICIENT STOCKS",
      "CUSTOMER REQUEST CANCELLATION",
      "INSUFFICIENT STOCKS",
      "UNABLE TO CONTACT CUSTOMER",
      "ITEM NOT CARRIED",
      "WAITING FOR CLIENT CONFIRMATION",
      "CUSTOMER REQUESTED CANCELLATION",
      "ACCREDITATION/PARTNERSHIP",
      "NO RESPONSE FROM CLIENT",
      "ASSISTED",
      "FOR SITE VISIT",
      "NON STANDARD ITEM",
      "PO RECEIVED",
      "PENDING QUOTATION",
      "FOR OCCULAR INSPECTION",
    ];

    const remarks = (a.remarks || "").toUpperCase();

    return list.includes(remarks) ? base : null;
  }

  function computeQuotationHTAligned(a: Activity): number | null {
    const base = getBaseHandlingTime(a);
    if (base === null) return null;

    const r = normalizeRemarks(a.remarks);

    if (r === "quotation for approval" || r === "sold") {
      return base;
    }

    return null;
  }

  function computeTsaResponseTimeAligned(a: Activity): number | null {
    if (isExcludedWrapUp(a.wrap_up)) return null;

    if (!a.tsa_acknowledge_date || !a.ticket_endorsed) return null;

    const ack = new Date(a.tsa_acknowledge_date);
    const endorsed = new Date(a.ticket_endorsed);

    if (isNaN(ack.getTime()) || isNaN(endorsed.getTime())) return null;

    if (ack < endorsed) return null;

    return Math.floor((ack.getTime() - endorsed.getTime()) / 60000);
  }

  function computeSpfHTAligned(a: Activity): number | null {
    if (isExcludedWrapUp(a.wrap_up)) return null;

    const base = getBaseHandlingTime(a);
    if (base === null) return null;

    const r = normalizeRemarks(a.remarks);

    if (r.includes("spf")) {
      return base;
    }

    return null;
  }

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
        newClientCount: number;
        newNonBuyingCount: number;
        ExistingActiveCount: number;
        ExistingInactive: number;
        newClientConvertedAmount: number;
        newNonBuyingConvertedAmount: number;
        newExistingActiveConvertedAmount: number;
        newExistingInactiveConvertedAmount: number;
        tsaResponseTotal: number;
        tsaResponseCount: number;

        nonRfQTotal: number;
        nonRfQCount: number;

        rfqTotal: number;
        rfqCount: number;

        spfTotal: number;
        spfCount: number;

        csrSet: Set<string>;
        companySet: Set<string>;
      }
    > = {};

    activities;
    activities
      .filter(
        (a) =>
          isDateInRange(a.date_created, dateCreatedFilterRange) &&
          a.manager &&
          a.manager.trim() !== "",
      )
      .forEach((a) => {
        const wrap = a.wrap_up?.toLowerCase().trim() || "";
        const status = a.status?.toLowerCase() || "";

        const isQuotation =
          status === "quotation for approval" ||
          status === "converted into sales";

        const isConverted = status === "converted into sales";

        const nonQ = computeNonQuotationHTAligned(a);

        const qHT = computeQuotationHTAligned(a);

        const tsaResponse = computeTsaResponseTimeAligned(a);
        const spfHT = computeSpfHTAligned(a);

        const manager = a.manager!.trim();

        const soAmount = Number(a.so_amount ?? 0);
        const traffic = a.traffic?.toLowerCase() ?? "";
        const qtySold = Number(a.qty_sold ?? 0);
        const customerStatus = a.customer_status?.toLowerCase() ?? "";

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
            tsaResponseTotal: 0,
            tsaResponseCount: 0,

            nonRfQTotal: 0,
            nonRfQCount: 0,

            rfqTotal: 0,
            rfqCount: 0,

            spfTotal: 0,
            spfCount: 0,

            csrSet: new Set<string>(),
            companySet: new Set<string>(),
          };
        }

        if (a.referenceid) {
          map[manager].csrSet.add(a.referenceid);
        }

const companyRaw = a.company_name?.trim();
const contactRaw = a.contact_person?.trim();

if (
  companyRaw &&
  companyRaw !== "" &&
  !["na", "n/a"].includes(companyRaw.toLowerCase())
) {
  map[manager].companySet.add(companyRaw);
} else if (contactRaw && contactRaw !== "") {
  map[manager].companySet.add(contactRaw);
}

        // Counts
        const normalizedTraffic = (a.traffic || "").toLowerCase().trim();
        const normalizedWrapUp = (a.wrap_up || "").toLowerCase().trim();

        if (normalizeRemarks(a.remarks) === "po received") {
          map[manager].nonSalesCount += 1;
        } else if (
          normalizedWrapUp === "customer inquiry non-sales" ||
          normalizedWrapUp === "customer inquiry non sales"
        ) {
          map[manager].nonSalesCount += 1;
        } else if (normalizedTraffic === "sales") {
          map[manager].salesCount += 1;
        } else {
          map[manager].nonSalesCount += 1;
        }

        if (
          normalizedTraffic === "sales" &&
          status === "converted into sales" &&
          normalizeRemarks(a.remarks) !== "po received"
        ) {
          map[manager].convertedCount += 1;
        }

        if (customerStatus === "new client") map[manager].newClientCount += 1;
        if (customerStatus === "new non-buying")
          map[manager].newNonBuyingCount += 1;
        if (customerStatus === "existing active")
          map[manager].ExistingActiveCount += 1;
        if (customerStatus === "existing inactive")
          map[manager].ExistingInactive += 1;

        // Totals
        map[manager].amount += isNaN(soAmount) ? 0 : soAmount;
        map[manager].qtySold += isNaN(qtySold) ? 0 : qtySold;

        // Converted amounts
        if (
          customerStatus === "new client" &&
          status === "converted into sales"
        )
          map[manager].newClientConvertedAmount += soAmount;

        if (
          customerStatus === "new non-buying" &&
          status === "converted into sales"
        )
          map[manager].newNonBuyingConvertedAmount += soAmount;

        if (
          customerStatus === "existing active" &&
          status === "converted into sales"
        )
          map[manager].newExistingActiveConvertedAmount += soAmount;

        if (
          customerStatus === "existing inactive" &&
          status === "converted into sales"
        )
          map[manager].newExistingInactiveConvertedAmount += soAmount;

        if (tsaResponse !== null) {
          map[manager].tsaResponseTotal += tsaResponse;
          map[manager].tsaResponseCount++;
        }

        if (nonQ !== null) {
          map[manager].nonRfQTotal += nonQ;
          map[manager].nonRfQCount++;
        }

        if (qHT !== null) {
          map[manager].rfqTotal += qHT;
          map[manager].rfqCount++;
        }

        if (spfHT !== null) {
          map[manager].spfTotal += spfHT;
          map[manager].spfCount++;
        }
      });

    return Object.values(map).map((row) => ({
      ...row,
      csrList: Array.from(row.csrSet),
      companyList: Array.from(row.companySet),
    }));
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
            (m) => m.ReferenceID === row.manager,
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
              .map((item) => `"${String(item).replace(/"/g, '""')}"`)
              .join(","),
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
                  <strong>Sales</strong> – Count of activities where{" "}
                  <em>traffic</em> is <em>Sales</em>.
                </p>

                <p>
                  <strong>Non-Sales</strong> – Count of activities where{" "}
                  <em>traffic</em> is <em>Non-Sales</em>.
                </p>

                <p>
                  <strong>QTY Sold</strong> – Total quantity sold per agent (sum
                  of <em>qty_sold</em>).
                </p>

                <p>
                  <strong>Converted Sales</strong> – Count of activities with{" "}
                  <em>status</em> "Converted into Sales".
                </p>

                <p>
                  <strong>% Conversion Inquiry to Sales</strong> – (Converted
                  Sales ÷ Sales) × 100%.
                </p>

                <p>
                  <strong>Avg Transaction Unit</strong> – (QTY Sold ÷ Converted
                  Sales).
                </p>

                <p>
                  <strong>Avg Transaction Value</strong> – (Total Amount ÷
                  Converted Sales).
                </p>

                <p>
                  <strong>Total Amount</strong> – Sum of all sales order amounts
                  (<em>so_amount</em>) per agent.
                </p>

                <p>
                  <strong>New Client</strong> – Count of activities with{" "}
                  <em>customer_status</em> "New Client".
                </p>

                <p>
                  <strong>New Client (Converted To Sales)</strong> – Total{" "}
                  <em>so_amount</em> for "New Client" with status "Converted
                  into Sales".
                </p>

                <p>
                  <strong>New Non-Buying</strong> – Count of activities with{" "}
                  <em>customer_status</em> "New Non-Buying".
                </p>

                <p>
                  <strong>New Non-Buying (Converted To Sales)</strong> – Total{" "}
                  <em>so_amount</em> for "New Non-Buying" with status "Converted
                  into Sales".
                </p>

                <p>
                  <strong>Existing Active</strong> – Count of activities with{" "}
                  <em>customer_status</em> "Existing Active".
                </p>

                <p>
                  <strong>Existing Active (Converted To Sales)</strong> – Total{" "}
                  <em>so_amount</em> for "Existing Active" with status
                  "Converted into Sales".
                </p>

                <p>
                  <strong>Existing Inactive</strong> – Count of activities with{" "}
                  <em>customer_status</em> "Existing Inactive".
                </p>

                <p>
                  <strong>Existing Inactive (Converted To Sales)</strong> –
                  Total <em>so_amount</em> for "Existing Inactive" with status
                  "Converted into Sales".
                </p>

                <p className="italic text-xs">
                  Note: All computations exclude records with remark{" "}
                  <em>"PO Received"</em> and are filtered by the selected date
                  range.
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
                  <TableHead className="text-right">
                    % Conversion Inquiry to Sales
                  </TableHead>
                  <TableHead className="text-right">New Client</TableHead>
                  <TableHead className="text-right">New Non-Buying</TableHead>
                  <TableHead className="text-right">Existing Active</TableHead>
                  <TableHead className="text-right">
                    Existing Inactive
                  </TableHead>
                  <TableHead className="text-right">
                    New Client (Converted To Sales)
                  </TableHead>
                  <TableHead className="text-right">
                    New Non-Buying (Converted To Sales)
                  </TableHead>
                  <TableHead className="text-right">
                    Existing Active (Converted To Sales)
                  </TableHead>
                  <TableHead className="text-right">
                    Existing Inactive (Converted To Sales)
                  </TableHead>
                  <TableHead className="text-right">
                    TSAs RESPONSE TIME
                  </TableHead>
                  <TableHead className="text-right">NON RFQ HT</TableHead>
                  <TableHead className="text-right">RFQ HT</TableHead>
                  <TableHead className="text-right">SPF HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedData
                  .slice()
                  .sort((a, b) => b.amount - a.amount)
                  .map((row, index) => {
                    const {
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
                      tsaResponseTotal,
                      tsaResponseCount,
                      nonRfQTotal,
                      nonRfQCount,
                      rfqTotal,
                      rfqCount,
                      spfTotal,
                      spfCount,
                      csrList,
                      companyList,
                    } = row;

                    const managerDetails = managers.find(
                      (a) => a.ReferenceID === manager,
                    );

                    const fullName = managerDetails
                      ? `${managerDetails.Firstname} ${managerDetails.Lastname}`
                      : "(Unknown Agent)";

                    const rank = index + 1;

                    const avgTsaResponse =
                      tsaResponseCount === 0
                        ? "-"
                        : Math.round(tsaResponseTotal / tsaResponseCount);

                    const avgNonRfQ =
                      nonRfQCount === 0
                        ? "-"
                        : Math.round(nonRfQTotal / nonRfQCount);

                    const avgRfQ =
                      rfqCount === 0 ? "-" : Math.round(rfqTotal / rfqCount);

                    const avgSpf =
                      spfCount === 0 ? "-" : Math.round(spfTotal / spfCount);

                    return (
                      <TableRow key={manager} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-center">
                          <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                            {rank}
                          </Badge>
                        </TableCell>

                        <TableCell className="capitalize">
                          <details className="cursor-pointer">
                            <summary className="font-semibold">
                              {fullName}
                            </summary>

                            <div className="mt-2 text-xs text-muted-foreground space-y-1">
                              <div className="font-medium">
                                CSRs who encoded:
                              </div>

                              {csrList?.length === 0 && <div>No CSR found</div>}

                              {csrList?.map((csrId: string) => {
                                const csr = managers.find(
                                  (a) => a.ReferenceID === csrId,
                                );

                                return (
                                  <div key={csrId}>
                                    {csr
                                      ? `${csr.Firstname} ${csr.Lastname}`
                                      : csrId}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="font-medium mt-3">
                              Companies Handled:
                            </div>

                            <div className="max-h-40 overflow-y-auto pr-2 border rounded-md p-2 bg-muted/30">
                              {companyList?.length === 0 && (
                                <div>No companies found</div>
                              )}

                              {companyList?.map((company: string) => (
                                <div key={company} className="truncate">
                                  {company}
                                </div>
                              ))}
                            </div>
                          </details>
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {salesCount.toLocaleString()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {nonSalesCount.toLocaleString()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-left">
                          ₱
                          {amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {qtySold.toLocaleString()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {convertedCount.toLocaleString()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {(() => {
                            const totalInquiry = salesCount + nonSalesCount;

                            return totalInquiry === 0
                              ? "0.00%"
                              : ((convertedCount / totalInquiry) * 100).toFixed(
                                  2,
                                ) + "%";
                          })()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {newClientCount.toLocaleString()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {newNonBuyingCount.toLocaleString()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {ExistingActiveCount.toLocaleString()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          {ExistingInactive.toLocaleString()}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          ₱
                          {newClientConvertedAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          ₱
                          {newNonBuyingConvertedAmount.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          ₱
                          {newExistingActiveConvertedAmount.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </TableCell>

                        <TableCell className="font-mono tabular-nums text-right">
                          ₱
                          {newExistingInactiveConvertedAmount.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {avgTsaResponse === "-"
                            ? "-"
                            : formatHHMMSS(avgTsaResponse)}
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {avgNonRfQ === "-" ? "-" : formatHHMMSS(avgNonRfQ)}
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {avgRfQ === "-" ? "-" : formatHHMMSS(avgRfQ)}
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {avgSpf === "-" ? "-" : formatHHMMSS(avgSpf)}
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
                    {groupedData
                      .reduce((sum, row) => sum + row.salesCount, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    {groupedData
                      .reduce((sum, row) => sum + row.nonSalesCount, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    ₱
                    {totalSoAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    {groupedData
                      .reduce((sum, row) => sum + row.qtySold, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    {groupedData
                      .reduce((sum, row) => sum + row.convertedCount, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    {(() => {
                      const totalInquiry = groupedData.reduce(
                        (sum, row) => sum + row.salesCount + row.nonSalesCount,
                        0,
                      );

                      const totalConverted = groupedData.reduce(
                        (sum, row) => sum + row.convertedCount,
                        0,
                      );

                      return totalInquiry === 0
                        ? "0.00%"
                        : ((totalConverted / totalInquiry) * 100).toFixed(2) +
                            "%";
                    })()}
                  </TableCell>

                  <TableCell className="font-mono tabular-nums text-right">
                    {groupedData
                      .reduce((sum, row) => sum + row.newClientCount, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    {groupedData
                      .reduce((sum, row) => sum + row.newNonBuyingCount, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    {groupedData
                      .reduce((sum, row) => sum + row.ExistingActiveCount, 0)
                      .toLocaleString()}
                  </TableCell>

                  <TableCell className="font-mono tabular-nums text-right">
                    {groupedData
                      .reduce((sum, row) => sum + row.ExistingInactive, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    ₱
                    {groupedData
                      .reduce(
                        (sum, row) => sum + row.newClientConvertedAmount,
                        0,
                      )
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    ₱
                    {groupedData
                      .reduce(
                        (sum, row) => sum + row.newNonBuyingConvertedAmount,
                        0,
                      )
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    ₱
                    {groupedData
                      .reduce(
                        (sum, row) =>
                          sum + row.newExistingActiveConvertedAmount,
                        0,
                      )
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-right">
                    ₱
                    {groupedData
                      .reduce(
                        (sum, row) =>
                          sum + row.newExistingInactiveConvertedAmount,
                        0,
                      )
                      .toLocaleString(undefined, {
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
          Total Amount: ₱
          {totalSoAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Badge>
      </CardFooter>
    </Card>
  );
});

export default AgentSalesTableCard;
