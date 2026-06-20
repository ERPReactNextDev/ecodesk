import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { role, department, manager, tsm, currentUser, filterDepartmentHeads, filterManagers, filterAgents, filterMarketingManagers, filterMarketingAgents, filterAgentsByTSM, filterCSRAdmin, filterCSRStaff } = req.query;

  try {
    let query = supabase
      .from("users")
      .select("*")
      .eq("Status", "Active");

    // 🔥 FILTER DEPARTMENT HEADS: Department=X, Role=Manager
    if (filterDepartmentHeads === "true" && department) {
      query = query.eq("Role", "Manager").eq("Department", String(department));
      console.log(`[fetch-users-by-role] Fetching DEPARTMENT HEADS for department: ${department}`);
    }

    // 🔥 FILTER MANAGERS (TSM): Role=Territory Sales Manager, Manager=departmentHead
    else if (filterManagers === "true" && manager) {
      query = query.eq("Role", "Territory Sales Manager").eq("Manager", String(manager));
      console.log(`[fetch-users-by-role] Fetching MANAGERS (TSM) under department head: ${manager}`);
    }

    // 🔥 FILTER AGENTS (TS Associate): Role=Territory Sales Associate, TSM=manager
    else if (filterAgents === "true" && tsm) {
      query = query.eq("Role", "Territory Sales Associate").eq("TSM", String(tsm));
      console.log(`[fetch-users-by-role] Fetching AGENTS (TS Associate) under TSM: ${tsm}`);
    }

    // 🔥 FILTER MARKETING MANAGERS: Department=Marketing, Role=Manager
    else if (filterMarketingManagers === "true" && department) {
      query = query.eq("Role", "Manager").eq("Department", String(department));
      console.log(`[fetch-users-by-role] Fetching MARKETING MANAGERS for department: ${department}`);
    }

    // 🔥 FILTER MARKETING AGENTS: Department=Marketing, Role != Manager
    else if (filterMarketingAgents === "true" && department && manager) {
      query = query.eq("Department", String(department)).neq("Role", "Manager");
      console.log(`[fetch-users-by-role] Fetching MARKETING AGENTS for department: ${department}, under manager: ${manager}`);
    }

    // 🔥 FILTER AGENTS BY TSM: For special cases like Sette Hosena who is Manager with no TSM
    else if (filterAgentsByTSM === "true" && tsm) {
      query = query.eq("Role", "Territory Sales Associate").eq("TSM", String(tsm));
      console.log(`[fetch-users-by-role] Fetching AGENTS by TSM reference: ${tsm}`);
    }

    // 🔥 FILTER CSR ADMIN: Role=Admin, Department=CSR
    else if (filterCSRAdmin === "true" && department) {
      query = query.eq("Role", "Admin").eq("Department", "CSR");
      console.log(`[fetch-users-by-role] Fetching CSR ADMIN for department: ${department}`);
    }

    // 🔥 FILTER CSR STAFF: Role=Staff, Department=CSR
    else if (filterCSRStaff === "true" && department) {
      query = query.eq("Role", "Staff").eq("Department", "CSR");
      console.log(`[fetch-users-by-role] Fetching CSR STAFF for department: ${department}`);
    }

    // FALLBACK: Original role-based fetch
    else if (role) {
      query = query.eq("Role", String(role));
      console.log(`[fetch-users-by-role] Fetching by ROLE: ${role}`);
    }

    const { data: users, error } = await query.order("Firstname", { ascending: true });

    if (error) {
      console.error("fetch-users-by-role error:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    // Remove sensitive fields
    const filteredUsers = users.map((user: any) => {
      const { Password, LoginAttempts, LockUntil, ...rest } = user;
      return rest;
    });

    let finalUsers = [...filteredUsers];

    // 🔥 THIS IS THE REAL FIX
    // Add ONLY the exact stored user if missing
    if (currentUser) {
      const existing = finalUsers.find(
        (u) => u.ReferenceID === currentUser,
      );

      if (!existing) {
        const { data: oldUser } = await supabase
          .from("users")
          .select("*")
          .eq("ReferenceID", currentUser)
          .single();

        if (oldUser) {
          const { Password, LoginAttempts, LockUntil, ...rest } = oldUser;
          finalUsers.push(rest);
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
