// pages/api/act-update-activity.ts
import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { _id, updates } = req.body;

    if (!_id || !updates || typeof updates !== "object") {
      return res.status(400).json({ error: "Missing _id or updates object" });
    }

    const { db } = await connectToDatabase();

    const result = await db
      .collection("activity") // replace with your collection name
      .updateOne(
        { _id: new ObjectId(_id.trim()) },
        { $set: updates }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.status(200).json({ success: true, updated: updates });
  } catch (err: any) {
    console.error("MongoDB update error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
