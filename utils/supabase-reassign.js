// @ts-nocheck

import { supabase } from "./supabase";

export async function updateReassignRemarks(ticketReferenceNumber, newAgent, newManager) {
  try {
    if (!ticketReferenceNumber) {
      throw new Error("Ticket reference number missing");
    }

    const { error } = await supabase
      .from("endorsed-ticket")
      .update({
        referenceid: newAgent,
        tsm: newManager,
        ticketremarks: "Reassigned",
        date_updated: new Date().toISOString(),
      })
      .eq("ticket_reference_number", ticketReferenceNumber);

    if (error) throw error;

    return { success: true };

  } catch (err) {
    // ONLY suppress the specific column/schema error
    if (!err.message?.includes("schema cache")) {
      console.error("Supabase Reassign Update Error:", err.message);
    }

    return { success: false };
  }
}
