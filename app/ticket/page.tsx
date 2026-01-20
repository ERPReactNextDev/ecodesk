"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";

import { Tickets } from "@/components/raise-tickets";
import { TicketRaiseSuggestion } from "@/components/raise-tickets-suggestion";
import { type DateRange } from "react-day-picker";

interface UserDetails {
    UserId: string;
    Firstname: string;
    Lastname: string;
    Email: string;
    Role: string;
    department: string;
    Company?: string;
    referenceid: string;
    profilePicture?: string;
}

function DashboardContent() {
    const searchParams = useSearchParams();
    const { userId, setUserId } = useUser();

    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

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
        const fetchUserData = async () => {
            if (!queryUserId) {
                setError("User ID is missing.");
                setUserDetails(null);
                return;
            }
            setError(null);
            setLoadingUser(true);
            try {
                const res = await fetch(`/api/user?id=${encodeURIComponent(queryUserId)}`);
                if (!res.ok) throw new Error("Failed to fetch user data");
                const data = await res.json();

                setUserDetails({
                    UserId: data._id ?? "",
                    Firstname: data.Firstname ?? "",
                    Lastname: data.Lastname ?? "",
                    Email: data.Email ?? "",
                    Role: data.Role ?? "",
                    department: data.Department ?? "",
                    Company: data.Company ?? "",
                    referenceid: data.ReferenceID ?? "",
                    profilePicture: data.profilePicture ?? "",
                });
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Failed to load user data.");
                setUserDetails(null);
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserData();
    }, [queryUserId]);

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
                                    <BreadcrumbPage className="line-clamp-1">Creation of Tickets</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
                    <div>
                        {!loadingUser && userDetails && (
                            <>  
                                <TicketRaiseSuggestion />
                                <Tickets
                                    referenceid={userDetails.referenceid}
                                    department={userDetails.department}
                                    fullname={`${userDetails.Firstname} ${userDetails.Lastname}`.trim()}
                                />
                            </>
                        )}
                    </div>
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
                        <DashboardContent />
                    </Suspense>
                </SidebarProvider>
            </FormatProvider>
        </UserProvider>
    );
}
