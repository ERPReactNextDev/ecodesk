"use client";

import React, { Suspense, useEffect, useState } from "react";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { useSearchParams } from "next/navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { DateRange } from "react-day-picker";

type OBCRecord = {
  id: number;
  activity_reference_number: string;
  referenceid: string;
  tsm: string;
  manager: string;
  type_client: string;
  project_name: string;
  product_category: string;
  project_type: string;
  source: string;
  target_quota: number;
  type_activity: string;
  callback: string | null;
  call_status: string;
  call_type: string;
  quotation_number: string;
  quotation_amount: number;
  so_number: string;
  so_amount: number;
  actual_sales: number;
  delivery_date: string | null;
  dr_number: string;
  ticket_reference_number: string;
  remarks: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  date_followup: string | null;
  date_site_visit: string | null;
  date_created: string;
  date_updated: string;
  account_reference_number: string;
  payment_terms: string;
  scheduled_status: string;
  product_quantity: string;
  product_amount: string;
  product_sku: string;
  product_title: string;
  quotation_type: string;
  si_date: string | null;
};

export function OBCContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();
  const queryUserId = searchParams?.get("id") ?? "";

  useEffect(() => {
    if (queryUserId && queryUserId !== userId) setUserId(queryUserId);
  }, [queryUserId, userId, setUserId]);

  const [records, setRecords] = useState<OBCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateCreatedFilterRange, setDateCreatedFilterRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const fetchOBCRecords = async () => {
      try {
        const res = await fetch("/api/ob-calls-fetch-activity");
        if (!res.ok) throw new Error("Failed to fetch OBC records");
        const json = await res.json();
        setRecords(json.data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchOBCRecords();
  }, []);

  return (
    <>
      <SidebarLeft />
      <SidebarInset className="overflow-auto">
        <header className="bg-background sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">Outbound Calls</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
          {/* Section Header */}
          <div className="mb-4">
            <h1 className="text-xl font-semibold">Outbound Calls</h1>
            <p className="text-sm text-muted-foreground mt-1">
              This section displays details about outbound calls made to clients. It
              includes a search and filter functionality to refine call records based
              on client type, date range, and other criteria. The total number of
              entries is shown to provide an overview of recorded outbound calls.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-40">
              <Spinner className="size-8" />
            </div>
          )}

          {error && <p className="text-destructive">{error}</p>}

          {!loading && !error && records.length > 0 && (
            <div className="overflow-auto">
              <Table className="min-w-[2000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Ref #</TableHead>
                    <TableHead>ReferenceID</TableHead>
                    <TableHead>TSM</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Type Client</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Product Category</TableHead>
                    <TableHead>Project Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Target Quota</TableHead>
                    <TableHead>Type Activity</TableHead>
                    <TableHead>Callback</TableHead>
                    <TableHead>Call Status</TableHead>
                    <TableHead>Call Type</TableHead>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Quotation Amount</TableHead>
                    <TableHead>SO #</TableHead>
                    <TableHead>SO Amount</TableHead>
                    <TableHead>Actual Sales</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>DR #</TableHead>
                    <TableHead>Ticket Ref #</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Date Followup</TableHead>
                    <TableHead>Date Site Visit</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Date Updated</TableHead>
                    <TableHead>Account Ref #</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Scheduled Status</TableHead>
                    <TableHead>Product Quantity</TableHead>
                    <TableHead>Product Amount</TableHead>
                    <TableHead>Product SKU</TableHead>
                    <TableHead>Product Title</TableHead>
                    <TableHead>Quotation Type</TableHead>
                    <TableHead>SI Date</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id} className="hover:bg-gray-50">
                      <TableCell>{r.activity_reference_number}</TableCell>
                      <TableCell>{r.referenceid}</TableCell>
                      <TableCell>{r.tsm}</TableCell>
                      <TableCell>{r.manager}</TableCell>
                      <TableCell>{r.type_client}</TableCell>
                      <TableCell>{r.project_name}</TableCell>
                      <TableCell>{r.product_category}</TableCell>
                      <TableCell>{r.project_type}</TableCell>
                      <TableCell>{r.source}</TableCell>
                      <TableCell>{r.target_quota}</TableCell>
                      <TableCell>{r.type_activity}</TableCell>
                      <TableCell>{r.callback || "-"}</TableCell>
                      <TableCell>{r.call_status}</TableCell>
                      <TableCell>{r.call_type}</TableCell>
                      <TableCell>{r.quotation_number}</TableCell>
                      <TableCell>{r.quotation_amount}</TableCell>
                      <TableCell>{r.so_number}</TableCell>
                      <TableCell>{r.so_amount}</TableCell>
                      <TableCell>{r.actual_sales}</TableCell>
                      <TableCell>{r.delivery_date || "-"}</TableCell>
                      <TableCell>{r.dr_number}</TableCell>
                      <TableCell>{r.ticket_reference_number}</TableCell>
                      <TableCell>{r.remarks}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.start_date || "-"}</TableCell>
                      <TableCell>{r.end_date || "-"}</TableCell>
                      <TableCell>{r.date_followup || "-"}</TableCell>
                      <TableCell>{r.date_site_visit || "-"}</TableCell>
                      <TableCell>{r.date_created}</TableCell>
                      <TableCell>{r.date_updated}</TableCell>
                      <TableCell>{r.account_reference_number}</TableCell>
                      <TableCell>{r.payment_terms}</TableCell>
                      <TableCell>{r.scheduled_status}</TableCell>
                      <TableCell>{r.product_quantity}</TableCell>
                      <TableCell>{r.product_amount}</TableCell>
                      <TableCell>{r.product_sku}</TableCell>
                      <TableCell>{r.product_title}</TableCell>
                      <TableCell>{r.quotation_type}</TableCell>
                      <TableCell>{r.si_date || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
