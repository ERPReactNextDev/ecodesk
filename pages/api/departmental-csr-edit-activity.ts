// pages/api/departmental-csr-edit-activity.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connect() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { _id, ...fields } = req.body;

    if (!_id) {
      return res.status(400).json({ error: "_id is required" });
    }

    const { db } = await connect();

    const result = await db
      .collection("departmental-csr")
      .updateOne(
        { _id: new ObjectId(_id) },
        {
          $set: {
            ...fields,
            date_updated: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    return res.status(200).json({
      success: true,
      updated: true,
    });
  } catch (err) {
    console.error("Edit error:", err);
    return res.status(500).json({ error: "Failed to update record" });
  }
}