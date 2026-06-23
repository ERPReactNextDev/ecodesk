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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface SalesUser {
  id: number;
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
  Email: string;
  Role: string;
  Department: string;
  Location: string;
  Company: string;
  Manager: string;
  TSM: string;
  Status: string;
  ContactNumber: string;
  profilePicture: string;
  Position: string;
  type_of_sales: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TypeOfSalesTableProps {
  referenceid: string;
  role: string;
}

export function TypeOfSalesTable({ referenceid, role }: TypeOfSalesTableProps) {
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async (page: number = 1, search: string = "") => {
    setError(null);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await fetch(`/api/fetch-sales-users?page=${page}&limit=10${searchParam}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    }
  };

  const handleTypeOfSalesChange = async (userId: number, value: string) => {
    setUpdatingUserId(userId);
    try {
      const response = await fetch("/api/update-type-of-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          typeOfSales: value,
        }),
      });

      if (!response.ok) throw new Error("Failed to update type of sales");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, type_of_sales: value } : user
        )
      );

      toast.success("Type of sales updated successfully");
    } catch (err) {
      toast.error("Failed to update type of sales");
      console.error(err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  useEffect(() => {
    fetchUsers(1, "");
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage, searchTerm);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    fetchUsers(1, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales users</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive">{error}</p>}

        {!error && (
          <>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Reference ID, Name, Email, Role, Position, Location, Manager, TSM, or Type of Sales..."
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
                    <TableHead className="sticky left-[120px] z-30 bg-background">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>TSM</TableHead>
                    <TableHead>Type of Sales</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="sticky left-0 z-20 bg-background font-medium">{user.ReferenceID}</TableCell>
                      <TableCell className="sticky left-[120px] z-20 bg-background">
                        {user.Firstname} {user.Lastname}
                      </TableCell>
                      <TableCell>{user.Email}</TableCell>
                      <TableCell>{user.Role}</TableCell>
                      <TableCell>{user.Position}</TableCell>
                      <TableCell>{user.Location}</TableCell>
                      <TableCell>{user.Manager}</TableCell>
                      <TableCell>{user.TSM}</TableCell>
                      <TableCell>
                        <Select
                          value={user.type_of_sales || ""}
                          onValueChange={(value) => handleTypeOfSalesChange(user.id, value)}
                          disabled={updatingUserId === user.id}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OFFICE">OFFICE</SelectItem>
                            <SelectItem value="PROJECT">PROJECT</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.Status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.Status}
                        </span>
                      </TableCell>
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
                {pagination.total} users
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
