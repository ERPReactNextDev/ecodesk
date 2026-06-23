"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CSRQuotation {
  _id: string;
  referenceid: string;
  account_reference_number: string;
  status: string;
  company_name: string;
  contact_person: string;
  contact_number: string;
  email_address: string;
  type_client: string;
  address: string;
  activity_reference_number: string;
  date_created: string;
  date_updated: string;
  agent: string;
  channel: string;
  client_segment: string;
  customer_status: string;
  customer_type: string;
  delivery_date: string;
  department: string;
  department_head: string;
  gender: string;
  handling_csr: string;
  hr_acknowledge_date: string;
  inquiry: string;
  inquiry_received: string;
  item_code: string;
  item_description: string;
  manager: string;
  payment_date: string;
  payment_terms: string;
  po_number: string;
  po_source: string;
  qty_sold: string;
  quotation_amount: string;
  quotation_number: string;
  remarks: string;
  response_to_inquiry: string;
  so_amount: string;
  so_date: string;
  so_number: string;
  source: string;
  source_company: string;
  ticket_endorsed: string;
  ticket_received: string;
  ticket_reference_number: string;
  traffic: string;
  tsa_acknowledge_date: string;
  tsa_handling_time: string;
  tsm_acknowledge_date: string;
  tsm_handling_time: string;
  wrap_up: string;
  client_specs: string;
  close_reason: string;
  counter_offer: string;
  userName?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function CSRQuotationsTable() {
  const [quotations, setQuotations] = useState<CSRQuotation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const fetchUserName = async (referenceid: string) => {
    try {
      const response = await fetch(`/api/fetch-user-by-referenceid?referenceid=${encodeURIComponent(referenceid)}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.data && data.data.Firstname && data.data.Lastname) {
        return `${data.data.Firstname} ${data.data.Lastname}`;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user name:", err);
      return null;
    }
  };

  const fetchQuotations = async (page: number = 1, search: string = "") => {
    setError(null);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await fetch(`/api/fetch-csr-quotations?page=${page}&limit=10${searchParam}`);
      if (!response.ok) throw new Error("Failed to fetch quotations");
      const data = await response.json();
      setQuotations(data.data);
      setPagination(data.pagination);

      // Fetch user names for all quotations
      const namePromises = data.data.map(async (quotation: CSRQuotation) => {
        const name = await fetchUserName(quotation.referenceid);
        return { referenceid: quotation.referenceid, name };
      });

      const names = await Promise.all(namePromises);
      const nameMap: Record<string, string> = {};
      names.forEach(({ referenceid, name }) => {
        if (name) {
          nameMap[referenceid] = name;
        }
      });
      setUserNames(nameMap);
    } catch (err) {
      setError("Failed to load quotations");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuotations(1, "");
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchQuotations(newPage, searchTerm);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    fetchQuotations(1, value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSR Quotations</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive">{error}</p>}

        {!error && (
          <>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Quotation Number, Ticket Reference, Company Name, or Reference ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-30 bg-background">Reference ID</TableHead>
                    <TableHead className="sticky left-[120px] z-30 bg-background">User Name</TableHead>
                    <TableHead>Account Ref #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type Client</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Activity Ref #</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Date Updated</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Client Segment</TableHead>
                    <TableHead>Customer Status</TableHead>
                    <TableHead>Customer Type</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Department Head</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Handling CSR</TableHead>
                    <TableHead>HR Ack Date</TableHead>
                    <TableHead>Inquiry</TableHead>
                    <TableHead>Inquiry Received</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Description</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>PO Source</TableHead>
                    <TableHead>Qty Sold</TableHead>
                    <TableHead>Quotation Amount</TableHead>
                    <TableHead>Quotation Number</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Response to Inquiry</TableHead>
                    <TableHead>SO Amount</TableHead>
                    <TableHead>SO Date</TableHead>
                    <TableHead>SO Number</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Source Company</TableHead>
                    <TableHead>Ticket Endorsed</TableHead>
                    <TableHead>Ticket Received</TableHead>
                    <TableHead>Ticket Reference</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>TSA Ack Date</TableHead>
                    <TableHead>TSA Handling Time</TableHead>
                    <TableHead>TSM Ack Date</TableHead>
                    <TableHead>TSM Handling Time</TableHead>
                    <TableHead>Wrap Up</TableHead>
                    <TableHead>Client Specs</TableHead>
                    <TableHead>Close Reason</TableHead>
                    <TableHead>Counter Offer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow key={quotation._id}>
                      <TableCell className="sticky left-0 z-20 bg-background font-medium">
                        {quotation.referenceid}
                      </TableCell>
                      <TableCell className="sticky left-[120px] z-20 bg-background font-medium">
                        {userNames[quotation.referenceid] || quotation.referenceid}
                      </TableCell>
                      <TableCell>{quotation.account_reference_number}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            quotation.status === "Closed"
                              ? "bg-green-100 text-green-800"
                              : quotation.status === "Open"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {quotation.status}
                        </span>
                      </TableCell>
                      <TableCell>{quotation.company_name}</TableCell>
                      <TableCell>{quotation.contact_person}</TableCell>
                      <TableCell>{quotation.contact_number}</TableCell>
                      <TableCell>{quotation.email_address}</TableCell>
                      <TableCell>{quotation.type_client}</TableCell>
                      <TableCell>{quotation.address}</TableCell>
                      <TableCell>{quotation.activity_reference_number}</TableCell>
                      <TableCell>{formatDate(quotation.date_created)}</TableCell>
                      <TableCell>{formatDate(quotation.date_updated)}</TableCell>
                      <TableCell>{quotation.agent}</TableCell>
                      <TableCell>{quotation.channel}</TableCell>
                      <TableCell>{quotation.client_segment}</TableCell>
                      <TableCell>{quotation.customer_status}</TableCell>
                      <TableCell>{quotation.customer_type}</TableCell>
                      <TableCell>{quotation.delivery_date || "-"}</TableCell>
                      <TableCell>{quotation.department}</TableCell>
                      <TableCell>{quotation.department_head}</TableCell>
                      <TableCell>{quotation.gender}</TableCell>
                      <TableCell>{quotation.handling_csr}</TableCell>
                      <TableCell>{quotation.hr_acknowledge_date || "-"}</TableCell>
                      <TableCell>{quotation.inquiry}</TableCell>
                      <TableCell>{quotation.inquiry_received || "-"}</TableCell>
                      <TableCell>{quotation.item_code || "-"}</TableCell>
                      <TableCell>{quotation.item_description || "-"}</TableCell>
                      <TableCell>{quotation.manager}</TableCell>
                      <TableCell>{quotation.payment_date || "-"}</TableCell>
                      <TableCell>{quotation.payment_terms || "-"}</TableCell>
                      <TableCell>{quotation.po_number || "-"}</TableCell>
                      <TableCell>{quotation.po_source || "-"}</TableCell>
                      <TableCell>{quotation.qty_sold || "-"}</TableCell>
                      <TableCell>{quotation.quotation_amount}</TableCell>
                      <TableCell>{quotation.quotation_number}</TableCell>
                      <TableCell>{quotation.remarks}</TableCell>
                      <TableCell>{quotation.response_to_inquiry || "-"}</TableCell>
                      <TableCell>{quotation.so_amount || "-"}</TableCell>
                      <TableCell>{quotation.so_date || "-"}</TableCell>
                      <TableCell>{quotation.so_number || "-"}</TableCell>
                      <TableCell>{quotation.source}</TableCell>
                      <TableCell>{quotation.source_company}</TableCell>
                      <TableCell>{quotation.ticket_endorsed}</TableCell>
                      <TableCell>{quotation.ticket_received}</TableCell>
                      <TableCell>{quotation.ticket_reference_number}</TableCell>
                      <TableCell>{quotation.traffic}</TableCell>
                      <TableCell>{quotation.tsa_acknowledge_date}</TableCell>
                      <TableCell>{quotation.tsa_handling_time}</TableCell>
                      <TableCell>{quotation.tsm_acknowledge_date || "-"}</TableCell>
                      <TableCell>{quotation.tsm_handling_time || "-"}</TableCell>
                      <TableCell>{quotation.wrap_up}</TableCell>
                      <TableCell>{quotation.client_specs}</TableCell>
                      <TableCell>{quotation.close_reason}</TableCell>
                      <TableCell>{quotation.counter_offer}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} quotations
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {pagination.page} / {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
