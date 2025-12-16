"use client";

import React, { Suspense, useState, useEffect } from "react";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { useSearchParams } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { type DateRange } from "react-day-picker";
import { CustomerDatabaseEditModal } from "./customer-database-edit-modal";
import { CustomerDatabaseHideModal } from "./customer-database-hide-modal";
import { Funnel } from "lucide-react";

interface Account {
  id: number;
  referenceid: string;
  company_name: string | null;
  contact_person: string | null;
  contact_number: string | null;
  email_address: string | null;
  address: string | null;
  region: string | null;
  industry: string | null;
  type_client: string | null;
  status: string;
}

interface UserDetails {
  referenceid: string;
}

export function CustomerDatabaseContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const [userDetails, setUserDetails] = useState<UserDetails>({
    referenceid: "",
  });

  const queryUserId = searchParams?.get("id") ?? "";

  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [queryUserId, userId, setUserId]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const accountsPerPage = 20;
  const [dateCreatedFilterRange, setDateCreatedFilterRange] =
    useState<DateRange | undefined>(undefined);

  const [filterTypeClient, setFilterTypeClient] = useState<string | undefined>(undefined);
  const [filterIndustry, setFilterIndustry] = useState<string | undefined>(undefined);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  /* Edit modal */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  /* Hide modal */
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Agents state and loading
  const [agents, setAgents] = useState<{ Firstname: string; Lastname: string; ReferenceID: string }[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // Fetch all users (agents) from /api/fetch-all-users (no query params needed)
  useEffect(() => {
    async function fetchAgents() {
      setAgentsLoading(true);
      try {
        const res = await fetch('/api/fetch-agent');
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

  // Fetch user data based on userId (to get userDetails.referenceid)
  useEffect(() => {
    if (!userId) {
      setError("User ID is missing.");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setError(null);
      setLoading(true);
      try {
        const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();

        setUserDetails({
          referenceid: data.ReferenceID || "",
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fetch accounts
  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        const res = await fetch("/api/com-fetch-account");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch accounts");
        setAccounts(data.data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  // Filter and search accounts logic
  const filteredAccounts = accounts.filter((acc) => {
    if (["Removed", "Deletion", "Transferred"].includes(acc.status)) {
      return false;
    }

    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      acc.company_name?.toLowerCase().includes(searchLower) ||
      acc.contact_person?.toLowerCase().includes(searchLower) ||
      acc.referenceid?.toLowerCase().includes(searchLower) ||
      acc.contact_number?.toLowerCase().includes(searchLower) ||
      acc.email_address?.toLowerCase().includes(searchLower) ||
      acc.address?.toLowerCase().includes(searchLower) ||
      acc.region?.toLowerCase().includes(searchLower) ||
      acc.industry?.toLowerCase().includes(searchLower) ||
      acc.type_client?.toLowerCase().includes(searchLower);

    const matchesTypeClient = filterTypeClient ? acc.type_client === filterTypeClient : true;
    const matchesIndustry = filterIndustry ? acc.industry === filterIndustry : true;

    return matchesSearch && matchesTypeClient && matchesIndustry;
  });

  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);
  const indexOfLast = currentPage * accountsPerPage;
  const indexOfFirst = indexOfLast - accountsPerPage;
  const currentAccounts = filteredAccounts.slice(indexOfFirst, indexOfLast);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleSaveAccount = (updated: Account) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === updated.id ? updated : acc))
    );
  };

  const handleDelete = (account: Account) => {
    setSelectedAccount(account);
    setHideModalOpen(true);
  };

  const handleHideSave = (updated: Account) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === updated.id ? updated : acc))
    );
  };

  // Extract unique options for filters
  const uniqueTypeClients: string[] = Array.from(
    new Set(
      accounts
        .map((a) => a.type_client)
        .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    )
  );

  const uniqueIndustries: string[] = Array.from(
    new Set(
      accounts
        .map((a) => a.industry)
        .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    )
  );

  // Get agent name by ReferenceID
  const getAgentNameByReferenceID = (refId: string | null | undefined) => {
    if (!refId) return "-";
    const agent = agents.find((a) => a.ReferenceID === refId);
    return agent ? `${agent.Firstname} ${agent.Lastname}` : "-";
  };

  return (
    <>
      <SidebarLeft />

      <SidebarInset className="overflow-auto">
        <header className="bg-background sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    Customer Database
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
          {/* Search and Filter Toggle Row */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md"
            />

            <Button
              variant={filterDialogOpen ? "default" : "outline"}
              onClick={() => setFilterDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Funnel size={16} />
              Filter
            </Button>
          </div>

          {/* Filter Dialog */}
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filter Accounts</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block mb-1 font-medium text-sm">Type Client</label>
                  <Select
                    value={filterTypeClient ?? ""}
                    onValueChange={(value) =>
                      setFilterTypeClient(value === "__clear" ? undefined : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Type Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__clear">Clear</SelectItem>
                      {uniqueTypeClients.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block mb-1 font-medium text-sm">Industry</label>
                  <Select
                    value={filterIndustry ?? ""}
                    onValueChange={(value) =>
                      setFilterIndustry(value === "__clear" ? undefined : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__clear">Clear</SelectItem>
                      {uniqueIndustries.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterTypeClient(undefined);
                    setFilterIndustry(undefined);
                    setFilterDialogOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button onClick={() => setFilterDialogOpen(false)}>Apply</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Loading, Error and No Data states */}
          {loading && <p>Loading accounts...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!loading && !error && filteredAccounts.length === 0 && (
            <p>No accounts found.</p>
          )}

          {/* Table container */}
          {!loading && !error && currentAccounts.length > 0 && (
            <div className="overflow-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Actions</TableHead>
                    <TableHead>Account Owner</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Type Client</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAccounts.map((acc) => (
                    <TableRow key={acc.id} className="hover:bg-gray-50">
                      <TableCell className="flex gap-2">
                        {acc.type_client === "CSR Client" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingAccount(acc);
                                setEditModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(acc)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{getAgentNameByReferenceID(acc.referenceid)}</TableCell>
                      <TableCell>{acc.company_name ?? "-"}</TableCell>
                      <TableCell>{acc.contact_person ?? "-"}</TableCell>
                      <TableCell>{acc.contact_number ?? "-"}</TableCell>
                      <TableCell>{acc.email_address ?? "-"}</TableCell>
                      <TableCell>{acc.address ?? "-"}</TableCell>
                      <TableCell>{acc.region ?? "-"}</TableCell>
                      <TableCell>{acc.industry ?? "-"}</TableCell>
                      <TableCell>{acc.type_client ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && filteredAccounts.length > 0 && (
            <div className="mt-4 flex justify-center items-center space-x-2 text-xs">
              <Button
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              <span>
                Page {currentPage} / {totalPages || 1}
              </span>
              <Button
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </SidebarInset>

      <SidebarRight
        userId={userId ?? undefined}
        dateCreatedFilterRange={dateCreatedFilterRange}
        setDateCreatedFilterRangeAction={setDateCreatedFilterRange}
      />

      <CustomerDatabaseEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        account={editingAccount}
        onSave={handleSaveAccount}
      />

      <CustomerDatabaseHideModal
        isOpen={hideModalOpen}
        onClose={() => setHideModalOpen(false)}
        account={selectedAccount}
        onSave={handleHideSave}
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
            <CustomerDatabaseContent />
          </Suspense>
        </SidebarProvider>
      </FormatProvider>
    </UserProvider>
  );
}
