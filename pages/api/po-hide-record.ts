import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env.local");
if (!MONGODB_DB) throw new Error("Please define MONGODB_DB in .env.local");

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing PO record ID" });

    const { db } = await connectToDatabase();
    const collection = db.collection("activity");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "PO record not found or already deleted" });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("MongoDB hide error (PO):", error);
    return res.status(500).json({ error: error.message || "Failed to hide PO record" });
  }
}
