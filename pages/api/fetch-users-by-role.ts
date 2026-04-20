import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { role, department, manager, tsm, currentUser, filterManagers, filterAgents } = req.query;

  try {
    const db = await connectToDatabase();

    const query: any = {
      Status: "Active",
    };

    // 🔥 FILTER MANAGERS BY DEPARTMENT (for Manager dropdown)
    if (filterManagers === "true" && department) {
      query.Role = "Manager";
      query.Department = String(department);
      console.log(`[fetch-users-by-role] Fetching MANAGERS for department: ${department}`);
    }

    // 🔥 FILTER AGENTS BY DEPARTMENT (for Agent dropdown - exclude managers)
    if (filterAgents === "true" && department) {
      query.Department = String(department);
      query.Role = { $ne: "Manager" };
      console.log(`[fetch-users-by-role] Fetching AGENTS for department: ${department} (excluding managers)`);
    }

    // SPECIAL BUSINESS RULE FOR TSM (only if not using department filters)
    if (role && filterManagers !== "true" && filterAgents !== "true") {
      query.Role = String(role);
      console.log(`[fetch-users-by-role] Fetching by ROLE: ${role}`);
    }

    console.log("[fetch-users-by-role] Final query:", JSON.stringify(query));

    // Only filter by manager/tsm if NOT using the new department-based filters
    if (!filterManagers && !filterAgents) {
      if (manager) query.Manager = String(manager);
      if (tsm) query.TSM = String(tsm);
    }

    // NORMAL ACTIVE USERS
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

    let finalUsers = [...users];

    // 🔥 THIS IS THE REAL FIX
    // Add ONLY the exact stored user if missing
    if (currentUser) {
      const existing = finalUsers.find(
        (u) => u.ReferenceID === currentUser,
      );

      if (!existing) {
        const oldUser = await db
          .collection("users")
          .findOne(
            { ReferenceID: currentUser },
            {
              projection: {
                Password: 0,
                LoginAttempts: 0,
                LockUntil: 0,
              },
            },
          );

        if (oldUser) {
          finalUsers.push(oldUser);
        }
      }
    }

    console.log(`[fetch-users-by-role] Returning ${finalUsers.length} users:`, finalUsers.map((u: any) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID}) - Role: ${u.Role}, Dept: ${u.Department}`));

    res.status(200).json({ data: finalUsers });
  } catch (error) {
    console.error("fetch-users-by-role error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}
