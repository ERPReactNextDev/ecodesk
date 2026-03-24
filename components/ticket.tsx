"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DoneDialog } from "./activity-done-dialog";
import { UpdateTicketDialog } from "./ticket-update-dialog";
import { ActDeleteDialog } from "./act-delete-dialog";
import { ActFilterDialog } from "./act-filter-dialog";
import { type DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { AddCompanyModal } from "./add-company-modal";
import { Separator } from "@/components/ui/separator";
import { TicketHistoryDialog } from "./ticket-history-dialog";

/* ─────────────────────────────────────────────────────────────
   GLOW KEYFRAMES — injected once into <head>
───────────────────────────────────────────────────────────── */
const GLOW_STYLE_ID = "ticket-glow-style";
if (typeof document !== "undefined" && !document.getElementById(GLOW_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = GLOW_STYLE_ID;
  style.textContent = `
    @keyframes ticketGlowPulse {
      0%   { box-shadow: 0 0 0px  0px  var(--glow-color, rgba(99,102,241,0)); }
      15%  { box-shadow: 0 0 20px 8px  var(--glow-color, rgba(99,102,241,0.6)); }
      50%  { box-shadow: 0 0 28px 10px var(--glow-color, rgba(99,102,241,0.38)); }
      85%  { box-shadow: 0 0 18px 6px  var(--glow-color, rgba(99,102,241,0.22)); }
      100% { box-shadow: 0 0 0px  0px  var(--glow-color, rgba(99,102,241,0)); }
    }
    .ticket-glow {
      animation: ticketGlowPulse 2.4s ease-in-out infinite !important;
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────────────────────
   PERSISTENT GLOW — localStorage helpers
───────────────────────────────────────────────────────────── */
const LS_GLOW_KEY   = "ticket_glow_map";
const LS_PREV_KEY   = "ticket_prev_status_map";
const GLOW_DURATION = 30_000; // 30 s

type GlowEntry = { status: string; glowUntil: number };
type GlowMap   = Record<string, GlowEntry>;

function readGlowMap(): GlowMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_GLOW_KEY) || "{}") as GlowMap; }
  catch { return {}; }
}
function writeGlowMap(m: GlowMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_GLOW_KEY, JSON.stringify(m));
}
function readPrevMap(): Map<string, string> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = JSON.parse(localStorage.getItem(LS_PREV_KEY) || "{}") as Record<string, string>;
    return new Map(Object.entries(raw));
  } catch { return new Map(); }
}
function writePrevMap(m: Map<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_PREV_KEY, JSON.stringify(Object.fromEntries(m)));
}
function getActiveGlowIds(m: GlowMap): Set<string> {
  const now = Date.now();
  return new Set(Object.entries(m).filter(([, v]) => v.glowUntil > now).map(([k]) => k));
}
function pruneAndRead(): GlowMap {
  const m = readGlowMap();
  const now = Date.now();
  const pruned: GlowMap = {};
  for (const [id, e] of Object.entries(m)) if (e.glowUntil > now) pruned[id] = e;
  writeGlowMap(pruned);
  return pruned;
}

/* ─────────────────────────────────────────────────────────────
   PER-STATUS GLOW COLOURS
───────────────────────────────────────────────────────────── */
const GLOW_COLOR: Record<string, string> = {
  "On-Progress":          "rgba(59,130,246,0.65)",
  "Closed":               "rgba(107,114,128,0.5)",
  "Endorsed":             "rgba(168,85,247,0.65)",
  "Converted into Sales": "rgba(34,197,94,0.65)",
};
const GLOW_BG: Record<string, string> = {
  "On-Progress":          "rgba(239,246,255,0.97)",
  "Closed":               "rgba(249,250,251,0.97)",
  "Endorsed":             "rgba(250,245,255,0.97)",
  "Converted into Sales": "rgba(240,253,244,0.97)",
};
const GLOW_BORDER: Record<string, string> = {
  "On-Progress":          "rgba(59,130,246,0.55)",
  "Closed":               "rgba(107,114,128,0.45)",
  "Endorsed":             "rgba(168,85,247,0.55)",
  "Converted into Sales": "rgba(34,197,94,0.55)",
};
const PING_COLOR: Record<string, string> = {
  "On-Progress":          "#3b82f6",
  "Closed":               "#6b7280",
  "Endorsed":             "#a855f7",
  "Converted into Sales": "#22c55e",
};
const BADGE_BG: Record<string, string> = {
  "On-Progress":          "rgba(219,234,254,1)",
  "Closed":               "rgba(243,244,246,1)",
  "Endorsed":             "rgba(237,233,254,1)",
  "Converted into Sales": "rgba(220,252,231,1)",
};
const BADGE_FG: Record<string, string> = {
  "On-Progress":          "#1d4ed8",
  "Closed":               "#374151",
  "Endorsed":             "#7c3aed",
  "Converted into Sales": "#15803d",
};

/* ─────────────────────────────────────────────────────────────
   INTERFACES
───────────────────────────────────────────────────────────── */
interface Company {
  id: string;
  account_reference_number: string;
  company_name: string;
  contact_number?: string;
  type_client?: string;
  email_address: string;
  contact_person: string;
  address: string;
  status: string;
  referenceid: string;
  date_created?: string;
}
interface MergedActivity extends Ticket {
  company_name: string; contact_number: string; type_client: string;
  contact_person: string; email_address: string; address: string;
}
interface Ticket {
  _id: string; ticket_reference_number: string;
  ticket_received?: string; ticket_endorsed?: string;
  inquiry_received?: string; response_to_inquiry?: string; handling_csr?: string;
  traffic?: string; source_company?: string; gender: string;
  channel?: string; wrap_up?: string; source?: string;
  customer_type?: string; customer_status?: string; status: string;
  department?: string; manager?: string; agent?: string;
  remarks?: string; inquiry?: string; department_head?: string;
  company_name: string; contact_number: string; type_client: string;
  email_address: string; contact_person: string; address: string;
  item_code?: string; item_description?: string; po_number?: string;
  so_date?: string; so_number?: string; so_amount?: string; qty_sold?: string;
  quotation_number?: string; quotation_amount?: string; payment_terms?: string;
  po_source?: string; payment_date?: string; delivery_date?: string;
  referenceid: string; activity_reference_number: string;
  account_reference_number: string; date_updated: string; date_created: string;
  close_reason?: string; counter_offer?: string; client_specs?: string;
  tsm_acknowledge_date?: string; tsa_acknowledge_date?: string;
  tsm_handling_time?: string; tsa_handling_time?: string; hr_acknowledge_date?: string;
}
interface TicketProps {
  referenceid: string; role: string;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}
interface Agent { ReferenceID: string; Firstname: string; Lastname: string; }

const COLUMN_ITEMS_PER_PAGE = 10;
const STATUS_COLUMNS = ["On-Progress","Closed","Endorsed","Converted into Sales"] as const;
type StatusColumn = (typeof STATUS_COLUMNS)[number];

const STATUS_STYLES: Record<string,string> = {
  "On-Progress": "bg-blue-100 text-blue-700 border-blue-300",
  Closed: "bg-gray-200 text-gray-700 border-gray-300",
  Endorsed: "bg-purple-100 text-purple-700 border-purple-300",
  "Converted into Sales": "bg-green-100 text-green-700 border-green-300",
};
const STATUS_HEADER_STYLES: Record<string,string> = {
  "On-Progress": "bg-blue-50 border-blue-200 text-blue-800",
  Closed: "bg-gray-50 border-gray-200 text-gray-700",
  Endorsed: "bg-purple-50 border-purple-200 text-purple-800",
  "Converted into Sales": "bg-green-50 border-green-200 text-green-800",
};

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export const Ticket: React.FC<TicketProps> = ({
  referenceid, role, dateCreatedFilterRange, setDateCreatedFilterRangeAction,
}) => {
  const [companies, setCompanies]           = useState<Company[]>([]);
  const [activities, setActivities]         = useState<Ticket[]>([]);
  const [loadingCompanies, setLoadingCo]    = useState(false);
  const [loadingActivities, setLoadingAct]  = useState(false);
  const [errorCompanies, setErrorCo]        = useState<string|null>(null);
  const [errorActivities, setErrorAct]      = useState<string|null>(null);
  const [updatingId, setUpdatingId]         = useState<string|null>(null);
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [selectedActivityId, setSelActId]   = useState<string|null>(null);
  const [addingLock, setAddingLock]         = useState<Set<string>>(new Set());
  const [addingAccount, setAddingAccount]   = useState<string|null>(null);
  const [searchTerm, setSearchTerm]         = useState("");
  const [activitySearchTerm, setActSearch]  = useState("");
  const [columnSearch, setColSearch]        = useState<Record<StatusColumn,string>>({
    "On-Progress":"", Closed:"", Endorsed:"", "Converted into Sales":"",
  });
  const [columnCurrentPage, setColPage]     = useState<Record<StatusColumn,number>>({
    "On-Progress":1, Closed:1, Endorsed:1, "Converted into Sales":1,
  });
  const [showCheckboxes, setShowCB]         = useState(false);
  const [selectedToDelete, setSelDel]       = useState<string[]>([]);
  const [showDeleteConfirm, setShowDC]      = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [filterDialogOpen, setFilterOpen]   = useState(false);
  const [filters, setFilters]               = useState<{
    referenceid?:string; source_company?:string; source?:string; wrap_up?:string;
    traffic?:string; department?:string; channel?:string; customer_status?:string;
    customer_type?:string; remarks?:string; status?:string;
  }>({});
  const [sortField, setSortField]           = useState("date_updated");
  const [sortOrder, setSortOrder]           = useState<"asc"|"desc">("desc");
  const [exporting, setExporting]           = useState(false);
  const [progress, setProgress]             = useState(0);
  const [agents, setAgents]                 = useState<Agent[]>([]);

  /* ── PERSISTENT GLOW STATE ───────────────────────── */
  const [glowingIds, setGlowingIds] = useState<Set<string>>(() =>
    getActiveGlowIds(pruneAndRead()),
  );

  // Tick every 1 s — auto-expire glows
  useEffect(() => {
    const id = setInterval(() => {
      setGlowingIds(getActiveGlowIds(pruneAndRead()));
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  const syncGlow = useCallback(() => {
    setGlowingIds(getActiveGlowIds(pruneAndRead()));
  }, []);

  /**
   * clearGlow — called when the user clicks View History, Update, or Closed
   * on a glowing card. Immediately removes the glow and clears it from storage.
   */
  const clearGlow = useCallback((id: string) => {
    const m = readGlowMap();
    if (m[id]) {
      delete m[id];
      writeGlowMap(m);
    }
    setGlowingIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /* ── AGENTS ──────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/fetch-agent");
        if (!res.ok) throw new Error();
        setAgents(await res.json());
      } catch { setAgents([]); }
    })();
  }, []);

  /* ── EXPORT PROGRESS ─────────────────────────────── */
  useEffect(() => {
    if (!exporting) { setProgress(0); return; }
    const id = setInterval(() => setProgress(p => p >= 100 ? (clearInterval(id), 100) : p + 1), 10);
    return () => clearInterval(id);
  }, [exporting]);

  const handleFilterChange = (field: keyof typeof filters, value: string) =>
    setFilters(p => ({ ...p, [field]: value || undefined }));

  /* ── FETCH COMPANIES ─────────────────────────────── */
  const fetchCompanies = useCallback(async () => {
    setLoadingCo(true); setErrorCo(null);
    try {
      const res = await fetch("/api/com-fetch-account", {
        cache: "no-store",
        headers: { "Cache-Control":"no-store,no-cache,must-revalidate", Pragma:"no-cache", Expires:"0" },
      });
      if (!res.ok) throw new Error("Failed to fetch company data");
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (e: any) { setErrorCo(e.message || "Error"); }
    finally { setLoadingCo(false); }
  }, []);

  useEffect(() => { fetchCompanies(); }, []);

  /* ── FETCH ACTIVITIES + GLOW DETECTION ───────────── */
  const fetchActivities = useCallback(async () => {
    setLoadingAct(true); setErrorAct(null);
    try {
      const res = await fetch("/api/act-fetch-activity-role", {
        method: "GET", cache: "no-store",
        headers: { "Content-Type":"application/json", "x-user-role":role, "x-reference-id":referenceid },
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Failed"); }
      const json = await res.json();
      const incoming: Ticket[] = json.data || [];

      const prevMap  = readPrevMap();
      const glowMap  = readGlowMap();
      const now      = Date.now();
      let   dirty    = false;

      incoming.forEach(act => {
        const prev = prevMap.get(act._id);
        if (prev === undefined) {
          if (prevMap.size > 0) {
            glowMap[act._id] = { status: act.status, glowUntil: now + GLOW_DURATION };
            dirty = true;
          }
        } else if (prev !== act.status) {
          glowMap[act._id] = { status: act.status, glowUntil: now + GLOW_DURATION };
          dirty = true;
        }
      });

      if (dirty) writeGlowMap(glowMap);

      const next = new Map<string, string>();
      incoming.forEach(a => next.set(a._id, a.status));
      writePrevMap(next);

      syncGlow();
      setActivities(incoming);
    } catch (e: any) { setErrorAct(e.message || "Error"); }
    finally { setLoadingAct(false); }
  }, [role, referenceid, syncGlow]);

  useEffect(() => { fetchActivities(); }, [referenceid, fetchActivities]);

  useEffect(() => {
    const h = () => fetchActivities();
    window.addEventListener("activity-updated", h);
    return () => window.removeEventListener("activity-updated", h);
  }, [fetchActivities]);

  /* ── HELPERS ─────────────────────────────────────── */
  const isNewCompany = (d?: string) => {
    if (!d) return false;
    const t = new Date(d.replace(" ","T")).getTime();
    return !isNaN(t) && Date.now() - t <= 86_400_000;
  };
  const isDateInRange = (s: string, r: DateRange|undefined) => {
    if (!r) return true;
    const d = new Date(s); if (isNaN(d.getTime())) return false;
    const f = r.from ? new Date(r.from.getFullYear(),r.from.getMonth(),r.from.getDate(),0,0,0,0) : null;
    const t = r.to   ? new Date(r.to.getFullYear(),  r.to.getMonth(),  r.to.getDate(),  23,59,59,999) : null;
    if (f && d < f) return false;
    if (t && d > t) return false;
    return true;
  };
  const getAgentName = (id?: string|null) => {
    if (!id) return "-";
    const a = agents.find(x => x.ReferenceID === id);
    return a ? `${a.Firstname} ${a.Lastname}` : "-";
  };

  /* ── FILTERED / SORTED DATA ──────────────────────── */
  const filteredAndSortedData = useMemo(() => {
    let data = activities
      .filter(a => ["On-Progress","Closed","Endorsed","Converted into Sales"].includes(a.status))
      .filter(a => isDateInRange(a.date_created, dateCreatedFilterRange));

    if (activitySearchTerm.trim()) {
      const t = activitySearchTerm.toLowerCase();
      data = data.filter(i =>
        (i.company_name??"").toLowerCase().includes(t) ||
        (i.ticket_reference_number??"").toLowerCase().includes(t) ||
        (i.contact_person??"").toLowerCase().includes(t));
    }
    Object.entries(filters).forEach(([k,v]) => {
      if (v?.trim()) data = data.filter(i => (i as any)[k]?.toString().toLowerCase().includes(v.toLowerCase()));
    });
    return data.slice().sort((a,b) => {
      if (a.status==="Endorsed"&&b.status!=="Endorsed") return -1;
      if (a.status!=="Endorsed"&&b.status==="Endorsed") return 1;
      let av=(a as any)[sortField], bv=(b as any)[sortField];
      if (sortField==="date_created"||sortField==="date_updated") {
        av=av?new Date(av).getTime():0; bv=bv?new Date(bv).getTime():0;
      } else { av=av?.toString().toLowerCase()??""; bv=bv?.toString().toLowerCase()??""; }
      return av<bv ? (sortOrder==="asc"?-1:1) : av>bv ? (sortOrder==="asc"?1:-1) : 0;
    });
  }, [activities, activitySearchTerm, filters, sortField, sortOrder, dateCreatedFilterRange]);

  const groupedByStatus = useMemo(() => {
    const r={} as Record<StatusColumn,Ticket[]>;
    for (const s of STATUS_COLUMNS) {
      const t = columnSearch[s]?.toLowerCase()||"";
      r[s] = filteredAndSortedData.filter(a=>a.status===s).filter(i=>
        !t||i.company_name?.toLowerCase().includes(t)||
        i.ticket_reference_number?.toLowerCase().includes(t)||
        i.contact_person?.toLowerCase().includes(t));
    }
    return r;
  }, [filteredAndSortedData, columnSearch]);

  const paginatedByStatus = useMemo(() => {
    const r={} as Record<StatusColumn,Ticket[]>;
    for (const s of STATUS_COLUMNS) {
      const p=columnCurrentPage[s], st=(p-1)*COLUMN_ITEMS_PER_PAGE;
      r[s]=groupedByStatus[s].slice(st,st+COLUMN_ITEMS_PER_PAGE);
    }
    return r;
  }, [groupedByStatus, columnCurrentPage]);

  const totalPagesByStatus = useMemo(() => {
    const r={} as Record<StatusColumn,number>;
    for (const s of STATUS_COLUMNS) r[s]=Math.max(1,Math.ceil(groupedByStatus[s].length/COLUMN_ITEMS_PER_PAGE));
    return r;
  }, [groupedByStatus]);

  const goToPage = (s: StatusColumn, p: number) =>
    setColPage(prev => ({ ...prev, [s]: Math.min(Math.max(1,p), totalPagesByStatus[s]) }));

  useEffect(() => {
    setColPage({ "On-Progress":1, Closed:1, Endorsed:1, "Converted into Sales":1 });
  }, [activitySearchTerm, filters, dateCreatedFilterRange, columnSearch]);

  /* ── ACTIONS ─────────────────────────────────────── */
  const openDoneDialog = (id: string) => {
    if (!id) { toast.error("Invalid ID"); return; }
    setSelActId(id);
    setDialogOpen(true);
  };

  const handleConfirmDone = async (payload: {
    close_reason:string; counter_offer:string; client_specs:string;
    tsm_acknowledge_date:string; tsm_handling_time:string;
    tsa_acknowledge_date:string; tsa_handling_time:string;
  }) => {
    try {
      setUpdatingId(selectedActivityId); setDialogOpen(false);
      if (!activities.find(a=>a._id===selectedActivityId)) { toast.error("Not found."); setUpdatingId(null); return; }
      const res = await fetch("/api/act-update-status?role="+encodeURIComponent(role), {
        method:"PUT", headers:{"Content-Type":"application/json"}, cache:"no-store",
        body: JSON.stringify({ _id:selectedActivityId, status:"Closed", ...payload }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(`Failed: ${result.error||"Unknown"}`); setUpdatingId(null); return; }
      await fetchActivities(); toast.success("Marked as Done.");
    } catch { toast.error("Error."); }
    finally { setUpdatingId(null); setSelActId(null); }
  };

  const handleAddActivity = async (company: Company) => {
    const key = company.account_reference_number;
    if (addingLock.has(key)) return;
    if (!referenceid) { toast.error("Missing reference ID"); return; }
    setAddingLock(p=>new Set(p).add(key)); setAddingAccount(key);
    try {
      const res = await fetch("/api/act-save-account", {
        method:"POST", headers:{"Content-Type":"application/json"}, cache:"no-store",
        body: JSON.stringify({
          referenceid, account_reference_number:company.account_reference_number,
          status:"On-Progress", company_name:company.company_name,
          contact_person:company.contact_person, contact_number:company.contact_number,
          email_address:company.email_address, type_client:company.type_client,
          address:company.address,
          activity_reference_number: company.company_name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)+`-REG-${Date.now()}`,
        }),
      });
      const j = await res.json();
      if (!res.ok) { toast.error(`Failed: ${j.error||"Unknown"}`); return; }
      toast.success("Activity added."); await fetchActivities();
    } catch { toast.error("Error saving."); }
    finally {
      setAddingLock(p=>{ const c=new Set(p); c.delete(key); return c; });
      setAddingAccount(null);
    }
  };

  const toggleSelect = (id: string) =>
    setSelDel(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  const handleDeleteConfirm = async () => {
    if (!selectedToDelete.length) { toast.error("Nothing selected."); return; }
    try {
      setDeleting(true);
      const res = await fetch("/api/act-delete-activity", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ids:selectedToDelete }),
      });
      const r = await res.json();
      if (!res.ok) { toast.error(r.error||"Failed."); return; }
      toast.success("Deleted."); setSelDel([]); setShowCB(false); await fetchActivities();
    } catch { toast.error("Error."); }
    finally { setDeleting(false); setShowDC(false); }
  };

  async function handleExportCsv(data: MergedActivity[]) {
    if (!data.length) { toast.error("No data."); return; }
    try {
      setExporting(true); await new Promise(r=>setTimeout(r,1000));
      const headers=["CSR Agent","Company Name","Status","Date Created","Date Updated","Contact Person","Contact Number","Email Address","Gender","Ticket Received","Ticket Endorsed","Inquiry Received","Response to Inquiry","Handling CSR","Traffic","Source Company","Channel","Wrap Up","Source","Customer Type","Customer Status","Department","Territory Sales Manager","TSM Acknowledge Time","TSM Handling Time","Territory Sales Associate","TSA Acknowledge Time","TSA Handling Time","Remarks","Inquiry","Item Code","Item Description","PO Number","SO Date","SO Number","SO Amount","Qty Sold","Quotation Number","Quotation Amount","Payment Terms","PO Source","Payment Date","Delivery Date","Close Reason"];
      const fd=(s?:string)=>{if(!s)return"-";const d=new Date(s);return isNaN(d.getTime())?"-":d.toLocaleString();};
      const rows=data.map(i=>[getAgentName(i.referenceid),i.company_name,i.status,fd(i.date_created),fd(i.date_updated),i.contact_person||"-",i.contact_number||"-",i.email_address||"-",i.gender||"-",fd(i.ticket_received),fd(i.ticket_endorsed),fd(i.inquiry_received),fd(i.response_to_inquiry),i.handling_csr||"-",i.traffic||"-",i.source_company||"-",i.channel||"-",i.wrap_up||"-",i.source||"-",i.customer_type||"-",i.customer_status||"-",i.department||"-",getAgentName(i.manager),fd(i.tsm_acknowledge_date),fd(i.tsm_handling_time),getAgentName(i.agent),fd(i.tsa_acknowledge_date),fd(i.tsa_handling_time),i.remarks||"-",i.inquiry||"-",i.item_code||"-",i.item_description||"-",i.po_number||"-",fd(i.so_date),i.so_number||"-",i.so_amount||"-",i.qty_sold||"-",i.quotation_number||"-",i.quotation_amount||"-",i.payment_terms||"-",i.po_source||"-",fd(i.payment_date),fd(i.delivery_date),i.close_reason||"-"]);
      const csv=[headers.join(","),...rows.map(r=>r.map(f=>`"${String(f).replace(/"/g,'""')}"`).join(","))].join("\n");
      const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
      const url=URL.createObjectURL(blob); const a=document.createElement("a");
      a.href=url; a.setAttribute("download",`TICKETS_${Date.now()}.csv`);
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Downloaded.");
    } catch(e){ toast.error("Export failed."); console.error(e); }
    finally { setExporting(false); }
  }

  const isLoading = loadingCompanies || loadingActivities;
  const error     = errorCompanies   || errorActivities;
  const normalize = (s:string) => s.toLowerCase().replace(/[_\s]+/g," ").trim();
  const selectedActivity = activities.find(a=>a._id===selectedActivityId);

  const filteredCompanies = useMemo(() => companies
    .filter(c=>{
      if(["Pending","Transferred","Remove"].includes(c.status)) return false;
      const t=normalize(searchTerm); if(!t) return true;
      return [c.company_name,c.email_address,c.contact_number,c.contact_person]
        .map(s=>normalize(s||"")).some(f=>f.includes(t));
    })
    .sort((a,b)=>{
      const an=isNewCompany(a.date_created), bn=isNewCompany(b.date_created);
      if(an&&!bn) return -1; if(!an&&bn) return 1;
      return new Date(b.date_created??0).getTime()-new Date(a.date_created??0).getTime();
    }), [companies, searchTerm]);

  const displayedCompanies = useMemo(
    ()=>filteredCompanies.filter(c=>c.account_reference_number!==addingAccount).slice(0,20),
    [filteredCompanies,addingAccount]);

  /* ── RENDER ───────────────────────────────────────── */
  if (isLoading) return <div className="flex justify-center items-center h-40"><Spinner className="size-8"/></div>;
  if (error) return (
    <Alert variant="destructive" className="flex flex-col space-y-4 p-4 text-xs">
      <div className="flex items-center space-x-3"><AlertCircleIcon className="h-6 w-6 text-red-600"/>
        <div><AlertTitle>No Data Found or No Network Connection</AlertTitle>
          <AlertDescription className="text-xs">Please check your connection or try again later.</AlertDescription></div></div>
      <div className="flex items-center space-x-3"><CheckCircle2Icon className="h-6 w-6 text-green-600"/>
        <div><AlertTitle className="text-black">Create New Data</AlertTitle>
          <AlertDescription className="text-xs">You can start by adding new entries.</AlertDescription></div></div>
    </Alert>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4">

      {/* ── LEFT: COMPANIES ─────────────────────────── */}
      <Card className="w-full md:w-1/3 p-3 rounded-lg flex flex-col">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Companies</CardTitle>
            <AddCompanyModal referenceid={referenceid} onCreated={fetchCompanies}/>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-grow overflow-hidden">
          <Input type="search" placeholder="Search company, email, contact, person..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          {displayedCompanies.length===0
            ? <div className="text-muted-foreground text-sm p-3 border rounded-lg">No company info available.</div>
            : (
              <Accordion type="multiple" className="overflow-auto space-y-2 p-2 max-h-[700px]">
                {displayedCompanies.map(c=>{
                  const ag=agents.find(a=>a.ReferenceID===c.referenceid);
                  const fullName=ag?`${ag.Firstname} ${ag.Lastname}`:"(Unknown Agent)";
                  return (
                    <AccordionItem key={c.account_reference_number} value={c.account_reference_number}>
                      <div className="flex items-center justify-between text-xs font-semibold gap-2 px-4 py-2">
                        <AccordionTrigger className="text-xs font-semibold flex-1 text-left">
                          <span className="flex items-center gap-2 flex-wrap" style={{minWidth:0}}>
                            <span className="break-words whitespace-normal">{c.company_name?.trim()?c.company_name:c.contact_person}</span>
                            {isNewCompany(c.date_created)&&(
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300 text-[9px] font-semibold">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                                </span>NEW
                              </span>
                            )}
                          </span>
                        </AccordionTrigger>
                        <Button variant="outline" disabled={addingAccount===c.account_reference_number||addingLock.has(c.account_reference_number)} onClick={e=>{e.stopPropagation();handleAddActivity(c);}} className="text-xs px-3 py-1 cursor-pointer">
                          {addingAccount===c.account_reference_number?"Adding...":"Add"}
                        </Button>
                      </div>
                      <AccordionContent className="text-xs px-4 pb-2 pt-0">
                        <p><strong>Contact Number:</strong> {c.contact_number||"-"}</p>
                        <p><strong>Email Address:</strong> {c.email_address||"-"}</p>
                        {!(!c.company_name?.trim()&&c.contact_person?.trim())&&<p className="capitalize"><strong>Contact Person:</strong> {c.contact_person||"-"}</p>}
                        <p className="mb-2"><strong>Type Client:</strong> {c.type_client||"-"}</p>
                        <p className="uppercase"><strong>Current Handler: <Badge>{fullName}</Badge></strong></p>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
        </CardContent>
      </Card>

      {/* ── RIGHT: ACTIVITIES ───────────────────────── */}
      <Card className="w-full md:w-2/3 p-4 rounded-xl flex flex-col">
        <div className="mb-2 text-xs font-bold">Total Activities: {filteredAndSortedData.length}</div>
        <div className="flex mb-3 space-x-2 items-center flex-wrap gap-y-2">
          <input type="search" placeholder="Search activities by company, status, reference number..." value={activitySearchTerm} onChange={e=>setActSearch(e.target.value)} className="flex-grow px-3 py-2 border rounded-md text-sm"/>
          <Button variant="outline" disabled={!filteredAndSortedData.length} onClick={()=>handleExportCsv(filteredAndSortedData)} className="bg-green-500 text-white hover:bg-green-600 cursor-pointer">Download CSV</Button>
          <Button className="cursor-pointer" onClick={()=>setFilterOpen(true)}>Filter</Button>
          <Button variant={showCheckboxes?"secondary":"outline"} disabled={!filteredAndSortedData.length} onClick={()=>{if(showCheckboxes){setShowCB(false);setSelDel([]);}else setShowCB(true);}} className="whitespace-nowrap cursor-pointer">
            {showCheckboxes?"Cancel":"Delete"}
          </Button>
          {showCheckboxes&&selectedToDelete.length>0&&(
            <Button variant="destructive" onClick={()=>setShowDC(true)}>Delete Selected ({selectedToDelete.length})</Button>
          )}
        </div>

        {/* 4 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STATUS_COLUMNS.map(status=>{
            const columnItems  = paginatedByStatus[status];
            const totalItems   = groupedByStatus[status].length;
            const currentPage  = columnCurrentPage[status];
            const totalPages   = totalPagesByStatus[status];

            return (
              <div key={status} className="flex flex-col border rounded-xl overflow-hidden" style={{height:"680px"}}>

                {/* HEADER */}
                <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${STATUS_HEADER_STYLES[status]}`}>
                  <span className="text-xs font-bold truncate">{status}</span>
                  <span className="text-[10px] font-semibold bg-white/70 border px-1.5 py-0.5 rounded-full ml-1 shrink-0">{totalItems}</span>
                </div>

                {/* COLUMN SEARCH */}
                <div className="px-2 py-1.5 border-b bg-white shrink-0">
                  <input type="text" placeholder="Search..." className="w-full px-2 py-1 text-xs border rounded" value={columnSearch[status]} onChange={e=>{setColSearch(p=>({...p,[status]:e.target.value}));setColPage(p=>({...p,[status]:1}));}}/>
                </div>

                {/* SCROLLABLE CARDS */}
                <div className="overflow-y-auto flex-1 bg-gray-50/50 custom-scrollbar">
                  {columnItems.length===0
                    ? <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">No records found.</div>
                    : (
                      <div className="p-2 space-y-2">
                        {columnItems.map((item,index)=>{
                          const isChecked  = selectedToDelete.includes(item._id);
                          const isGlowing  = glowingIds.has(item._id);

                          const cardStyle: React.CSSProperties = isGlowing ? {
                            "--glow-color": GLOW_COLOR[item.status] ?? GLOW_COLOR["On-Progress"],
                            borderColor:    GLOW_BORDER[item.status],
                            backgroundColor: GLOW_BG[item.status],
                            position: "relative",
                            zIndex: 2,
                          } as React.CSSProperties : {};

                          return (
                            <div
                              key={`${item._id}-${index}`}
                              style={cardStyle}
                              className={`bg-white border rounded-lg p-2.5 flex items-start justify-between gap-2 shadow-sm hover:shadow-md transition-shadow${isGlowing?" ticket-glow":""}`}
                            >
                              {/* LEFT */}
                              <div className="flex-1 text-xs min-w-0">
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  {showCheckboxes&&(
                                    <input type="checkbox" checked={isChecked} onChange={()=>toggleSelect(item._id)} className="w-3.5 h-3.5 cursor-pointer shrink-0"/>
                                  )}
                                  <span className="font-semibold capitalize truncate">
                                    {item.company_name==="Unknown Company"?item.contact_person||"Unknown Company":item.company_name}
                                  </span>

                                  {/* UPDATED badge — visible only while glowing */}
                                  {isGlowing&&(
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0"
                                      style={{
                                        backgroundColor: BADGE_BG[item.status]??BADGE_BG["On-Progress"],
                                        color:           BADGE_FG[item.status]??BADGE_FG["On-Progress"],
                                        borderColor:     GLOW_BORDER[item.status],
                                      }}>
                                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{backgroundColor:PING_COLOR[item.status]}}/>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{backgroundColor:PING_COLOR[item.status]}}/>
                                      </span>
                                      UPDATED
                                    </span>
                                  )}
                                </div>

                                {item.contact_person&&<div className="text-gray-500 truncate mb-1">{item.contact_person}</div>}
                                <div className="text-muted-foreground space-y-0.5">
                                  <div className="truncate">Updated: {new Date(item.date_updated).toLocaleString()}</div>
                                  <div className="text-[10px] text-slate-400 truncate">Created: {new Date(item.date_created).toLocaleString()}</div>
                                </div>
                                <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[8px] font-semibold ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                                  <span className="text-[10px] text-gray-400">–</span>
                                  <span className="text-[10px] capitalize font-semibold truncate">{getAgentName(item.referenceid)}</span>
                                </div>
                              </div>

                              {/* RIGHT ACTIONS
                                  — each button calls clearGlow(item._id) on click
                                    so the card stops glowing the moment it's acknowledged
                              */}
                              {!showCheckboxes&&(
                                <div className="flex flex-col gap-1 shrink-0">

                                  {/* VIEW HISTORY — wrap with a div to intercept click */}
                                  <div onClick={() => clearGlow(item._id)}>
                                    <TicketHistoryDialog item={item}/>
                                  </div>

                                  {/* UPDATE */}
                                  <div onClick={() => clearGlow(item._id)}>
                                    <UpdateTicketDialog
                                      {...item}
                                      onCreated={async()=>{await fetchActivities();await fetchCompanies();}}
                                    />
                                  </div>

                                  {/* CLOSED */}
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={updatingId===item._id}
                                    onClick={() => {
                                      clearGlow(item._id);
                                      openDoneDialog(item._id);
                                    }}
                                    className="text-xs"
                                  >
                                    {updatingId===item._id?"Updating...":"Closed"}
                                  </Button>

                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>

                {/* PAGINATION */}
                <div className="border-t bg-white px-2 py-2 shrink-0">
                  {totalPages>1?(
                    <>
                      <div className="flex items-center justify-between gap-1 text-xs">
                        <button onClick={()=>goToPage(status,currentPage-1)} disabled={currentPage===1} className="px-2 py-0.5 rounded border disabled:opacity-40 hover:bg-gray-100 cursor-pointer text-xs">‹ Prev</button>
                        <div className="flex items-center gap-0.5">
                          {currentPage>2&&(<><button onClick={()=>goToPage(status,1)} className="px-1.5 py-0.5 rounded border hover:bg-gray-100 cursor-pointer text-xs">1</button>{currentPage>3&&<span className="text-gray-400 text-xs">…</span>}</>)}
                          {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p>=currentPage-1&&p<=currentPage+1).map(p=>(
                            <button key={p} onClick={()=>goToPage(status,p)} className={`px-1.5 py-0.5 rounded border cursor-pointer text-xs ${p===currentPage?"bg-blue-600 text-white border-blue-600":"hover:bg-gray-100"}`}>{p}</button>
                          ))}
                          {currentPage<totalPages-1&&(<>{currentPage<totalPages-2&&<span className="text-gray-400 text-xs">…</span>}<button onClick={()=>goToPage(status,totalPages)} className="px-1.5 py-0.5 rounded border hover:bg-gray-100 cursor-pointer text-xs">{totalPages}</button></>)}
                        </div>
                        <button onClick={()=>goToPage(status,currentPage+1)} disabled={currentPage===totalPages} className="px-2 py-0.5 rounded border disabled:opacity-40 hover:bg-gray-100 cursor-pointer text-xs">Next ›</button>
                      </div>
                      <div className="text-center text-[10px] text-gray-400 mt-0.5">Page {currentPage} of {totalPages} · {totalItems} total</div>
                    </>
                  ):(
                    <div className="text-center text-[10px] text-gray-400">{totalItems} {totalItems===1?"record":"records"}</div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        <ActDeleteDialog open={showDeleteConfirm} onOpenChange={setShowDC} selectedToDeleteCount={selectedToDelete.length} deleting={deleting} onConfirm={handleDeleteConfirm}/>
        <ActFilterDialog filterDialogOpen={filterDialogOpen} setFilterDialogOpen={setFilterOpen} filters={filters} handleFilterChange={handleFilterChange} sortField={sortField} setSortField={setSortField} sortOrder={sortOrder} setSortOrder={setSortOrder} mergedData={filteredAndSortedData} sortableFields={["source_company","source","wrap_up","traffic","department","channel","customer_status","customer_type","remarks","status","date_created","date_updated"]} agents={agents}/>
      </Card>

      <DoneDialog open={dialogOpen} onOpenChange={setDialogOpen} onConfirm={handleConfirmDone} loading={updatingId===selectedActivityId} close_reason={selectedActivity?.close_reason} counter_offer={selectedActivity?.counter_offer} client_specs={selectedActivity?.client_specs} tsm_acknowledge_date={selectedActivity?.tsm_acknowledge_date} tsm_handling_time={selectedActivity?.tsm_handling_time} tsa_acknowledge_date={selectedActivity?.tsa_acknowledge_date} tsa_handling_time={selectedActivity?.tsa_handling_time}/>

      {exporting&&(
        <div className="fixed top-4 right-4 z-50 w-full max-w-md flex flex-col gap-4 rounded-xl shadow-lg bg-white p-4" style={{borderRadius:"1rem"}}>
          <Item variant="outline">
            <ItemMedia variant="icon"><Spinner/></ItemMedia>
            <ItemContent><ItemTitle>Downloading...</ItemTitle><ItemDescription>{filteredAndSortedData.length} records</ItemDescription></ItemContent>
            <ItemActions className="hidden sm:flex"><Button variant="outline" size="sm" disabled>Cancel</Button></ItemActions>
            <ItemFooter><Progress value={progress}/></ItemFooter>
          </Item>
        </div>
      )}
    </div>
  );
};
