// pages/api/d-tracking-hide-record.ts
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
    const { id, _id } = req.body;
    const recordId = id || _id;

    if (!recordId) {
      return res.status(400).json({ error: "Record ID (_id or id) is required" });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("d-tracking");

    const result = await collection.updateOne(
      { _id: new ObjectId(recordId) },
      { $set: { isActive: false } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    return res.status(200).json({
      success: true,
      message: "D-Tracking record is now hidden",
      updatedRecord: { _id: recordId, isActive: false },
    });
  } catch (error: any) {
    console.error("MongoDB hide record error:", error);
    return res.status(500).json({
      error: error.message || "Failed to hide D-Tracking record",
    });
  }
}
