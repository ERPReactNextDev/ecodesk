"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  company_name: string;
  contact_number: string;
  type_client: string;
  contact_person: string;
  email_address: string;
  address: string;
}

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
  department_head?: string;

  company_name: string;
  contact_number: string;
  type_client: string;
  email_address: string;
  contact_person: string;
  address: string;

  item_code?: string;
  item_description?: string;
  po_number?: string;
  so_date?: string;
  so_number?: string;
  so_amount?: string;
  qty_sold?: string;
  quotation_number?: string;
  quotation_amount?: string;
  payment_terms?: string;
  po_source?: string;
  payment_date?: string;
  delivery_date?: string;

  referenceid: string;
  activity_reference_number: string;
  account_reference_number: string;
  date_updated: string;
  date_created: string;

  close_reason?: string;
  counter_offer?: string;
  client_specs?: string;

  tsm_acknowledge_date?: string;
  tsa_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_handling_time?: string;
  hr_acknowledge_date?: string;
}

interface TicketProps {
  referenceid: string;
  role: string;
  dateCreatedFilterRange: DateRange | undefined;
  setDateCreatedFilterRangeAction: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
}

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

const COLUMN_ITEMS_PER_PAGE = 10;

const STATUS_COLUMNS = [
  "On-Progress",
  "Closed",
  "Endorsed",
  "Converted into Sales",
] as const;

type StatusColumn = (typeof STATUS_COLUMNS)[number];

const STATUS_STYLES: Record<string, string> = {
  "On-Progress": "bg-blue-100 text-blue-700 border-blue-300",
  Closed: "bg-gray-200 text-gray-700 border-gray-300",
  Endorsed: "bg-purple-100 text-purple-700 border-purple-300",
  "Converted into Sales": "bg-green-100 text-green-700 border-green-300",
};

const STATUS_HEADER_STYLES: Record<string, string> = {
  "On-Progress": "bg-blue-50 border-blue-200 text-blue-800",
  Closed: "bg-gray-50 border-gray-200 text-gray-700",
  Endorsed: "bg-purple-50 border-purple-200 text-purple-800",
  "Converted into Sales": "bg-green-50 border-green-200 text-green-800",
};

