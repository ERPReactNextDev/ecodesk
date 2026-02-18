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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ===================== HELPERS ===================== */
const SALES_WRAP_UPS = [
  "customer order",
  "customer inquiry sales",
  "follow up sales",
];

function isSalesWrapUp(a: Activity): boolean {
  const wrapUp = (a.wrap_up || "").toLowerCase().trim();
  return SALES_WRAP_UPS.includes(wrapUp);
}

function isValidSalesInquiry(a: Activity): boolean {
  if (normalizeRemarks(a.remarks) === "po received") return false;
  return isSalesWrapUp(a);
}

function isConvertedSale(a: Activity): boolean {
  if (!isSalesWrapUp(a)) return false;
  return a.status?.toLowerCase() === "converted into sales";
}

function normalizeRemarks(remarks?: string): string {
  return remarks?.trim().toLowerCase() ?? "";
}

// ===== NEW COMPUTATION BASED ON SHEET-TICKET LOGIC =====

// ===== ALIGNED COMPUTATION HELPERS (MATCH SHEET-TICKET) =====

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

function computeTsaResponseTimeAligned(a: Activity): number | null {
  if (isExcludedWrapUp(a.wrap_up)) return null;

  if (!a.ticket_endorsed || !a.tsa_acknowledge_date) return null;

  const start = new Date(a.ticket_endorsed);
  const end = new Date(a.tsa_acknowledge_date);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  if (end < start) return null;

  // return MINUTES (same unit as sheet-ticket)
  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

// SAME LOGIC AS SHEET-TICKET DISPLAY:
// TSA Handling = TSA Handling Time – Ticket Received
function computeTsaHandlingTimeAligned(a: Activity): number | null {
  if (isExcludedWrapUp(a.wrap_up)) return null;

  if (!a.ticket_received || !a.tsa_handling_time) return null;

  const start = new Date(a.ticket_received);
  const end = new Date(a.tsa_handling_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  if (end < start) return null;

  // minutes to match sheet-ticket.tsx
  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

function getBaseHandlingTime(a: Activity): number | null {
  const tsaHT = computeTsaHandlingTimeAligned(a);
  if (tsaHT !== null) return tsaHT;

  return null;
}

function computeNonQuotationHTAligned(a: Activity): number | null {
  const base = getBaseHandlingTime(a);
  if (base === null) return null;

  const list = [
    "no stocks / insufficient stocks",
    "customer request cancellation",
    "insufficient stocks",
    "unable to contact customer",
    "item not carried",
    "waiting for client confirmation",
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

  const remarks = normalizeRemarks(a.remarks);

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

function computeSpfHTAligned(a: Activity): number | null {
  const base = getBaseHandlingTime(a);
  if (base === null) return null;

  const r = normalizeRemarks(a.remarks);

  if (r.includes("spf")) {
    return base;
  }

  return null;
}

function formatMinutesToHHMM(minutes: number): string {
  if (!minutes || minutes <= 0) return "00:00:00";

  const totalSeconds = Math.floor(minutes * 60);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ===================== INTERFACES ===================== */

function formatDate(date?: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

interface Activity {
  agent?: string;
  referenceid?: string; // ✅ ADD THIS
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
  tsa_acknowledge_date?: string;
  tsa_handling_time?: string;

  wrap_up?: string; // ← ADDED to support exclusion logic
  company_name?: string;
  contact_person?: string;
}

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

interface Props {
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;

  // ✅ ADD THESE
  userReferenceId: string;
  role: string;
}

export interface AgentSalesConversionCardRef {
  downloadCSV: () => void;
}

const AgentSalesTableCard = forwardRef<AgentSalesConversionCardRef, Props>(
  ({ dateCreatedFilterRange, role, userReferenceId }: Props, ref) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ===================== FETCH ===================== */

    useEffect(() => {
      async function fetchAgents() {
        setAgentsLoading(true);
        try {
          const res = await fetch("/api/fetch-agent");
          const data = await res.json();
          setAgents(data);
        } catch {
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

          // ✅ SAME STATUS FILTER AS ticket.tsx
          const allowedStatuses = [
            "On-Progress",
            "Closed",
            "Endorsed",
            "Converted into Sales",
          ];

          const filtered = (json.data || []).filter((a: any) =>
            allowedStatuses.includes(a.status),
          );

          setActivities(filtered);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }

      fetchActivities();
    }, [role, userReferenceId]);

    /* ===================== DATE FILTER ===================== */

    const isDateInRange = (dateStr?: string, range?: DateRange) => {
      if (!range || !dateStr) return true;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;

      const from = range.from
        ? new Date(
          range.from.getFullYear(),
          range.from.getMonth(),
          range.from.getDate(),
          0,
          0,
          0,
        )
        : null;

      const to = range.to
        ? new Date(
          range.to.getFullYear(),
          range.to.getMonth(),
          range.to.getDate(),
          23,
          59,
          59,
        )
        : null;

      if (from && date < from) return false;
      if (to && date > to) return false;

      return true;
    };

    /* ===================== GROUPED DATA ===================== */

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

          tsaHandlingTotal: number;
          tsaHandlingCount: number;

          nonQuotationTotal: number;
          nonQuotationCount: number;

          quotationTotal: number;
          quotationCount: number;

          spfTotal: number;
          spfCount: number;

          csrSet: Set<string>;
          companySet: Set<string>;
        }
      > = {};

      activities
        .filter(
          (a) =>
            isDateInRange(a.date_created, dateCreatedFilterRange) && a.agent,
        )

        .forEach((a) => {
          // 🔹 Always declare agent FIRST
          const agent = a.agent!;
          const soAmount = Number(a.so_amount ?? 0);
          const qtySold = Number(a.qty_sold ?? 0);
          const traffic = (a.traffic || "").toLowerCase();
          const status = (a.status || "").toLowerCase();
          const cs = (a.customer_status || "").toLowerCase();

          // 🔹 Initialize map entry FIRST
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

              tsaHandlingTotal: 0,
              tsaHandlingCount: 0,

              nonQuotationTotal: 0,
              nonQuotationCount: 0,

              quotationTotal: 0,
              quotationCount: 0,

              spfTotal: 0,
              spfCount: 0,

              csrSet: new Set<string>(),
              companySet: new Set<string>(),
            };
          }

          // 🔹 Now safe to track CSR
          if (a.referenceid) {
            map[agent].csrSet.add(a.referenceid);
          }

          const companyRaw = a.company_name?.trim();
          const contactRaw = a.contact_person?.trim();

          if (
            companyRaw &&
            companyRaw !== "" &&
            !["na", "n/a"].includes(companyRaw.toLowerCase())
          ) {
            map[agent].companySet.add(companyRaw);
          } else if (contactRaw && contactRaw !== "") {
            map[agent].companySet.add(contactRaw);
          }

          // 🔹 Exclude PO received early if needed
          if (normalizeRemarks(a.remarks) === "po received") {
            map[agent].nonSalesCount += 1;
            return;
          }

          // SALES / NON-SALES COUNT (WRAP_UP BASED ONLY)
          const wrapUp = (a.wrap_up || "").toLowerCase().trim();

          // PO RECEIVED → ALWAYS NON-SALES
          if (normalizeRemarks(a.remarks) === "po received") {
            map[agent].nonSalesCount += 1;
          }
          // SALES
          else if (isSalesWrapUp(a)) {
            map[agent].salesCount += 1;
          }
          // EVERYTHING ELSE → NON-SALES
          else {
            map[agent].nonSalesCount += 1;
          }

          // CUSTOMER STATUS COUNTS (Sales inquiries only)
          if (isValidSalesInquiry(a)) {
            if (cs === "new client") map[agent].newClientCount++;
            if (cs === "new non-buying") map[agent].newNonBuyingCount++;
            if (cs === "existing active") map[agent].ExistingActiveCount++;
            if (cs === "existing inactive") map[agent].ExistingInactive++;
          }

          // TRUE SALES CONVERSIONS
          if (isConvertedSale(a)) {
            map[agent].convertedCount++;
            map[agent].amount += soAmount;
            map[agent].qtySold += qtySold;

            if (cs === "new client")
              map[agent].newClientConvertedAmount += soAmount;

            if (cs === "new non-buying")
              map[agent].newNonBuyingConvertedAmount += soAmount;

            if (cs === "existing active")
              map[agent].newExistingActiveConvertedAmount += soAmount;

            if (cs === "existing inactive")
              map[agent].newExistingInactiveConvertedAmount += soAmount;
          }

          // TSA RESPONSE TIME
          const tsaResponse = computeTsaResponseTimeAligned(a);
          if (tsaResponse !== null) {
            map[agent].tsaResponseTotal += tsaResponse;
            map[agent].tsaResponseCount++;
          }

          // TSA HANDLING TIME
          const tsaHandling = computeTsaHandlingTimeAligned(a);
          if (tsaHandling !== null) {
            map[agent].tsaHandlingTotal += tsaHandling;
            map[agent].tsaHandlingCount++;
          }

          // NON QUOTATION HT
          const nonQ = computeNonQuotationHTAligned(a);
          if (nonQ !== null) {
            map[agent].nonQuotationTotal += nonQ;
            map[agent].nonQuotationCount++;
          }

          // QUOTATION HT
          const qHT = computeQuotationHTAligned(a);
          if (qHT !== null) {
            map[agent].quotationTotal += qHT;
            map[agent].quotationCount++;
          }

          // SPF HT
          const spf = computeSpfHTAligned(a);
          if (spf !== null) {
            map[agent].spfTotal += spf;
            map[agent].spfCount++;
          }
        });

      return Object.values(map).map((row) => ({
        ...row,
        csrList: Array.from(row.csrSet),
        companyList: Array.from(row.companySet),
      }));
    }, [activities, dateCreatedFilterRange]);

    useImperativeHandle(ref, () => ({
      downloadCSV() { },
    }));

    /* ===================== RENDER ===================== */

    return (
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Territory Sales Associate Conversion</CardTitle>
          <div className="text-sm text-muted-foreground">
            {dateCreatedFilterRange?.from || dateCreatedFilterRange?.to ? (
              <>
                {dateCreatedFilterRange.from
                  ? formatDate(dateCreatedFilterRange.from)
                  : "Any"}{" "}
                -{" "}
                {dateCreatedFilterRange.to
                  ? formatDate(dateCreatedFilterRange.to)
                  : "Any"}
              </>
            ) : (
              <span>All Dates</span>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="cursor-pointer">
                <Info size={18} />
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-[420px] text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold">Computation Guide</h4>

                <ul className="space-y-2">
                  <li>
                    <b>Sales</b> – Number of records where{" "}
                    <i>Traffic = Sales</i>
                  </li>

                  <li>
                    <b>Non-Sales</b> – Number of records where{" "}
                    <i>Traffic = Non-Sales</i>
                  </li>

                  <li>
                    <b>Amount</b> – Total <i>SO Amount</i> per agent
                  </li>

                  <li>
                    <b>QTY Sold</b> – Total quantity sold per agent
                  </li>

                  <li>
                    <b>Converted Sales</b> – Number of records with status
                    <i> “Converted into Sales”</i>
                  </li>

                  <li>
                    <b>% Inquiry to Sales</b> – (Converted Sales ÷ Sales) × 100
                  </li>

                  <li>
                    <b>TSA Response Time</b> –
                    <i>TSA Handling Time − Ticket Endorsed</i>
                  </li>

                  <li>
                    <b>Quotation Handling Time</b> –
                    <i>TSA Handling Time − TSA Acknowledge Date</i>
                    <br />
                    <span className="text-muted-foreground">
                      Applies when:
                      <br />• Remarks = “Quotation for Approval”
                    </span>
                  </li>

                  <li>
                    <b>Non-Quotation Handling Time</b> –
                    <i>TSA Handling Time − Ticket Received</i>
                    <br />
                    <span className="text-muted-foreground">
                      Applies to non-quotation remarks such as:
                      <br />
                      No Stocks, Unable to Contact Customer, Item Not Carried,
                      Waiting for Client Confirmation, and similar cases
                    </span>
                  </li>

                  <li>
                    <b>SPF Handling Duration</b> –
                    <i>TSA Handling Time − Ticket Received</i>
                    <br />
                    <span className="text-muted-foreground">
                      Applies only when Remarks = “For SPF”
                    </span>
                  </li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </CardHeader>

        <CardContent>
          {(loading || agentsLoading) && <p>Loading...</p>}
          {error && <p className="text-destructive">{error}</p>}

          {!loading && groupedData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent Name</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Non-Sales</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">QTY Sold</TableHead>
                  <TableHead className="text-right">Converted Sales</TableHead>
                  <TableHead className="text-right">
                    % Inquiry to Sales
                  </TableHead>
                  <TableHead className="text-right">New Client</TableHead>
                  <TableHead className="text-right">New Non-Buying</TableHead>
                  <TableHead className="text-right">Existing Active</TableHead>
                  <TableHead className="text-right">
                    Existing Inactive
                  </TableHead>
                  <TableHead className="text-right">
                    New Client (Converted)
                  </TableHead>
                  <TableHead className="text-right">
                    New Non-Buying (Converted)
                  </TableHead>
                  <TableHead className="text-right">
                    Existing Active (Converted)
                  </TableHead>
                  <TableHead className="text-right">
                    Existing Inactive (Converted)
                  </TableHead>
                  <TableHead className="text-right">
                    TSA Response Time
                  </TableHead>
                  <TableHead className="text-right">
                    TSA Handling Time
                  </TableHead>
                  <TableHead className="text-right">Non-Quotation Handling Time</TableHead>
                  <TableHead className="text-right">Quotation Handling Time</TableHead>
                  <TableHead className="text-right">SPF Handling Time</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(groupedData as any[])
                  .sort((a: any, b: any) => b.amount - a.amount)
                  .map((r: any, i: number) => {
                    const agent = agents.find((a) => a.ReferenceID === r.agent);
                    return (
                      <TableRow key={r.agent}>
                        <TableCell>
                          <Badge className="h-10 min-w-10">{i + 1}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          <details className="cursor-pointer">
                            <summary className="font-semibold">
                              {agent
                                ? `${agent.Firstname} ${agent.Lastname}`
                                : "(Unknown)"}
                            </summary>

                            <div className="mt-2 text-xs text-muted-foreground space-y-1">
                              <div className="font-medium">
                                CSRs who endorsed:
                              </div>

                              {r.csrList?.length === 0 && (
                                <div>No CSR found</div>
                              )}

                              {r.csrList?.map((csrId: string) => {
                                const csr = agents.find(
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

                            <div className="font-medium mt-2">
                              Companies Handled:
                            </div>

                            <div className="max-h-40 overflow-y-auto pr-2 border rounded-md p-2 bg-muted/30">
                              {r.companyList?.length === 0 && (
                                <div>No companies found</div>
                              )}

                              {r.companyList?.map((company: string) => (
                                <div key={company} className="truncate">
                                  {company}
                                </div>
                              ))}
                            </div>
                          </details>
                        </TableCell>

                        <TableCell className="text-right">
                          {r.salesCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.nonSalesCount}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱
                          {r.amount.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.qtySold}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.convertedCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.salesCount === 0
                            ? "-"
                            : ((r.convertedCount / r.salesCount) * 100).toFixed(
                              2,
                            ) + "%"}
                        </TableCell>

                        <TableCell className="text-right">
                          {r.newClientCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.newNonBuyingCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.ExistingActiveCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.ExistingInactive}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱
                          {r.newClientConvertedAmount.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱
                          {r.newNonBuyingConvertedAmount.toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.newExistingActiveConvertedAmount}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.newExistingInactiveConvertedAmount}
                        </TableCell>

                        {/* FIXED — removed Math.floor */}
                        <TableCell className="text-right">
                          {r.tsaResponseCount === 0
                            ? "-"
                            : formatMinutesToHHMM(
                              r.tsaResponseTotal / r.tsaResponseCount,
                            )}
                        </TableCell>

                        <TableCell className="text-right">
                          {r.tsaHandlingCount === 0
                            ? "-"
                            : formatMinutesToHHMM(
                              r.tsaHandlingTotal / r.tsaHandlingCount,
                            )}
                        </TableCell>

                        <TableCell className="text-right">
                          {r.nonQuotationCount === 0
                            ? "-"
                            : formatMinutesToHHMM(
                              r.nonQuotationTotal / r.nonQuotationCount,
                            )}
                        </TableCell>

                        <TableCell className="text-right">
                          {r.quotationCount === 0
                            ? "-"
                            : formatMinutesToHHMM(
                              r.quotationTotal / r.quotationCount,
                            )}
                        </TableCell>

                        <TableCell className="text-right">
                          {r.spfCount === 0
                            ? "-"
                            : formatMinutesToHHMM(
                              r.spfTotal / r.spfCount,
                            )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
</TableBody>

<tfoot>
  <TableRow className="bg-muted/30 font-semibold">
    <TableCell>-</TableCell>
    <TableCell>Total</TableCell>

    <TableCell className="text-right">
      {groupedData.reduce((sum, r) => sum + r.salesCount, 0)}
    </TableCell>

    <TableCell className="text-right">
      {groupedData.reduce((sum, r) => sum + r.nonSalesCount, 0)}
    </TableCell>

    <TableCell className="text-right">
      ₱
      {groupedData.reduce((sum, r) => sum + r.amount, 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </TableCell>

    <TableCell className="text-right">
      {groupedData.reduce((sum, r) => sum + r.qtySold, 0)}
    </TableCell>

    <TableCell className="text-right">
      {groupedData.reduce((sum, r) => sum + r.convertedCount, 0)}
    </TableCell>

    <TableCell className="text-right">
      {(() => {
        const totalSales = groupedData.reduce((sum, r) => sum + r.salesCount, 0);
        const totalConverted = groupedData.reduce((sum, r) => sum + r.convertedCount, 0);

        return totalSales === 0
          ? "-"
          : ((totalConverted / totalSales) * 100).toFixed(2) + "%";
      })()}
    </TableCell>

    <TableCell className="text-right">
      {groupedData.reduce((sum, r) => sum + r.newClientCount, 0)}
    </TableCell>

    <TableCell className="text-right">
      {groupedData.reduce((sum, r) => sum + r.newNonBuyingCount, 0)}
    </TableCell>

    <TableCell className="text-right">
      {groupedData.reduce((sum, r) => sum + r.ExistingActiveCount, 0)}
    </TableCell>

    <TableCell className="text-right">
      {groupedData.reduce((sum, r) => sum + r.ExistingInactive, 0)}
    </TableCell>

    <TableCell className="text-right">
      ₱
      {groupedData.reduce((sum, r) => sum + r.newClientConvertedAmount, 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </TableCell>

    <TableCell className="text-right">
      ₱
      {groupedData.reduce((sum, r) => sum + r.newNonBuyingConvertedAmount, 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </TableCell>

    <TableCell className="text-right">
      ₱
      {groupedData.reduce((sum, r) => sum + r.newExistingActiveConvertedAmount, 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </TableCell>

    <TableCell className="text-right">
      ₱
      {groupedData.reduce((sum, r) => sum + r.newExistingInactiveConvertedAmount, 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </TableCell>

<TableCell className="text-right">
  {(() => {
    const total = groupedData.reduce(
      (sum, r) => sum + (r.tsaResponseTotal / (r.tsaResponseCount || 1)),
      0
    );
    return total === 0 ? "-" : formatMinutesToHHMM(total);
  })()}
</TableCell>

<TableCell className="text-right">
  {(() => {
    const total = groupedData.reduce(
      (sum, r) => sum + (r.tsaHandlingTotal / (r.tsaHandlingCount || 1)),
      0
    );
    return total === 0 ? "-" : formatMinutesToHHMM(total);
  })()}
</TableCell>

<TableCell className="text-right">
  {(() => {
    const total = groupedData.reduce(
      (sum, r) => sum + (r.nonQuotationTotal / (r.nonQuotationCount || 1)),
      0
    );
    return total === 0 ? "-" : formatMinutesToHHMM(total);
  })()}
</TableCell>

<TableCell className="text-right">
  {(() => {
    const total = groupedData.reduce(
      (sum, r) => sum + (r.quotationTotal / (r.quotationCount || 1)),
      0
    );
    return total === 0 ? "-" : formatMinutesToHHMM(total);
  })()}
</TableCell>

<TableCell className="text-right">
  {(() => {
    const total = groupedData.reduce(
      (sum, r) => sum + (r.spfTotal / (r.spfCount || 1)),
      0
    );
    return total === 0 ? "-" : formatMinutesToHHMM(total);
  })()}
</TableCell>


  </TableRow>
</tfoot>

</Table>
          )}

        </CardContent>

        <Separator />

        <CardFooter className="flex justify-end">
          <Badge>Report Generated</Badge>
        </CardFooter>
      </Card>
    );
  },
);

export default AgentSalesTableCard;