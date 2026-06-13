/**
 * download-tickets-workbook.ts
 *
 * Generates a styled XLSX export for TaskFlow tickets.
 *
 * DateTime fields are split into separate DATE and TIME columns:
 *   - Ticket Received Date      | Ticket Received Time
 *   - Ticket Endorsed Date      | Ticket Endorsed Time
 *   - TSA Acknowledge Date      | TSA Acknowledge Time
 *   - TSA Handling Date         | TSA Handling Time
 *   - TSM Acknowledge Date      | TSM Acknowledge Time
 *   - TSM Handling Date         | TSM Handling Time
 *
 * Excluded: date_created, date_updated
 */

import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
  _id: string;
  ticket_reference_number: string;
  ticket_received?: string;
  ticket_endorsed?: string;
  inquiry_received?: string;
  response_to_inquiry?: string;
  handling_csr?: string;
  traffic?: string;
  source_company?: string;
  gender: string;
  channel?: string;
  wrap_up?: string;
  source?: string;
  customer_type?: string;
  customer_status?: string;
  status: string;
  department?: string;
  manager?: string;
  agent?: string;
  remarks?: string;
  inquiry?: string;

  company_name: string;
  contact_number: string;
  type_client: string;
  email_address: string;
  contact_person: string;
  address: string;

  so_number?: string;
  so_amount?: string;
  qty_sold?: string;
  quotation_number?: string;
  quotation_amount?: string;

  referenceid: string;
  date_updated: string;
  date_created: string;

  close_reason?: string;
  tsa_acknowledge_date?: string;
  tsa_handling_time?: string;
  tsm_acknowledge_date?: string;
  tsm_handling_time?: string;
}

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a datetime string → "MM/DD/YYYY" or "-" */
function fmtDate(raw?: string): string {
  if (!raw || raw === "-") return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/** Format a datetime string → "hh:mm AM/PM" or "-" */
function fmtTime(raw?: string): string {
  if (!raw || raw === "-") return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format a datetime string → full "MM/DD/YYYY, hh:mm AM/PM" */
function fmtDateTime(raw?: string): string {
  if (!raw || raw === "-") return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Resolve agent full name from ReferenceID */
function resolveAgent(referenceid: string, agents: Agent[]): string {
  const a = agents.find((ag) => ag.ReferenceID === referenceid);
  return a ? `${a.Firstname} ${a.Lastname}` : "-";
}

/** Apply header row style */
function styleHeaderRow(ws: XLSX.WorkSheet, headerRow: number, colCount: number) {
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow - 1, c });
    if (!ws[cellRef]) continue;
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 9 },
      fill: { fgColor: { rgb: "1F4E79" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "FFFFFF" } },
        bottom: { style: "thin", color: { rgb: "FFFFFF" } },
        left: { style: "thin", color: { rgb: "FFFFFF" } },
        right: { style: "thin", color: { rgb: "FFFFFF" } },
      },
    };
  }
}

/** Apply alternating row fill */
function styleDataRow(
  ws: XLSX.WorkSheet,
  rowIndex: number, // 0-based
  colCount: number,
  isEven: boolean
) {
  const fillColor = isEven ? "EBF3FB" : "FFFFFF";
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c });
    if (!ws[cellRef]) {
      ws[cellRef] = { t: "s", v: "" };
    }
    ws[cellRef].s = {
      font: { sz: 8 },
      fill: { fgColor: { rgb: fillColor } },
      alignment: { horizontal: "left", vertical: "center", wrapText: false },
      border: {
        bottom: { style: "hair", color: { rgb: "D0D0D0" } },
        right: { style: "hair", color: { rgb: "D0D0D0" } },
      },
    };
  }
}

// ─── Column definitions ───────────────────────────────────────────────────────

/**
 * Each entry: [header label, width in chars, value extractor fn]
 * DateTime fields are split into *Date and *Time pairs.
 */
