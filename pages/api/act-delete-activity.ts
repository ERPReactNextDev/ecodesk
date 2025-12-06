import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

if (!MONGODB_DB) {
  throw new Error("Please define the MONGODB_DB environment variable");
}

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Missing or invalid 'ids' array" });
    }

    // Validate and convert to ObjectId array
    const objectIds: ObjectId[] = [];
    for (const id of ids) {
      try {
        objectIds.push(new ObjectId(id));
      } catch {
        return res.status(400).json({ error: `Invalid ID format: ${id}` });
      }
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB!);
    const collection = db.collection("activity");

    // Delete many matching the ids
    const deleteResult = await collection.deleteMany({
      _id: { $in: objectIds },
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "No activities found to delete" });
    }

    return res.status(200).json({
      success: true,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (err: any) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
