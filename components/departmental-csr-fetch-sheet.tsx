// components/departmental-csr-fetch-sheet.tsx
"use client";

import React, { useEffect, useState } from "react";

interface Props {
  referenceid: string;
  newRecord?: any;
}

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

export function DepartmentalCsrFetchSheet({
  referenceid,
  newRecord,
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

  if (!referenceid) return null;

  return (
    <div className="rounded-lg border mt-4 flex flex-col min-w-0">
      <div className="p-4 border-b font-semibold shrink-0">
        Departmental CSR Records
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
          <table className="min-w-[2400px] w-full text-sm border-collapse">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
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
                ].map((h) => (
                  <th key={h} className="p-2 text-left whitespace-nowrap border-b">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t hover:bg-muted/40">
                  <td className="p-2 whitespace-nowrap">
                    {formatDT(r.ticket_received_date_and_time)}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {formatDT(r.ticket_endorsed_date_and_time)}
                  </td>
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
                  <td className="p-2">
                    {formatDT(r.date_and_time_repaired)}
                  </td>
                  <td className="p-2">{r.replacement_slip_no}</td>
                  <td className="p-2">
                    {formatDT(r.date_forwarded_to_dispatch)}
                  </td>
                  <td className="p-2">{formatDT(r.date_delivered)}</td>
                  <td className="p-2">{r.pending_days}</td>
                  <td className="p-2 font-semibold">{r.status}</td>
                  <td className="p-2">{r.replacement_remarks}</td>
                  <td className="p-2">
                    {formatDT(r.jr_costing_date_and_time)}
                  </td>
                  <td className="p-2">
                    {formatDT(r.confirmed_acknowledged_date_and_time)}
                  </td>
                  <td className="p-2">
                    {formatDT(r.ticket_closed_date_and_time)}
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
