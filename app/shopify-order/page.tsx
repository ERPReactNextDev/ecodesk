"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";

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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { type DateRange } from "react-day-picker";

/* =======================
   CONFIG
======================= */
const PAGE_SIZE = 5;

function ShopifyOrderContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  /* =======================
     STATE
  ======================= */
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const queryUserId = searchParams?.get("id") ?? "";
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] =
    useState<DateRange | undefined>(undefined);
    const [userReferenceId, setUserReferenceId] = useState<string>("");

  /* =======================
     USER ID SYNC
  ======================= */
  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [queryUserId, userId, setUserId]);

  /* =======================
     FETCH SHOPIFY ORDERS
  ======================= */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/shopify/shopify-fetch-order");
        const json = await res.json();

        if (!json.success) throw new Error(json.error);

        setOrders(json.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Shopify orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

    useEffect(() => {
    if (!userId) return;

    fetch(`/api/user?id=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        setUserReferenceId(data.ReferenceID || "");
      })
      .catch(() => {
        setUserReferenceId("");
      });
  }, [userId]);

  /* =======================
     FILTERED DATA
  ======================= */
  const filtered = useMemo(() => {
    let list = orders;

    if (startDate) {
      list = list.filter(
        (o) => new Date(o.created_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      list = list.filter(
        (o) => new Date(o.created_at) <= new Date(endDate)
      );
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter((o) => {
        const name = o.customer
          ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}`.toLowerCase()
          : "";
        const email = o.customer?.email?.toLowerCase() ?? "";

        return name.includes(q) || email.includes(q);
      });
    }

    return list;
  }, [orders, query, startDate, endDate]);

  /* =======================
     PAGINATION
  ======================= */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [query, startDate, endDate]);

  /* =======================
     ADD HANDLER
  ======================= */
const handleAdd = async (order: any) => {
  if (!userId) {
    toast.error("User session missing");
    return;
  }

  const fullName = order.customer
    ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim()
    : "Shopify Customer";

  try {
    const payload = {
      referenceid: userReferenceId,

      status: "On-Progress",
      channel: "Shopify",
      wrap_up: "Customer Order",
      source: "Shopify",

      // ✅ NOW STORED IN MONGODB
      contact_person: fullName,

      inquiry: `Shopify Order - ${fullName} (${order.name})`,

      ticket_received: order.created_at,
      ticket_endorsed: order.created_at,

      email_address: order.customer?.email ?? "",
      contact_number: order.customer?.phone ?? "",

      activity_reference_number: `SHOPIFY-${order.id}`,
      account_reference_number: `SHOPIFY-${order.id}`,
    };

    const res = await fetch("/api/act-save-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Failed to add Shopify inquiry");
      return;
    }

    toast.success("Shopify order added to Inquiries");
  } catch (err) {
    console.error(err);
    toast.error("Error adding Shopify order");
  }
};


  /* =======================
     MOUNT CHECK
  ======================= */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      <SidebarLeft />

      <SidebarInset>
        {/* Header */}
        <header className="bg-background sticky top-0 flex h-14 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-base font-semibold">
                    Shopify Order
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-6 p-4">
          <div className="mx-auto w-full max-w-5xl space-y-4">

            {/* SEARCH */}
            <Input
              placeholder="Search customer name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-sm"
            />

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading orders…</p>
            ) : paginated.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Shopify orders found.
              </p>
            ) : (
              <>
                {paginated.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    {/* ORDER HEADER */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">
                          {order.customer
                            ? `${order.customer.first_name} ${order.customer.last_name}`
                            : order.billing_address?.name ??
                              order.shipping_address?.name ??
                              "Guest Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer?.email ?? "No email"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs rounded bg-muted px-2 py-1 capitalize">
                          {order.financial_status}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleAdd(order)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* PRODUCTS */}
                    <div className="space-y-3">
                      {order.line_items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex gap-4 items-center border rounded p-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {item.sku || "N/A"} | Qty: {item.quantity}
                            </p>
                          </div>

                          <div className="text-sm font-semibold">
                            ₱{item.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* PAGINATION */}
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SidebarInset>

      <SidebarRight
        userId={userId ?? undefined}
        dateCreatedFilterRange={dateCreatedFilterRange}
        setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
      />
    </>
  );
}

export default function ShopifyOrderPage() {
  return (
    <FormatProvider>
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <ShopifyOrderContent />
        </Suspense>
      </SidebarProvider>
    </FormatProvider>
  );
}
