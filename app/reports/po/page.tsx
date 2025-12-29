"use client";


import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { POTrackingAddDialog } from "@/components/po-tracking-add-dialog";
import { PODeleteModal } from "@/components/po-delete-dialog";
import { EditPO as POTrackingEditDialog } from "@/components/po-tracking-edit-dialog";
import { POFilterDialog } from "@/components/po-filter-dialog";
import { type DateRange } from "react-day-picker";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserDetails {
  referenceid: string;
  role: string;
  Firstname?: string;
  Lastname?: string;
}

interface Company {
  account_reference_number: string;
  company_name: string;
  contact_number?: string[];
}

const defaultFilters = {
  status: "All",
  source: "All",
  sales_agent: "All",
  csr_agent: "All",
};

function highlightMatch(text: string, searchTerm: string) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-black">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function POContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const [userDetails, setUserDetails] = useState<UserDetails>({ referenceid: "", role: "", });
  const [records, setRecords] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] = useState<any>(undefined);

  const [openAdd, setOpenAdd] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<any | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errorCompanies, setErrorCompanies] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [filters, setFilters] = useState({ ...defaultFilters });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [agents, setAgents] = useState<
    Array<{ ReferenceID: string; Firstname: string; Lastname: string }>
  >([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  const queryUserId = searchParams?.get("id") ?? "";

  useEffect(() => {
    if (queryUserId && queryUserId !== userId) setUserId(queryUserId);
  }, [queryUserId, userId, setUserId]);

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing.");
      setLoadingUser(false);
      return;
    }

    const fetchUserData = async () => {
      setError(null);
      setLoadingUser(true);
      try {
        const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        setUserDetails({
          referenceid: data.ReferenceID || "",
          Firstname: data.Firstname || "",
          Lastname: data.Lastname || "",
          role: data.Role || "",
        });
        toast.success("User data loaded successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to connect to server. Please try again later.");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    setErrorCompanies(null);
    try {
      const res = await fetch("/api/com-fetch-po-company", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch companies");
      const json = await res.json();
      setCompanies(json.data || []);
    } catch (err: any) {
      setErrorCompanies(err.message || "Error fetching companies");
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of companies) {
      if (c.account_reference_number) map[c.account_reference_number] = c.company_name;
    }
    return map;
  }, [companies]);

  const recordsWithCompanyName = useMemo(() => {
    return records.map((r) => {
      const acctRef = r.account_reference_number || r.company_ref_number;
      return {
        ...r,
        company_name: companyMap[acctRef] || r.company_name || "Unknown Company"
      };
    });
  }, [records, companyMap]);

  // Fetch records
  useEffect(() => {
    // Kung hindi pa loaded ang role or userDetails, wag mag-fetch
    if (!userDetails.role) return;

    const fetchRecords = async () => {
      try {
        // Kung Admin, walang referenceid filter sa API
        const url =
          userDetails.role === "Admin"
            ? "/api/po-fetch-record"
            : `/api/po-fetch-record?referenceid=${encodeURIComponent(userDetails.referenceid)}`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          // Filter pa rin sa front end kung gusto mo pero pwede din tanggalin if full data na
          setRecords(json.data.filter((r: any) => r.isActive !== false));
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error(err);
        setRecords([]);
      }
    };

    fetchRecords();

    const intervalId = setInterval(fetchRecords, 500);
    return () => clearInterval(intervalId);
  }, [userDetails.referenceid, userDetails.role]);

  const salesAgents = useMemo(
    () => Array.from(new Set(recordsWithCompanyName.map((r) => r.sales_agent).filter(Boolean))),
    [recordsWithCompanyName]
  );

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

  // Filtered records including search, filters, and sidebar date range
  const filteredRecords = useMemo(() => {
    return recordsWithCompanyName.filter((r) => {
      const matchesSearch =
        !searchTerm ||
        [
          r.csr_agent,
          r.sales_agent,
          r.company_name,
          r.contact_number,
          r.po_number,
          r.amount,
          r.so_number,
          r.so_date,
          r.payment_terms,
          r.payment_date,
          r.delivery_pickup_date,
          r.status,
          r.source,
        ].some((field) =>
          field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesFilters =
        (filters.status === "All" || r.status === filters.status) &&
        (filters.source === "All" || r.source === filters.source) &&
        (filters.sales_agent === "All" || r.sales_agent === filters.sales_agent) &&
        (filters.csr_agent === "All" || r.csr_agent === filters.csr_agent);

      // Return true lang kung pasok sa date range kung meron (otherwise true kung walang filter)
      const matchesDateRange = isDateInRange(r.date_created, dateCreatedFilterRange);

      return matchesSearch && matchesFilters && matchesDateRange;
    });
  }, [recordsWithCompanyName, searchTerm, filters, dateCreatedFilterRange]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const today = new Date();

  const handleDownloadCSV = () => {
    if (!records.length) return;

    const headers = [
      "CSR Agent",
      "Company",
      "Contact Number",
      "PO Number",
      "Amount",
      "SO Number",
      "SO Date",
      "Sales Agent",
      "Pending From SO Date",
      "Payment Terms",
      "Payment Date",
      "Delivery/Pick-Up Date",
      "Pending Days from Payment",
      "Status",
      "Source",
      "Created At",
    ];

    // Filter records by date range before exporting
    const recordsToExport = recordsWithCompanyName.filter((r) =>
      isDateInRange(r.date_created, dateCreatedFilterRange)
    );

    const rows = recordsToExport.map((r) => {
      const soDate = r.so_date ? new Date(r.so_date) : null;
      const paymentDate = r.payment_date ? new Date(r.payment_date) : null;
      const pendingFromSO = soDate
        ? Math.floor((today.getTime() - soDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const pendingFromPayment = paymentDate
        ? Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return [
        `${userDetails.Firstname ?? ""} ${userDetails.Lastname ?? ""}`.trim(),
        r.company_name,
        r.contact_number ?? "",
        r.po_number ?? "",
        r.amount ?? "",
        r.so_number ?? "",
        r.so_date ?? "",
        r.sales_agent ?? "",
        pendingFromSO,
        r.payment_terms ?? "",
        r.payment_date ?? "",
        r.delivery_pickup_date ?? "",
        pendingFromPayment,
        r.status ?? "",
        r.source ?? "",
        r.date_created ?? "",
      ];
    });

    // Calculate total only from filtered records matching date range
    const totalAmount = recordsToExport.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    rows.push(["", "", "", "", totalAmount.toString(), "", "", "", "", "", "", "", "", "", "", "Total"]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `po_records_${userDetails.referenceid || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleString();
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  useEffect(() => {
    async function fetchAgents() {
      setAgentsLoading(true);
      try {
        const res = await fetch("/api/fetch-agent");
        if (!res.ok) throw new Error("Failed to fetch agents");
        const data = await res.json();
        setAgents(data); // assuming data is array of agents
      } catch (err) {
        console.error(err);
        setAgents([]);
      } finally {
        setAgentsLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const getAgentNameByReferenceID = (
    refId: string | null | undefined
  ): string => {
    if (!refId) return "-";
    const agent = agents.find((a) => a.ReferenceID === refId);
    return agent ? `${agent.Firstname} ${agent.Lastname}` : "-";
  };

  return (
    <>
      <SidebarLeft />
      <SidebarInset className="overflow-hidden">
        <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Purchase Orders</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-auto">
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center gap-2">
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-80"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setFilterDialogOpen(true)}><Filter /> Filter</Button>
                <Button onClick={() => setOpenAdd(true)}>Add Record</Button>
                <Button className="bg-green-500 text-white hover:bg-green-600" onClick={handleDownloadCSV}>Download CSV</Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actions</TableHead>
                    <TableHead>CSR Agent</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>SO Number</TableHead>
                    <TableHead>SO Date</TableHead>
                    <TableHead>Sales Agent</TableHead>
                    <TableHead>Pending From SO Date</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Delivery/Pick-Up Date</TableHead>
                    <TableHead>Pending Days from Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((r: any) => {
                    const soDate = r.so_date ? new Date(r.so_date) : null;
                    const paymentDate = r.payment_date ? new Date(r.payment_date) : null;
                    const pendingFromSO = soDate ? Math.floor((today.getTime() - soDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const pendingFromPayment = paymentDate ? Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                    return (
                      <TableRow key={r._id ?? r.po_number}>
                        <TableCell className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setRecordToEdit(r); setEditModalOpen(true); }}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => { setRecordToDelete(r); setDeleteModalOpen(true); }}>Delete</Button>
                        </TableCell>
                        <TableCell className="uppercase">{getAgentNameByReferenceID(r.referenceid)}</TableCell>
                        <TableCell>{highlightMatch(r.company_name, searchTerm)}</TableCell>
                        <TableCell>{highlightMatch(r.contact_number ?? "—", searchTerm)}</TableCell>
                        <TableCell className="uppercase">{highlightMatch(r.po_number ?? "—", searchTerm)}</TableCell>
                        <TableCell>{highlightMatch(r.amount?.toString() ?? "0", searchTerm)}</TableCell>
                        <TableCell className="uppercase">{highlightMatch(r.so_number ?? "—", searchTerm)}</TableCell>
                        <TableCell>{formatDateOnly(r.so_date)}</TableCell>
                        <TableCell>{highlightMatch(r.sales_agent ?? "—", searchTerm)}</TableCell>
                        <TableCell>{pendingFromSO}</TableCell>
                        <TableCell>{highlightMatch(r.payment_terms ?? "—", searchTerm)}</TableCell>
                        <TableCell>{formatDateOnly(r.payment_date)}</TableCell>
                        <TableCell>{formatDateOnly(r.delivery_pickup_date)}</TableCell>
                        <TableCell>{pendingFromPayment}</TableCell>
                        <TableCell>{highlightMatch(r.status ?? "—", searchTerm)}</TableCell>
                        <TableCell>{highlightMatch(r.source ?? "—", searchTerm)}</TableCell>
                        <TableCell>{formatDate(r.date_created)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="font-bold">
                      {filteredRecords.reduce((sum, r) => sum + (Number(r.amount?.toString().replace(/,/g, "")) || 0), 0).toLocaleString()}
                    </TableCell>
                    <TableCell colSpan={10}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center items-center space-x-2 text-xs">
                <Button size="sm" variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>Prev</Button>
                <span>Page {currentPage} / {totalPages || 1}</span>
                <Button size="sm" variant="outline" onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>

      <SidebarRight
        userId={userId ?? undefined}
        dateCreatedFilterRange={dateCreatedFilterRange}
        setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
      />

      <POTrackingAddDialog
        isOpen={openAdd}
        onClose={() => setOpenAdd(false)}
        userId={userId ?? ""}
        onSave={(newRecord) => {
          setRecords((prev) => [newRecord, ...prev]);
          setOpenAdd(false);
        }}
      />

      <PODeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        record={recordToDelete}
        onDelete={(deletedRecord) => {
          setRecords((prev) => prev.filter((r) => r._id !== deletedRecord._id));
        }}
      />

      <POTrackingEditDialog
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setRecordToEdit(null); }}
        record={recordToEdit}
        onSave={(updatedRecord) => {
          setRecords((prev) => prev.map((r) => (r._id === updatedRecord._id ? updatedRecord : r)));
          setEditModalOpen(false);
          setRecordToEdit(null);
        }}
      />

      <POFilterDialog
        isOpen={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        setFilters={setFilters}
        salesAgents={salesAgents}
      />
    </>
  );
}

export default function Page() {
  return (
    <UserProvider>
      <FormatProvider>
        <SidebarProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <POContent />
          </Suspense>
        </SidebarProvider>
      </FormatProvider>
    </UserProvider>
  );
}
