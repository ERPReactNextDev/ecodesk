"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/utils/supabase";

interface TransferTicket {
  id: number;
  ticket_reference_number: string;
  account_reference_number: string;
  company_name: string | null;
  contact_person: string | null;
  condition: string | null;
  date_transfer: string | null;
  referenceid: string | null;
}

interface Agent {
  ReferenceID: string;
  Firstname: string;
  Lastname: string;
}

export function PopupTicketDateTransferred() {
  const [tickets, setTickets] = useState<TransferTicket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Fetch Agents List
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/fetch-agent");
        if (!res.ok) throw new Error("Failed to fetch agents");
        const data = await res.json();
        setAgents(data);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setAgents([]);
      }
    }

    fetchAgents();
  }, []);

  const fetchTransferTickets = useCallback(async () => {
    try {
      setLoading(true);

      const dismissedTickets: string[] = JSON.parse(
        localStorage.getItem("dismissedTransferTickets") || "[]",
      );

      const { data, error } = await supabase
        .from("endorsed-ticket")
        .select("*")
        .eq("condition", "Transfer")
        .gte("date_transfer", today);

      if (error) {
        console.error("Error fetching transfer tickets:", error);
        setTickets([]);
        setOpen(false);
        return;
      }

      const filtered = (data || []).filter(
        (t: any) => !dismissedTickets.includes(String(t.id)),
      );

      setTickets(filtered);

      if (filtered.length > 0) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setTickets([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchTransferTickets();
  }, [fetchTransferTickets]);

  useEffect(() => {
    const channel = supabase
      .channel("transfer-ticket-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "endorsed-ticket",
        },
        () => {
          fetchTransferTickets();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchTransferTickets]);

  function handleDismiss() {
    setShowDismissConfirm(true);
  }

  function confirmDismiss() {
    const dismissedTickets: string[] = JSON.parse(
      localStorage.getItem("dismissedTransferTickets") || "[]",
    );

    const newDismissed = [
      ...dismissedTickets,
      ...tickets.map((t) => String(t.id)),
    ];

    localStorage.setItem(
      "dismissedTransferTickets",
      JSON.stringify(newDismissed),
    );

    setShowDismissConfirm(false);
    setOpen(false);
  }

  function cancelDismiss() {
    setShowDismissConfirm(false);
  }

  const formatDate = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      timeZone: "Asia/Manila",
    });
  };

  const getAgentName = (referenceId: string | null) => {
    if (!referenceId) return "(Unknown Agent)";

    const agent = agents.find((a) => a.ReferenceID === referenceId);

    return agent ? `${agent.Firstname} ${agent.Lastname}` : "(Unknown Agent)";
  };

  if (loading) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ width: "40vw", maxWidth: "none" }}>
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1">
              <span>Ticket Transfer Notice</span>

              {tickets.length > 1 && (
                <span className="text-sm text-muted-foreground">
                  {tickets.length} tickets scheduled for transfer
                </span>
              )}
            </DialogTitle>

            <DialogDescription>
              {tickets.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto mt-4 space-y-6 pr-2">
                  {tickets.map((t, i) => (
                    <div
                      key={t.id || i}
                      className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex flex-wrap justify-between items-center mb-3">
                        <div className="mb-3">
                          <div className="text-sm font-semibold text-muted-foreground">
                            Ticket #: {t.ticket_reference_number}
                          </div>

                          <div className="text-lg font-semibold capitalize mt-1">
                            <Badge variant="destructive">Transfer</Badge>
                          </div>
                        </div>
                      </div>

                      {/* EXACT FORMAT YOU REQUESTED */}
                      <div className="text-sm space-y-3">
                        <p>
                          The CSR Ticket{" "}
                          <span className="font-semibold text-green-600">
                            {t.ticket_reference_number}
                          </span>{" "}
                          with company name{" "}
                          <span className="font-semibold text-green-600">
                            {t.company_name || "-"}
                          </span>{" "}
                          with Contact Person{" "}
                          <span className="font-semibold text-green-600">
                            {t.contact_person || "-"}
                          </span>{" "}
                          are being transferred to Agent{" "}
                          <span className="font-semibold text-green-600">
                            {getAgentName(t.referenceid)}.
                          </span>
                        </p>

                        <p>
                          Date Transferred:{" "}
                          <span className="font-semibold text-green-600">
                            {formatDate(t.date_transfer)}.
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-10">
                  No scheduled transfers.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end">
            <Button onClick={handleDismiss}>Dismiss</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDismissConfirm} onOpenChange={setShowDismissConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Dismiss</DialogTitle>
            <DialogDescription>
              Once you dismiss this alert, it will not appear again until new
              transfer tickets are created.
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

export default PopupTicketDateTransferred;
