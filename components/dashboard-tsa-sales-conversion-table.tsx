"use client";

import React, { useState, useMemo, forwardRef, useImperativeHandle, useEffect, } from "react";
import { Info } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";

/* ===================== HELPERS ===================== */

/* ===================== TSA RESPONSE TIME ===================== */
function computeResponseSeconds(
  ticket_endorsed?: string,
  tsa_handling_time?: string
): number | null {
  if (!ticket_endorsed || !tsa_handling_time) return null;

  const start = new Date(ticket_endorsed);
  const end = new Date(tsa_handling_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;

  return Math.floor(diffMs / 1000);
}

/* ===================== TSA RESPONSE TIME ===================== */



/* ===================== QUOTATION HANDLING TIME ===================== */
function computeQuotationSeconds(
  ticket_received?: string,
  tsa_handling_time?: string,
  remarks?: string,
  status?: string
): number | null {
  if (
    !ticket_received ||
    !tsa_handling_time ||
    !remarks ||
    !status
  ) return null;

  if (
    remarks.toLowerCase() !== "quotation for approval" ||
    status.toLowerCase() !== "converted into sales"
  ) return null;

  const start = new Date(ticket_received);
  const end = new Date(tsa_handling_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;

  return Math.floor(diffMs / 1000);
}

/* ===================== QUOTATION HANDLING TIME ===================== */



/* ===================== NON-QUOTATION HANDLING TIME ===================== */

function computeNonQuotationSeconds(
  ticket_received?: string,
  tsa_handling_time?: string,
  remarks?: string
): number | null {
  if (!ticket_received || !tsa_handling_time || !remarks) return null;

  const validRemarks = [
    "no stocks / insufficient stocks",
    "unable to contact customer",
    "item not carried",
    "waiting for client confirmation",
    "customer request cancellation",
    "accreditation / partnership",
    "no response for client",
    "assisted",
    "for site visit",
    "non standard item",
    "po received",
    "for occular inspection"
  ];

  if (!validRemarks.includes(remarks.toLowerCase())) return null;

  const start = new Date(ticket_received);
  const end = new Date(tsa_handling_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;

  return Math.floor(diffMs / 1000);
}

/* ===================== NON-QUOTATION HANDLING TIME ===================== */



/* ===================== SPF HANDLING DURATION ===================== */

function computeSPFSeconds(
  ticket_received?: string,
  tsa_handling_time?: string,
  remarks?: string
): number | null {
  if (!ticket_received || !tsa_handling_time || !remarks) return null;

  if (remarks.toLowerCase() !== "for spf") return null;

  const start = new Date(ticket_received);
  const end = new Date(tsa_handling_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;

  return Math.floor(diffMs / 1000);
}

/* ===================== SPF HANDLING DURATION ===================== */


function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h}h ${m}m ${s}s`;
}

/* ===================== INTERFACES ===================== */

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

  tsa_handling_time?: string;
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
}

export interface AgentSalesConversionCardRef {
  downloadCSV: () => void;
}

const AgentSalesTableCard = forwardRef<
  AgentSalesConversionCardRef,
  Props
>(({ dateCreatedFilterRange }, ref) => {
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
        const res = await fetch("/api/act-fetch-agent-sales", {
          cache: "no-store",
        });
        const json = await res.json();
        setActivities(json.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  /* ===================== DATE FILTER ===================== */

  const isDateInRange = (dateStr?: string, range?: DateRange) => {
    if (!range || !dateStr) return true;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    const from = range.from
      ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 0, 0, 0)
      : null;

    const to = range.to
      ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59)
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
        // TSA RESPONSE TIME
        totalResponseSeconds: number;
        responseCount: number;
        // QUOTATION HANDLING TIME
        quotationTotalSeconds: number;
        quotationCount: number;
        // NON-QUOTATION HANDLING TIME
        nonQuotationTotalSeconds: number;
        nonQuotationCount: number;
        // SPF HANDLING DURATION
        spfTotalSeconds: number;
        spfCount: number;

      }
    > = {};

    activities
      .filter(
        (a) =>
          isDateInRange(a.date_updated, dateCreatedFilterRange) &&
          a.agent
      )
      .forEach((a) => {
        const agent = a.agent!;
        const soAmount = Number(a.so_amount ?? 0);
        const qtySold = Number(a.qty_sold ?? 0);
        const traffic = a.traffic.toLowerCase();
        const status = a.status.toLowerCase();
        const cs = a.customer_status.toLowerCase();

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

            totalResponseSeconds: 0,
            responseCount: 0,

            quotationTotalSeconds: 0,
            quotationCount: 0,

            nonQuotationTotalSeconds: 0,
            nonQuotationCount: 0,

            spfTotalSeconds: 0,
            spfCount: 0,

          };
        }

        if (traffic === "sales") map[agent].salesCount++;
        if (traffic === "non-sales") map[agent].nonSalesCount++;
        if (status === "converted into sales") map[agent].convertedCount++;

        if (cs === "new client") map[agent].newClientCount++;
        if (cs === "new non-buying") map[agent].newNonBuyingCount++;
        if (cs === "existing active") map[agent].ExistingActiveCount++;
        if (cs === "existing inactive") map[agent].ExistingInactive++;

        map[agent].amount += soAmount;
        map[agent].qtySold += qtySold;

        if (status === "converted into sales") {
          if (cs === "new client") map[agent].newClientConvertedAmount += soAmount;
          if (cs === "new non-buying") map[agent].newNonBuyingConvertedAmount += soAmount;
          if (cs === "existing active") map[agent].newExistingActiveConvertedAmount += soAmount;
          if (cs === "existing inactive") map[agent].newExistingInactiveConvertedAmount += soAmount;
        }

        // TSA RESPONSE TIME COMPUTATION
        const responseSeconds = computeResponseSeconds(
          a.ticket_endorsed,
          a.tsa_handling_time
        );

        if (responseSeconds !== null) {
          map[agent].totalResponseSeconds += responseSeconds;
          map[agent].responseCount++;
        }


        // QUOTATION HANDLING TIME COMPUTATION
        const quotationSeconds = computeQuotationSeconds(
          a.ticket_received,
          a.tsa_handling_time,
          a.remarks,
          a.status
        );

        if (quotationSeconds !== null) {
          map[agent].quotationTotalSeconds += quotationSeconds;
          map[agent].quotationCount++;
        }


        // NON-QUOTATION HANDLING TIME COMPUTATION
        const nonQuotationSeconds = computeNonQuotationSeconds(
          a.ticket_received,
          a.tsa_handling_time,
          a.remarks
        );

        if (nonQuotationSeconds !== null) {
          map[agent].nonQuotationTotalSeconds += nonQuotationSeconds;
          map[agent].nonQuotationCount++;
        }


        // SPF HANDLING DURATION COMPUTATION
        const spfSeconds = computeSPFSeconds(
          a.ticket_received,
          a.tsa_handling_time,
          a.remarks
        );

        if (spfSeconds !== null) {
          map[agent].spfTotalSeconds += spfSeconds;
          map[agent].spfCount++;
        }

      });

    return Object.values(map);
  }, [activities, dateCreatedFilterRange]);

  useImperativeHandle(ref, () => ({
    downloadCSV() { },
  }));

  /* ===================== RENDER ===================== */

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle>Territory Sales Associate Conversion</CardTitle>
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
                  <b>Sales</b> – Number of records where <i>Traffic = Sales</i>
                </li>

                <li>
                  <b>Non-Sales</b> – Number of records where <i>Traffic = Non-Sales</i>
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
                  <b>% Inquiry to Sales</b> –
                  (Converted Sales ÷ Sales) × 100
                </li>

                <li>
                  <b>TSA Response Time</b> –
                  <i>TSA Handling Time − Ticket Endorsed</i>
                </li>

                <li>
                  <b>Quotation Handling Time</b> –
                  <i>TSA Handling Time − Ticket Received</i><br />
                  <span className="text-muted-foreground">
                    Applies only when:<br />
                    • Remarks = “Quotation for Approval”<br />
                    • Status = “Converted into Sales”
                  </span>
                </li>

                <li>
                  <b>Non-Quotation Handling Time</b> –
                  <i>TSA Handling Time − Ticket Received</i><br />
                  <span className="text-muted-foreground">
                    Applies to non-quotation remarks such as:<br />
                    No Stocks, Unable to Contact Customer, Item Not Carried, Waiting for
                    Client Confirmation, and similar cases
                  </span>
                </li>

                <li>
                  <b>SPF Handling Duration</b> –
                  <i>TSA Handling Time − Ticket Received</i><br />
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
                <TableHead className="text-right">% Inquiry to Sales</TableHead>
                <TableHead className="text-right">New Client</TableHead>
                <TableHead className="text-right">New Non-Buying</TableHead>
                <TableHead className="text-right">Existing Active</TableHead>
                <TableHead className="text-right">Existing Inactive</TableHead>
                <TableHead className="text-right">New Client (Converted)</TableHead>
                <TableHead className="text-right">New Non-Buying (Converted)</TableHead>
                <TableHead className="text-right">Existing Active (Converted)</TableHead>
                <TableHead className="text-right">Existing Inactive (Converted)</TableHead>
                <TableHead className="text-right">TSA Response Time</TableHead>
                <TableHead className="text-right">Quotation Handling Time</TableHead>
                <TableHead className="text-right">Non-Quotation Handling Time</TableHead>
                <TableHead className="text-right">SPF Handling Duration</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupedData
                .sort((a, b) => b.amount - a.amount)
                .map((r, i) => {
                  const agent = agents.find((a) => a.ReferenceID === r.agent);
                  return (
                    <TableRow key={r.agent}>
                      <TableCell><Badge>{i + 1}</Badge></TableCell>
                      <TableCell>
                        {agent ? `${agent.Firstname} ${agent.Lastname}` : "(Unknown)"}
                      </TableCell>

                      <TableCell className="text-right">{r.salesCount}</TableCell>
                      <TableCell className="text-right">{r.nonSalesCount}</TableCell>
                      <TableCell className="text-right">₱{r.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2, })}</TableCell>
                      <TableCell className="text-right">{r.qtySold}</TableCell>
                      <TableCell className="text-right">{r.convertedCount}</TableCell>
                      <TableCell className="text-right">
                        {r.salesCount === 0
                          ? "-"
                          : ((r.convertedCount / r.salesCount) * 100).toFixed(2) + "%"}
                      </TableCell>

                      <TableCell className="text-right">{r.newClientCount}</TableCell>
                      <TableCell className="text-right">{r.newNonBuyingCount}</TableCell>
                      <TableCell className="text-right">{r.ExistingActiveCount}</TableCell>
                      <TableCell className="text-right">{r.ExistingInactive}</TableCell>
                      <TableCell className="text-right">{r.newClientConvertedAmount}</TableCell>
                      <TableCell className="text-right">{r.newNonBuyingConvertedAmount}</TableCell>
                      <TableCell className="text-right">{r.newExistingActiveConvertedAmount}</TableCell>
                      <TableCell className="text-right">{r.newExistingInactiveConvertedAmount}</TableCell>
                      <TableCell className="text-right">
                        {r.responseCount === 0
                          ? "-"
                          : formatDuration(
                            Math.floor(r.totalResponseSeconds / r.responseCount)
                          )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.quotationCount === 0
                          ? "-"
                          : formatDuration(Math.floor(r.quotationTotalSeconds / r.quotationCount))}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.nonQuotationCount === 0
                          ? "-"
                          : formatDuration(
                            Math.floor(
                              r.nonQuotationTotalSeconds / r.nonQuotationCount
                            )
                          )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.spfCount === 0
                          ? "-"
                          : formatDuration(
                            Math.floor(r.spfTotalSeconds / r.spfCount)
                          )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-end">
        <Badge>Report Generated</Badge>
      </CardFooter>
    </Card>
  );
});

export default AgentSalesTableCard;
