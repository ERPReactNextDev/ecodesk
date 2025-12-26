"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { DateRange } from "react-day-picker";

type OBCRecord = {
  activity_reference_number: string;
  referenceid: string;
  tsm: string;
  manager: string;
  type_client: string;
  source: string;
  type_activity: string;
  call_status: string;
  call_type: string;
  remarks: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  date_followup: string | null;
  date_created: string;
  date_updated: string;
  account_reference_number: string;
};

const PAGE_SIZE = 10;

function OBCContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();
  const queryUserId = searchParams?.get("id") ?? "";

  useEffect(() => {
    if (queryUserId && queryUserId !== userId) setUserId(queryUserId);
  }, [queryUserId, userId, setUserId]);

  const [records, setRecords] = useState<OBCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [dateCreatedFilterRange, setDateCreatedFilterRange] = useState<DateRange | undefined>(undefined);
  const [typeClientFilter, setTypeClientFilter] = useState<string | null>(null);
  const [callStatusFilter, setCallStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/ob-calls-fetch-activity");
        if (!res.ok) throw new Error("Failed to fetch OBC records");
        const json = await res.json();
        setRecords(json.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /** 🔍 SEARCH — lahat ng fields */
  const filtered = useMemo(() => {
    let filteredRecords = records;

    if (search) {
      const q = search.toLowerCase();
      filteredRecords = filteredRecords.filter((r) =>
        Object.values(r)
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (typeClientFilter) {
      filteredRecords = filteredRecords.filter(
        (r) => r.type_client.toLowerCase() === typeClientFilter.toLowerCase()
      );
    }

    if (callStatusFilter) {
      filteredRecords = filteredRecords.filter(
        (r) => r.call_status.toLowerCase() === callStatusFilter.toLowerCase()
      );
    }

    if (sourceFilter) {
      filteredRecords = filteredRecords.filter(
        (r) => r.source.toLowerCase() === sourceFilter.toLowerCase()
      );
    }

    return filteredRecords;
  }, [records, search, typeClientFilter, callStatusFilter, sourceFilter]);

  /** 📄 PAGINATION */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // CSV Download Handler
  const handleDownloadCSV = () => {
    const csvRows: string[] = [];

    // Get the headers of the table
    const headers = [
      'Activity Ref #', 'ReferenceID', 'TSM', 'Manager', 'Type Client', 
      'Source', 'Type Activity', 'Call Status', 'Call Type', 'Remarks', 
      'Status', 'Start Date', 'End Date', 'Date Followup', 'Date Created', 
      'Date Updated', 'Account Ref #'
    ];
    csvRows.push(headers.join(','));

    // Add each row of data
    filtered.forEach((record) => {
      const row = [
        record.activity_reference_number || "-", 
        record.referenceid || "-", 
        record.tsm || "-", 
        record.manager || "-", 
        record.type_client || "-", 
        record.source || "-", 
        record.type_activity || "-", 
        record.call_status || "-", 
        record.call_type || "-", 
        record.remarks || "-", 
        record.status || "-", 
        record.start_date || "-", 
        record.end_date || "-", 
        record.date_followup || "-", 
        record.date_created || "-", 
        record.date_updated || "-", 
        record.account_reference_number || "-"
      ];
      csvRows.push(row.join(','));
    });

    // Create a Blob for CSV file and trigger download
    const csvData = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvData);
    const a = document.createElement('a');
    a.href = csvUrl;
    a.download = 'outbound_calls.csv';
    a.click();
    URL.revokeObjectURL(csvUrl);
  };

  return (
    <>
      <SidebarLeft />
      <SidebarInset className="overflow-auto">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Outbound Calls</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
          {/* HEADER TEXT */}
          <div>
            <h1 className="text-xl font-semibold">Outbound Calls</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-5xl">
              This section displays details about outbound calls made to clients.
            </p>
          </div>

          {/* SEARCH AND FILTER + DOWNLOAD CSV */}
          <div className="flex justify-between gap-3 items-center">
            {/* SEARCH AND FILTER */}
            <div className="flex gap-3">
              <Input
                placeholder="Search outbound calls..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="max-w-sm"
              />

              {/* Filter by Client Type */}
              <select
                className="border rounded p-2"
                value={typeClientFilter ?? ""}
                onChange={(e) => setTypeClientFilter(e.target.value || null)}
              >
                <option value="">Filter by Client Type</option>
                <option value="CSR Client">CSR Client</option>
                <option value="TSA Client">TSA Client</option>
              </select>

              {/* Filter by Call Status */}
              <select
                className="border rounded p-2"
                value={callStatusFilter ?? ""}
                onChange={(e) => setCallStatusFilter(e.target.value || null)}
              >
                <option value="">Filter by Call Status</option>
                <option value="Successful">Successful</option>
                <option value="Unsuccessful">Unsuccessful</option>
              </select>

              {/* Filter by Source */}
              <select
                className="border rounded p-2"
                value={sourceFilter ?? ""}
                onChange={(e) => setSourceFilter(e.target.value || null)}
              >
                <option value="">Filter by Source</option>
                <option value="Outbound - Touchbase">Outbound - Touchbase</option>
                <option value="Outbound - Follow-up">Outbound - Follow-up</option>
              </select>
            </div>

            {/* Download CSV Button */}
            <Button
              className="bg-green-500 text-white hover:bg-green-600"
              onClick={handleDownloadCSV}
            >
              Download CSV
            </Button>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Spinner className="size-8" />
            </div>
          )}

          {error && <p className="text-destructive">{error}</p>}

          {!loading && paginated.length > 0 && (
            <>
              <div className="overflow-auto">
                <Table className="min-w-[2600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity Ref #</TableHead>
                      <TableHead>ReferenceID</TableHead>
                      <TableHead>TSM</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Type Client</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type Activity</TableHead>
                      <TableHead>Call Status</TableHead>
                      <TableHead>Call Type</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Date Followup</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Date Updated</TableHead>
                      <TableHead>Account Ref #</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginated.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.activity_reference_number || "-"}</TableCell>
                        <TableCell>{r.referenceid || "-"}</TableCell>
                        <TableCell>{r.tsm || "-"}</TableCell>
                        <TableCell>{r.manager || "-"}</TableCell>
                        <TableCell>{r.type_client || "-"}</TableCell>
                        <TableCell>{r.source || "-"}</TableCell>
                        <TableCell>{r.type_activity || "-"}</TableCell>
                        <TableCell>{r.call_status || "-"}</TableCell>
                        <TableCell>{r.call_type || "-"}</TableCell>
                        <TableCell>{r.remarks || "-"}</TableCell>
                        <TableCell>{r.status || "-"}</TableCell>
                        <TableCell>{r.start_date || "-"}</TableCell>
                        <TableCell>{r.end_date || "-"}</TableCell>
                        <TableCell>{r.date_followup || "-"}</TableCell>
                        <TableCell>{r.date_created || "-"}</TableCell>
                        <TableCell>{r.date_updated || "-"}</TableCell>
                        <TableCell>{r.account_reference_number || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}
              <div className="flex justify-end items-center gap-3">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </main>
      </SidebarInset>

      <SidebarRight
        userId={userId ?? undefined}
        dateCreatedFilterRange={dateCreatedFilterRange}
        setDateCreatedFilterRangeAction={setDateCreatedFilterRange}
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
            <OBCContent />
          </Suspense>
        </SidebarProvider>
      </FormatProvider>
    </UserProvider>
  );
}
