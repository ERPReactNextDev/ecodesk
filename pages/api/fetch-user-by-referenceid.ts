// pages/api/fetch-user-by-referenceid.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { referenceid } = req.query;

    if (!referenceid || typeof referenceid !== "string") {
      return res.status(400).json({ error: "ReferenceID is required" });
    }

    const { data, error } = await supabase
      .from("users")
      .select("Firstname, Lastname, ReferenceID")
      .eq("ReferenceID", referenceid)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch user" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
