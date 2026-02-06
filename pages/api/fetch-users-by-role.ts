import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { role, department, manager, tsm, currentUser } = req.query;

  try {
    const db = await connectToDatabase();

    const query: any = {
      Status: "Active",
    };

    // SPECIAL BUSINESS RULE FOR TSM
    if (role) {
      if (
        role === "Territory Sales Manager" &&
        department === "Sales"
      ) {
        query.$or = [
          { Role: "Territory Sales Manager" },
          {
            Role: "Manager",
            $or: [
              { TSM: { $exists: false } },
              { TSM: null },
              { TSM: "" },
            ],
          },
        ];
      } else {
        query.Role = String(role);
      }
    }

    if (department) query.Department = String(department);
    if (manager) query.Manager = String(manager);
    if (tsm) query.TSM = String(tsm);

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

    res.status(200).json({ data: finalUsers });
  } catch (error) {
    console.error("fetch-users-by-role error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}
