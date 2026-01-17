"use client";

import React, { useEffect, useState, useCallback, Suspense, useRef } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button"
import { toast } from "sonner";

import { AccountsCard } from "@/components/dashboard-accounts-card";
import { ClosedCard } from "@/components/dashboard-closed-card";
import { EndorsedCard } from "@/components/dashboard-endorsed-card";
import { ConvertedSalesCard } from "@/components/dashboard-converted-sales-card";
import { MetricsCard } from "@/components/dashboard-metrics-card";
import { WeeklyInboundCard } from "@/components/dashboard-weekly-inbound-card";
import InboundTrafficGenderCard from "@/components/dashboard-inbound-traffic-gender-card";
import CustomerStatusCard from "@/components/dashboard-customer-status-card";
import CustomerTypeCard from "@/components/dashboard-customer-type-card";
import SourceCompanyCard from "@/components/dashboard-source-company-card";
import ChannelCard from "@/components/dashboard-channel-card";
import SourceCard from "@/components/dashboard-source-card";
import WrapUpCard from "@/components/dashboard-wrapup-card";
import { WrapUpWeeklyCard } from "@/components/dashboard-weekly-wrapup-card";
import AgentSalesTableCard from "@/components/dashboard-agent-sales-conversion-table";
import AgentSalesTableWeeklyCard from "@/components/dashboard-agent-sales-conversion-table-weekly";
import TSASalesTableCard from "@/components/dashboard-tsa-sales-conversion-table";
import TSMSalesTableCard from "@/components/dashboard-tsm-sales-conversion-table";

interface UserDetails {
  referenceid: string;
  tsm?: string;
  manager?: string;
  role: string;
}

interface Company {
  account_reference_number: string;
  company_name: string;
  contact_person: string;
}

interface Activity {
  account_reference_number: string;
  referenceid: string;
  channel?: string;
  source: string;
  status: string;
  traffic: string;
  so_amount: string;
  qty_sold: string;
  gender: string;
  wrap_up: string;
  customer_status: string;
  customer_type: string;
  source_company: string;
  company_name: string;
  contact_person?: string;
  remarks: string;
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
    role: "",
  });
  const [loadingUser, setLoadingUser] = useState(false);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [errorActivities, setErrorActivities] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errorCompanies, setErrorCompanies] = useState<string | null>(null);
  const [selectedExport, setSelectedExport] = useState<string>("");

  // Ref to access ChannelCard download function
  const channelCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const sourceCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const inboundTrafficCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const customerStatusCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const customerTypeCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const companyDistributionCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const wrapupCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const tsaSalesTrafficCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const agentSalesCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const agentSalesWeeklyCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const tsmSalesTrafficCardRef = useRef<{ downloadCSV: () => void } | null>(null);
  const queryUserId = searchParams?.get("id") ?? "";

