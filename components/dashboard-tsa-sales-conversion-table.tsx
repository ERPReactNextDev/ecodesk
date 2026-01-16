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

/* =========================
   CONSTANTS (EXCEL-BASED)
========================= */

const EXCLUDED_WRAPUPS = [
  "customerfeedback/recommendation",
  "job inquiry",
  "job applicants",
  "supplier/vendor product offer",
  "internal whistle blower",
  "threats / extortion / intimidation",
  "prank call",
];

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

const QUOTATION_REMARKS = [
  "quotation for approval",
  "converted to sale",
  "disapproved quotation",
];

/* =========================
   HELPERS
========================= */

function diffMinutesExcel(start?: string, end?: string): number | null {
  if (!start || !end) return null;

  const s = new Date(start);
  const e = new Date(end);

  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  if (e < s) return null; // INVALID DATE / TIME

  return Math.round((e.getTime() - s.getTime()) / 60000);
}

function formatHHMMSS(minutes?: number): string {
  if (!minutes || minutes <= 0) return "-";

  const sec = minutes * 60;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* =========================
   COMPONENT
========================= */

const AgentSalesTableCard = forwardRef<any, any>(
  ({ dateCreatedFilterRange }, ref) => {
    const [activities, setActivities] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [agentsLoading, setAgentsLoading] = useState(false);

    useEffect(() => {
      setLoading(true);
      fetch("/api/act-fetch-agent-sales")
        .then((r) => r.json())
        .then((d) => setActivities(d.data || []))
        .finally(() => setLoading(false));

      setAgentsLoading(true);
      fetch("/api/fetch-agent")
        .then((r) => r.json())
        .then(setAgents)
        .finally(() => setAgentsLoading(false));
    }, []);

    const isDateInRange = (dateStr?: string, range?: DateRange) => {
      if (!range) return true;
      if (!dateStr) return false;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      const { from, to } = range;
      if (from && d < new Date(from.setHours(0, 0, 0, 0))) return false;
      if (to && d > new Date(to.setHours(23, 59, 59, 999))) return false;

      return true;
    };

    const groupedData = useMemo(() => {
      const map: any = {};

      activities
        .filter(
          (a) =>
            isDateInRange(a.ticket_received, dateCreatedFilterRange) &&
            a.agent &&
            a.agent.trim() !== ""
        )
        .forEach((a) => {
          const agent = a.agent.trim();
          const wrap = (a.wrap_up || "").toLowerCase();
          if (EXCLUDED_WRAPUPS.includes(wrap)) return;

          const remark = (a.remarks || "").toLowerCase().trim();

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

          /* TSA RESPONSE TIME */
          const response = diffMinutesExcel(
            a.ticket_received,
            a.tsa_acknowledge_date
          );
          if (response !== null) {
            map[agent].tsaResponseTotal += response;
            map[agent].tsaResponseCount++;
          }

          /* TSA HANDLING TIME */
          const handling = diffMinutesExcel(
            a.ticket_endorsed,
            a.tsa_handling_time
          );

          if (handling !== null) {
            if (NON_QUOTATION_REMARKS.some((r) => remark.includes(r))) {
              map[agent].tsaNonQuotationTotal += handling;
              map[agent].tsaNonQuotationCount++;
            } else if (QUOTATION_REMARKS.some((r) => remark.includes(r))) {
              map[agent].tsaQuotationTotal += handling;
              map[agent].tsaQuotationCount++;
            } else if (remark === "spf") {
              map[agent].spfTotal += handling;
              map[agent].spfCount++;
            }
          }

          /* EXISTING METRICS */
          const traffic = (a.traffic || "").toLowerCase();
          const status = (a.status || "").toLowerCase();
          const customerStatus = (a.customer_status || "").toLowerCase();
          const soAmount = Number(a.so_amount ?? 0);
          const qtySold = Number(a.qty_sold ?? 0);

          if (traffic === "sales") map[agent].salesCount++;
          else if (traffic === "non-sales") map[agent].nonSalesCount++;

          if (status === "converted into sales")
            map[agent].convertedCount++;

          if (customerStatus === "new client") map[agent].newClientCount++;
          if (customerStatus === "new non-buying")
            map[agent].newNonBuyingCount++;
          if (customerStatus === "existing active")
            map[agent].ExistingActiveCount++;
          if (customerStatus === "existing inactive")
            map[agent].ExistingInactive++;

          map[agent].amount += isNaN(soAmount) ? 0 : soAmount;
          map[agent].qtySold += isNaN(qtySold) ? 0 : qtySold;

          if (
            customerStatus === "new client" &&
            status === "converted into sales"
          )
            map[agent].newClientConvertedAmount += soAmount;

          if (
            customerStatus === "new non-buying" &&
            status === "converted into sales"
          )
            map[agent].newNonBuyingConvertedAmount += soAmount;

          if (
            customerStatus === "existing active" &&
            status === "converted into sales"
          )
            map[agent].newExistingActiveConvertedAmount += soAmount;

          if (
            customerStatus === "existing inactive" &&
            status === "converted into sales"
          )
            map[agent].newExistingInactiveConvertedAmount += soAmount;
        });

      return Object.values(map);
    }, [activities, dateCreatedFilterRange]);

    const totalSoAmount = groupedData.reduce(
      (sum: number, r: any) => sum + r.amount,
      0
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>Territory Sales Associate Conversion</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
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
                  <TableHead className="text-right">% Conversion</TableHead>
                  <TableHead className="text-right">New Client</TableHead>
                  <TableHead className="text-right">New Non-Buying</TableHead>
                  <TableHead className="text-right">Existing Active</TableHead>
                  <TableHead className="text-right">Existing Inactive</TableHead>
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
                    TSAs Response Time
                  </TableHead>
                  <TableHead className="text-right">Quotation HT</TableHead>
                  <TableHead className="text-right">
                    Non Quotation HT
                  </TableHead>
                  <TableHead className="text-right">SPF HD</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {groupedData
                  .slice()
                  .sort((a: any, b: any) => b.amount - a.amount)
                  .map((r: any, i: number) => {
                    const agentDetails = agents.find(
                      (a: any) => a.ReferenceID === r.agent
                    );
                    const fullName = agentDetails
                      ? `${agentDetails.Firstname} ${agentDetails.Lastname}`
                      : r.agent;

                    return (
                      <TableRow key={r.agent}>
                        <TableCell>
                          <Badge>{i + 1}</Badge>
                        </TableCell>
                        <TableCell>{fullName}</TableCell>
                        <TableCell className="text-right">{r.salesCount}</TableCell>
                        <TableCell className="text-right">{r.nonSalesCount}</TableCell>
                        <TableCell className="text-right">
                          ₱{r.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{r.qtySold}</TableCell>
                        <TableCell className="text-right">{r.convertedCount}</TableCell>
                        <TableCell className="text-right">
                          {r.salesCount === 0
                            ? "0.00%"
                            : ((r.convertedCount / r.salesCount) * 100).toFixed(2) + "%"}
                        </TableCell>

                        <TableCell className="text-right">{r.newClientCount}</TableCell>
                        <TableCell className="text-right">{r.newNonBuyingCount}</TableCell>
                        <TableCell className="text-right">{r.ExistingActiveCount}</TableCell>
                        <TableCell className="text-right">{r.ExistingInactive}</TableCell>

                        <TableCell className="text-right">
                          ₱{r.newClientConvertedAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱{r.newNonBuyingConvertedAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱{r.newExistingActiveConvertedAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱{r.newExistingInactiveConvertedAmount.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {formatHHMMSS(r.tsaResponseTotal / r.tsaResponseCount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatHHMMSS(r.tsaQuotationTotal / r.tsaQuotationCount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatHHMMSS(r.tsaNonQuotationTotal / r.tsaNonQuotationCount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatHHMMSS(r.spfTotal / r.spfCount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex justify-end">
          <Badge>
            Total Amount: ₱
            {totalSoAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Badge>
        </CardFooter>
      </Card>
    );
  }
);

export default AgentSalesTableCard;
