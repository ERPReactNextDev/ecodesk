// pages/api/d-tracking-edit-record.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

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
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Accept either 'id' or '_id'
    const {
      id,
      _id: _idFromBody,
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
      remarks,
      endorsed_date,
      closed_date,
    } = req.body;

    // Use whichever is provided
    const recordId = id || _idFromBody;

    /* 🔒 Basic validation */
    if (!recordId) {
      return res.status(400).json({ error: "Record ID (_id or id) is required" });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("d-tracking");

    /* 📌 Build update document */
    const updateDoc: any = {
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
      remarks,
      endorsed_date, // date string
      closed_date,   // date string
      date_created: new Date().toISOString(), // only date_created
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(recordId) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    return res.status(200).json({
      success: true,
      message: "D-Tracking record updated successfully",
      updatedRecord: { _id: recordId, ...updateDoc },
    });
  } catch (error: any) {
    console.error("MongoDB update error:", error);
    return res.status(500).json({
      error: error.message || "Failed to update D-Tracking record",
    });
  }
}
