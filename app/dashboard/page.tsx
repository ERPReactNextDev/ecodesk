"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
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
import { toast } from "sonner";

import { AccountsCard } from "@/components/dashboard-accounts-card";
import { ClosedCard } from "@/components/dashboard-closed-card";
import { EndorsedCard } from "@/components/dashboard-endorsed-card";
import { ConvertedSalesCard } from "@/components/dashboard-converted-sales-card";
import { MetricsCard } from "@/components/dashboard-metrics-card";
import { ChannelCard } from "@/components/dashboard-channel-card";
import { SourceCard } from "@/components/dashboard-source-card";


interface UserDetails {
  referenceid: string;
  tsm?: string;
  manager?: string;
}

interface Activity {
  referenceid: string;
  channel?: string;
  source: string;
  status: string;
  traffic: string;
  so_amount: string;
  qty_sold: string;
}

function DashboardContent() {
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] = React.useState<
    DateRange | undefined
  >(undefined);

  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const [userDetails, setUserDetails] = useState<UserDetails>({
    referenceid: "",
    tsm: "",
    manager: "",
  });
  const [loadingUser, setLoadingUser] = useState(false);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [errorActivities, setErrorActivities] = useState<string | null>(null);

  const queryUserId = searchParams?.get("id") ?? "";

  useEffect(() => {
    if (!dateCreatedFilterRange) {
      const today = new Date();
      const from = new Date(today);
      from.setHours(0, 0, 0, 0);
      const to = new Date(today);
      to.setHours(23, 59, 59, 999);
      setDateCreatedFilterRangeAction({ from, to });
    }
  }, [dateCreatedFilterRange]);

  // Set userId from query params
  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [queryUserId, userId, setUserId]);

  // Fetch user data
  useEffect(() => {
    if (!userId) {
      setErrorUser("User ID is missing.");
      setLoadingUser(false);
      return;
    }

    const fetchUserData = async () => {
      setErrorUser(null);
      setLoadingUser(true);
      try {
        const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();

        setUserDetails({
          referenceid: data.ReferenceID || "",
          tsm: data.TSM || "",
          manager: data.Manager || "",
        });

        toast.success("User data loaded successfully!");
      } catch (err) {
        console.error("Error fetching user data:", err);
        setErrorUser("Failed to fetch user data");
        toast.error(
          "Failed to connect to server. Please try again later or refresh your network connection"
        );
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fetch activities by referenceid
  const fetchActivities = useCallback(async () => {
    if (!userDetails.referenceid) {
      setActivities([]);
      return;
    }
    setLoadingActivities(true);
    setErrorActivities(null);

    try {
      const res = await fetch(
        `/api/act-fetch-activity?referenceid=${encodeURIComponent(userDetails.referenceid)}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to fetch activities");
      }

      const json = await res.json();
      setActivities(json.data || []);
    } catch (error: any) {
      setErrorActivities(error.message || "Error fetching activities");
    } finally {
      setLoadingActivities(false);
    }
  }, [userDetails.referenceid]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <>
      <SidebarLeft />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-col gap-4 p-4">
          {/* Two cards in one row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AccountsCard />

            <ClosedCard
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <EndorsedCard
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <ConvertedSalesCard
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricsCard
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <ChannelCard
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <SourceCard
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />
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

export default function Page() {
  return (
    <UserProvider>
      <FormatProvider>
        <SidebarProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <DashboardContent />
          </Suspense>
        </SidebarProvider>
      </FormatProvider>
    </UserProvider>
  );
}
