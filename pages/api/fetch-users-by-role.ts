import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { role, department, manager } = req.query;

  try {
    const db = await connectToDatabase();

    const query: any = {
      Status: "Active",
    };

    // 🔎 ctrl+f friendly conditions
    if (role) query.Role = role;
    if (department) query.Department = department;
    if (manager) query.Manager = manager;

    const users = await db
      .collection("users")
      .find(query, {
        projection: {
          Password: 0,
          LoginAttempts: 0,
          LockUntil: 0,
        },
      })
      .sort({ Firstname: 1 })
      .toArray();

    res.status(200).json({ data: users });
  } catch (error) {
    console.error("fetch-users-by-role error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}
