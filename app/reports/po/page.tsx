"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { POTrackingAddDialog } from "@/components/po-tracking-add-dialog";
import { PODeleteModal } from "@/components/po-delete-dialog";
import { EditPO as POTrackingEditDialog } from "@/components/po-tracking-edit-dialog";

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
  Firstname?: string;
  Lastname?: string;
}

interface Company {
  account_reference_number: string;
  company_name: string;
  contact_number?: string[];
}

function POContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const [userDetails, setUserDetails] = useState<UserDetails>({ referenceid: "" });
  const [records, setRecords] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] = useState<any>(undefined);

  const [openAdd, setOpenAdd] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<any | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errorCompanies, setErrorCompanies] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const queryUserId = searchParams?.get("id") ?? "";

  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
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
        });
        toast.success("User data loaded successfully!");
      } catch (err) {
        console.error("Error fetching user data:", err);
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

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of companies) {
      if (c.account_reference_number) {
        map[c.account_reference_number] = c.company_name;
      }
    }
    return map;
  }, [companies]);

  const recordsWithCompanyName = useMemo(() => {
    return records.map((r) => {
      // Assuming the account_reference_number is in r.account_reference_number (adjust if needed)
      const acctRef = r.account_reference_number || r.company_ref_number || r.company_name;
      const actualCompanyName = companyMap[acctRef] || "Unknown Company";
      return {
        ...r,
        company_name: actualCompanyName,
      };
    });
  }, [records, companyMap]);

  useEffect(() => {
    if (!userDetails.referenceid) return;

    const fetchRecords = async () => {
      try {
        const res = await fetch(`/api/po-fetch-record?referenceid=${encodeURIComponent(userDetails.referenceid)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const activeRecords = json.data.filter((r: any) => r.isActive !== false);
          setRecords(activeRecords);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("Failed to fetch PO records:", err);
        setRecords([]);
      }
    };

    fetchRecords();
    const intervalId = setInterval(fetchRecords, 500);
    return () => clearInterval(intervalId);
  }, [userDetails.referenceid]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return recordsWithCompanyName;
    const term = searchTerm.toLowerCase();
    return recordsWithCompanyName.filter((r) =>
      [
        r.csr_agent,
        r.company_name, // which is account_reference_number now
        r.contact_number,
        r.po_number,
        r.amount,
        r.so_number,
        r.so_date,
        r.sales_agent,
        r.payment_terms,
        r.payment_date,
        r.delivery_pickup_date,
        r.status,
        r.source,
      ].some((field) => field?.toString().toLowerCase().includes(term))
    );
  }, [recordsWithCompanyName, searchTerm]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

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

    const rows = recordsWithCompanyName.map((r) => {
      const soDate = r.so_date ? new Date(r.so_date) : null;
      const paymentDate = r.payment_date ? new Date(r.payment_date) : null;
      const pendingFromSO = soDate ? Math.floor((today.getTime() - soDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const pendingFromPayment = paymentDate ? Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      return [
        `${userDetails.Firstname ?? ""} ${userDetails.Lastname ?? ""}`.trim(),
        r.company_name,
        r.contact_number ?? "",
        (r.amount ? r.amount.toString().replace(/,/g, "") : "0"),
        r.amount,
        r.so_number,
        r.so_date ?? "",
        r.sales_agent,
        pendingFromSO,
        r.payment_terms ?? "",
        r.payment_date ?? "",
        r.delivery_pickup_date ?? "",
        pendingFromPayment,
        r.status,
        r.source,
        r.date_created ?? "",
      ];
    });

    const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount?.toString().replace(/,/g, "")) || 0), 0);
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

        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          <div className="border rounded p-4 space-y-4">
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
                <Button
                  className="bg-green-500 text-white hover:bg-green-600"
                  onClick={() => handleDownloadCSV()}
                >
                  Download CSV
                </Button>
                <Button onClick={() => setOpenAdd(true)}>Add Record</Button>
              </div>
            </div>

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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRecordToEdit(r);
                              setEditModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRecordToDelete(r);
                              setDeleteModalOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>

                        <TableCell className="capitalize">{`${userDetails.Firstname ?? ""} ${userDetails.Lastname ?? ""}`.trim() || "—"}</TableCell>
                        <TableCell className="uppercase">{r.company_name}</TableCell>
                        <TableCell>{r.contact_number ?? "—"}</TableCell>
                        <TableCell className="uppercase">{r.po_number}</TableCell>
                        <TableCell>{r.amount}</TableCell>
                        <TableCell className="uppercase">{r.so_number}</TableCell>
                        <TableCell>{r.so_date ?? "—"}</TableCell>
                        <TableCell>{r.sales_agent}</TableCell>
                        <TableCell>{pendingFromSO}</TableCell>
                        <TableCell>{r.payment_terms ?? "—"}</TableCell>
                        <TableCell>{r.payment_date ?? "—"}</TableCell>
                        <TableCell>{r.delivery_pickup_date ?? "—"}</TableCell>
                        <TableCell>{pendingFromPayment}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>{r.source}</TableCell>
                        <TableCell>{r.date_created ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}

                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="font-bold">
                      {paginatedRecords
                        .reduce((sum, r) => sum + (Number(r.amount?.toString().replace(/,/g, "")) || 0), 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell colSpan={10}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

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
          setRecords((prev) =>
            prev.filter((r) => r._id !== deletedRecord._id)
          );
        }}
      />

      <POTrackingEditDialog
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setRecordToEdit(null);
        }}
        record={recordToEdit}
        onSave={(updatedRecord) => {
          setRecords((prev) =>
            prev.map((r) => (r._id === updatedRecord._id ? updatedRecord : r))
          );
          setEditModalOpen(false);
          setRecordToEdit(null);
        }}
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
