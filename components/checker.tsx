"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { type DateRange } from "react-day-picker";
import {
  Search, RefreshCcw, Loader2, ChevronUp, ChevronDown,
  Filter, FileText, AlertCircle, Download,
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

interface Ticket {
  _id: string;
  referenceid: string;
  department_head: string;
  account_reference_number: string;
  status: string;
  activity_reference_number: string;
  date_created: string;
  date_updated: string;
  agent: string;
  channel: string;
  client_segment: string;
  client_specs: string;
  close_reason: string;
  counter_offer: string;
  customer_status: string;
  customer_type: string;
  delivery_date: string;
  department: string;
  gender: string;
  inquiry: string;
  item_code: string;
  item_description: string;
  manager: string;
  payment_date: string;
  payment_terms: string;
  po_number: string;
  po_source: string;
  qty_sold: string;
  quotation_amount: string;
  quotation_number: string;
  remarks: string;
  so_amount: string;
  so_date: string;
  so_number: string;
  source: string;
  source_company: string;
  ticket_endorsed: string;
  ticket_received: string;
  ticket_reference_number: string;
  traffic: string;
  tsa_acknowledge_date: string;
  tsa_handling_time: string;
  tsm_acknowledge_date: string;
  tsm_handling_time: string;
  wrap_up: string;
  company_name: string;
  contact_number: string;
  contact_person: string;
  email_address: string;
  hr_acknowledge_date: string;
  inquiry_received: string;
  response_to_inquiry: string;
  address?: string;
  [key: string]: string | undefined;
}

interface TicketProps {
  referenceid: string;
  role: string;
  dateCreatedFilterRange?: DateRange;
  setDateCreatedFilterRangeAction?: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}

// ─── Column definitions ───────────────────────────────────────────────────────

// Column config: key, label, width, whether editable, whether computed
interface ColDef {
  key: string;
  label: string;
  width: number;
  editable: boolean;
  computed?: boolean;
  pinned?: boolean;
}

const COLUMNS: ColDef[] = [
  { key: "referenceid",              label: "Reference ID",         width: 160, editable: false, pinned: true },
  { key: "company_name",             label: "Company",              width: 180, editable: true },
  { key: "contact_person",           label: "Contact Person",       width: 160, editable: true },
  { key: "gender",                   label: "Gender",               width: 90,  editable: true },
  { key: "contact_number",           label: "Contact No.",          width: 140, editable: true },
  { key: "email_address",            label: "Email",                width: 200, editable: true },
  { key: "agent",                    label: "Agent",                width: 150, editable: true },
  { key: "manager",                  label: "Manager",              width: 150, editable: true },
  { key: "department_head",          label: "Dept. Head",           width: 150, editable: true },
  { key: "department",               label: "Department",           width: 140, editable: true },
  { key: "status",                   label: "Status",               width: 130, editable: true },
  { key: "customer_status",          label: "Customer Status",      width: 140, editable: true },
  { key: "customer_type",            label: "Customer Type",        width: 140, editable: true },
  { key: "client_segment",           label: "Client Segment",       width: 140, editable: true },
  { key: "channel",                  label: "Channel",              width: 120, editable: true },
  { key: "source",                   label: "Source",               width: 130, editable: true },
  { key: "source_company",           label: "Source Company",       width: 170, editable: true },
  { key: "wrap_up",                  label: "Wrap Up",              width: 160, editable: true },
  { key: "traffic",                  label: "Traffic",              width: 110, editable: true },
  { key: "inquiry",                  label: "Inquiry",              width: 200, editable: true },
  { key: "item_code",                label: "Item Code",            width: 130, editable: true },
  { key: "item_description",         label: "Item Description",     width: 220, editable: true },
  { key: "quotation_number",         label: "Quotation No.",        width: 160, editable: true },
  { key: "quotation_amount",         label: "Quotation Amount",     width: 150, editable: true },
  { key: "so_number",                label: "SO No.",               width: 140, editable: true },
  { key: "so_amount",                label: "SO Amount",            width: 130, editable: true },
  { key: "so_date",                  label: "SO Date",              width: 130, editable: true },
  { key: "qty_sold",                 label: "Qty Sold",             width: 100, editable: true },
  { key: "po_number",                label: "PO No.",               width: 140, editable: true },
  { key: "po_source",                label: "PO Source",            width: 130, editable: true },
  { key: "delivery_date",            label: "Delivery Date",        width: 140, editable: true },
  { key: "payment_date",             label: "Payment Date",         width: 140, editable: true },
  { key: "payment_terms",            label: "Payment Terms",        width: 140, editable: true },
  { key: "counter_offer",            label: "Counter Offer",        width: 130, editable: true },
  { key: "close_reason",             label: "Close Reason",         width: 160, editable: true },
  { key: "remarks",                  label: "Remarks",              width: 180, editable: true },
  { key: "client_specs",             label: "Client Specs",         width: 180, editable: true },
  { key: "ticket_reference_number",  label: "Ticket Ref No.",       width: 170, editable: true },
  { key: "ticket_received",          label: "Ticket Received",      width: 170, editable: false },
  { key: "ticket_endorsed",          label: "Ticket Endorsed",      width: 170, editable: false },
  { key: "inquiry_received",         label: "Inquiry Received",     width: 170, editable: true },
  { key: "response_to_inquiry",      label: "Response to Inquiry",  width: 170, editable: true },
  { key: "tsa_acknowledge_date",     label: "TSA Acknowledge",      width: 170, editable: false },
  { key: "tsa_handling_time",        label: "TSA Handling Time",    width: 170, editable: false },
  { key: "tsm_acknowledge_date",     label: "TSM Acknowledge",      width: 170, editable: false },
  { key: "tsm_handling_time",        label: "TSM Handling Time",    width: 170, editable: false },
  { key: "hr_acknowledge_date",      label: "HR Acknowledge",       width: 170, editable: false },
  // ─── Computed columns ───────────────────────────────────────────────────────
  {
    key: "response_time_mins",
    label: "Response Time (min)",
    width: 170, editable: false, computed: true,
  },
  {
    key: "quotation_handling_time_hrs",
    label: "Quotation HT (hrs)",
    width: 170, editable: false, computed: true,
  },
  // ─── Metadata ───────────────────────────────────────────────────────────────
  { key: "activity_reference_number", label: "Activity Ref No.",   width: 180, editable: false },
  { key: "date_created",             label: "Date Created",         width: 160, editable: false },
  { key: "date_updated",             label: "Date Updated",         width: 160, editable: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Response time: minutes from ticket_endorsed → tsa_acknowledge_date.
 * Returns a rounded string or "" if data is missing/invalid.
 */
function computeResponseTime(act: Ticket): string {
  const endorsed    = act.ticket_endorsed     ? new Date(act.ticket_endorsed).getTime()     : NaN;
  const acknowledged= act.tsa_acknowledge_date? new Date(act.tsa_acknowledge_date).getTime(): NaN;
  if (isNaN(endorsed) || isNaN(acknowledged)) return "";
  const diffMin = (acknowledged - endorsed) / 60000;
  if (diffMin < 0) return ""; // invalid — acknowledged before endorsed
  return diffMin.toFixed(2);
}

/**
 * Quotation handling time: hours from ticket_received → tsa_handling_time.
 * Only applies when remarks is "Quotation For Approval" or "Sold" (case-insensitive).
 */
function computeQuotationHT(act: Ticket): string {
  const remarksUpper = (act.remarks || "").trim().toUpperCase();
  const isQuotation  =
    remarksUpper === "QUOTATION FOR APPROVAL" ||
    remarksUpper === "SOLD" ||
    remarksUpper === "QUOTATION FOR APPROVAL" ;
  if (!isQuotation) return "";

  const received  = act.ticket_received  ? new Date(act.ticket_received).getTime()  : NaN;
  const handling  = act.tsa_handling_time? new Date(act.tsa_handling_time).getTime(): NaN;
  if (isNaN(received) || isNaN(handling)) return "";
  const diffHrs = (handling - received) / 3600000;
  if (diffHrs < 0) return ""; // invalid
  return diffHrs.toFixed(4);
}

/**
 * Normalise date strings to YYYY-MM-DD for safe string comparison.
 */
const toDateKey = (v: string | Date): string => {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Checker: React.FC<TicketProps> = ({
  referenceid,
  role,
  dateCreatedFilterRange,
}) => {
  const [activities, setActivities] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Agent[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Filters
  const [filterReference,     setFilterReference]     = useState("All");
  const [filterAgent,         setFilterAgent]         = useState("All");
  const [filterManager,       setFilterManager]       = useState("All");
  const [filterCustomerStatus,setFilterCustomerStatus]= useState("All");
  const [searchQuery,         setSearchQuery]         = useState("");

  // Sort
  const [sortKey,  setSortKey]  = useState<string | null>(null);
  const [sortDir,  setSortDir]  = useState<"asc" | "desc">("asc");

  // Selected row
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Pending cell save (debounced)
  const pendingRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/act-fetch-activity-role", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": role,
          "x-reference-id": referenceid,
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
  }, [role, referenceid]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/fetch-users-by-role");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); fetchUsers(); }, [fetchActivities, fetchUsers]);

  const resolveUser = (referenceId: string | undefined): string => {
    if (!referenceId) return "";
    const user = users.find(u => u.ReferenceID === referenceId);
    return user ? `${user.Firstname} ${user.Lastname}` : referenceId;
  };

  // ─── Unique filter options ───────────────────────────────────────────────────

  const uniq = useCallback(
    (field: keyof Ticket) =>
      Array.from(new Set(activities.map((a) => a[field]).filter(Boolean))) as string[],
    [activities]
  );

  // Create maps for ID ↔ name lookup
  const idToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => map.set(u.ReferenceID, `${u.Firstname} ${u.Lastname}`));
    return map;
  }, [users]);

  const nameToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => map.set(`${u.Firstname} ${u.Lastname}`, u.ReferenceID));
    return map;
  }, [users]);

  const getFilterOptions = (field: keyof Ticket): string[] => {
    const ids = Array.from(new Set(activities.map((a) => a[field]).filter(Boolean))) as string[];
    return ids.map(id => idToNameMap.get(id) || id);
  };

  const uniqueRefs      = useMemo(() => getFilterOptions("referenceid"),    [activities, idToNameMap]);
  const uniqueAgents    = useMemo(() => getFilterOptions("agent"),          [activities, idToNameMap]);
  const uniqueManagers  = useMemo(() => getFilterOptions("manager"),        [activities, idToNameMap]);
  const uniqueStatuses  = useMemo(() => uniq("customer_status"),[uniq]);

  // Helper to get ID from filter value (which might be name or ID)
  const getIdFromFilterValue = (value: string): string => {
    if (value === "All") return value;
    return nameToIdMap.get(value) || value;
  };

  // ─── Filter + search + sort ──────────────────────────────────────────────────

  const filteredActivities = useMemo(() => {
    const fromKey = dateCreatedFilterRange?.from ? toDateKey(dateCreatedFilterRange.from) : null;
    const toKey   = dateCreatedFilterRange?.to   ? toDateKey(dateCreatedFilterRange.to)   : null;

    const filterRefId = getIdFromFilterValue(filterReference);
    const filterAgentId = getIdFromFilterValue(filterAgent);
    const filterManagerId = getIdFromFilterValue(filterManager);

    let result = activities.filter((a) => {
      if (filterReference     !== "All" && a.referenceid      !== filterRefId)     return false;
      if (filterAgent         !== "All" && a.agent            !== filterAgentId)         return false;
      if (filterManager       !== "All" && a.manager          !== filterManagerId)       return false;
      if (filterCustomerStatus!== "All" && a.customer_status  !== filterCustomerStatus)return false;

      // Date filter using YYYY-MM-DD string comparison
      if (fromKey || toKey) {
        const d = String(a.date_created).slice(0, 10);
        if (fromKey && d < fromKey) return false;
        if (toKey   && d > toKey)   return false;
      }

      // Search across all fields
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const found = COLUMNS.some(({ key }) => {
          let v = (a as any)[key];
          // Resolve user IDs for search
          if (["referenceid", "agent", "manager", "department_head"].includes(key)) {
            v = resolveUser(v);
          }
          return v && String(v).toLowerCase().includes(q);
        });
        if (!found) return false;
      }

      return true;
    });

    // Sort
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = String(a[sortKey] ?? "");
        const bv = String(b[sortKey] ?? "");
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [
    activities, filterReference, filterAgent, filterManager,
    filterCustomerStatus, dateCreatedFilterRange, searchQuery,
    sortKey, sortDir,
  ]);

  // ─── Sort toggle ─────────────────────────────────────────────────────────────

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ─── Cell edit (debounced save) ──────────────────────────────────────────────

  const handleCellChange = (id: string, field: string, value: string) => {
    setActivities((prev) =>
      prev.map((a) => (a._id === id ? { ...a, [field]: value } : a))
    );

    // Debounce API call — wait 600ms after last keystroke
    const key = `${id}:${field}`;
    if (pendingRef.current[key]) clearTimeout(pendingRef.current[key]);
    pendingRef.current[key] = setTimeout(async () => {
      try {
        await fetch("/api/act-update-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: id.trim(), updates: { [field]: value } }),
        });
      } catch (err) {
        console.error("Save error:", err);
      }
      delete pendingRef.current[key];
    }, 600);
  };

  // ─── Computed value getter ────────────────────────────────────────────────────

  const getComputedValue = (act: Ticket, key: string): string => {
    if (key === "response_time_mins")         return computeResponseTime(act);
    if (key === "quotation_handling_time_hrs") return computeQuotationHT(act);
    return "";
  };

  // ─── Render states ────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="flex items-center justify-center h-48 gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading activities…
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm p-4 border border-red-200 bg-red-50">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {error}
        <button
          onClick={fetchActivities}
          className="ml-auto text-[11px] underline text-red-600 hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );

  if (activities.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
        <FileText className="w-10 h-10 opacity-30" />
        <p className="text-sm text-gray-400 font-semibold">No activities found</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search all columns…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 h-8 border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 w-56"
          />
        </div>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Filter: Reference */}
        <FilterSelect
          label="Ref ID"
          value={filterReference}
          onChange={setFilterReference}
          options={uniqueRefs}
        />
        <FilterSelect
          label="Agent"
          value={filterAgent}
          onChange={setFilterAgent}
          options={uniqueAgents}
        />
        <FilterSelect
          label="Manager"
          value={filterManager}
          onChange={setFilterManager}
          options={uniqueManagers}
        />
        <FilterSelect
          label="Status"
          value={filterCustomerStatus}
          onChange={setFilterCustomerStatus}
          options={uniqueStatuses}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stats + Refresh */}
        <span className="text-[11px] text-gray-400 font-mono shrink-0">
          {filteredActivities.length.toLocaleString()} rows · {COLUMNS.length} cols
        </span>

        <button
          onClick={() => {
            const data = filteredActivities.map(act => {
              const row: Record<string, any> = {};
              COLUMNS.forEach(col => {
                if (col.computed) {
                  row[col.label] = getComputedValue(act, col.key);
                } else if (["referenceid", "agent", "manager", "department_head"].includes(col.key)) {
                  row[col.label] = resolveUser(act[col.key]);
                } else {
                  row[col.label] = act[col.key] ?? "";
                }
              });
              return row;
            });
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "Checker Data");
            XLSX.writeFile(wb, `checker_data_${Date.now()}.xlsx`);
          }}
          className="h-8 px-3 border border-gray-200 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-400 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Download Excel
        </button>

        <button
          onClick={fetchActivities}
          className="h-8 px-3 border border-gray-200 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-400 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Sheet ───────────────────────────────────────────────────────── */}
      <div
        className="overflow-auto border border-gray-300 flex-1"
        style={{ maxHeight: "76vh" }}
      >
        <table
          className="border-collapse text-xs"
          style={{ minWidth: `${COLUMNS.reduce((s, c) => s + c.width, 0)}px` }}
        >
          <thead>
            <tr>
              {/* Row number header */}
              <th
                className="sticky top-0 left-0 z-30 bg-gray-100 border-r border-b border-gray-300 text-gray-400 text-[10px] font-medium select-none"
                style={{ minWidth: 42, width: 42 }}
              />

              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => !col.computed && toggleSort(col.key)}
                  className={`sticky top-0 z-20 border-b border-r border-gray-300 px-2.5 py-2 text-left font-semibold whitespace-nowrap select-none transition-colors
                    ${col.computed
                      ? "bg-amber-50 text-amber-700 cursor-default"
                      : col.editable
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer"
                    }`}
                  style={{ minWidth: col.width, width: col.width }}
                >
                  <span className="flex items-center gap-1">
                    {col.computed && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    )}
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === "asc"
                        ? <ChevronUp className="w-3 h-3 shrink-0" />
                        : <ChevronDown className="w-3 h-3 shrink-0" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredActivities.map((act, rowIdx) => {
              const isSelected = selectedRowId === act._id;

              return (
                <tr
                  key={act._id}
                  onClick={() => setSelectedRowId(isSelected ? null : act._id)}
                  className={`group transition-colors ${
                    isSelected
                      ? "bg-blue-50"
                      : rowIdx % 2 === 0
                      ? "bg-white hover:bg-gray-50"
                      : "bg-gray-50/50 hover:bg-gray-100/60"
                  }`}
                >
                  {/* Row number */}
                  <td
                    className="sticky left-0 z-10 border-r border-b border-gray-200 text-center text-gray-400 font-mono select-none"
                    style={{
                      minWidth: 42, width: 42,
                      background: isSelected ? "#eff6ff" : rowIdx % 2 === 0 ? "#fff" : "#f9f9f9",
                    }}
                  >
                    {rowIdx + 1}
                  </td>

                  {COLUMNS.map((col) => {
                    const isComputed = !!col.computed;
                    let rawValue   = isComputed
                      ? getComputedValue(act, col.key)
                      : (act[col.key] ?? "");
                    
                    // Resolve user IDs to names for display
                    if (["referenceid", "agent", "manager", "department_head"].includes(col.key)) {
                      rawValue = resolveUser(rawValue);
                    }

                    return (
                      <td
                        key={col.key}
                        className={`border-b border-r border-gray-200 p-0 ${
                          isComputed ? "bg-amber-50/60" : ""
                        }`}
                        style={{ minWidth: col.width, width: col.width }}
                      >
                        <input
                          type="text"
                          value={rawValue}
                          readOnly={!col.editable || isComputed || ["referenceid", "agent", "manager", "department_head"].includes(col.key)}
                          onChange={(e) =>
                            col.editable && !isComputed && !["referenceid", "agent", "manager", "department_head"].includes(col.key) &&
                            handleCellChange(act._id, col.key, e.target.value)
                          }
                          className={`w-full h-7 px-2.5 text-xs font-mono bg-transparent focus:outline-none
                            ${!col.editable || isComputed || ["referenceid", "agent", "manager", "department_head"].includes(col.key)
                              ? "text-gray-400 cursor-default select-none caret-transparent"
                              : "text-gray-800 focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400"
                            }`}
                          tabIndex={col.editable && !isComputed && !["referenceid", "agent", "manager", "department_head"].includes(col.key) ? 0 : -1}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredActivities.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[11px] text-gray-400 border-t border-gray-200">
            No matching records
          </div>
        )}
      </div>

      {/* ── Footer status bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-0.5 shrink-0">
        <span>
          {filteredActivities.length.toLocaleString()} of {activities.length.toLocaleString()} records
          {selectedRowId && (
            <span className="ml-3 text-blue-500">
              Row {(filteredActivities.findIndex((a) => a._id === selectedRowId) + 1)} selected
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-amber-300 rounded-sm" />
          Computed (read-only)
          <span className="ml-2 inline-block w-2 h-2 bg-gray-200 rounded-sm" />
          System (read-only)
        </span>
      </div>
    </div>
  );
};

// ─── FilterSelect ─────────────────────────────────────────────────────────────

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}

const FilterSelect: React.FC<FilterSelectProps> = ({ label, value, onChange, options }) => (
  <div className="flex items-center gap-1.5 shrink-0">
    <Filter className="w-3 h-3 text-gray-400" />
    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}:</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 border border-gray-200 text-xs bg-white px-2 focus:outline-none focus:ring-1 focus:ring-gray-400 max-w-40"
    >
      <option value="All">All</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </div>
);

export default Checker;