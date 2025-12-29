"use client";

import { useSearchParams } from "next/navigation";
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
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { type DateRange } from "react-day-picker";
import { DTR } from "@/components/reports-d-tracking";

import { toast } from "sonner";

interface UserDetails {
  referenceid: string;
  role: string;
}

function DTrackingContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const [userDetails, setUserDetails] = useState<UserDetails>({
    referenceid: "",
    role: "",
  });

  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] = React.useState<
    DateRange | undefined
  >(undefined);

  const queryUserId = searchParams?.get("id") ?? "";

  // Sync URL query param with userId context
  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [queryUserId, userId, setUserId]);

  // Fetch user details when userId changes
  useEffect(() => {
    if (!userId) {
      setError("User ID is missing.");
      setLoadingUser(false);
      return;
    }

    const fetchUserData = async () => {
      setError(null);
      setLoadingUser(true);
      try {
        const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();

        setUserDetails({
          referenceid: data.ReferenceID || "",
          role: data.Role || "",
        });

        toast.success("User data loaded successfully!");
      } catch (err) {
        console.error("Error fetching user data:", err);
        toast.error("Failed to connect to server. Please try again later or refresh your network connection");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

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
                <BreadcrumbPage>D-Tracking</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-col p-4">
          <DTR
            referenceid={userDetails.referenceid}
            role={userDetails.role}
            dateCreatedFilterRange={dateCreatedFilterRange}
            setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
          />
        </main>
      </SidebarInset>

      <SidebarRight
        userId={userId ?? undefined}
        dateCreatedFilterRange={dateCreatedFilterRange}
        setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
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
