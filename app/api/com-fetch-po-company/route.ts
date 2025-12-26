import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const Xchire_databaseUrl = process.env.TASKFLOW_DB_URL;
if (!Xchire_databaseUrl) {
  throw new Error("TASKFLOW_DB_URL is not set in the environment variables.");
}
const Xchire_sql = neon(Xchire_databaseUrl);

export async function GET(req: Request) {
  try {
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
        type_client
      FROM accounts
      WHERE
        status IS DISTINCT FROM 'Removed'
        AND type_client = 'CSR Client'
      ORDER BY company_name ASC;
    `;

    if (Xchire_fetch.length === 0) {
      return NextResponse.json(
        { success: false, data: [], error: "No CSR Client accounts found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: Xchire_fetch },
      { status: 200 }
    );
  } catch (Xchire_error: any) {
    console.error("Error fetching CSR Client accounts:", Xchire_error);
    return NextResponse.json(
      {
        success: false,
        error: Xchire_error.message || "Failed to fetch accounts.",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
