"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
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
import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { AddRecordModal } from "@/components/reports-tracking-add-dialog";
// IMPORT EDIT MODAL
import { EditRecordModal } from "@/components/reports-tracking-edit-dialog";
// IMPORT HIDE MODAL
import { HideRecordModal } from "@/components/reports-tracking-delete-dialog";

function DTrackingContent() {
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] = useState<any>(undefined);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<string>("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const router = useRouter();
  const { userId, setUserId } = useUser();

  // EDIT MODAL STATE
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // HIDE MODAL STATE
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [recordToHide, setRecordToHide] = useState<any>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const filterColumns = [
    "All",
    "Company",
    "Customer Name",
    "Contact Number",
    "Ticket Type",
    "Ticket Concern",
    "Department",
    "Sales Agent",
    "TSM",
    "Status",
    "Nature of Concern",
    "Remarks",
  ];

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryUserId = searchParams.get("id") ?? "";
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [userId, setUserId]);


  // Fetch records (only active)
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch("/api/d-tracking-fetch-record");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // 🔹 Filter out inactive records just in case
          const activeRecords = json.data.filter((r: any) => r.isActive !== false);
          setRecords(activeRecords);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("Failed to fetch D-Tracking records:", err);
        setRecords([]);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const term = searchTerm.toLowerCase();
    return records.filter((r) => {
      if (filterBy === "All") {
        return [
          r.company_name,
          r.customer_name,
          r.contact_number,
          r.ticket_type,
          r.ticket_concern,
          r.department,
          r.sales_agent,
          r.tsm,
          r.status,
          r.nature_of_concern,
          r.remarks,
        ].some((field) => field?.toString().toLowerCase().includes(term));
      } else {
        switch (filterBy) {
          case "Company": return r.company_name?.toString().toLowerCase().includes(term);
          case "Customer Name": return r.customer_name?.toString().toLowerCase().includes(term);
          case "Contact Number": return r.contact_number?.toString().toLowerCase().includes(term);
          case "Ticket Type": return r.ticket_type?.toString().toLowerCase().includes(term);
          case "Ticket Concern": return r.ticket_concern?.toString().toLowerCase().includes(term);
          case "Department": return r.department?.toString().toLowerCase().includes(term);
          case "Sales Agent": return r.sales_agent?.toString().toLowerCase().includes(term);
          case "TSM": return r.tsm?.toString().toLowerCase().includes(term);
          case "Status": return r.status?.toString().toLowerCase().includes(term);
          case "Nature of Concern": return r.nature_of_concern?.toString().toLowerCase().includes(term);
          case "Remarks": return r.remarks?.toString().toLowerCase().includes(term);
          default: return true;
        }
      }
    });
  }, [records, searchTerm, filterBy]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleDownloadCSV = () => {
    const headers = [
      "Company", "Customer Name", "Contact Number", "Ticket Type", "Ticket Concern",
      "Department", "Sales Agent", "TSM", "Status", "Nature of Concern",
      "Endorsed Date", "Closed Date", "Date Created"
    ];
    const csvRows = [
      headers.join(","),
      ...filteredRecords.map((r) => [
        `"${r.company_name}"`,
        `"${r.customer_name}"`,
        `"${r.contact_number}"`,
        `"${r.ticket_type}"`,
        `"${r.ticket_concern}"`,
        `"${r.department}"`,
        `"${r.sales_agent}"`,
        `"${r.tsm}"`,
        `"${r.status}"`,
        `"${r.nature_of_concern}"`,
        `"${r.remarks ?? ""}"`,
        `"${r.endorsed_date ? new Date(r.endorsed_date).toLocaleString() : ""}"`,
        `"${r.closed_date ? new Date(r.closed_date).toLocaleString() : ""}"`,
        `"${new Date(r.date_created).toLocaleString()}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `d_tracking_${new Date().toISOString()}.csv`);
    link.click();
  };

  return (
    <>
      <SidebarLeft />
      <SidebarInset className="overflow-hidden">
        <header className="bg-background sticky top-0 flex h-14 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>D-Tracking</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          <div className="border rounded p-4 space-y-4">
            {/* Search with Filter */}
            <div className="flex justify-between items-center gap-2 relative">
              {/* Left side: Search + Add Record */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search..."
                  className="w-100"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Button onClick={() => setAddModalOpen(true)}>Add Record</Button>
              </div>

              {/* Right side: Filter + Download */}
              <div className="flex items-center gap-2 relative">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  Filter: {filterBy}
                </Button>
                <Button
                  className="bg-green-500 text-white hover:bg-green-600"
                  onClick={handleDownloadCSV}
                >
                  Download CSV
                </Button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-10 bg-white border rounded shadow-md z-10 w-52">
                    {filterColumns.map((col) => (
                      <div
                        key={col}
                        className={`px-3 py-1 cursor-pointer hover:bg-gray-100 ${filterBy === col ? "font-semibold bg-gray-200" : ""
                          }`}
                        onClick={() => {
                          setFilterBy(col);
                          setShowFilterDropdown(false);
                          setCurrentPage(1);
                        }}
                      >
                        {col}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actions</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Ticket Concern</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Sales Agent</TableHead>
                    <TableHead>TSM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nature of Concern</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Endorsed Date</TableHead>
                    <TableHead>Closed Date</TableHead>
                    <TableHead>Date Created</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedRecords.map((r: any) => (
                    <TableRow key={r._id ?? r.company_name + r.customer_name /* or fallback */}>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRecord(r);
                            setEditModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setRecordToHide(r);
                            setHideModalOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                      <TableCell className="uppercase">{r.company_name}</TableCell>
                      <TableCell className="capitalize">{r.customer_name}</TableCell>
                      <TableCell>{r.contact_number}</TableCell>
                      <TableCell>{r.ticket_type}</TableCell>
                      <TableCell>{r.ticket_concern}</TableCell>
                      <TableCell>{r.department}</TableCell>
                      <TableCell>{r.sales_agent}</TableCell>
                      <TableCell>{r.tsm}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.nature_of_concern}</TableCell>
                      <TableCell>{r.remarks || "—"}</TableCell>
                      <TableCell>{r.endorsed_date ? new Date(r.endorsed_date).toLocaleString() : "—"}</TableCell>
                      <TableCell>{r.closed_date ? new Date(r.closed_date).toLocaleString() : "—"}</TableCell>
                      <TableCell>{new Date(r.date_created).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center items-center space-x-2 text-xs">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPage} disabled={currentPage === 1}
                >
                  Prev
                </Button>

                <span>
                  Page {currentPage} / {totalPages || 1}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage} disabled={currentPage === totalPages}
                >
                  Next
                </Button>
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

      <AddRecordModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={(newRecord) => {
          setRecords((prev) => [newRecord, ...prev]);
          setAddModalOpen(false);
        }}
      />


      {/* EDIT MODAL */}
      <EditRecordModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        record={selectedRecord}
        onSave={(updatedRecord) => {
          setRecords((prev) =>
            prev.map((r) => (r._id === updatedRecord._id ? updatedRecord : r))
          );
        }}
      />

      {/* HIDE MODAL */}
      <HideRecordModal
        isOpen={hideModalOpen}
        onClose={() => setHideModalOpen(false)}
        record={recordToHide}
        onHide={(updatedRecord) => {
          // Remove the hidden record from state immediately
          setRecords((prev) =>
            prev.filter((r) => r._id !== updatedRecord._id)
          );
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
            <DTrackingContent />
          </Suspense>
        </SidebarProvider>
      </FormatProvider>
    </UserProvider>
  );
}
