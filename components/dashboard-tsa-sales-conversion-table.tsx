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
}

export interface AgentSalesConversionCardRef {
  downloadCSV: () => void;
}

/* ===================== HELPERS ===================== */

// difference in seconds
const diffSeconds = (start?: string, end?: string) => {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  if (e < s) return null;
  return Math.round((e.getTime() - s.getTime()) / 1000);
};

// ✅ EXCEL FORMAT: H:MM:SS (NO padded hour)
const formatHMMSS = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const NON_QUOTATION_REMARKS = [
  "No Stocks",
  "Insufficient Stocks",
  "Unable to Contact Customer",
  "Item Not Carried",
  "Waiting for Client Confirmation",
  "Customer Requested Cancellation",
  "Accreditation/Partnership",
  "No Response from Client",
  "Assisted",
  "For Site Visit",
  "Non-Standard Item",
  "PO Received",
  "Pending Quotation",
  "For Ocular Inspection",
];

/* ===================== COMPONENT ===================== */

const AgentSalesTableCard = forwardRef<
  AgentSalesConversionCardRef,
  Props
>(({ dateCreatedFilterRange }, ref) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const isDateInRange = (dateStr?: string, range?: DateRange) => {
    if (!range) return true;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    if (range.from && date < new Date(range.from.setHours(0, 0, 0, 0)))
      return false;
    if (range.to && date > new Date(range.to.setHours(23, 59, 59, 999)))
      return false;
    return true;
  };

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

        quotationTotal: number;
        quotationCount: number;
        nonQuotationTotal: number;
        nonQuotationCount: number;
        spfTotal: number;
        spfCount: number;
      }
    > = {};

    activities
      .filter(
        (a) =>
          isDateInRange(
            a.ticket_received ||
              a.ticket_endorsed ||
              a.date_updated ||
              a.date_created,
            dateCreatedFilterRange
          ) &&
          a.agent
      )
      .forEach((a) => {
        const agent = a.agent!;
        const soAmount = Number(a.so_amount ?? 0);
        const qtySold = Number(a.qty_sold ?? 0);
        const traffic = a.traffic.toLowerCase();
        const status = a.status.toLowerCase();
        const cs = a.customer_status.toLowerCase();
        const remarks = a.remarks || "";

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
            quotationTotal: 0,
            quotationCount: 0,
            nonQuotationTotal: 0,
            nonQuotationCount: 0,
            spfTotal: 0,
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

        // TSA Response Time (Endorsed → Handling)
        const respSec = diffSeconds(a.ticket_endorsed, a.tsa_handling_time);
        if (respSec !== null) {
          map[agent].tsaResponseTotal += respSec;
          map[agent].tsaResponseCount++;
        }

        // Handling Time (Received → Handling)
        const handleSec = diffSeconds(a.ticket_received, a.tsa_handling_time);

        if (
          handleSec !== null &&
          remarks === "Quotation For Approval" &&
          status === "converted into sales"
        ) {
          map[agent].quotationTotal += handleSec;
          map[agent].quotationCount++;
        }

        if (handleSec !== null && NON_QUOTATION_REMARKS.includes(remarks)) {
          map[agent].nonQuotationTotal += handleSec;
          map[agent].nonQuotationCount++;
        }

        if (handleSec !== null && remarks === "For SPF") {
          map[agent].spfTotal += handleSec;
          map[agent].spfCount++;
        }
      });

    return Object.values(map);
  }, [activities, dateCreatedFilterRange]);

  useImperativeHandle(ref, () => ({
    downloadCSV() {},
  }));

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle>Territory Sales Associate Conversion</CardTitle>
        <Info size={18} />
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
                <TableHead className="text-right">TSAs Response Time</TableHead>
                <TableHead className="text-right">Non Quotation HT</TableHead>
                <TableHead className="text-right">Quotation HT</TableHead>
                <TableHead className="text-right">SPF HD</TableHead>
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
                      <TableCell>{agent ? `${agent.Firstname} ${agent.Lastname}` : "(Unknown)"}</TableCell>

                      <TableCell className="text-right">{r.salesCount}</TableCell>
                      <TableCell className="text-right">{r.nonSalesCount}</TableCell>
                      <TableCell className="text-right">₱{r.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{r.qtySold}</TableCell>
                      <TableCell className="text-right">{r.convertedCount}</TableCell>
                      <TableCell className="text-right">
                        {r.salesCount === 0 ? "" : ((r.convertedCount / r.salesCount) * 100).toFixed(2) + "%"}
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
                        {r.tsaResponseCount ? formatHMMSS(Math.round(r.tsaResponseTotal / r.tsaResponseCount)) : ""}
                      </TableCell>

                      <TableCell className="text-right">
                        {r.nonQuotationCount ? formatHMMSS(Math.round(r.nonQuotationTotal / r.nonQuotationCount)) : ""}
                      </TableCell>

                      <TableCell className="text-right">
                        {r.quotationCount ? formatHMMSS(Math.round(r.quotationTotal / r.quotationCount)) : ""}
                      </TableCell>

    <TableCell className="text-right">
    {r.spfCount
        ? formatHMMSS(Math.round(r.spfTotal / r.spfCount))
        : ""}
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
