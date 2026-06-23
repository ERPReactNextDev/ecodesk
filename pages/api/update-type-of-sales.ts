import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, typeOfSales } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!typeOfSales || (typeOfSales !== "OFFICE" && typeOfSales !== "PROJECT")) {
      return res.status(400).json({ error: "Type of Sales must be OFFICE or PROJECT" });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ type_of_sales: typeOfSales })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating type_of_sales:", error);
      return res.status(500).json({ error: "Failed to update type of sales" });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error updating type of sales:", error);
    res.status(500).json({ error: "Server error" });
  }
}
