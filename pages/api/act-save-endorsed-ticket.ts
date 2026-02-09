import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No data provided" });
  }

  const insertData: Record<string, any> = {};

  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      insertData[key] = value;
    }
  });

  const ticketRef = insertData.ticket_reference_number;

  if (!ticketRef) {
    return res.status(400).json({ error: "ticket_reference_number is required" });
  }

  try {
    // 1. Check if ticket already exists in Supabase
    const { data: existing } = await supabase
      .from("endorsed-ticket")
      .select("*")
      .eq("ticket_reference_number", ticketRef)
      .single();

    // 2. If exists → UPDATE only
    if (existing) {
      const { error: updateError } = await supabase
        .from("endorsed-ticket")
        .update({
          referenceid: insertData.referenceid,
          tsm: insertData.tsm,
          status: insertData.status,
          remarks: "Reassigned",
          date_updated: new Date().toISOString(),
        })
        .eq("ticket_reference_number", ticketRef);

      if (updateError) {
        console.error("Update failed:", updateError);
        return res.status(500).json({ error: updateError.message });
      }

      return res.status(200).json({ success: true, action: "updated" });
    }

    // 3. If not exists → INSERT new record
    const { error: insertError } = await supabase
      .from("endorsed-ticket")
      .insert([insertData]);

    if (insertError) {
      console.error("Insert failed:", insertError);
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({ success: true, action: "inserted" });

  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
