"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, } from "@/components/ui/accordion";
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
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle, } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { AddCompanyModal } from "./add-company-modal";
import { Separator } from "@/components/ui/separator"
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
    date_created?: string; // ✅ ADD THIS
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

  // ✅ ADD THESE TWO LINES (THIS FIXES YOUR ERROR)
  company_name: string;
  contact_number?: string;
  email_address?: string;
  contact_person?: string;

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

    // For activities right side search and pagination
    const [activitySearchTerm, setActivitySearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [filterDialogOpen, setFilterDialogOpen] = useState(false);

    const [filters, setFilters] = useState<{
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

    const STATUS_STYLES: Record<string, string> = {
    "On-Progress": "bg-blue-100 text-blue-700 border-blue-300",
    "Closed": "bg-gray-200 text-gray-700 border-gray-300",
    "Endorsed": "bg-purple-100 text-purple-700 border-purple-300",
    "Converted into Sales": "bg-green-100 text-green-700 border-green-300",
    };

const isNewCompany = (dateCreated?: string) => {
  if (!dateCreated) return false;

  // Convert "YYYY-MM-DD HH:mm:ss.SSS" → local Date
  const created = new Date(dateCreated.replace(" ", "T"));
  if (isNaN(created.getTime())) return false;

  const now = new Date();

  // Difference in milliseconds
  const diffMs = now.getTime() - created.getTime();

  // 1 day = 24 hours
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  return diffMs <= ONE_DAY_MS;
};

    // Sorting field and order
    const sortableFields = [
        "source_company",
        "source",
        "wrap_up",
        "traffic",
        "department",
        "channel",
        "customer_status",
        "customer_type",
        "remarks",
        "status",
        "date_created",
        "date_updated",
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
        if (!exporting) {
            setProgress(0);
            return;
        }

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1; // increase 1% every interval
            });
        }, 10); // every 50ms, so ~5 seconds to reach 100%

        return () => clearInterval(interval);
    }, [exporting]);

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value || undefined, // clear filter if empty string
        }));
    };

    // Fetch companies on mount
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

    useEffect(() => {
        fetchCompanies();
    }, []);

        // Fetch activities when referenceid changes
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

    useEffect(() => {
        fetchActivities();
    }, [referenceid, fetchActivities]);

    // 🔥 REAL-TIME LISTENER (Shopify → Ticket)
useEffect(() => {
  const handleRealtimeUpdate = () => {
    fetchActivities(); // re-fetch MongoDB instantly
  };

  window.addEventListener("activity-updated", handleRealtimeUpdate);

  return () => {
    window.removeEventListener("activity-updated", handleRealtimeUpdate);
  };
}, [fetchActivities]);


    const isDateInRange = (dateStr: string, range: DateRange | undefined) => {
        if (!range) return true;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;

        const { from, to } = range;

        const fromDate = from
            ? new Date(from.getFullYear(), from.getMonth(), from.getDate())
            : null;
        const toDate = to
            ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)
            : null;

        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;

        return true;
    };

    const allowedStatuses = ["On-Progress", "Closed", "Endorsed", "Converted into Sales"];

    // Merge activity with company info, filter by status and date range
