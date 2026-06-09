/**
 * download-tickets-workbook.ts
 *
 * Generates an .xlsx file matching the exact format of TICKETS_MODIFIED.xlsx:
 *  - Green header row (bg #16A34A, white bold text, center-aligned)
 *  - Yellow "helper/split" columns (K, L, N, O, AD, AE, AH, AI)
 *  - 44 columns matching the original layout
 *  - Auto-fit column widths (min 12, max 60 chars)
 *  - Frozen header row (row 1)
 *
 * Usage (replace your handleExportCsv call):
 *
 *   import { downloadTicketsWorkbook } from "@/lib/download-tickets-workbook";
 *   downloadTicketsWorkbook(filteredAndSortedData, agents);
 */

import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

interface TicketRow {
  referenceid?: string;
  ticket_reference_number?: string;
  company_name?: string;
  status?: string;
  date_created?: string;
  date_updated?: string;
  contact_person?: string;
  contact_number?: string;
  email_address?: string;
  gender?: string;
  ticket_received?: string;
  ticket_endorsed?: string;
  inquiry_received?: string;
  response_to_inquiry?: string;
  handling_csr?: string;
  traffic?: string;
  source_company?: string;
  channel?: string;
  wrap_up?: string;
  source?: string;
  customer_type?: string;
  customer_status?: string;
  department?: string;
  manager?: string;
  agent?: string;
  tsa_acknowledge_date?: string;
  tsa_handling_time?: string;
  remarks?: string;
  inquiry?: string;
  so_number?: string;
  so_amount?: string;
  qty_sold?: string;
  quotation_number?: string;
  quotation_amount?: string;
  close_reason?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

/** Extract just the date part (YYYY-MM-DD) for yellow helper columns */
function fmtDateOnly(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

/** Extract just the time part (HH:MM:SS) for yellow helper columns */
function fmtTimeOnly(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toTimeString().split(" ")[0]; // "HH:MM:SS"
}

function agentName(refId: string | undefined, agents: Agent[]): string {
  if (!refId) return "-";
  const a = agents.find((ag) => ag.ReferenceID === refId);
  return a ? `${a.Firstname} ${a.Lastname}` : "-";
}

// ─── Column definitions ───────────────────────────────────────────────────────
//
// Each entry: { header, yellow? }
// "yellow" columns get FFFFFF00 fill; all others get FF16A34A (green) header fill.
//
// Column layout mirrors TICKETS_MODIFIED.xlsx exactly (44 columns A–AR):
//
// A   CSR Agent
// B   Company Name
// C   Status
// D   Date Created
// E   Date Updated
// F   Contact Person
// G   Contact Number
// H   Email Address
// I   Gender
// J   Ticket Received          (green)
// K   Ticket Received          (yellow – date part)
// L   Ticket Endorsed          (yellow – time part of ticket_received)
// M   Ticket Endorsed          (green – full datetime)
// N   Ticket Endorsed          (yellow – date part)
// O   Ticket Endorsed          (yellow – time part)
// P   Inquiry Received
// Q   Response to Inquiry
// R   Handling CSR
// S   Traffic
// T   Source Company
// U   Channel
// V   Wrap Up
// W   Source
// X   Customer Type
// Y   Customer Status
// Z   Department
// AA  Territory Sales Manager
// AB  Territory Sales Associate
// AC  TSA Acknowledge Time     (green – full datetime)
// AD  TSA Acknowledge Time     (yellow – date part)
// AE  TSA Handling Time        (yellow – time part)
// AF  ack                      (green)
// AG  TSA Handling Time        (green – full datetime)
// AH  (yellow helper)
// AI  (yellow helper)
// AJ  (green helper)
// AK  Remarks
// AL  Inquiry
// AM  SO Number
// AN  SO Amount
// AO  Qty Sold
// AP  Quotation Number
// AQ  Quotation Amount
// AR  Close Reason

const COLUMNS: { header: string; yellow?: boolean }[] = [
  { header: "CSR Agent" },
  { header: "Company Name" },
  { header: "Status" },
  { header: "Date Created" },
  { header: "Date Updated" },
  { header: "Contact Person" },
  { header: "Contact Number" },
  { header: "Email Address" },
  { header: "Gender" },
  { header: "Ticket Received" },                    // J – green
  { header: "Ticket Received", yellow: true },      // K – yellow (date only)
  { header: "Ticket Endorsed", yellow: true },      // L – yellow (time only of ticket_received)
  { header: "Ticket Endorsed" },                    // M – green (full ticket_endorsed datetime)
  { header: "Ticket Endorsed", yellow: true },      // N – yellow (date only of ticket_endorsed)
  { header: "Ticket Endorsed", yellow: true },      // O – yellow (time only of ticket_endorsed)
  { header: "Inquiry Received" },
  { header: "Response to Inquiry" },
  { header: "Handling CSR" },
  { header: "Traffic" },
  { header: "Source Company" },
  { header: "Channel" },
  { header: "Wrap Up" },
  { header: "Source" },
  { header: "Customer Type" },
  { header: "Customer Status" },
  { header: "Department" },
  { header: "Territory Sales Manager" },
  { header: "Territory Sales Associate" },
  { header: "TSA Acknowledge Time" },               // AC – green (full datetime)
  { header: "TSA Acknowledge Time", yellow: true }, // AD – yellow (date only)
  { header: "TSA Handling Time", yellow: true },    // AE – yellow (time only of tsa_acknowledge)
  { header: "ack" },                                // AF – green
  { header: "TSA Handling Time" },                  // AG – green (full tsa_handling_time)
  { header: "", yellow: true },                     // AH – yellow helper
  { header: "", yellow: true },                     // AI – yellow helper
  { header: "" },                                   // AJ – green helper
  { header: "Remarks" },
  { header: "Inquiry" },
  { header: "SO Number" },
  { header: "SO Amount" },
  { header: "Qty Sold" },
  { header: "Quotation Number" },
  { header: "Quotation Amount" },
  { header: "Close Reason" },
];

// ─── Row builder ──────────────────────────────────────────────────────────────

function buildRow(t: TicketRow, agents: Agent[]): (string | number | null)[] {
  return [
    /* A  */ agentName(t.referenceid, agents),
    /* B  */ t.company_name ?? "-",
    /* C  */ t.status ?? "-",
    /* D  */ fmtDate(t.date_created),
    /* E  */ fmtDate(t.date_updated),
    /* F  */ t.contact_person ?? "-",
    /* G  */ t.contact_number ?? "-",
    /* H  */ t.email_address ?? "-",
    /* I  */ t.gender ?? "-",
    /* J  */ fmtDate(t.ticket_received),
    /* K  */ fmtDateOnly(t.ticket_received),
    /* L  */ fmtTimeOnly(t.ticket_received),
    /* M  */ fmtDate(t.ticket_endorsed),
    /* N  */ fmtDateOnly(t.ticket_endorsed),
    /* O  */ fmtTimeOnly(t.ticket_endorsed),
    /* P  */ fmtDate(t.inquiry_received),
    /* Q  */ fmtDate(t.response_to_inquiry),
    /* R  */ t.handling_csr ?? "-",
    /* S  */ t.traffic ?? "-",
    /* T  */ t.source_company ?? "-",
    /* U  */ t.channel ?? "-",
    /* V  */ t.wrap_up ?? "-",
    /* W  */ t.source ?? "-",
    /* X  */ t.customer_type ?? "-",
    /* Y  */ t.customer_status ?? "-",
    /* Z  */ t.department ?? "-",
    /* AA */ agentName(t.manager, agents),
    /* AB */ agentName(t.agent, agents),
    /* AC */ fmtDate(t.tsa_acknowledge_date),
    /* AD */ fmtDateOnly(t.tsa_acknowledge_date),
    /* AE */ fmtTimeOnly(t.tsa_acknowledge_date),
    /* AF */ null,  // "ack" – computed field placeholder
    /* AG */ fmtDate(t.tsa_handling_time),
    /* AH */ null,  // yellow helper
    /* AI */ null,  // yellow helper
    /* AJ */ null,  // green helper
    /* AK */ t.remarks ?? "-",
    /* AL */ t.inquiry ?? "-",
    /* AM */ t.so_number ?? "-",
    /* AN */ t.so_amount ?? "-",
    /* AO */ t.qty_sold ?? "-",
    /* AP */ t.quotation_number ?? "-",
    /* AQ */ t.quotation_amount ?? "-",
    /* AR */ t.close_reason ?? "-",
  ];
}

// ─── XLSX styling helpers ─────────────────────────────────────────────────────

/** Build a styled cell object for SheetJS */
function styledCell(
  value: string | number | null,
  style: object
): { v: typeof value; s: object } {
  return { v: value ?? "", s: style };
}

const GREEN_HEADER_STYLE = {
  fill: { fgColor: { rgb: "16A34A" } },
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    bottom: { style: "thin", color: { rgb: "CCCCCC" } },
  },
};

const YELLOW_HEADER_STYLE = {
  fill: { fgColor: { rgb: "FFFF00" } },
  font: { bold: true, color: { rgb: "000000" }, sz: 10 },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    bottom: { style: "thin", color: { rgb: "CCCCCC" } },
  },
};

