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
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { referenceid, title, items } = req.body;

    /* ------------------------------
       VALIDATION
    ------------------------------ */
    if (!referenceid) {
      return res.status(400).json({ error: "Missing referenceid" });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: "Missing title" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("faqs");

    /* ------------------------------
       BUILD FIELDS
    ------------------------------ */
    const fields: Record<string, string> = {};

    items.forEach((item: any, index: number) => {
      if (!item.description?.trim()) {
        throw new Error(`Description ${index + 1} is empty`);
      }

      if (item.subtitle?.trim()) {
        fields[`subtitle_${index + 1}`] = item.subtitle.trim();
      }

      fields[`description_${index + 1}`] = item.description.trim();
    });

    const payload = {
      referenceid,
      title,
      ...fields,
      isActive: true,
      date_created: new Date().toISOString(),
      date_updated: new Date().toISOString(),
    };

    /* ------------------------------
       INSERT + RETURN ID ✅ FIX
    ------------------------------ */
    const result = await collection.insertOne(payload);

    return res.status(200).json({
      success: true,
      message: "FAQ saved successfully",
      insertedId: result.insertedId, // 🔥 REQUIRED FOR EDIT
    });
  } catch (error: any) {
    console.error("MongoDB insert error:", error);
    return res.status(500).json({
      error: error.message || "Failed to save FAQ activity",
    });
  }
}
