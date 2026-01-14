"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";

interface HistoryTicket {
    id: string;
    ticket_reference_number: string;
    date_created: string;
    date_updated: string;
    referenceid: string;
    remarks: string;
    type_activity: string;
    source: string;
    call_status: string;
    call_type: string;
    status: string;
    start_date: string;
    end_date: string;
    // Quotations
    quotation_number: string;
    quotation_amount: number | string;
    product_title: string;
    product_quantity: number | string;
    product_sku: string;
    // SO
    so_number: string;
    so_amount: number | string;
    // Delivery
    actual_sales: number | string;
    delivery_date: string;
    dr_number: string;
    payment_terms: string;
    si_date: string;

    // Company
    account_reference_number: string;
}

interface EndorsedCompany {
    account_reference_number: string;
    company_name: string;
}

interface UserDetails {
    referenceid: string;
}

interface Agent {
    ReferenceID: string;
    Firstname: string;
    Lastname: string;
}

export function TicketHistory() {
    const searchParams = useSearchParams();
    const [receivedTickets, setReceivedTickets] = useState<HistoryTicket[]>([]);
    const [endorsedCompanies, setEndorsedCompanies] = useState<EndorsedCompany[]>([]);
    const [open, setOpen] = useState(false);
    const [showDismissConfirm, setShowDismissConfirm] = useState(false);
    const { userId, setUserId } = useUser();
    const [userDetails, setUserDetails] = useState<UserDetails>({ referenceid: "" });
    const [loadingUser, setLoadingUser] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [errorTickets, setErrorTickets] = useState<string | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [soundPlayed, setSoundPlayed] = useState(false);

    const queryUserId = searchParams?.get("id") ?? "";

    // Sync URL query param with userId context
    useEffect(() => {
        if (queryUserId && queryUserId !== userId) {
            setUserId(queryUserId);
        }
    }, [queryUserId, userId, setUserId]);

    // Fetch user details based on userId
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
                });

                toast.success("User data loaded successfully!");
            } catch (err) {
                console.error("Error fetching user data:", err);
                toast.error(
                    "Failed to connect to server. Please try again later or refresh your network connection"
                );
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserData();
    }, [userId]);

    // Fetch agents once on mount
    useEffect(() => {
        async function fetchAgents() {
            setAgentsLoading(true);
            try {
                const res = await fetch("/api/fetch-agent");
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

    // Fetch endorsed companies based on referenceid
    const fetchEndorsedCompanies = useCallback(async () => {
        if (!userDetails.referenceid) return;

        try {
            const res = await fetch(
                `/api/act-fetch-company-ticket?referenceid=${encodeURIComponent(userDetails.referenceid)}`,
                { cache: "no-store" }
            );

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.message || json.error || "Failed to fetch endorsed companies");
            }

            const json = await res.json();
            console.log("Endorsed companies response:", json);

            setEndorsedCompanies(json.activities ?? []);
        } catch (err: any) {
            console.error("Error fetching endorsed companies:", err);
            setEndorsedCompanies([]);
        }
    }, [userDetails.referenceid]);

    // Fetch history tickets
    const fetchHistoryTickets = useCallback(async () => {
        if (!userDetails.referenceid) {
            setReceivedTickets([]);
            setOpen(false);
            return;
        }

        setLoadingTickets(true);
        setErrorTickets(null);

        try {
            const res = await fetch(
                `/api/act-fetch-history-ticket?referenceid=${encodeURIComponent(userDetails.referenceid)}`,
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
                const json = await res.json().catch(() => ({}));
                throw new Error(json.message || json.error || "Failed to fetch tickets");
            }

            const json = await res.json();
            const tickets: HistoryTicket[] = json.activities || [];

            const dismissedTickets: string[] = JSON.parse(localStorage.getItem("dismissedEndorsedTickets") || "[]");
            const newTickets = tickets.filter(ticket => !dismissedTickets.includes(ticket.id));

            setReceivedTickets(prevTickets => {
                const currentIds = prevTickets.map(t => t.id).sort().join(",");
                const newIds = newTickets.map(t => t.id).sort().join(",");

                if (newTickets.length > 0 && currentIds !== newIds) {
                    setOpen(true);
                    localStorage.removeItem("ticketSoundPlayedFor");
                    setSoundPlayed(false);
                    return newTickets;
                } else if (newTickets.length === 0) {
                    setOpen(false);
                    return [];
                }
                // no changes, return previous state to avoid unnecessary re-renders
                return prevTickets;
            });
        } catch (err: any) {
            setErrorTickets(err.message || "Error fetching tickets");
            setReceivedTickets([]);
            setOpen(false);
        } finally {
            setLoadingTickets(false);
        }
    }, [userDetails.referenceid]);

    // Fetch both tickets and endorsed companies when referenceid changes
    useEffect(() => {
        fetchHistoryTickets();
        fetchEndorsedCompanies();
    }, [fetchHistoryTickets, fetchEndorsedCompanies]);

    // Play notification sound once per new ticket batch
    useEffect(() => {
        if (open && receivedTickets.length > 0 && !soundPlayed) {
            const soundKey = "ticketSoundPlayedFor";
            const dismissedFor = localStorage.getItem(soundKey);

            const currentIds = receivedTickets.map(t => t.id).sort().join(",");
            if (dismissedFor !== currentIds) {
                if (!audioRef.current) {
                    audioRef.current = new Audio("/ticket-endorsed.mp3");
                }
                audioRef.current.play().catch(() => {
                    // ignore autoplay errors
                });
                localStorage.setItem(soundKey, currentIds);
                setSoundPlayed(true);
            }
        }
    }, [open, receivedTickets, soundPlayed]);

    // Subscribe to realtime updates
    useEffect(() => {
        if (!userDetails.referenceid) return;

        fetchHistoryTickets();

        const channel = supabase
            .channel(`history-${userDetails.referenceid}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "history",
                    filter: `agent=eq.${userDetails.referenceid}`,
                },
                () => {
                    fetchHistoryTickets();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [userDetails.referenceid, fetchHistoryTickets]);

    function handleDismiss() {
        setShowDismissConfirm(true);
    }

    function confirmDismiss() {
        const dismissedTickets: string[] = JSON.parse(localStorage.getItem("dismissedEndorsedTickets") || "[]");
        const newDismissed = [...dismissedTickets, ...receivedTickets.map(t => t.id)];
        localStorage.setItem("dismissedEndorsedTickets", JSON.stringify(newDismissed));

        localStorage.removeItem("ticketSoundPlayedFor");
        setSoundPlayed(false);

        setShowDismissConfirm(false);
        setOpen(false);
    }

    function cancelDismiss() {
        setShowDismissConfirm(false);
    }

    if (loadingUser || loadingTickets || agentsLoading) return null;
    if (error || errorTickets) return null;

    const formatDate = (value?: string | null) => {
        if (!value) return "-";

        const date = new Date(value);

        return date.toLocaleString("en-PH", {
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Manila",
        });
    };

    const calculateDuration = (start?: string | null, end?: string | null) => {
        if (!start || !end) return "-";
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "-";

        const diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs < 0) return "-";

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const diffSeconds = Math.floor((diffMs / 1000) % 60);

        let result = "";
        if (diffDays > 0) result += `${diffDays} day${diffDays > 1 ? "s" : ""} `;
        if (diffHours > 0) result += `${diffHours} hour${diffHours > 1 ? "s" : ""} `;
        if (diffMinutes > 0) result += `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} `;
        if (diffSeconds > 0) result += `${diffSeconds} second${diffSeconds > 1 ? "s" : ""}`;

        return result.trim() || "less than a second";
    };

    // Helper to get company_name from endorsedCompanies based on account_reference_number
    const getCompanyName = (accountRefNum: string) => {
        const company = endorsedCompanies.find((c) => c.account_reference_number === accountRefNum);
        return company ? company.company_name : "-";
    };

    const totalProductQuantity = receivedTickets.reduce((total, ticket) => {
        if (!ticket.product_quantity) return total;

        if (typeof ticket.product_quantity === "string") {
            const quantities = ticket.product_quantity.split(",").map(qtyStr => {
                const num = parseInt(qtyStr.trim(), 10);
                return isNaN(num) ? 0 : num;
            });
            const sumQty = quantities.reduce((acc, val) => acc + val, 0);
            return total + sumQty;
        } else if (typeof ticket.product_quantity === "number") {
            return total + ticket.product_quantity;
        } else {
            return total;
        }
    }, 0);


    return (
        <>
            {/* Main Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent style={{ width: "40vw", maxWidth: "none" }}>
                            <DialogHeader>
                            <DialogTitle className="flex flex-col gap-1">
                                <span>Your Ticket Status Has Been Updated</span>
                                {receivedTickets.length > 1 && (
                                <span className="text-sm text-muted-foreground">
                                    {receivedTickets.length} tickets updated
                                </span>
                                )}
                            </DialogTitle>

                            <DialogDescription>

                            {receivedTickets.length > 0 ? (
                                <div className="max-h-[320px] overflow-y-auto mt-4 space-y-6 pr-2">
                                    {receivedTickets.map((t, i) => {
                                        const agentDetails = agents.find((a) => a.ReferenceID === t.referenceid);
                                        const fullName = agentDetails
                                            ? `${agentDetails.Firstname} ${agentDetails.Lastname}`
                                            : "(Unknown Agent)";

                                        return (
                                            <div
                                                key={t.id || i}
                                                className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
                                            >
                                                {/* Header with main status */}
                                                <div className="flex flex-wrap justify-between items-center mb-3">
                                                    <div className="mb-3">
                                                    <div className="text-sm font-semibold text-muted-foreground">
                                                        Ticket #: {t.ticket_reference_number}
                                                    </div>

                                                    <div className="text-lg font-semibold capitalize mt-1">
                                                        <h3 className="text-lg font-semibold capitalize">
                                                        {t.type_activity || "Ticket Update"}
                                                        </h3>
                                                        <Badge>{t.status}</Badge>
                                                    </div>
                                                    </div>

                                                </div>

                                                {/* Details Grid */}
                                                <div>
                                                    {t.source && (
                                                        <div>
                                                            <span className="font-semibold">Source:</span> {t.source}
                                                        </div>
                                                    )}
                                                    {t.call_type && (
                                                        <div className="mb-2">
                                                            <span className="font-semibold">Type:</span> {t.call_type}
                                                        </div>
                                                    )}

                                                    <Card className="mb-2">
                                                        <CardHeader>
                                                            <CardTitle>
                                                                {t.quotation_number && (
                                                                    <div>
                                                                        <span className="font-semibold">Quotation #:</span> {t.quotation_number}
                                                                    </div>
                                                                )}

                                                                {t.so_number && (
                                                                    <div>
                                                                        <span className="font-semibold uppercase">SO #: {t.so_number}</span>
                                                                    </div>
                                                                )}
                                                                {t.dr_number && (
                                                                    <div>
                                                                        <span className="font-semibold uppercase">DR #: {t.dr_number}</span>
                                                                    </div>
                                                                )}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {t.quotation_amount && (
                                                                    <div>
                                                                        <span className="font-semibold">Amount:</span> {t.quotation_amount}
                                                                    </div>
                                                                )}
                                                                {t.so_amount && (
                                                                    <div>
                                                                        <span className="font-semibold">SO Amount:</span> {t.so_amount}
                                                                    </div>
                                                                )}
                                                                {t.actual_sales && (
                                                                    <div>
                                                                        <span className="font-semibold">Sales Invoice:</span> {t.actual_sales}
                                                                    </div>
                                                                )}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {t.call_status && (
                                                                <div>
                                                                    <span className="font-semibold">Call Status:</span> {t.call_status}
                                                                </div>
                                                            )}
                                                            {t.product_title && (
                                                                <div>
                                                                    <span className="font-semibold">Products:</span> {t.product_title}
                                                                </div>
                                                            )}
                                                            {t.product_sku && (
                                                                <div>
                                                                    <span className="font-semibold">Product SKU:</span> {t.product_sku}
                                                                </div>
                                                            )}
                                                            {totalProductQuantity > 0 && (
                                                                <div className="my-4 font-semibold text-gray-900">
                                                                    Total Product Quantity Purchase: {totalProductQuantity}
                                                                </div>
                                                            )}
                                                            {t.delivery_date && (
                                                                <div>
                                                                    <span className="font-semibold">Delivery Date:</span> {t.delivery_date}
                                                                </div>
                                                            )}
                                                            {t.si_date && (
                                                                <div>
                                                                    <span className="font-semibold">Sales Invoice Date:</span> {t.si_date}
                                                                </div>
                                                            )}
                                                            {t.payment_terms && (
                                                                <div>
                                                                    <span className="font-semibold">Payment Terms / Type:</span> {t.payment_terms}
                                                                </div>
                                                            )}

                                                            {t.remarks && (
                                                                <div className="text-gray-800">
                                                                    <span className="font-semibold">Remarks / Feedback :</span> {t.remarks}
                                                                </div>
                                                            )}

                                                        </CardContent>
                                                        <CardFooter>
                                                            <span className="font-semibold mr-1">Company: </span> {getCompanyName(t.account_reference_number)}
                                                        </CardFooter>
                                                    </Card>

                                                    {fullName !== "(Unknown Agent)" && (
                                                        <div>
                                                            <span className="font-semibold">Sales Agent:</span> {fullName}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Date info */}
                                                <div className="mt-4 gap-x-6 gap-y-2 text-gray-600">
                                                    {t.start_date && (
                                                        <div>
                                                            <span className="font-semibold">Start Date:</span> {formatDate(t.start_date)}
                                                        </div>
                                                    )}
                                                    {t.end_date && (
                                                        <div>
                                                            <span className="font-semibold">End Date:</span> {formatDate(t.end_date)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-10">No tickets received.</p>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex items-center justify-between">
                        {/* Duration on left */}
                        {receivedTickets.length > 0 && receivedTickets[0].start_date && receivedTickets[0].end_date && (
                            <div className="text-sm font-semibold">
                                Duration: {calculateDuration(receivedTickets[0].start_date, receivedTickets[0].end_date)}
                            </div>
                        )}

                        {/* Dismiss button on right */}
                        <Button onClick={handleDismiss}>Dismiss</Button>
                    </DialogFooter>

                </DialogContent>
            </Dialog>

            {/* Dismiss confirmation dialog */}
            <Dialog open={showDismissConfirm} onOpenChange={setShowDismissConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Dismiss</DialogTitle>
                        <DialogDescription>
                            Once you dismiss this alert, you won&apos;t see it again until new tickets
                            are received.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelDismiss}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDismiss}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
