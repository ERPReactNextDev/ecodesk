import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      referenceid,
      type_activity,
      tsm,
      manager,
      project_name,
      status,
      start_date,
      end_date,
      date_created,
    } = req.query;

    // Initialize the query to select all records, ordered by date_created descending
    let query = supabase.from("history").select("*").order("date_created", { ascending: false });

    // Apply filters based on query parameters
    if (referenceid && typeof referenceid === "string") {
      query = query.eq("referenceid", referenceid);
    }

    if (type_activity && typeof type_activity === "string") {
  query = query.eq("type_activity", type_activity); // Filter by type_activity
} else {
  query = query.eq("type_activity", "Outbound Calls"); // Default to Outbound Calls
}

    // Execute the query and handle results
    const { data, error } = await query;

    if (error) {
      console.error("Supabase history fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      count: data?.length ?? 0,
      data,
    });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