useEffect(() => {
  if (dateCreatedFilterRange) return;

  const raw = localStorage.getItem("date-filter-dialog");

  // ✅ If may saved filter, HUWAG galawin
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.from && parsed?.to) return;
    } catch {
      localStorage.removeItem("date-filter-dialog");
    }
  }

  // ✅ Fallback ONLY if walang saved filter
  const today = new Date();
  const from = new Date(today);
  from.setHours(0, 0, 0, 0);
  const to = new Date(today);
  to.setHours(23, 59, 59, 999);
  setDateCreatedFilterRangeAction({ from, to });
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
          role: data.Role || "",
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

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    setErrorCompanies(null);

    try {
      const res = await fetch("/api/com-fetch-account", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch company data");
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (err: any) {
      setErrorCompanies(err.message || "Error fetching company data");
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  // Fetch activities by referenceid
  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    setErrorActivities(null);

    try {
      // If Admin, don't filter by referenceid; else filter by referenceid
      const url = userDetails.role === "Admin"
        ? `/api/act-fetch-activity`  // fetch all activities for Admin (API should support this)
        : `/api/act-fetch-activity?referenceid=${encodeURIComponent(userDetails.referenceid)}`;

      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to fetch activities");
      }

      const json = await res.json();
      let fetchedActivities: Activity[] = json.data || [];

      // Merge company info by matching account_reference_number
      const mergedActivities = fetchedActivities.map((activity) => {
        const matchedCompany = companies.find(
          (comp) => comp.account_reference_number === activity.account_reference_number
        );
        return {
          ...activity,
          company_name: matchedCompany?.company_name ?? "",
          contact_person: matchedCompany?.contact_person ?? "",
        };
      });

      setActivities(mergedActivities);
    } catch (error: any) {
      setErrorActivities(error.message || "Error fetching activities");
    } finally {
      setLoadingActivities(false);
    }
  }, [userDetails.role, userDetails.referenceid, companies]);

  // Fetch companies on mount or when user changes
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleExportAll = () => {
    // Kung meron kang multiple refs na may downloadCSV method, tawagin lahat sila dito
    if (channelCardRef.current) {
      channelCardRef.current.downloadCSV();
    }
    if (sourceCardRef.current) {
      sourceCardRef.current.downloadCSV();
    }
    if (inboundTrafficCardRef.current) {
      inboundTrafficCardRef.current.downloadCSV();
    }
    if (customerStatusCardRef.current) {
      customerStatusCardRef.current.downloadCSV();
    }
    if (customerTypeCardRef.current) {
      customerTypeCardRef.current.downloadCSV();
    }
    if (companyDistributionCardRef.current) {
      companyDistributionCardRef.current.downloadCSV();
    }
    if (wrapupCardRef.current) {
      wrapupCardRef.current.downloadCSV();
    }
    if (tsaSalesTrafficCardRef.current) {
      tsaSalesTrafficCardRef.current.downloadCSV();
    }
    if (agentSalesCardRef.current) {
      agentSalesCardRef.current.downloadCSV();
    }
    if (agentSalesWeeklyCardRef.current) {
      agentSalesWeeklyCardRef.current.downloadCSV();
    }
    if (tsmSalesTrafficCardRef.current) {
      tsmSalesTrafficCardRef.current.downloadCSV();
    }
    // Kung may iba pang cards na may export, idagdag rin dito
    toast.success("Exported all available data!");
  };

  const handleExportDownload = () => {
    console.log("Selected export option:", selectedExport);
    if (selectedExport === "Export Channel Usage") {
      if (channelCardRef.current) {
        console.log("Calling downloadCSV from ChannelCard");
        channelCardRef.current.downloadCSV();
      } else {
        console.log("channelCardRef.current is null");
      }
    } else if (selectedExport === "Export Source Usage") {
      if (sourceCardRef.current) {
        console.log("Calling downloadCSV from SourceCard");
        sourceCardRef.current.downloadCSV();
      } else {
        console.log("sourceCardRef.current is null");
      }
    } else if (selectedExport === "Export Inbound Traffic by Gender") {
      if (inboundTrafficCardRef.current) {
        console.log("Calling downloadCSV from InboundTrafficGenderCard");
        inboundTrafficCardRef.current.downloadCSV();
      } else {
        console.log("inboundTrafficCardRef.current is null");
      }
    } else if (selectedExport === "Export Customer Status Distribution") {
      if (customerStatusCardRef.current) {
        console.log("Calling downloadCSV from CustomerStatusCard");
        customerStatusCardRef.current.downloadCSV();
      } else {
        console.log("customerStatusCardRef.current is null");
      }
    } else if (selectedExport === "Export Type Distribution") {
      if (customerTypeCardRef.current) {
        console.log("Calling downloadCSV from CustomerTypeCard");
        customerTypeCardRef.current.downloadCSV();
      } else {
        console.log("customerTypeCardRef.current is null");
      }
    } else if (selectedExport === "Export Company Distribution") {
      if (companyDistributionCardRef.current) {
        console.log("Calling downloadCSV from SourceCompanyCard");
        companyDistributionCardRef.current.downloadCSV();
      } else {
        console.log("companyDistributionCardRef.current is null");
      }
    } else if (selectedExport === "Export Company Distribution") {
      if (wrapupCardRef.current) {
        console.log("Calling downloadCSV from WrapUpCard");
        wrapupCardRef.current.downloadCSV();
      } else {
        console.log("wrapupCardRef.current is null");
      }
    } else if (selectedExport === "Export TSA Sales Traffic") {
      if (tsaSalesTrafficCardRef.current) {
        console.log("Calling downloadCSV from TSASalesTrafficCard");
        tsaSalesTrafficCardRef.current.downloadCSV();
      } else {
        console.log("tsaSalesTrafficCardRef.current is null");
      }
    } else if (selectedExport === "Export TSM Sales Traffic") {
      if (tsmSalesTrafficCardRef.current) {
        console.log("Calling downloadCSV from TSMSalesTrafficCard");
        tsmSalesTrafficCardRef.current.downloadCSV();
      } else {
        console.log("tsmSalesTrafficCardRef.current is null");
      }
    } else if (selectedExport === "Export All") {
      handleExportAll();
    } else {
      toast.error("Please select a valid export option");
    }
  };

  return (
    <>
      <SidebarLeft />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 px-3 z-[50]">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />

          <div className="flex justify-between items-center w-full">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center space-x-2">
              <Select defaultValue="" onValueChange={(value) => setSelectedExport(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Export All">Export All</SelectItem>
                  <SelectItem value="Export Channel Usage">Export Channel Usage</SelectItem>
                  <SelectItem value="Export Source Usage">Export Wrap Up Usage</SelectItem>
                  <SelectItem value="Export Inbound Traffic by Gender">Export Inbound Traffic by Gender</SelectItem>
                  <SelectItem value="Export Customer Status Distribution">Export Customer Status Distribution</SelectItem>
                  <SelectItem value="Export Type Distribution">Export Type Distribution</SelectItem>
                  <SelectItem value="Export Company Distribution">Export Company Distribution</SelectItem>
                  <SelectItem value="Export Wrap Up Distribution">Export Wrap Up Distribution</SelectItem>
                  <SelectItem value="Export TSA Sales Traffic">Export TSA Sales</SelectItem>
                  <SelectItem value="Export TSM Sales Traffic">Export TSM Sales</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExportDownload}>
                Download as CSV
              </Button>
            </div>
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

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <AgentSalesTableCard
            ref={agentSalesCardRef}
            dateCreatedFilterRange={dateCreatedFilterRange}
            setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            userReferenceId={userDetails.referenceid}
            role={userDetails.role}
          />

            <AgentSalesTableWeeklyCard
              ref={agentSalesWeeklyCardRef}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

<TSASalesTableCard
  ref={tsaSalesTrafficCardRef}
  dateCreatedFilterRange={dateCreatedFilterRange}
  setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
  userReferenceId={userDetails.referenceid}
  role={userDetails.role}
/>


            <TSMSalesTableCard
              ref={tsmSalesTrafficCardRef}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricsCard
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <WeeklyInboundCard
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <ChannelCard
              ref={channelCardRef}
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <SourceCard
              ref={sourceCardRef}
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InboundTrafficGenderCard
              ref={inboundTrafficCardRef}
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <CustomerStatusCard
              ref={customerStatusCardRef}
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <CustomerTypeCard
              ref={customerTypeCardRef}
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <SourceCompanyCard
              ref={companyDistributionCardRef}
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WrapUpCard
              ref={wrapupCardRef}
              activities={activities}
              loading={loadingActivities}
              error={errorActivities}
              dateCreatedFilterRange={dateCreatedFilterRange}
              setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
            />

            <WrapUpWeeklyCard
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
