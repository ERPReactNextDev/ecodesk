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

  console.log("[fetch-users-by-role] Query params:", { filterManagers, filterAgents, department, role });

  try {
    const db = await connectToDatabase();

    const query: any = {
      Status: "Active",
    };

    // 🔥 FILTER MANAGERS BY DEPARTMENT (for Manager dropdown)
    if (filterManagers === "true" && department) {
      query.Role = "Manager";
      query.Department = String(department);
      console.log("[fetch-users-by-role] Filtering managers by department:", query.Department);
    }
    // 🔥 FILTER AGENTS BY DEPARTMENT (for Agent dropdown - exclude managers)
    else if (filterAgents === "true" && department) {
      query.Department = String(department);
      query.Role = { $ne: "Manager" };
    }
    // SPECIAL BUSINESS RULE FOR TSM
    else if (role) {
      query.Role = String(role);
    }

    // Only filter by manager/tsm if NOT using the new department-based filters
    if (!filterManagers && !filterAgents) {
      if (manager) query.Manager = String(manager);
      if (tsm) query.TSM = String(tsm);
    }

    console.log("[fetch-users-by-role] Final MongoDB query:", JSON.stringify(query));

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

    console.log("[fetch-users-by-role] Found users count:", users.length);
    console.log("[fetch-users-by-role] First 3 users:", users.slice(0, 3).map(u => ({ name: `${u.Firstname} ${u.Lastname}`, role: u.Role, dept: u.Department })));

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

    res.status(200).json({ data: finalUsers });
  } catch (error) {
    console.error("fetch-users-by-role error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}
