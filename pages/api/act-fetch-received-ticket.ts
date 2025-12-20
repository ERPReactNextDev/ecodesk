import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { referenceid } = req.query;

  if (!referenceid || typeof referenceid !== "string") {
    return res.status(400).json({ message: "Missing or invalid referenceid" });
  }

  try {
    console.log("Received referenceid:", referenceid);

    const { data, error } = await supabase
      .from("endorsed-ticket")
      .select("*")
      .eq("agent", referenceid)
      .eq("status", "Received");

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).json({ message: error.message });
    }

    console.log("Found tickets count:", data?.length);

    return res.status(200).json({
      activities: data ?? [],
      cached: false,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

