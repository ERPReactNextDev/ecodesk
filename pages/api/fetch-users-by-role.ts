import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { role, department, manager, tsm, currentUser, filterDepartmentHeads, filterManagers, filterAgents, filterMarketingManagers, filterMarketingAgents, filterAgentsByTSM } = req.query;

  try {
    const db = await connectToDatabase();

    const query: any = {
      Status: "Active",
    };

    // 🔥 FILTER DEPARTMENT HEADS: Department=X, Role=Manager
    if (filterDepartmentHeads === "true" && department) {
      query.Role = "Manager";
      query.Department = String(department);
      console.log(`[fetch-users-by-role] Fetching DEPARTMENT HEADS for department: ${department}`);
    }

    // 🔥 FILTER MANAGERS (TSM): Role=Territory Sales Manager, Manager=departmentHead
    else if (filterManagers === "true" && manager) {
      query.Role = "Territory Sales Manager";
      query.Manager = String(manager);
      console.log(`[fetch-users-by-role] Fetching MANAGERS (TSM) under department head: ${manager}`);
    }

    // 🔥 FILTER AGENTS (TS Associate): Role=Territory Sales Associate, TSM=manager
    else if (filterAgents === "true" && tsm) {
      query.Role = "Territory Sales Associate";
      query.TSM = String(tsm);
      console.log(`[fetch-users-by-role] Fetching AGENTS (TS Associate) under TSM: ${tsm}`);
    }

    // 🔥 FILTER MARKETING MANAGERS: Department=Marketing, Role=Manager
    else if (filterMarketingManagers === "true" && department) {
      query.Role = "Manager";
      query.Department = String(department);
      console.log(`[fetch-users-by-role] Fetching MARKETING MANAGERS for department: ${department}`);
    }

    // 🔥 FILTER MARKETING AGENTS: Department=Marketing, Role != Manager
    else if (filterMarketingAgents === "true" && department && manager) {
      query.Department = String(department);
      query.Role = { $ne: "Manager" };
      console.log(`[fetch-users-by-role] Fetching MARKETING AGENTS for department: ${department}, under manager: ${manager}`);
    }

    // 🔥 FILTER AGENTS BY TSM: For special cases like Sette Hosena who is Manager with no TSM
    else if (filterAgentsByTSM === "true" && tsm) {
      query.Role = "Territory Sales Associate";
      query.TSM = String(tsm);
      console.log(`[fetch-users-by-role] Fetching AGENTS by TSM reference: ${tsm}`);
    }

    // FALLBACK: Original role-based fetch
    else if (role) {
      query.Role = String(role);
      console.log(`[fetch-users-by-role] Fetching by ROLE: ${role}`);
    }

    console.log("[fetch-users-by-role] Final query:", JSON.stringify(query));

    // Note: hierarchical filters above already set Manager/TSM fields as needed
    // This section reserved for future additional filters

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