const mergedData = React.useMemo(() => {
  if (companies.length === 0) return [];

  return activities
    .filter((a) => allowedStatuses.includes(a.status))
    .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
    .map((activity) => {
      const company = companies.find(
        (c) => c.account_reference_number === activity.account_reference_number
      );

      const isShopify =
        activity.account_reference_number?.startsWith("SHOPIFY-");

      return {
        ...activity,

        // ✅ DISPLAY NAME RULE (FIX)
          company_name:
              company?.company_name?.trim()
                  ? company.company_name
                  : isShopify
            ? activity.contact_person || "Shopify Customer"
                      : activity.contact_person || "Unknown Company",



        contact_number:
          company?.contact_number ??
          (isShopify ? activity.contact_number ?? "-" : "-"),

        type_client: company?.type_client ?? "",

        // ✅ ENSURE CONTACT PERSON FLOWS EVERYWHERE
        contact_person:
          activity.contact_person ??
          company?.contact_person ??
          "",

        email_address:
          company?.email_address ??
          (isShopify ? activity.email_address ?? "" : ""),

        address: company?.address ?? "",
      };
    })
    .sort(
      (a, b) =>
        new Date(b.date_updated).getTime() -
        new Date(a.date_updated).getTime()
    );
}, [activities, companies, dateCreatedFilterRange]);


    const filteredAndSortedData = useMemo(() => {
        let data = mergedData;

        // Step 1: Search bar filter (activitySearchTerm)
        if (activitySearchTerm.trim() !== "") {
            const term = activitySearchTerm.toLowerCase();

            data = data.filter((item) => {
                const companyName = (item.company_name ?? "").toString().toLowerCase();
                const ticketRef = (item.ticket_reference_number ?? "").toString().toLowerCase();

                return (
                    companyName.includes(term) ||
                    ticketRef.includes(term)
                );
            });
        }

        // Step 2: UI filters from filters object
        Object.entries(filters).forEach(([key, val]) => {
            if (val && val.trim() !== "") {
                data = data.filter((item) => {
                    const itemValue = (item as any)[key];
                    return itemValue?.toString().toLowerCase().includes(val.toLowerCase());
                });
            }
        });

        // Step 3: Sort the filtered data
        data = data.slice().sort((a, b) => {
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
    }, [mergedData, activitySearchTerm, filters, sortField, sortOrder]);

    const isLoading = loadingCompanies || loadingActivities;
    const error = errorCompanies || errorActivities;

    const excludedCompanyStatuses = ["Pending", "Transferred", "Remove"];

    const normalize = (str: string) =>
        str
            .toLowerCase()
            .replace(/[_\s]+/g, " ") // replace underscores and multiple spaces with single space
            .trim();

const filteredCompanies = companies
    .filter((c) => {
        if (excludedCompanyStatuses.includes(c.status)) return false;
        if (c.type_client !== "CSR Client") return false;

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

    // ✅ KEEP OLD SEARCH RELEVANCE SORT
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

    // 🔥 NEW SORT: NEW + LATEST ON TOP
    .sort((a, b) => {
        const aIsNew = isNewCompany((a as any).date_created);
        const bIsNew = isNewCompany((b as any).date_created);

        // 1️⃣ NEW companies first
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;

        // 2️⃣ Latest created first
        const aTime = new Date((a as any).date_created ?? 0).getTime();
        const bTime = new Date((b as any).date_created ?? 0).getTime();

        return bTime - aTime;
    });

    const MAX_DISPLAY = 20;

    const displayedCompanies = useMemo(() => {
        // 1️⃣ Exclude the company that is currently being added
        const filtered = filteredCompanies.filter(
            (c) => c.account_reference_number !== addingAccount
        );

        // 2️⃣ Slice to MAX_DISPLAY after relevance sorting
        return filtered.slice(0, MAX_DISPLAY);
    }, [filteredCompanies, addingAccount]); // added addingAccount as dependency
    // Filter activities by search term (right side)
    const filteredActivities = useMemo(() => {
        if (!activitySearchTerm.trim()) return mergedData;

        const term = activitySearchTerm.toLowerCase();

        return mergedData.filter((item) => {
            const companyName = (item.company_name ?? "").toString().toLowerCase();
            const ticketRef = (item.ticket_reference_number ?? "").toString().toLowerCase();

            return (
                companyName.includes(term) ||
                ticketRef.includes(term)
            );
        });
    }, [activitySearchTerm, mergedData]);

    const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);

    const paginatedActivities = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredAndSortedData]);

    const goToPage = (page: number) => {
        if (page < 1) page = 1;
        else if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };

    // Generates activity reference number from company initials + region + timestamp
    function generateActivityReferenceNumber(companyName: string): string {
        const initials = companyName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        const region = "REG"; // TODO: replace with real region logic if needed
        const timestamp = Date.now();
        return `${initials}-${region}-${timestamp}`;
    }

    const openDoneDialog = (_id: string) => {
        // Make sure id is defined and non-empty
        if (!_id) {
            toast.error("Invalid activity ID");
            return;
        }
        setSelectedActivityId(_id);
        setDialogOpen(true);
    };

        const handleConfirmDone = async (payload: {
        close_reason: string;
        counter_offer: string;
        client_specs: string;
        }) => {

        try {
            setUpdatingId(selectedActivityId);
            setDialogOpen(false);

            // Find the activity to update in your current state (activities or mergedData)
            const activityToUpdate = activities.find(a => a._id === selectedActivityId);
            if (!activityToUpdate) {
                toast.error("Activity not found in current data.");
                setUpdatingId(null);
                return;
            }

            // Prepare updated activity data
            const updatedActivity = {
            _id: selectedActivityId,
            status: "Closed",
            close_reason: payload.close_reason,
            counter_offer: payload.counter_offer,
            client_specs: payload.client_specs,
            };


            const res = await fetch(
            "/api/act-update-status?role=" + encodeURIComponent(role),
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedActivity),
                cache: "no-store",
            }
            );


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

    // 🔒 HARD BLOCK double click
    if (addingLock.has(key)) return;

  if (!referenceid) {
    toast.error("Missing reference ID");
    return;
  }

    // 🔒 lock immediately
    setAddingLock(prev => new Set(prev).add(key));
    setAddingAccount(key);

  const newActivityReferenceNumber = generateActivityReferenceNumber(company.company_name);

  const payload = {
    referenceid,
    account_reference_number: company.account_reference_number,
    status: "On-Progress",
    activity_reference_number: newActivityReferenceNumber,
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
  } catch (error) {
    toast.error("Error saving activity");
  } finally {
      // 🔓 unlock after request ends
      setAddingLock(prev => {
          const copy = new Set(prev);
          copy.delete(key);
          return copy;
      });
    setAddingAccount(null);
  }
};


