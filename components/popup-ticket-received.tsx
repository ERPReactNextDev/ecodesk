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
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";

interface EndorsedTicket {
  id: string;
  company_name: string;
  date_created: string;
}

interface UserDetails {
  referenceid: string;
}

export function TicketReceived() {
  const searchParams = useSearchParams();
  const [receivedTickets, setReceivedTickets] = useState<EndorsedTicket[]>([]);
  const [open, setOpen] = useState(false);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const { userId, setUserId } = useUser();
  const [userDetails, setUserDetails] = useState<UserDetails>({ referenceid: "" });
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [errorTickets, setErrorTickets] = useState<string | null>(null);
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
        toast.error("Failed to connect to server. Please try again later or refresh your network connection");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fetch received tickets
  const fetchReceivedTickets = useCallback(async () => {
    if (!userDetails.referenceid) {
      setReceivedTickets([]);
      setOpen(false);
      return;
    }

    setLoadingTickets(true);
    setErrorTickets(null);

    try {
      const res = await fetch(`/api/act-fetch-received-ticket?referenceid=${encodeURIComponent(userDetails.referenceid)}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || json.error || "Failed to fetch endorsed tickets");
      }

      const json = await res.json();
      const tickets: EndorsedTicket[] = json.activities || [];

      const today = new Date().toISOString().split("T")[0];
      const dismissedTickets: string[] = JSON.parse(localStorage.getItem("dismissedEndorsedTickets") || "[]");

      // Filter tickets: not dismissed and created today
      const newTickets = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.date_created).toISOString().split("T")[0];
        return !dismissedTickets.includes(ticket.id) && ticketDate === today;
      });

      // Check if tickets are new compared to current state
      const currentIds = receivedTickets.map(t => t.id).sort().join(",");
      const newIds = newTickets.map(t => t.id).sort().join(",");

      if (newTickets.length > 0 && currentIds !== newIds) {
        setReceivedTickets(newTickets);
        setOpen(true);
        localStorage.removeItem("ticketSoundPlayedFor"); // Reset sound flag for new tickets
        setSoundPlayed(false);
      } else if (newTickets.length === 0) {
        setReceivedTickets([]);
        setOpen(false);
      }
      // else, same tickets, don't reopen
    } catch (err: any) {
      setErrorTickets(err.message || "Error fetching endorsed tickets");
      setReceivedTickets([]);
      setOpen(false);
    } finally {
      setLoadingTickets(false);
    }
  }, [userDetails.referenceid, receivedTickets]);

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

    fetchReceivedTickets();

    const channel = supabase
      .channel(`endorsed-ticket-${userDetails.referenceid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "endorsed-ticket",
          filter: `agent=eq.${userDetails.referenceid}`,
        },
        () => {
          fetchReceivedTickets();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userDetails.referenceid, fetchReceivedTickets]);

  function handleDismiss() {
    setShowDismissConfirm(true);
  }

  function confirmDismiss() {
    const dismissedTickets: string[] = JSON.parse(localStorage.getItem("dismissedEndorsedTickets") || "[]");
    const newDismissed = [...dismissedTickets, ...receivedTickets.map(t => t.id)];
    localStorage.setItem("dismissedEndorsedTickets", JSON.stringify(newDismissed));

    setShowDismissConfirm(false);
    setOpen(false);

    localStorage.removeItem("ticketSoundPlayedFor");
    setSoundPlayed(false);
  }

  function cancelDismiss() {
    setShowDismissConfirm(false);
  }

  if (loadingUser || loadingTickets) return null;
  if (error || errorTickets) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket Received</DialogTitle>
            <DialogDescription>
              {receivedTickets.length > 0 ? (
                <>
                  <div>
                    {receivedTickets.length} {receivedTickets.length === 1 ? "ticket has" : "tickets have"} been received and assigned to your account recently:
                  </div>
                  <div className="max-h-[300px] overflow-y-auto mt-2">
                    <ul className="list-disc pl-5 space-y-4">
                      {receivedTickets.map((t, i) => (
                        <li key={t.id || i}>
                          <strong>{t.company_name || "No subject"}</strong>
                          <div>Created on: {formatDate(t.date_created)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
              Once you dismiss this alert, you won&apos;t see it again until new tickets are received.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDismiss}>Cancel</Button>
            <Button onClick={confirmDismiss}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
