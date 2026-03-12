import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE as string
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { data, error } = await supabase
      .from("industry")
      .select("*")
      .order("industry_name", { ascending: true });

    if (error) {
      console.error("Supabase fetch error:", error);
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