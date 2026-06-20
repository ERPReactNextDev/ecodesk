import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const userId = req.query.id as string;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    try {
      // Find the user by UserId (UUID)
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("UserId", userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Respond with all user fields except the password
      const { Password, ...userData } = user;
      res.status(200).json(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
