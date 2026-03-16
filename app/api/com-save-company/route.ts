import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const Xchire_databaseUrl = process.env.TASKFLOW_DB_URL;

if (!Xchire_databaseUrl) {
  throw new Error("TASKFLOW_DB_URL is not set in the environment variables.");
}

const Xchire_sql = neon(Xchire_databaseUrl);

// Normalize array or string fields
function normalizeField(value: any): string | null {
  if (Array.isArray(value)) {
    const filtered = value.filter((v) => v && v.trim() !== "");
    return filtered.length > 0 ? filtered.join(" / ") : null;
  }

  if (typeof value === "string") {
    return value.trim() === "" ? null : value.trim();
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received save account data:", body);

    const {
      referenceid,
      tsm,
      manager,
      company_name,
      contact_person,
      contact_number,
      email_address,

      // NEW ADDRESS STRUCTURE
      street_address,
      barangay,
      city,
      province,
      region,

      delivery_address,
      type_client,
      date_created,
      industry,
      status,
      company_group,
      account_reference_number,
      gender,
      remarks,
    } = body;

    const normalizedContactPerson = normalizeField(contact_person);
    const normalizedContactNumber = normalizeField(contact_number);
    const normalizedEmailAddress = normalizeField(email_address);
    const normalizedGender = normalizeField(gender) || "Male";
    const normalizedRemarks = normalizeField(remarks);

    const createdDate =
      date_created && !isNaN(Date.parse(date_created))
        ? date_created
        : new Date().toISOString();

    // ✅ GENERATE FULL ADDRESS
    const fullAddress = [
      street_address,
      barangay ? `Brgy. ${barangay}` : null,
      city,
      province,
      region,
    ]
      .filter(Boolean)
      .join(", ");

    const inserted = await Xchire_sql`
      INSERT INTO accounts
      (
        referenceid,
        tsm,
        manager,
        company_name,
        contact_person,
        contact_number,
        email_address,

        address,
        street_address,
        barangay,
        city,
        province,
        region,

        delivery_address,
        type_client,
        date_created,
        industry,
        status,
        company_group,
        account_reference_number,
        gender,
        remarks
      )
      VALUES
      (
        ${referenceid},
        ${tsm || null},
        ${manager || null},
        ${company_name},
        ${normalizedContactPerson},
        ${normalizedContactNumber},
        ${normalizedEmailAddress},

        ${fullAddress || null},
        ${street_address || null},
        ${barangay || null},
        ${city || null},
        ${province || null},
        ${region || null},

        ${delivery_address || null},
        ${type_client},
        ${createdDate},
        ${industry || null},
        ${status || "Active"},
        ${company_group || null},
        ${account_reference_number},
        ${normalizedGender},
        ${normalizedRemarks}
      )
      RETURNING *;
    `;

    return NextResponse.json(
      { success: true, data: inserted[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error saving account:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save account.",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";