function buildColumns(agents: Agent[]): Array<{
  header: string;
  width: number;
  value: (t: Ticket) => string;
}> {
  return [
    // ── Identity
    { header: "CSR Agent",          width: 22, value: (t) => resolveAgent(t.referenceid, agents) },
    { header: "Company Name",       width: 28, value: (t) => t.company_name || "-" },
    { header: "Status",             width: 20, value: (t) => t.status || "-" },

    // ── Contact info
    { header: "Contact Person",     width: 22, value: (t) => t.contact_person || "-" },
    { header: "Contact Number",     width: 18, value: (t) => t.contact_number || "-" },
    { header: "Email Address",      width: 28, value: (t) => t.email_address || "-" },
    { header: "Gender",             width: 10, value: (t) => t.gender || "-" },

    // ── Ticket Received (split)
    { header: "Ticket Received Date", width: 20, value: (t) => fmtDate(t.ticket_received) },
    { header: "Ticket Received Time", width: 18, value: (t) => fmtTime(t.ticket_received) },

    // ── Ticket Endorsed (split)
    { header: "Ticket Endorsed Date", width: 20, value: (t) => fmtDate(t.ticket_endorsed) },
    { header: "Ticket Endorsed Time", width: 18, value: (t) => fmtTime(t.ticket_endorsed) },

    // ── Inquiry
    { header: "Inquiry Received",    width: 22, value: (t) => fmtDateTime(t.inquiry_received) },
    { header: "Response to Inquiry", width: 22, value: (t) => fmtDateTime(t.response_to_inquiry) },

    // ── Call routing
    { header: "Handling CSR",       width: 18, value: (t) => t.handling_csr || "-" },
    { header: "Traffic",            width: 14, value: (t) => t.traffic || "-" },
    { header: "Source Company",     width: 22, value: (t) => t.source_company || "-" },
    { header: "Channel",            width: 16, value: (t) => t.channel || "-" },
    { header: "Wrap Up",            width: 24, value: (t) => t.wrap_up || "-" },
    { header: "Source",             width: 16, value: (t) => t.source || "-" },
    { header: "Customer Type",      width: 14, value: (t) => t.customer_type || "-" },
    { header: "Customer Status",    width: 18, value: (t) => t.customer_status || "-" },
    { header: "Department",         width: 14, value: (t) => t.department || "-" },

    // ── TSM
    { header: "Territory Sales Manager",    width: 22, value: (t) => t.manager || "-" },

    // ── TSM Acknowledge (split)
    { header: "TSM Acknowledge Date", width: 22, value: (t) => fmtDate(t.tsm_acknowledge_date) },
    { header: "TSM Acknowledge Time", width: 18, value: (t) => fmtTime(t.tsm_acknowledge_date) },

    // ── TSM Handling Time (split)
    { header: "TSM Handling Date",  width: 20, value: (t) => fmtDate(t.tsm_handling_time) },
    { header: "TSM Handling Time",  width: 18, value: (t) => fmtTime(t.tsm_handling_time) },

    // ── TSA
    { header: "Territory Sales Associate",  width: 22, value: (t) => t.agent || "-" },

    // ── TSA Acknowledge (split)
    { header: "TSA Acknowledge Date", width: 22, value: (t) => fmtDate(t.tsa_acknowledge_date) },
    { header: "TSA Acknowledge Time", width: 18, value: (t) => fmtTime(t.tsa_acknowledge_date) },

    // ── TSA Handling Time (split)
    { header: "TSA Handling Date",  width: 20, value: (t) => fmtDate(t.tsa_handling_time) },
    { header: "TSA Handling Time",  width: 18, value: (t) => fmtTime(t.tsa_handling_time) },

    // ── Notes
    { header: "Remarks",            width: 28, value: (t) => t.remarks || "-" },
    { header: "Inquiry",            width: 30, value: (t) => t.inquiry || "-" },

    // ── Sales
    { header: "SO Number",          width: 16, value: (t) => t.so_number || "-" },
    { header: "SO Amount",          width: 14, value: (t) => t.so_amount || "-" },
    { header: "Qty Sold",           width: 12, value: (t) => t.qty_sold || "-" },
    { header: "Quotation Number",   width: 18, value: (t) => t.quotation_number || "-" },
    { header: "Quotation Amount",   width: 16, value: (t) => t.quotation_amount || "-" },

    // ── Closure
    { header: "Close Reason",       width: 20, value: (t) => t.close_reason || "-" },
  ];
}

// ─── Main export function ─────────────────────────────────────────────────────

export function downloadTicketsWorkbook(
  tickets: Ticket[],
  agents: Agent[],
  filename = `TICKETS_${Date.now()}.xlsx`
) {
  const columns = buildColumns(agents);

  // Build rows: header + data
  const headerRow = columns.map((c) => c.header);
  const dataRows = tickets.map((t) => columns.map((c) => c.value(t)));

  const wsData = [headerRow, ...dataRows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = columns.map((c) => ({ wch: c.width }));

  // Freeze top row
  ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };

  // Apply header styling
  styleHeaderRow(ws, 1, columns.length);

  // Apply data row styling
  for (let r = 0; r < dataRows.length; r++) {
    styleDataRow(ws, r + 1, columns.length, r % 2 === 0);
  }

  XLSX.utils.book_append_sheet(wb, ws, "Tickets");

  XLSX.writeFile(wb, filename);
}