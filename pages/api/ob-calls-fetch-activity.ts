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
    const { referenceid, type_activity } = req.query;

    let query = supabase
      .from("history")
      .select("*")
      .order("date_created", { ascending: false });

    if (referenceid && typeof referenceid === "string") {
      query = query.eq("referenceid", referenceid);
    }

    if (type_activity && typeof type_activity === "string") {
      query = query.eq("type_activity", type_activity);
    }

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
