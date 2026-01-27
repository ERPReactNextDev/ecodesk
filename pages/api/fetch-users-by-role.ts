import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔎 accept all supported filters
  const { role, department, manager, tsm } = req.query;

  try {
    const db = await connectToDatabase();

    // ✅ always start with Active users only
    const query: any = {
      Status: "Active",
    };

    // 🔎 ctrl+f friendly conditions
// ALSO allow Role = Manager
if (role) {
  if (
    role === "Territory Sales Manager" &&
    department === "Sales"
  ) {
    query.Role = {
      $in: ["Territory Sales Manager", "Manager"],
    };
  } else {
    query.Role = String(role);
  }
}

if (department) query.Department = String(department);
if (manager) query.Manager = String(manager);

// ✅ IMPORTANT: strict TSM match (used when fetching agents)
if (tsm) query.TSM = String(tsm);

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
