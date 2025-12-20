// app/reports/po/add-record/page.tsx
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UserDetails {
  referenceid: string;
  firstname: string;
  lastname: string;
  position: string;
  email: string;
  profilePicture: string;
}

// Placeholder component for Add PO Record form
const AddPORecordForm: React.FC<{ referenceid: string }> = ({ referenceid }) => {
  return (
    <div className="border rounded p-4 space-y-2 text-gray-500">
      <p>Adding PO Record for Reference ID: <strong>{referenceid}</strong></p>
      <p>Form fields and other functionality will be added here later.</p>
    </div>
  );
};

function AddPORecordContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const [userDetails, setUserDetails] = useState<UserDetails>({
    referenceid: "",
    firstname: "",
    lastname: "",
    position: "",
    email: "",
    profilePicture: "",
  });

  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] = useState<any>(undefined);

  const router = useRouter();
  const queryUserId = searchParams?.get("id") ?? "";

  // Sync URL query param with userId context
  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [queryUserId, userId, setUserId]);

  // Fetch full user details when userId changes
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

        // Set full user details for SidebarRight
        setUserDetails({
          referenceid: data.ReferenceID || "",
          firstname: data.Firstname || "",
          lastname: data.Lastname || "",
          position: data.Position || "",
          email: data.Email || "",
          profilePicture: data.profilePicture || "",
        });

        toast.success("User data loaded successfully!");
      } catch (err) {
        console.error("Error fetching user data:", err);
        toast.error("Failed to connect to server. Please try again later.");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

  return (
    <>
      <SidebarLeft />
      <SidebarInset className="overflow-hidden">
        <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">Add Purchase Order</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
        {/* Back button */}
        <div className="flex justify-end">
        <Button
            variant="default"
            onClick={() => router.push(`/reports/po?id=${userId}`)} // Pass userId back
        >
            Back
        </Button>
        </div>

          {/* Add PO Form */}
          <AddPORecordForm referenceid={userDetails.referenceid} />
        </main>
      </SidebarInset>

      {/* SidebarRight with full user info */}
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
            <AddPORecordContent />
          </Suspense>
        </SidebarProvider>
      </FormatProvider>
    </UserProvider>
  );
}