// 👇👇👇 PUT THIS RIGHT HERE 👇👇👇
const selectedActivity = activities.find(
  (a) => a._id === selectedActivityId
);

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

    const toggleSelect = (id: string) => {
        setSelectedToDelete((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // Delete selected activities handler
    const handleDeleteConfirm = async () => {
        if (selectedToDelete.length === 0) {
            toast.error("No activity selected.");
            return;
        }

        try {
            setDeleting(true);
            // Example delete API, adjust path & method as needed
            const res = await fetch("/api/act-delete-activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedToDelete }),
            });
            const result = await res.json();

            if (!res.ok) {
                toast.error(result.error || "Failed to delete activities.");
                setDeleting(false);
                return;
            }

            toast.success("Selected activities deleted.");
            setSelectedToDelete([]);
            setShowCheckboxes(false);
            await fetchActivities();
        } catch (err) {
            toast.error("Error deleting activities.");
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    async function handleExportCsv(data: MergedActivity[]) {
        if (!data.length) {
            toast.error("No data to export.");
            return;
        }

        try {
            setExporting(true);

            await new Promise((r) => setTimeout(r, 1000));

            const headers = [
                "Activity Reference Number",
                "Company Name",
                "Status",
                "Date Created",
                "Date Updated",
                "Contact Person",
                "Contact Number",
                "Email Address",
                "Ticket Received",
                "Ticket Endorsed",
                "Traffic",
                "Source Company",
                "Channel",
                "Wrap Up",
                "Source",
                "Customer Type",
                "Customer Status",
                "Department",
                "Manager",
                "Agent",
                "Remarks",
                "Inquiry",
                "Item Code",
                "Item Description",
                "PO Number",
                "SO Date",
                "SO Number",
                "SO Amount",
                "Qty Sold",
                "Quotation Number",
                "Quotation Amount",
                "Payment Terms",
                "PO Source",
                "Payment Date",
                "Delivery Date",
            ];

            const formatDate = (dateStr?: string) => {
                if (!dateStr) return "-";
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? "-" : d.toLocaleString();
            };

            const rows = data.map((item: MergedActivity) => [
                item.activity_reference_number,
                item.company_name,
                item.status,
                formatDate(item.date_created),
                formatDate(item.date_updated),
                item.contact_person || "-",
                item.contact_number || "-",
                item.email_address || "-",
                item.ticket_received || "-",
                item.ticket_endorsed || "-",
                item.traffic || "-",
                item.source_company || "-",
                item.channel || "-",
                item.wrap_up || "-",
                item.source || "-",
                item.customer_type || "-",
                item.customer_status || "-",
                item.department || "-",
                item.manager || "-",
                item.agent || "-",
                item.remarks || "-",
                item.inquiry || "-",
                item.item_code || "-",
                item.item_description || "-",
                item.po_number || "-",
                formatDate(item.so_date),
                item.so_number || "-",
                item.so_amount || "-",
                item.qty_sold || "-",
                item.quotation_number || "-",
                item.quotation_amount || "-",
                item.payment_terms || "-",
                item.po_source || "-",
                formatDate(item.payment_date),
                formatDate(item.delivery_date),
            ]);

            const csvContent =
                [
                    headers.join(","),
                    ...rows.map((row) =>
                        row
                            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                            .join(",")
                    ),
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
        } finally {
            setExporting(false);
        }
    }

    const getAgentNameByReferenceID = (
    refId: string | null | undefined
  ): string => {
    if (!refId) return "-";
    const agent = agents.find((a) => a.ReferenceID === refId);
    return agent ? `${agent.Firstname} ${agent.Lastname}` : "-";
  };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            {/* LEFT SIDE — COMPANIES */}
            <Card className="w-full md:w-1/3 p-3 rounded-lg flex flex-col">
                <CardHeader className="p-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">Companies</CardTitle>
                        {/* LEFT SIDE — COMPANIES */}
                        <AddCompanyModal
                            referenceid={referenceid}
                            onCreated={fetchCompanies} // pass the fetch function here
                        />
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
                        <Accordion
                            type="multiple"
                            className="overflow-auto space-y-2 p-2 max-h-[700px]"
                        >
                            {displayedCompanies.map((c) => {
                                // Find the agent for this company (adjust if needed)
                                const agentDetails = agents.find((a) => a.ReferenceID === c.referenceid);
                                const fullName = agentDetails
                                    ? `${agentDetails.Firstname} ${agentDetails.Lastname}`
                                    : "(Unknown Agent)";

                                return (
                                    <AccordionItem
                                        key={c.account_reference_number}
                                        value={c.account_reference_number} // may kaparehas kasi bro
                                    >
                                        <div className="flex items-center justify-between text-xs font-semibold gap-2 px-4 py-2">
                                        <AccordionTrigger className="text-xs font-semibold flex-1 text-left">
                                            <span className="flex items-center gap-2 flex-wrap" style={{ minWidth: 0 }}>
                                                    <span className="break-words whitespace-normal cap">
                                                        {c.company_name?.trim()
                                                            ? c.company_name
                                                            : c.contact_person}
                                                    </span>


                                                    {isNewCompany(c.date_created) && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full
                                                        bg-green-100 text-green-700 border border-green-300 text-[9px] font-semibold">
                                                        
                                                        {/* glowing dot */}
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddActivity(c);
                                                }}
                                                className="text-xs px-3 py-1 cursor-pointer"
                                            >

                                                {addingAccount === c.account_reference_number ? "Adding..." : "Add"}
                                            </Button>
                                        </div>

                                        <AccordionContent className="text-xs px-4 pb-2 pt-0">
                                            <p>
                                                <strong>Contact Number:</strong> {c.contact_number || "-"}
                                            </p>
                                            <p>
                                                <strong>Email Address:</strong> {c.email_address || "-"}
                                            </p>
                                            {!c.company_name?.trim() && c.contact_person?.trim() ? null : (
                                            <p className="capitalize">
                                                <strong>Contact Person:</strong> {c.contact_person || "-"}
                                            </p>
                                            )}
                                            <p className="mb-2">
                                                <strong>Type Client:</strong> {c.type_client || "-"}
                                            </p>
                                            <p className="uppercase">
                                                
                                                <strong>Current Handler: <Badge>{fullName} </Badge></strong> 
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
                    Total On-Progress Activities: {filteredActivities.length}
                </div>

                <div className="flex mb-3 space-x-2 items-center">
                    <input
                        type="search"
                        placeholder="Search activities by company, status, reference number..."
                        value={activitySearchTerm}
                        onChange={(e) => {
                            setActivitySearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-grow px-3 py-2 border rounded-md text-sm"
                    />

                    <Button className = "cursor-pointer" onClick={() => setFilterDialogOpen(true)}>Filter</Button>

                    <Button
                        variant="outline"
                        disabled={filteredActivities.length === 0}
                        onClick={() => handleExportCsv(filteredActivities)}
                        className="bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                    >
                        Download CSV
                    </Button>

                    <Button
                        variant={showCheckboxes ? "secondary" : "outline"}
                        disabled={filteredActivities.length === 0}
                        onClick={() => {
                            if (showCheckboxes) {
                                // Cancel delete mode
                                setShowCheckboxes(false);
                                setSelectedToDelete([]);
                            } else {
                                setShowCheckboxes(true);
                            }
                        }}
                        className="whitespace-nowrap cursor-pointer"
                    >
                        {showCheckboxes ? "Cancel" : "Delete"}
                    </Button>

                    {showCheckboxes && selectedToDelete.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete Selected ({selectedToDelete.length})
                        </Button>
                    )}
                </div>

                {/* ACTIVITIES LIST */}
                <div className="max-h-[600px] overflow-auto space-y-3 custom-scrollbar flex-grow">
                {paginatedActivities.map((item, index) => {
                    let badgeColor: "default" | "secondary" | "outline" = "default";

                    if (item.status === "Assisted" || item.status === "SO-Done") {
                    badgeColor = "secondary";
                    } else if (item.status === "Quote-Done") {
                    badgeColor = "outline";
                    }

                    const isChecked = selectedToDelete.includes(item._id);

                    return (
                    <div
                        key={`${item._id}-${index}`}
                        className="border rounded-lg p-3 flex items-start justify-between gap-3"
                    >
                        {/* LEFT INFO */}
                        <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                            {showCheckboxes && (
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelect(item._id)}
                                className="w-4 h-4 cursor-pointer"
                            />
                            )}

                                    <span className="font-semibold capitalize">
                                        {item.company_name === "Unknown Company"
                                            ? item.contact_person || "Unknown Company"
                                            : item.company_name}
                                    </span>
                        </div>

                        <div className="text-muted-foreground mt-1">
                            {new Date(item.date_updated ?? item.date_created).toLocaleDateString()}{" "}
                            {new Date(item.date_updated ?? item.date_created).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            })}
                        </div>

                        <div className="mt-1 flex items-center gap-1">
                        <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-semibold
                            ${STATUS_STYLES[item.status] ?? "bg-slate-100 text-slate-700 border-slate-300"}`}
                        >
                            {item.status}
                        </span>
                        –{" "}
                        <span className="capitalize font-bold">
                            {getAgentNameByReferenceID(item.referenceid)}
                        </span>
                        </div>

                        </div>

                        {/* RIGHT ACTIONS */}
                        {!showCheckboxes && (
                        <div className="flex gap-2 flex-shrink-0">
                            {/* VIEW HISTORY MODAL */}
                            <TicketHistoryDialog item={item} />

                            {/* UPDATE */}
                            <UpdateTicketDialog
                            {...{
                                _id: item._id,
                                date_created: item.date_created,
                                ticket_reference_number: item.ticket_reference_number,
                                ticket_received: item.ticket_received,
                                ticket_endorsed: item.ticket_endorsed,
                                traffic: item.traffic,
                                source_company: item.source_company,
                                gender: item.gender,
                                channel: item.channel,
                                wrap_up: item.wrap_up,
                                source: item.source,
                                customer_type: item.customer_type,
                                customer_status: item.customer_status,
                                status: item.status,
                                department: item.department,
                                manager: item.manager,
                                agent: item.agent,
                                remarks: item.remarks,
                                inquiry: item.inquiry,
                                item_code: item.item_code,
                                item_description: item.item_description,
                                po_number: item.po_number,
                                so_date: item.so_date,
                                so_number: item.so_number,
                                so_amount: item.so_amount,
                                qty_sold: item.qty_sold,
                                quotation_number: item.quotation_number,
                                quotation_amount: item.quotation_amount,
                                payment_terms: item.payment_terms,
                                po_source: item.po_source,
                                payment_date: item.payment_date,
                                delivery_date: item.delivery_date,

                                // ✅ REQUIRED FOR AUTOFILL
                                close_reason: item.close_reason,
                                counter_offer: item.counter_offer,
                                client_specs: item.client_specs,
                                tsm_acknowledge_date: item.tsm_acknowledge_date,
                                tsa_acknowledge_date: item.tsa_acknowledge_date,
                                tsm_handling_time: item.tsm_handling_time,
                                tsa_handling_time: item.tsa_handling_time,

                                referenceid: item.referenceid,
                                type_client: item.type_client,
                                contact_number: item.contact_number,
                                email_address: item.email_address,
                                company_name: item.company_name,
                                contact_person: item.contact_person,
                                address: item.address,
                                account_reference_number: item.account_reference_number,
                            }}
                            onCreated={() => fetchActivities()}
                            />

                            {/* CLOSE */}
                            <Button
                            type="button"
                            variant="secondary"
                            className="cursor-pointer"
                            disabled={updatingId === item._id}
                            onClick={() => openDoneDialog(item._id)}
                            >
                            {updatingId === item._id ? "Updating..." : "Closed"}
                            </Button>
                        </div>
                        )}
                    </div>
                    );
                })}
                </div>


                {/* PAGINATION CONTROLS */}
                <div className="mt-4 flex justify-center items-center space-x-2 text-xs">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage <= 1}
                        onClick={() => goToPage(currentPage - 1)}
                    >
                        Prev
                    </Button>

                    <span>
                        Page {currentPage} / {totalPages || 1}
                    </span>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage >= totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                    >
                        Next
                    </Button>
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
                    mergedData={mergedData}
                    sortableFields={sortableFields}
                />

            </Card>

            <DoneDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onConfirm={handleConfirmDone}
            close_reason={selectedActivity?.close_reason}
            counter_offer={selectedActivity?.counter_offer}
            client_specs={selectedActivity?.client_specs}
            />

            {exporting && (
                <div
                    className="fixed top-4 right-4 z-50 w-full max-w-md flex flex-col gap-4 rounded-xl shadow-lg bg-white p-4"
                    style={{ borderRadius: "1rem" }}
                >
                    <Item variant="outline">
                        <ItemMedia variant="icon">
                            <Spinner />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>Downloading...</ItemTitle>
                            <ItemDescription>{`${filteredAndSortedData.length} records`}</ItemDescription>
                        </ItemContent>
                        <ItemActions className="hidden sm:flex">
                            <Button variant="outline" size="sm" disabled>
                                Cancel
                            </Button>
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