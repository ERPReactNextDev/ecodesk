// app/help/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { UserProvider, useUser } from "@/contexts/UserContext";
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

import { type DateRange } from "react-day-picker";
import CsrSummaryPage from "./csr-summary/page";

function HelpContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const queryUserId = searchParams?.get("id") ?? "";
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] =
    useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [queryUserId, userId, setUserId]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <SidebarLeft />

      <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-background sticky top-0 flex h-14 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-base font-semibold">
                    Departmental
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-6 p-4 min-w-0 overflow-hidden">
          <div className="w-full flex-1 min-w-0 space-y-4">
            <h1 className="text-xl font-semibold">
              <div>Departmental Summary</div>
            </h1>
            <CsrSummaryPage />
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

export default function HelpPage() {
  return (
    <FormatProvider>
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <HelpContent />
        </Suspense>
      </SidebarProvider>
    </FormatProvider>
  );
}
