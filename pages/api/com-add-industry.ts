import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/*
  Use the keys that already exist in your .env.local
  (you said not to modify .env.local)
*/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE as string
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { industry_name } = req.body;

    if (!industry_name || industry_name.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Industry name is required",
      });
    }

    const { data, error } = await supabase
      .from("industry")
      .insert([
        {
          industry_name: industry_name.trim(),
          date_created: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (err: any) {
    console.error("API error:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Unexpected error",
    });
  }
}