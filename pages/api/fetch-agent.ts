// pages/api/fetch-all-users.ts

import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Fetch all users, exclude sensitive fields like password
    const { data: users, error } = await supabase
      .from("users")
      .select()
      .neq("Password", ""); // Exclude password field

    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Server error fetching users" });
    }

    // Remove password from each user
    const filteredUsers = users.map((user: any) => {
      const { Password, ...rest } = user;
      return rest;
    });

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error fetching users" });
  }
}