const DATA_STYLE = {
  font: { sz: 9 },
  alignment: { vertical: "top", wrapText: true },
  border: {
    bottom: { style: "hair", color: { rgb: "E5E7EB" } },
    right: { style: "hair", color: { rgb: "E5E7EB" } },
  },
};

const YELLOW_DATA_STYLE = {
  ...DATA_STYLE,
  fill: { fgColor: { rgb: "FFFFE0" } },
};

// ─── Main export function ─────────────────────────────────────────────────────

export function downloadTicketsWorkbook(
  data: TicketRow[],
  agents: Agent[],
  filename = `TICKETS_${Date.now()}.xlsx`
): void {
  const wb = XLSX.utils.book_new();

  // ── Build worksheet array-of-arrays ────────────────────────────────────────
  const headerRow = COLUMNS.map((col, i) =>
    styledCell(col.header, col.yellow ? YELLOW_HEADER_STYLE : GREEN_HEADER_STYLE)
  );

  const dataRows = data.map((ticket) => {
    const row = buildRow(ticket, agents);
    return row.map((val, colIdx) => {
      const isYellow = COLUMNS[colIdx]?.yellow;
      return styledCell(val as string | number | null, isYellow ? YELLOW_DATA_STYLE : DATA_STYLE);
    });
  });

  const aoa = [headerRow, ...dataRows];

  // ── Create sheet ────────────────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // ── Column widths (auto-fit, capped) ────────────────────────────────────────
  const MIN_W = 12;
  const MAX_W = 60;
  const colWidths = COLUMNS.map((col, colIdx) => {
    const headerLen = col.header.length;
    const maxDataLen = data.reduce((mx, ticket) => {
      const row = buildRow(ticket, agents);
      const cell = row[colIdx];
      const len = cell ? String(cell).split("\n")[0].length : 0; // first line only
      return Math.max(mx, len);
    }, 0);
    const w = Math.min(MAX_W, Math.max(MIN_W, headerLen + 2, maxDataLen + 2));
    return { wch: w };
  });
  ws["!cols"] = colWidths;

  // ── Freeze header row ───────────────────────────────────────────────────────
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // ── Row heights ─────────────────────────────────────────────────────────────
  // Header slightly taller; data rows auto
  ws["!rows"] = [{ hpt: 30 }, ...data.map(() => ({ hpt: 14 }))];

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  XLSX.writeFile(wb, filename);
}