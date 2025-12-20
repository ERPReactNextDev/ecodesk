import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

/* 🔒 Runtime env checks */
if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

if (!MONGODB_DB) {
  throw new Error(
    "Please define the MONGODB_DB environment variable inside .env.local"
  );
}

const mongoUri: string = MONGODB_URI;
const mongoDb: string = MONGODB_DB;

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(mongoDb);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      referenceid,
      company_name,
      customer_name,
      contact_number,
      ticket_type,
      ticket_concern,
      department,
      sales_agent,
      tsm,
      status,
      nature_of_concern,
      endorsed_date,
      closed_date,
      remarks, // ✅ NEW
    } = req.body;

    /* 🔒 Basic validation */
    if (!company_name || !customer_name || !contact_number || !ticket_type || !status) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("d-tracking");

    /* 📌 Build document */
    const newRecord = {
      referenceid,
      company_name,
      customer_name,
      contact_number,
      ticket_type,
      ticket_concern,
      department,
      sales_agent,
      tsm,
      status,
      nature_of_concern,
      remarks: remarks || "", // ✅ NEW
      endorsed_date,
      closed_date,
      isActive: true,
      date_created: new Date().toISOString(),
    };

    const result = await collection.insertOne(newRecord);

    if (!result.acknowledged) {
      throw new Error("Failed to insert D-Tracking record");
    }

    return res.status(201).json({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (error: any) {
    console.error("MongoDB insert error:", error);
    return res.status(500).json({
      error: error.message || "Failed to add D-Tracking record",
    });
  }
}
