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
      contact_number,

      po_number,
      amount,

      so_number,
      so_date,

      sales_agent,

      payment_terms,
      payment_date,

      delivery_pickup_date,

      source,

      remarks,
    } = req.body;

    /* 🔒 Basic validation (minimal scaffold) */
    if (!company_name || !po_number || !remarks) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("activity");

    /* 📌 Build document */
    const newRecord = {
      referenceid,

      company_name,
      contact_number,

      po_number,
      amount,

      so_number,
      so_date,

      sales_agent,

      payment_terms,
      payment_date,

      delivery_pickup_date,

      source,

      remarks,

      isActive: true,
      date_created: new Date().toISOString(),
    };

    const result = await collection.insertOne(newRecord);

    if (!result.acknowledged) {
      throw new Error("Failed to insert PO record");
    }

    return res.status(201).json({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (error: any) {
    console.error("MongoDB insert error (PO):", error);
    return res.status(500).json({
      error: error.message || "Failed to add PO record",
    });
  }
}
