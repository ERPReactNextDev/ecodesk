// components/departmental-csr-fetch-sheet.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  referenceid: string;
  newRecord?: any;
  updatedRecord?: any;
  onEdit: (row: any) => void;
}

/* =========================
   FORMATTERS
========================= */

function formatDT(v?: string) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function msToTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* =========================
   EXCEL-ALIGNED LOGIC
========================= */

/** DAYS COLUMNS (DATE ONLY, Excel style)
 * - ignores time
 * - negative → 0
 * - never INVALID
 */
function excelDays(start?: string, end?: string) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";

  const sd = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const ed = new Date(e.getFullYear(), e.getMonth(), e.getDate());

  if (ed < sd) return 0;
  return Math.floor((ed.getTime() - sd.getTime()) / 86400000);
}

/** HANDLING TIME (DATE + TIME)
 * Validation order:
 * 1. Earlier DATE → INVALID DATE
 * 2. Same DATE, earlier TIME → INVALID TIME
 * 3. Else → diff
 */
function excelHT(start?: string, end?: string) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";

  if (
    e.getFullYear() < s.getFullYear() ||
    (e.getFullYear() === s.getFullYear() && e.getMonth() < s.getMonth()) ||
    (e.getFullYear() === s.getFullYear() &&
      e.getMonth() === s.getMonth() &&
      e.getDate() < s.getDate())
  ) {
    return "INVALID DATE";
  }

  if (e.toDateString() === s.toDateString() && e.getTime() < s.getTime()) {
    return "INVALID TIME";
  }

  return msToTime(e.getTime() - s.getTime());
}

/** DEPARTMENT HANDLING TIME
 * Excel shows #ERROR! instead of INVALID
 */
function excelDeptHandling(start?: string, end?: string) {
  const r = excelHT(start, end);
  if (r === "INVALID DATE" || r === "INVALID TIME") return "#ERROR!";
  return r;
}

/** RAW HANDLING TIME (Excel behavior)
 * - no validation
 * - allows huge / negative values
 * - used ONLY for JR COSTING
 */
function excelRawHT(start?: string, end?: string) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
  return msToTime(e.getTime() - s.getTime());
}

/* =========================
   COMPONENT
========================= */

