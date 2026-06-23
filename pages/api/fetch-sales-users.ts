import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .eq("Department", "Sales");

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.or(
        `ReferenceID.ilike.%${searchLower}%,Firstname.ilike.%${searchLower}%,Lastname.ilike.%${searchLower}%,Email.ilike.%${searchLower}%,Role.ilike.%${searchLower}%,Position.ilike.%${searchLower}%,Location.ilike.%${searchLower}%,Manager.ilike.%${searchLower}%,TSM.ilike.%${searchLower}%,type_of_sales.ilike.%${searchLower}%`
      );
    }

    // Get total count
    const { count, error: countError } = await query;

    if (countError) {
      console.error("Error counting users:", countError);
      return res.status(500).json({ error: "Failed to count users" });
    }

    // Fetch users with pagination and ordering
    const { data: users, error } = await query
      .order("Firstname", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    // Remove sensitive fields
    const filteredUsers = users.map((user: any) => {
      const { Password, LoginAttempts, LockUntil, ...rest } = user;
      return rest;
    });

    res.status(200).json({
      data: filteredUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sales users:", error);
    res.status(500).json({ error: "Server error" });
  }
}
