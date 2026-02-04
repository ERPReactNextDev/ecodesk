// pages/api/act-save-activity.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

// Runtime check for env vars
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
    const body = req.body;

    if (!body._id) {
      return res.status(400).json({ error: "Missing activity _id" });
    }

    if (!ObjectId.isValid(body._id)) {
      return res.status(400).json({ error: "Invalid _id format" });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("activity");

    const filter = { _id: new ObjectId(body._id) };

    // 🔹 Prepare update payload
    const updateData: any = { ...body };
    delete updateData._id;

    // ================================
    // ✅ FIXED DATE HANDLING LOGIC
    // ================================

    // Always update date_updated whenever a record is modified
    updateData.date_updated = new Date();

    // If date_created is provided from the client, store it directly as a Date object
    if (updateData.date_created) {
      updateData.date_created = new Date(updateData.date_created);
    }

    const result = await collection.updateOne(
      filter,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("MongoDB update error:", error);
    return res.status(500).json({
      error: error.message || "Failed to update activity",
    });
  }
}
