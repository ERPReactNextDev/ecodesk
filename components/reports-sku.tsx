"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UpdateTicketDialog } from "./ticket-update-dialog";
import { ActDeleteDialog } from "./act-delete-dialog";
import { ActFilterDialog } from "./act-filter-dialog";
import { type DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle, } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator"
import { ReportsSkuTicketDialog } from "./reports-sku-ticket-dialog";

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
    channel?: string;
    wrap_up?: string;
    source?: string;
    customer_type?: string;
    customer_status?: string;
    status: string;
    department?: string;
    manager?: string;
    agent?: string;
    remarks: string;
    inquiry?: string;
    item_code?: string;
    item_description?: string;
    po_number?: string;
    so_date?: string;
    so_number?: string;
    so_amount?: string;
    qty_sold?: string;
    gender: string;
    quotation_number?: string;
    quotation_amount?: string;
    payment_terms?: string;
    po_source?: string;
    payment_date?: string;
    delivery_date?: string;

    // ✅ ADD THESE EXACTLY HERE
    close_reason?: string;
    counter_offer?: string;
    client_specs?: string;

    tsm_acknowledge_date?: string;
    tsa_acknowledge_date?: string;
    tsm_handling_time?: string;
    tsa_handling_time?: string;

    referenceid: string;
    activity_reference_number: string;
    account_reference_number: string;
    date_updated: string;
    date_created: string;
}


interface TicketProps {
    referenceid: string;
    role: string;
    dateCreatedFilterRange: DateRange | undefined;
    setDateCreatedFilterRangeAction: React.Dispatch<
        React.SetStateAction<DateRange | undefined>
    >;
}

export const SKU: React.FC<TicketProps> = ({
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

    const STATUS_STYLES: Record<string, string> = {
    "On-Progress": "bg-blue-100 text-blue-700 border-blue-300",
    "Closed": "bg-gray-200 text-gray-700 border-gray-300",
    "Endorsed": "bg-purple-100 text-purple-700 border-purple-300",
    "Converted into Sales": "bg-green-100 text-green-700 border-green-300",
    };

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
            // Determine the query param: kung admin, walang filter referenceid
            // otherwise gamitin referenceid para sa filter
            const queryParam = role === "Admin" ? "" : `?referenceid=${encodeURIComponent(referenceid)}`;

            const res = await fetch(
                `/api/act-fetch-activity${queryParam}`,
                {
                    cache: "no-store",
                    headers: {
                        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                        Pragma: "no-cache",
                        Expires: "0",
                    },
                }
            );

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
    }, [referenceid, role]);

    useEffect(() => {
        fetchActivities();
    }, [referenceid, fetchActivities]);

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

    const allowedRemarks = ["No Stocks / Insufficient Stocks", "Item Not Carried", "Non Standard Item"];

    // Merge activity with company info, filter by status and date range
    const mergedData = React.useMemo(() => {
        if (companies.length === 0) return [];

        return activities
            .filter((a) => allowedRemarks.includes(a.remarks))
            .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
            .map((activity) => {
                const company = companies.find(
                    (c) => c.account_reference_number === activity.account_reference_number
                );
                return {
                    ...activity,
                    company_name: company?.company_name ?? "Unknown Company",
                    contact_number: company?.contact_number ?? "-",
                    type_client: company?.type_client ?? "",
                    contact_person: company?.contact_person ?? "",
                    email_address: company?.email_address ?? "",
                    address: company?.address ?? "",
                };
            })
            .sort(
                (a, b) =>
                    new Date(b.date_updated).getTime() - new Date(a.date_updated).getTime()
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
            link.setAttribute("download", `SKU_LISTING_${Date.now()}.csv`);
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

    return (
        <div className="flex flex-col md:flex-row gap-4">
            {/* RIGHT SIDE — ACTIVITIES */}
            <Card className="w-full flex flex-col border-none shadow-none">
                <div className="text-xs font-bold">
                    Total Sku Listing's: {filteredActivities.length}
                </div>

                <div className="flex space-x-2 items-center">
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

                    <Button onClick={() => setFilterDialogOpen(true)} className="cursor-pointer">Filter</Button>

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
                        className="whitespace-nowrap"
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
<div className="max-h-[600px] overflow-auto custom-scrollbar flex-grow space-y-2">
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
        className="border rounded-lg p-3 flex justify-between items-start hover:bg-muted/40 transition"
      >
        {/* LEFT SIDE */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {showCheckboxes && (
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSelect(item._id)}
                className="w-4 h-4 cursor-pointer"
              />
            )}

            <span>
              {new Date(item.date_updated ?? item.date_created).toLocaleDateString()}
            </span>
            <span className="text-muted-foreground text-[10px]">|</span>
            <span>
              {new Date(item.date_updated ?? item.date_created).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="text-sm font-bold">
            {item.company_name}
          </div>

          <div className="flex items-center gap-2">
            <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold
                ${STATUS_STYLES[item.status] ?? "bg-slate-100 text-slate-700 border-slate-300"}`}
            >
            {item.status}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">
              {item.ticket_reference_number}
            </span>
          </div>
        </div>

        {/* RIGHT SIDE ACTIONS */}
        {!showCheckboxes && (
          <div className="flex items-center gap-2">
            {/* VIEW SKU TICKET (REPLACEMENT FOR ACCORDION CONTENT) */}
            <ReportsSkuTicketDialog item={item} />

            {/* UPDATE */}
            <UpdateTicketDialog
            {...{
                _id: item._id,
                ticket_reference_number: item.ticket_reference_number,
                ticket_received: item.ticket_received,
                ticket_endorsed: item.ticket_endorsed,
                traffic: item.traffic,
                gender: item.gender,
                source_company: item.source_company,
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

                // ✅ ADD THESE (THIS FIXES THE BUG)
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
