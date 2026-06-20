import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const Xchire_databaseUrl = process.env.TASKFLOW_DB_URL;

if (!Xchire_databaseUrl) {
  throw new Error("TASKFLOW_DB_URL is not set in the environment variables.");
}

const Xchire_sql = neon(Xchire_databaseUrl);

export async function GET(req: Request) {
  try {
    // Fetch all accounts (Active and Inactive)
    // CSR Client first, then alphabetical by company_name
    const Xchire_fetch = await Xchire_sql`
      SELECT 
        id,
        account_reference_number,
        referenceid,
        company_name,
        contact_person,
        contact_number,
        email_address,
        address,
        region,
        industry,
        type_client,
        status,
        date_created -- ✅ REQUIRED FOR "NEW" BADGE
      FROM accounts
      ORDER BY 
        company_name ASC;
    `;

    if (!Xchire_fetch || Xchire_fetch.length === 0) {
      return NextResponse.json(
        { success: false, data: [], error: "No accounts found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: Xchire_fetch },
      { status: 200 }
    );
  } catch (Xchire_error: any) {
    console.error("Error fetching accounts:", Xchire_error);
    return NextResponse.json(
      {
        success: false,
        error: Xchire_error?.message || "Failed to fetch accounts.",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
