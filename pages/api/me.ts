import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(401).json({ error: "No session found" });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("UserId", sessionCookie)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    return res.status(200).json({
      userId: user.UserId,
      Email: user.Email,
      Name: `${user.Firstname} ${user.Lastname}`,
      Department: user.Department,
      Status: user.Status,
      Role: user.Role,
      Position: user.Position,
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