export function DepartmentalCsrFetchSheet({
  referenceid,
  newRecord,
  updatedRecord,
  onEdit,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!referenceid) return;
    setLoading(true);
    fetch(`/api/departmental-csr-fetch-activity?referenceid=${referenceid}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setRows(d.data);
      })
      .finally(() => setLoading(false));
  }, [referenceid]);

  useEffect(() => {
    if (!newRecord) return;
    setRows((prev) => [newRecord, ...prev]);
  }, [newRecord]);

  useEffect(() => {
    if (!updatedRecord) return;
    setRows((prev) =>
      prev.map((r) => (r._id === updatedRecord._id ? updatedRecord : r))
    );
  }, [updatedRecord]);

  if (!referenceid) return null;

  return (
    <div className="rounded-lg border mt-4 flex flex-col min-w-0">
      <div className="p-4 border-b font-semibold flex items-center gap-3">
        <span>Departmental CSR Records</span>
        <span className="text-sm text-muted-foreground">
          Ref: {referenceid}
        </span>
      </div>

      {loading && (
        <div className="p-4 text-sm text-muted-foreground">Loading…</div>
      )}

      {!loading && rows.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground">
          No records found.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="flex-1 min-w-0 overflow-auto">
          <table className="min-w-[3800px] w-full text-sm border-collapse">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="p-2 border-b">Actions</th>
                {[
                  "Ticket Received",
                  "Ticket Endorsed",
                  "Company",
                  "Customer",
                  "Concern",
                  "Activity",
                  "SO #",
                  "Order Qty",
                  "Busted",
                  "SI / DR",
                  "Item Code",
                  "Item Description",
                  "Reason",
                  "Warranty Claims",
                  "Warranty Period",
                  "Pullout Address",
                  "Pullout Slip",
                  "Logistics",
                  "Pulled Out",
                  "Technical",
                  "Processed By",
                  "Replacement Status",
                  "Repaired",
                  "Replacement Slip",
                  "Dispatch",
                  "Delivered",
                  "Pending Days",
                  "Status",
                  "Remarks",
                  "JR Costing",
                  "Acknowledged",
                  "Closed",

                  "Dept Response Time",
                  "Dept Handling Time",

                  "Pull-Out → Logistics (Days)",
                  "Pulled-Out / Returned (Days)",
                  "Date Repaired (Days)",
                  "Dispatch (Days)",
                  "Delivered (Days)",

                  "Pull-Out → Logistics (HT)",
                  "Pulled-Out / Returned (HT)",
                  "Date Repaired (HT)",
                  "Dispatch (HT)",
                  "Delivered (HT)",

                  "JR Costing Handling Time",
                ].map((h) => (
                  <th key={h} className="p-2 border-b whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t hover:bg-muted/40">
                  <td className="p-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={() => onEdit(r)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive">
                        Delete
                      </Button>
                    </div>
                  </td>

                  <td className="p-2">{formatDT(r.ticket_received_date_and_time)}</td>
                  <td className="p-2">{formatDT(r.ticket_endorsed_date_and_time)}</td>
                  <td className="p-2">{r.company_name}</td>
                  <td className="p-2">{r.customer_name}</td>
                  <td className="p-2">{r.type_of_concern}</td>
                  <td className="p-2">{r.activity}</td>
                  <td className="p-2">{r.so_no}</td>
                  <td className="p-2">{r.order_qty}</td>
                  <td className="p-2">{r.busted_items}</td>
                  <td className="p-2">{r.si_dr_no}</td>
                  <td className="p-2">{r.item_code}</td>
                  <td className="p-2">{r.item_description}</td>
                  <td className="p-2">{r.reason_for_replacement}</td>
                  <td className="p-2">{r.warranty_claims}</td>
                  <td className="p-2">
                    {r.warranty_period} {r.warranty_period_unit}
                  </td>
                  <td className="p-2">{r.pullout_address}</td>
                  <td className="p-2">{r.pullout_slip_no}</td>
                  <td className="p-2">{formatDT(r.logistics_date)}</td>
                  <td className="p-2">{formatDT(r.replacement_date)}</td>
                  <td className="p-2">{r.technical_assessment}</td>
                  <td className="p-2">{r.processed_by}</td>
                  <td className="p-2">{r.replacement_status}</td>
                  <td className="p-2">{formatDT(r.date_and_time_repaired)}</td>
                  <td className="p-2">{r.replacement_slip_no}</td>
                  <td className="p-2">{formatDT(r.date_forwarded_to_dispatch)}</td>
                  <td className="p-2">{formatDT(r.date_delivered)}</td>
                  <td className="p-2">{r.pending_days}</td>
                  <td className="p-2 font-semibold">{r.status}</td>
                  <td className="p-2">{r.replacement_remarks}</td>
                  <td className="p-2">{formatDT(r.jr_costing_date_and_time)}</td>
                  <td className="p-2">{formatDT(r.confirmed_acknowledged_date_and_time)}</td>
                  <td className="p-2">{formatDT(r.ticket_closed_date_and_time)}</td>

                  {/* Dept Response Time */}
                  <td className="p-2">
                    {excelHT(
                      r.ticket_endorsed_date_and_time,
                      r.confirmed_acknowledged_date_and_time
                    )}
                  </td>

                  {/* Dept Handling Time */}
                  <td className="p-2">
                    {excelDeptHandling(
                      r.ticket_received_date_and_time,
                      r.confirmed_acknowledged_date_and_time
                    )}
                  </td>

                  {/* DAYS */}
                  <td className="p-2">
                    {excelDays(r.ticket_endorsed_date_and_time, r.logistics_date)}
                  </td>
                  <td className="p-2">
                    {excelDays(r.logistics_date, r.replacement_date)}
                  </td>
                  <td className="p-2">
                    {excelDays(r.replacement_date, r.date_and_time_repaired)}
                  </td>
                  <td className="p-2">
                    {excelDays(r.date_and_time_repaired, r.date_forwarded_to_dispatch)}
                  </td>
                  <td className="p-2">
                    {excelDays(r.date_forwarded_to_dispatch, r.date_delivered)}
                  </td>

                  {/* HANDLING TIME */}
                  <td className="p-2">
                    {excelHT(
                      r.ticket_endorsed_date_and_time,
                      r.logistics_date
                    )}
                  </td>
                  <td className="p-2">
                    {excelHT(
                      r.logistics_date,
                      r.replacement_date
                    )}
                  </td>
                  <td className="p-2">
                    {excelHT(
                      r.replacement_date,
                      r.date_and_time_repaired
                    )}
                  </td>
                  <td className="p-2">
                    {excelHT(
                      r.date_and_time_repaired,
                      r.date_forwarded_to_dispatch
                    )}
                  </td>
                  <td className="p-2">
                    {excelHT(
                      r.date_forwarded_to_dispatch,
                      r.date_delivered
                    )}
                  </td>

                  {/* JR COSTING HANDLING TIME (RAW Excel) */}
                  <td className="p-2 font-semibold">
                    {excelRawHT(
                      r.confirmed_acknowledged_date_and_time,
                      r.jr_costing_date_and_time
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
