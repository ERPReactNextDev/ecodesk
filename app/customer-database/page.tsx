"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { useSearchParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { type DateRange } from "react-day-picker";
import { CustomerDatabaseEditModal } from "./customer-database-edit-modal";
import { CustomerDatabaseHideModal } from "./customer-database-hide-modal";
import { Funnel, ChevronDown, ChevronUp } from "lucide-react";

interface Account {
  id: number;
  referenceid: string;
  manager: string | null;
  tsm: string | null;
  company_name: string | null;
  contact_person: string | null;
  contact_number: string | null;
  email_address: string | null;
  address: string | null;
  delivery_address: string | null;
  region: string | null;
  industry: string | null;
  remarks: string | null;
  status: string | null;
  date_created: string;
  date_updated: string;
  next_available_date: string | null;
  gender: string | null;
  type: string | null;
  account_reference_number: string | null;
  type_client: string | null;
  company_group: string | null;
  date_transferred: string | null;
}

interface UserDetails {
  referenceid: string;
}

function CustomerDatabaseContent() {
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
  const accountsPerPage = 10;
  const [dateCreatedFilterRange, setDateCreatedFilterRange] =
    useState<DateRange | undefined>(undefined);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false); // hidden by default

  /* Edit modal */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  /* Hide modal */
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  /* refs for horizontal scroll sync */
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScroll = useRef(false);

  const filterFields = [
    "Company Name",
    "Contact Person",
    "Contact Number",
    "Email",
    "Address",
    "Region",
    "Industry",
    "Type Client",
  ].sort();

  const getRelevanceScore = (text: string, search: string) => {
    const t = text.toLowerCase();
    const s = search.toLowerCase();

    if (!s) return 0;
    if (t === s) return 100;
    if (t.startsWith(s)) return 80;
    if (t.includes(s)) return 60;
    return 0;
  };

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

  const toggleFilter = (field: string) => {
    setActiveFilters((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
    setCurrentPage(1);
  };

  const filteredAccounts = accounts
    .filter(acc => acc.status !== "Removed") // <- filter out removed accounts
    .map((acc) => {
      const fieldMap: Record<string, string> = {
        "Company Name": acc.company_name ?? "",
        "Contact Person": acc.contact_person ?? "",
        "Contact Number": acc.contact_number ?? "",
        "Email": acc.email_address ?? "",
        "Address": acc.address ?? "",
        "Region": acc.region ?? "",
        "Industry": acc.industry ?? "",
        "Type Client": acc.type_client ?? "",
      };

   const fieldsToSearch =
      activeFilters.length > 0
        ? activeFilters.map((f) => fieldMap[f])
        : Object.values(fieldMap);

      const score = Math.max(...fieldsToSearch.map((f) => getRelevanceScore(f, searchTerm)));

      return { acc, score };
    })
    .filter((item) => item.score > 0 || searchTerm === "")
    .sort((a, b) => b.score - a.score)
    .map((item) => item.acc);

  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);
  const indexOfLast = currentPage * accountsPerPage;
  const indexOfFirst = indexOfLast - accountsPerPage;
  const currentAccounts = filteredAccounts.slice(indexOfFirst, indexOfLast);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const syncScroll = (
    source: "top" | "table",
    e: React.UIEvent<HTMLDivElement>
  ) => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;

    if (source === "top" && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }

    if (source === "table" && topScrollRef.current) {
      topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handleSaveAccount = (updated: Account) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === updated.id ? updated : acc))
    );
  };

  /* Handle Delete - now triggers Hide Modal */
  const handleDelete = (account: Account) => {
    setSelectedAccount(account);
    setHideModalOpen(true);
  };

  const handleHideSave = (updated: Account) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === updated.id ? updated : acc))
    );
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
          {/* Search and filter toggle */}
          <div className="mb-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                className="border px-3 py-1 rounded flex-1"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />

              {/* Filter Toggle Button */}
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 transition-all"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Funnel size={16} />
                {showFilters ? "Hide Filters" : "Show Filters"}
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </div>

            {/* Filters with animation */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                showFilters ? "max-h-96 mt-2 opacity-100" : "max-h-0 opacity-0"
              } flex flex-wrap gap-2`}
            >
              {filterFields.map((field) => (
                <Button
                  key={field}
                  variant={activeFilters.includes(field) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(field)}
                >
                  {field}
                </Button>
              ))}
            </div>
          </div>

          {loading && <p>Loading accounts...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && filteredAccounts.length === 0 && (
            <p>No accounts found.</p>
          )}

          {!loading && !error && filteredAccounts.length > 0 && (
            <div className="mb-2">
              {/* Top row: Showing + Pagination */}
              <div className="flex justify-between items-center">
                <span>
                  Showing {indexOfFirst + 1}-{Math.min(indexOfLast, filteredAccounts.length)} of{" "}
                  {filteredAccounts.length}
                </span>

                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  <span className="px-3 py-1">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Bottom row: CREATE ACCOUNT BUTTON (LEFT SIDE ONLY) */}
              <div className="mt-2">
                <Button
                  size="sm"
                  className="font-semibold"
                  onClick={() => {
                    // no function yet
                  }}
                >
                  + Create Account
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && currentAccounts.length > 0 && (
            <div
              ref={topScrollRef}
              onScroll={(e) => syncScroll("top", e)}
              className="sticky top-14 z-10 overflow-x-auto overflow-y-hidden border border-gray-200 bg-background"
            >
              <div className="min-w-[2400px] h-4"></div>
            </div>
          )}

          {!loading && !error && currentAccounts.length > 0 && (
            <div
              ref={tableScrollRef}
              onScroll={(e) => syncScroll("table", e)}
              className="overflow-auto"
            >
              <table className="min-w-[2400px] border border-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 whitespace-nowrap">Actions</th>
                    {[
                      "Reference ID",
                      "Company Name",
                      "Contact Person",
                      "Contact Number",
                      "Email",
                      "Address",
                      "Region",
                      "Industry",
                      "Type Client",
                    ].map((h) => (
                      <th key={h} className="px-4 py-2 whitespace-nowrap text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className={`border-t border-gray-200 ${
                        acc.type_client === "CSR Client"
                          ? "bg-yellow-50 hover:bg-yellow-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-2 flex gap-2">
                        {acc.type_client === "CSR Client" && (
                          <>
                            <Button
                              size="sm"
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
                      </td>
                      <td className="px-4 py-2">{acc.referenceid}</td>
                      <td className="px-4 py-2">{acc.company_name ?? "-"}</td>
                      <td className="px-4 py-2">{acc.contact_person ?? "-"}</td>
                      <td className="px-4 py-2">{acc.contact_number ?? "-"}</td>
                      <td className="px-4 py-2">{acc.email_address ?? "-"}</td>
                      <td className="px-4 py-2">{acc.address ?? "-"}</td>
                      <td className="px-4 py-2">{acc.region ?? "-"}</td>
                      <td className="px-4 py-2">{acc.industry ?? "-"}</td>
                      <td className="px-4 py-2">{acc.type_client ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredAccounts.length > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
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
