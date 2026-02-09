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
    console.error("Supabase Reassign Update Error:", err.message);
    return { success: false };
  }
}