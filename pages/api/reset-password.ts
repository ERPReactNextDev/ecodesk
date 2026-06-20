import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: "Email and new password are required" });
  }

  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("Email", email)
    .single();

  if (fetchError || !user) {
    return res.status(404).json({ message: "User not found" });
  }

  const hashedPassword = await hashPassword(newPassword);
  
  const { error: updateError } = await supabase
    .from("users")
    .update({
      Password: hashedPassword,
      LoginAttempts: 0,
      Status: "Active",
      LockUntil: null,
    })
    .eq("Email", email);

  if (updateError) {
    console.error("Error updating password:", updateError);
    return res.status(500).json({ message: "Error updating password" });
  }

  return res.status(200).json({ message: "Password reset successful" });
}
