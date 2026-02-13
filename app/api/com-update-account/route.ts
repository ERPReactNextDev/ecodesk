import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.TASKFLOW_DB_URL;

if (!databaseUrl) {
  throw new Error("TASKFLOW_DB_URL is not set in the environment variables.");
}

const sql = neon(databaseUrl);

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const {
      account_reference_number,
      company_name,
      contact_person,
      contact_number,
      email_address,
      address,
    } = body;

    if (!account_reference_number) {
      return NextResponse.json(
        { success: false, error: "Missing account_reference_number" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE accounts
      SET
        company_name = ${company_name},
        contact_person = ${contact_person},
        contact_number = ${contact_number},
        email_address = ${email_address},
        address = ${address},
        date_updated = NOW()
      WHERE account_reference_number = ${account_reference_number};
    `;

    return NextResponse.json(
      { success: true, message: "Account updated successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Update failed." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
