import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";
import redis from "@/lib/redis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Removed referenceid validation and usage

  const cacheKey = `history:all`;

  try {
    // Check cache first
    const cached = await redis.get(cacheKey);

    if (cached && typeof cached === "string") {
      // Return cached data
      return res.status(200).json({ activities: JSON.parse(cached), cached: true });
    }

    // Fetch all history without referenceid filter
    const { data, error } = await supabase
      .from("history")
      .select("*");

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    // Cache the data for 5 minutes (300 seconds)
    if (data) {
      await redis.set(cacheKey, JSON.stringify(data), { ex: 300 });
    }

    return res.status(200).json({ activities: data, cached: false });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
