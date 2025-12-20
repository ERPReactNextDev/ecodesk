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

// IMPORT EDIT MODAL
import { EditRecordModal } from "./edit-record-modal";
// IMPORT HIDE MODAL
import { HideRecordModal } from "./hide-record-modal";

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

  const handleAddRecord = () => {
    router.push(`/reports/dtr/add-record?id=${userId}`);
  };

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
            <div className="flex justify-between items-center gap-2">
              <h2 className="text-xl font-semibold">D-Tracking Records</h2>
              <div className="flex gap-2">
                <Button className="bg-green-500 text-white hover:bg-green-600" onClick={handleDownloadCSV}>Download CSV</Button>
                <Button onClick={handleAddRecord}>Add Record</Button>
              </div>
            </div>

            {/* Search with Filter */}
            <div className="flex justify-end items-center gap-2 relative">
              <input
                type="text"
                placeholder="Search..."
                className="border rounded px-2 py-1 w-64"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              <button
                className="border rounded px-2 py-1 flex items-center gap-1 hover:bg-gray-100"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                Filter: {filterBy}
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-10 bg-white border rounded shadow-md z-10 w-52">
                  {filterColumns.map((col) => (
                    <div
                      key={col}
                      className={`px-3 py-1 cursor-pointer hover:bg-gray-100 ${
                        filterBy === col ? "font-semibold bg-gray-200" : ""
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

            {/* Table */}
            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Actions</th>
                    <th className="border px-2 py-1">Company</th>
                    <th className="border px-2 py-1">Customer Name</th>
                    <th className="border px-2 py-1">Contact Number</th>
                    <th className="border px-2 py-1">Ticket Type</th>
                    <th className="border px-2 py-1">Ticket Concern</th>
                    <th className="border px-2 py-1">Department</th>
                    <th className="border px-2 py-1">Sales Agent</th>
                    <th className="border px-2 py-1">TSM</th>
                    <th className="border px-2 py-1">Status</th>
                    <th className="border px-2 py-1">Nature of Concern</th>
                    <th className="border px-2 py-1">Remarks</th>
                    <th className="border px-2 py-1">Endorsed Date</th>
                    <th className="border px-2 py-1">Closed Date</th>
                    <th className="border px-2 py-1">Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((r: any) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="border px-2 py-1 flex gap-2">
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
                      </td>
                      <td className="border px-2 py-1">{r.company_name}</td>
                      <td className="border px-2 py-1">{r.customer_name}</td>
                      <td className="border px-2 py-1">{r.contact_number}</td>
                      <td className="border px-2 py-1">{r.ticket_type}</td>
                      <td className="border px-2 py-1">{r.ticket_concern}</td>
                      <td className="border px-2 py-1">{r.department}</td>
                      <td className="border px-2 py-1">{r.sales_agent}</td>
                      <td className="border px-2 py-1">{r.tsm}</td>
                      <td className="border px-2 py-1">{r.status}</td>
                      <td className="border px-2 py-1">{r.nature_of_concern}</td>
                      <td className="border px-2 py-1">{r.remarks || "—"}</td>
                      <td className="border px-2 py-1">{r.endorsed_date ? new Date(r.endorsed_date).toLocaleString() : "—"}</td>
                      <td className="border px-2 py-1">{r.closed_date ? new Date(r.closed_date).toLocaleString() : "—"}</td>
                      <td className="border px-2 py-1">{new Date(r.date_created).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={handlePrevPage} disabled={currentPage === 1}>Prev</Button>
                <span className="px-2 py-1">{currentPage} / {totalPages}</span>
                <Button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
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