export const Ticket: React.FC<TicketProps> = ({
  referenceid,
  role,
  dateCreatedFilterRange,
  setDateCreatedFilterRangeAction,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activities, setActivities] = useState<Ticket[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [errorCompanies, setErrorCompanies] = useState<string | null>(null);
  const [errorActivities, setErrorActivities] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const [addingLock, setAddingLock] = useState<Set<string>>(new Set());
  const [addingAccount, setAddingAccount] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [activitySearchTerm, setActivitySearchTerm] = useState("");
  const [columnSearch, setColumnSearch] = useState<Record<StatusColumn, string>>({
    "On-Progress": "",
    "Closed": "",
    "Endorsed": "",
    "Converted into Sales": "",
  });

  const [columnCurrentPage, setColumnCurrentPage] = useState<Record<StatusColumn, number>>({
    "On-Progress": 1,
    "Closed": 1,
    "Endorsed": 1,
    "Converted into Sales": 1,
  });

  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [filters, setFilters] = useState<{
    referenceid?: string;
    source_company?: string;
    source?: string;
    wrap_up?: string;
    traffic?: string;
    department?: string;
    channel?: string;
    customer_status?: string;
    customer_type?: string;
    remarks?: string;
    status?: string;
  }>({});

  const isNewCompany = (dateCreated?: string) => {
    if (!dateCreated) return false;
    const created = new Date(dateCreated.replace(" ", "T"));
    if (isNaN(created.getTime())) return false;
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return diffMs <= ONE_DAY_MS;
  };

  const sortableFields = [
    "source_company", "source", "wrap_up", "traffic", "department",
    "channel", "customer_status", "customer_type", "remarks", "status",
    "date_created", "date_updated",
  ];
  const [sortField, setSortField] = useState<string>("date_updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      setAgentsLoading(true);
      try {
        const res = await fetch("/api/fetch-agent");
        if (!res.ok) throw new Error("Failed to fetch agents");
        const data = await res.json();
        setAgents(data);
      } catch (err) {
        console.error(err);
        setAgents([]);
      } finally {
        setAgentsLoading(false);
      }
    }
    fetchAgents();
  }, []);

  useEffect(() => {
    if (!exporting) { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 1;
      });
    }, 10);
    return () => clearInterval(interval);
  }, [exporting]);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    setErrorCompanies(null);
    try {
      const res = await fetch("/api/com-fetch-account", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch company data");
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (err: any) {
      setErrorCompanies(err.message || "Error fetching company data");
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    setErrorActivities(null);
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
    } catch (error: any) {
      setErrorActivities(error.message || "Error fetching activities");
    } finally {
      setLoadingActivities(false);
    }
  }, [role, referenceid]);

  useEffect(() => { fetchActivities(); }, [referenceid, fetchActivities]);

  useEffect(() => {
    const handleRealtimeUpdate = () => { fetchActivities(); };
    window.addEventListener("activity-updated", handleRealtimeUpdate);
    return () => { window.removeEventListener("activity-updated", handleRealtimeUpdate); };
  }, [fetchActivities]);

  const isDateInRange = (dateStr: string, range: DateRange | undefined) => {
    if (!range) return true;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const { from, to } = range;
    const fromDate = from ? new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0) : null;
    const toDate = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999) : null;
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  };

  const allowedStatuses = ["On-Progress", "Closed", "Endorsed", "Converted into Sales"];

  const filteredAndSortedData = useMemo(() => {
    let data = activities
      .filter((a) => allowedStatuses.includes(a.status))
      .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange));

    if (activitySearchTerm.trim() !== "") {
      const term = activitySearchTerm.toLowerCase();
      data = data.filter((item) =>
        (item.company_name ?? "").toLowerCase().includes(term) ||
        (item.ticket_reference_number ?? "").toLowerCase().includes(term) ||
        (item.contact_person ?? "").toLowerCase().includes(term)
      );
    }

    Object.entries(filters).forEach(([key, val]) => {
      if (val && val.trim() !== "") {
        data = data.filter((item) =>
          (item as any)[key]?.toString().toLowerCase().includes(val.toLowerCase())
        );
      }
    });

    data = data.slice().sort((a, b) => {
      const aIsEndorsed = a.status === "Endorsed";
      const bIsEndorsed = b.status === "Endorsed";
      if (aIsEndorsed && !bIsEndorsed) return -1;
      if (!aIsEndorsed && bIsEndorsed) return 1;

      let aVal = (a as any)[sortField];
      let bVal = (b as any)[sortField];
      if (sortField === "date_created" || sortField === "date_updated") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = aVal ? aVal.toString().toLowerCase() : "";
        bVal = bVal ? bVal.toString().toLowerCase() : "";
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [activities, activitySearchTerm, filters, sortField, sortOrder, dateCreatedFilterRange]);

  const groupedByStatus = useMemo(() => {
    const result = {} as Record<StatusColumn, Ticket[]>;
    for (const status of STATUS_COLUMNS) {
      const term = columnSearch[status]?.toLowerCase() || "";
      result[status] = filteredAndSortedData
        .filter((a) => a.status === status)
        .filter((item) => {
          if (!term) return true;
          return (
            item.company_name?.toLowerCase().includes(term) ||
            item.ticket_reference_number?.toLowerCase().includes(term) ||
            item.contact_person?.toLowerCase().includes(term)
          );
        });
    }
    return result;
  }, [filteredAndSortedData, columnSearch]);

  const paginatedByStatus = useMemo(() => {
    const result = {} as Record<StatusColumn, Ticket[]>;
    for (const status of STATUS_COLUMNS) {
      const page = columnCurrentPage[status];
      const start = (page - 1) * COLUMN_ITEMS_PER_PAGE;
      result[status] = groupedByStatus[status].slice(start, start + COLUMN_ITEMS_PER_PAGE);
    }
    return result;
  }, [groupedByStatus, columnCurrentPage]);

  const totalPagesByStatus = useMemo(() => {
    const result = {} as Record<StatusColumn, number>;
    for (const status of STATUS_COLUMNS) {
      result[status] = Math.max(1, Math.ceil(groupedByStatus[status].length / COLUMN_ITEMS_PER_PAGE));
    }
    return result;
  }, [groupedByStatus]);

  const goToColumnPage = (status: StatusColumn, page: number) => {
    const total = totalPagesByStatus[status];
    const clamped = Math.min(Math.max(1, page), total);
    setColumnCurrentPage((prev) => ({ ...prev, [status]: clamped }));
  };

  useEffect(() => {
    setColumnCurrentPage({
      "On-Progress": 1,
      "Closed": 1,
      "Endorsed": 1,
      "Converted into Sales": 1,
    });
  }, [activitySearchTerm, filters, dateCreatedFilterRange, columnSearch]);

  const isLoading = loadingCompanies || loadingActivities;
  const error = errorCompanies || errorActivities;

  const excludedCompanyStatuses = ["Pending", "Transferred", "Remove"];
  const normalize = (str: string) => str.toLowerCase().replace(/[_\s]+/g, " ").trim();

  const filteredCompanies = companies
    .filter((c) => {
      if (excludedCompanyStatuses.includes(c.status)) return false;
      const term = normalize(searchTerm);
      if (!term) return true;
      const fields = [
        normalize(c.company_name || ""),
        normalize(c.email_address || ""),
        normalize(c.contact_number || ""),
        normalize(c.contact_person || ""),
      ];
      return fields.some((field) => field.includes(term));
    })
    .sort((a, b) => {
      const term = normalize(searchTerm);
      if (!term) return 0;
      const score = (company: Company) => {
        const fields = [
          normalize(company.company_name || ""),
          normalize(company.email_address || ""),
          normalize(company.contact_number || ""),
          normalize(company.contact_person || ""),
        ];
        let bestScore = 3;
        fields.forEach((field) => {
          if (field === term) bestScore = Math.min(bestScore, 0);
          else if (field.startsWith(term)) bestScore = Math.min(bestScore, 1);
          else if (field.includes(term)) bestScore = Math.min(bestScore, 2);
        });
        return bestScore;
      };
      return score(a) - score(b);
    })
    .sort((a, b) => {
      const aIsNew = isNewCompany((a as any).date_created);
      const bIsNew = isNewCompany((b as any).date_created);
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      const aTime = new Date((a as any).date_created ?? 0).getTime();
      const bTime = new Date((b as any).date_created ?? 0).getTime();
      return bTime - aTime;
    });

  const MAX_DISPLAY = 20;

  const displayedCompanies = useMemo(() => {
    return filteredCompanies
      .filter((c) => c.account_reference_number !== addingAccount)
      .slice(0, MAX_DISPLAY);
  }, [filteredCompanies, addingAccount]);

  function generateActivityReferenceNumber(companyName: string): string {
    const initials = companyName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const region = "REG";
    const timestamp = Date.now();
    return `${initials}-${region}-${timestamp}`;
  }

  const openDoneDialog = (_id: string) => {
    if (!_id) { toast.error("Invalid activity ID"); return; }
    setSelectedActivityId(_id);
    setDialogOpen(true);
  };

  const handleConfirmDone = async (payload: {
    close_reason: string;
    counter_offer: string;
    client_specs: string;
    tsm_acknowledge_date: string;
    tsm_handling_time: string;
    tsa_acknowledge_date: string;
    tsa_handling_time: string;
  }) => {
    try {
      setUpdatingId(selectedActivityId);
      setDialogOpen(false);
      const activityToUpdate = activities.find((a) => a._id === selectedActivityId);
      if (!activityToUpdate) {
        toast.error("Activity not found in current data.");
        setUpdatingId(null);
        return;
      }
      const updatedActivity = { _id: selectedActivityId, status: "Closed", ...payload };
      const res = await fetch("/api/act-update-status?role=" + encodeURIComponent(role), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedActivity),
        cache: "no-store",
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(`Failed to update status: ${result.error || "Unknown error"}`);
        setUpdatingId(null);
        return;
      }
      await fetchActivities();
      toast.success("Transaction marked as Done.");
    } catch {
      toast.error("An error occurred while updating status.");
    } finally {
      setUpdatingId(null);
      setSelectedActivityId(null);
    }
  };

  const handleAddActivity = async (company: Company) => {
    const key = company.account_reference_number;
    if (addingLock.has(key)) return;
    if (!referenceid) { toast.error("Missing reference ID"); return; }
    setAddingLock((prev) => new Set(prev).add(key));
    setAddingAccount(key);
    const payload = {
      referenceid,
      account_reference_number: company.account_reference_number,
      status: "On-Progress",
      company_name: company.company_name,
      contact_person: company.contact_person,
      contact_number: company.contact_number,
      email_address: company.email_address,
      type_client: company.type_client,
      address: company.address,
      activity_reference_number: generateActivityReferenceNumber(company.company_name),
    };
    try {
      const res = await fetch("/api/act-save-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(`Failed to save activity: ${json.error || "Unknown error"}`);
        return;
      }
      toast.success("Activity added.");
      await fetchActivities();
    } catch {
      toast.error("Error saving activity");
    } finally {
      setAddingLock((prev) => { const copy = new Set(prev); copy.delete(key); return copy; });
      setAddingAccount(null);
    }
  };

  const selectedActivity = activities.find((a) => a._id === selectedActivityId);

  const toggleSelect = (id: string) => {
    setSelectedToDelete((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteConfirm = async () => {
    if (selectedToDelete.length === 0) { toast.error("No activity selected."); return; }
    try {
      setDeleting(true);
      const res = await fetch("/api/act-delete-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedToDelete }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Failed to delete activities."); setDeleting(false); return; }
      toast.success("Selected activities deleted.");
      setSelectedToDelete([]);
      setShowCheckboxes(false);
      await fetchActivities();
    } catch { toast.error("Error deleting activities."); }
    finally { setDeleting(false); setShowDeleteConfirm(false); }
  };

  async function handleExportCsv(data: MergedActivity[]) {
    if (!data.length) { toast.error("No data to export."); return; }
    try {
      setExporting(true);
      await new Promise((r) => setTimeout(r, 1000));
      const headers = [
        "CSR Agent", "Company Name", "Status", "Date Created", "Date Updated",
        "Contact Person", "Contact Number", "Email Address", "Gender",
        "Ticket Received", "Ticket Endorsed", "Inquiry Received", "Response to Inquiry",
        "Handling CSR", "Traffic", "Source Company", "Channel", "Wrap Up", "Source",
        "Customer Type", "Customer Status", "Department", "Territory Sales Manager",
        "TSM Acknowledge Time", "TSM Handling Time", "Territory Sales Associate",
        "TSA Acknowledge Time", "TSA Handling Time", "Remarks", "Inquiry",
        "Item Code", "Item Description", "PO Number", "SO Date", "SO Number",
        "SO Amount", "Qty Sold", "Quotation Number", "Quotation Amount",
        "Payment Terms", "PO Source", "Payment Date", "Delivery Date", "Close Reason",
      ];
      const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "-" : d.toLocaleString();
      };
      const rows = data.map((item: MergedActivity) => [
        getAgentNameByReferenceID(item.referenceid), item.company_name, item.status,
        formatDate(item.date_created), formatDate(item.date_updated),
        item.contact_person || "-", item.contact_number || "-", item.email_address || "-",
        item.gender || "-", formatDate(item.ticket_received), formatDate(item.ticket_endorsed),
        formatDate(item.inquiry_received), formatDate(item.response_to_inquiry),
        item.handling_csr || "-", item.traffic || "-", item.source_company || "-",
        item.channel || "-", item.wrap_up || "-", item.source || "-",
        item.customer_type || "-", item.customer_status || "-", item.department || "-",
        getAgentNameByReferenceID(item.manager), formatDate(item.tsm_acknowledge_date),
        formatDate(item.tsm_handling_time), getAgentNameByReferenceID(item.agent),
        formatDate(item.tsa_acknowledge_date), formatDate(item.tsa_handling_time),
        item.remarks || "-", item.inquiry || "-", item.item_code || "-",
        item.item_description || "-", item.po_number || "-", formatDate(item.so_date),
        item.so_number || "-", item.so_amount || "-", item.qty_sold || "-",
        item.quotation_number || "-", item.quotation_amount || "-",
        item.payment_terms || "-", item.po_source || "-",
        formatDate(item.payment_date), formatDate(item.delivery_date), item.close_reason || "-",
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `TICKETS_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV file downloaded.");
    } catch (error) {
      toast.error("Failed to export CSV.");
      console.error(error);
    } finally { setExporting(false); }
  }

  const getAgentNameByReferenceID = (refId: string | null | undefined): string => {
    if (!refId) return "-";
    const agent = agents.find((a) => a.ReferenceID === refId);
    return agent ? `${agent.Firstname} ${agent.Lastname}` : "-";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="flex flex-col space-y-4 p-4 text-xs">
        <div className="flex items-center space-x-3">
          <AlertCircleIcon className="h-6 w-6 text-red-600" />
          <div>
            <AlertTitle>No Data Found or No Network Connection</AlertTitle>
            <AlertDescription className="text-xs">
              Please check your internet connection or try again later.
            </AlertDescription>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <CheckCircle2Icon className="h-6 w-6 text-green-600" />
          <div>
            <AlertTitle className="text-black">Create New Data</AlertTitle>
            <AlertDescription className="text-xs">
              You can start by adding new entries to populate your database.
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* LEFT SIDE — COMPANIES */}
      <Card className="w-full md:w-1/3 p-3 rounded-lg flex flex-col">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Companies</CardTitle>
            <AddCompanyModal referenceid={referenceid} onCreated={fetchCompanies} />
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col flex-grow overflow-hidden">
          <Input
            type="search"
            placeholder="Search company, email, contact, person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {displayedCompanies.length === 0 ? (
            <div className="text-muted-foreground text-sm p-3 border rounded-lg">
              No company info available.
            </div>
          ) : (
            <Accordion type="multiple" className="overflow-auto space-y-2 p-2 max-h-[700px]">
              {displayedCompanies.map((c) => {
                const agentDetails = agents.find((a) => a.ReferenceID === c.referenceid);
                const fullName = agentDetails
                  ? `${agentDetails.Firstname} ${agentDetails.Lastname}`
                  : "(Unknown Agent)";
                return (
                  <AccordionItem key={c.account_reference_number} value={c.account_reference_number}>
                    <div className="flex items-center justify-between text-xs font-semibold gap-2 px-4 py-2">
                      <AccordionTrigger className="text-xs font-semibold flex-1 text-left">
                        <span className="flex items-center gap-2 flex-wrap" style={{ minWidth: 0 }}>
                          <span className="break-words whitespace-normal cap">
                            {c.company_name?.trim() ? c.company_name : c.contact_person}
                          </span>
                          {isNewCompany(c.date_created) && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300 text-[9px] font-semibold">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                              </span>
                              NEW
                            </span>
                          )}
                        </span>
                      </AccordionTrigger>
                      <Button
                        variant="outline"
                        disabled={
                          addingAccount === c.account_reference_number ||
                          addingLock.has(c.account_reference_number)
                        }
                        onClick={(e) => { e.stopPropagation(); handleAddActivity(c); }}
                        className="text-xs px-3 py-1 cursor-pointer"
                      >
                        {addingAccount === c.account_reference_number ? "Adding..." : "Add"}
                      </Button>
                    </div>
                    <AccordionContent className="text-xs px-4 pb-2 pt-0">
                      <p><strong>Contact Number:</strong> {c.contact_number || "-"}</p>
                      <p><strong>Email Address:</strong> {c.email_address || "-"}</p>
                      {!c.company_name?.trim() && c.contact_person?.trim() ? null : (
                        <p className="capitalize"><strong>Contact Person:</strong> {c.contact_person || "-"}</p>
                      )}
                      <p className="mb-2"><strong>Type Client:</strong> {c.type_client || "-"}</p>
                      <p className="uppercase">
                        <strong>Current Handler: <Badge>{fullName}</Badge></strong>
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* RIGHT SIDE — ACTIVITIES */}
      <Card className="w-full md:w-2/3 p-4 rounded-xl flex flex-col">
        <div className="mb-2 text-xs font-bold">
          Total Activities: {filteredAndSortedData.length}
        </div>

        <div className="flex mb-3 space-x-2 items-center flex-wrap gap-y-2">
          <input
            type="search"
            placeholder="Search activities by company, status, reference number..."
            value={activitySearchTerm}
            onChange={(e) => setActivitySearchTerm(e.target.value)}
            className="flex-grow px-3 py-2 border rounded-md text-sm"
          />
          <Button
            variant="outline"
            disabled={filteredAndSortedData.length === 0}
            onClick={() => handleExportCsv(filteredAndSortedData)}
            className="bg-green-500 text-white hover:bg-green-600 cursor-pointer"
          >
            Download CSV
          </Button>
          <Button className="cursor-pointer" onClick={() => setFilterDialogOpen(true)}>
            Filter
          </Button>
          <Button
            variant={showCheckboxes ? "secondary" : "outline"}
            disabled={filteredAndSortedData.length === 0}
            onClick={() => {
              if (showCheckboxes) { setShowCheckboxes(false); setSelectedToDelete([]); }
              else { setShowCheckboxes(true); }
            }}
            className="whitespace-nowrap cursor-pointer"
          >
            {showCheckboxes ? "Cancel" : "Delete"}
          </Button>
          {showCheckboxes && selectedToDelete.length > 0 && (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              Delete Selected ({selectedToDelete.length})
            </Button>
          )}
        </div>

        {/* ===================== 4 STATUS COLUMNS ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {STATUS_COLUMNS.map((status) => {
            const columnItems = paginatedByStatus[status];
            const totalItems = groupedByStatus[status].length;
            const currentPage = columnCurrentPage[status];
            const totalPages = totalPagesByStatus[status];

            return (
              /* Each column is a flex column with fixed total height so all 4 are equal */
              <div
                key={status}
                className="flex flex-col border rounded-xl overflow-hidden"
                style={{ height: "680px" }}
              >
                {/* COLUMN HEADER */}
                <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${STATUS_HEADER_STYLES[status]}`}>
                  <span className="text-xs font-bold truncate">{status}</span>
                  <span className="text-[10px] font-semibold bg-white/70 border px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                    {totalItems}
                  </span>
                </div>

                {/* SEARCH BAR */}
                <div className="px-2 py-1.5 border-b bg-white shrink-0">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full px-2 py-1 text-xs border rounded"
                    value={columnSearch[status]}
                    onChange={(e) => {
                      setColumnSearch((prev) => ({ ...prev, [status]: e.target.value }));
                      setColumnCurrentPage((prev) => ({ ...prev, [status]: 1 }));
                    }}
                  />
                </div>

                {/* SCROLLABLE ITEMS LIST — takes remaining height */}
                <div className="overflow-y-auto flex-1 bg-gray-50/50 custom-scrollbar">
                  {columnItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
                      No records found.
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {columnItems.map((item, index) => {
                        const isChecked = selectedToDelete.includes(item._id);
                        return (
                          <div
                            key={`${item._id}-${index}`}
                            className="bg-white border rounded-lg p-2.5 flex items-start justify-between gap-2 shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* LEFT INFO */}
                            <div className="flex-1 text-xs min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                {showCheckboxes && (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSelect(item._id)}
                                    className="w-3.5 h-3.5 cursor-pointer shrink-0"
                                  />
                                )}
                                <span className="font-semibold capitalize truncate">
                                  {item.company_name === "Unknown Company"
                                    ? item.contact_person || "Unknown Company"
                                    : item.company_name}
                                </span>
                              </div>

                              {item.contact_person && (
                                <div className="text-gray-500 truncate mb-1">
                                  {item.contact_person}
                                </div>
                              )}

                              <div className="text-muted-foreground space-y-0.5">
                                <div className="truncate">
                                  Updated: {new Date(item.date_updated).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  Created: {new Date(item.date_created).toLocaleString()}
                                </div>
                              </div>

                              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                                <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[8px] font-semibold ${STATUS_STYLES[item.status]}`}>
                                  {item.status}
                                </span>
                                <span className="text-[10px] text-gray-400">–</span>
                                <span className="text-[10px] capitalize font-semibold truncate">
                                  {getAgentNameByReferenceID(item.referenceid)}
                                </span>
                              </div>
                            </div>

                            {/* RIGHT ACTIONS */}
                            {!showCheckboxes && (
                              <div className="flex flex-col gap-1 shrink-0">
                                <TicketHistoryDialog item={item} />
                                <UpdateTicketDialog
                                  {...item}
                                  onCreated={async () => {
                                    await fetchActivities();
                                    await fetchCompanies();
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={updatingId === item._id}
                                  onClick={() => openDoneDialog(item._id)}
                                  className="text-xs"
                                >
                                  {updatingId === item._id ? "Updating..." : "Closed"}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PAGINATION FOOTER — always pinned at bottom */}
                <div className="border-t bg-white px-2 py-2 shrink-0">
                  {totalPages > 1 ? (
                    <>
                      <div className="flex items-center justify-between gap-1 text-xs">
                        <button
                          onClick={() => goToColumnPage(status, currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-2 py-0.5 rounded border disabled:opacity-40 hover:bg-gray-100 cursor-pointer text-xs"
                        >
                          ‹ Prev
                        </button>

                        <div className="flex items-center gap-0.5">
                          {currentPage > 2 && (
                            <>
                              <button
                                onClick={() => goToColumnPage(status, 1)}
                                className="px-1.5 py-0.5 rounded border hover:bg-gray-100 cursor-pointer text-xs"
                              >
                                1
                              </button>
                              {currentPage > 3 && <span className="text-gray-400 text-xs">…</span>}
                            </>
                          )}
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p >= currentPage - 1 && p <= currentPage + 1)
                            .map((p) => (
                              <button
                                key={p}
                                onClick={() => goToColumnPage(status, p)}
                                className={`px-1.5 py-0.5 rounded border cursor-pointer text-xs ${
                                  p === currentPage
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          {currentPage < totalPages - 1 && (
                            <>
                              {currentPage < totalPages - 2 && <span className="text-gray-400 text-xs">…</span>}
                              <button
                                onClick={() => goToColumnPage(status, totalPages)}
                                className="px-1.5 py-0.5 rounded border hover:bg-gray-100 cursor-pointer text-xs"
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => goToColumnPage(status, currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-2 py-0.5 rounded border disabled:opacity-40 hover:bg-gray-100 cursor-pointer text-xs"
                        >
                          Next ›
                        </button>
                      </div>
                      <div className="text-center text-[10px] text-gray-400 mt-0.5">
                        Page {currentPage} of {totalPages} · {totalItems} total
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-[10px] text-gray-400">
                      {totalItems} {totalItems === 1 ? "record" : "records"}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* CONFIRM DELETE DIALOG */}
        <ActDeleteDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          selectedToDeleteCount={selectedToDelete.length}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
        />

        <ActFilterDialog
          filterDialogOpen={filterDialogOpen}
          setFilterDialogOpen={setFilterDialogOpen}
          filters={filters}
          handleFilterChange={handleFilterChange}
          sortField={sortField}
          setSortField={setSortField}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          mergedData={filteredAndSortedData}
          sortableFields={sortableFields}
          agents={agents}
        />
      </Card>

      <DoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmDone}
        loading={updatingId === selectedActivityId}
        close_reason={selectedActivity?.close_reason}
        counter_offer={selectedActivity?.counter_offer}
        client_specs={selectedActivity?.client_specs}
        tsm_acknowledge_date={selectedActivity?.tsm_acknowledge_date}
        tsm_handling_time={selectedActivity?.tsm_handling_time}
        tsa_acknowledge_date={selectedActivity?.tsa_acknowledge_date}
        tsa_handling_time={selectedActivity?.tsa_handling_time}
      />

      {exporting && (
        <div
          className="fixed top-4 right-4 z-50 w-full max-w-md flex flex-col gap-4 rounded-xl shadow-lg bg-white p-4"
          style={{ borderRadius: "1rem" }}
        >
          <Item variant="outline">
            <ItemMedia variant="icon"><Spinner /></ItemMedia>
            <ItemContent>
              <ItemTitle>Downloading...</ItemTitle>
              <ItemDescription>{`${filteredAndSortedData.length} records`}</ItemDescription>
            </ItemContent>
            <ItemActions className="hidden sm:flex">
              <Button variant="outline" size="sm" disabled>Cancel</Button>
            </ItemActions>
            <ItemFooter>
              <Progress value={progress} />
            </ItemFooter>
          </Item>
        </div>
      )}
    </div>
  );
};
