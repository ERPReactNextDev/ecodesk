import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { referenceid } = req.query;

    const { db } = await connectToDatabase();
    const collection = db.collection("activity");

    // Base filter always on remarks
    const filter: any = {
      remarks: { $in: ["PO Received", "Po Received"] },
    };

    // Add referenceid filter only if present and valid string
    if (referenceid && typeof referenceid === "string" && referenceid.trim() !== "") {
      filter.referenceid = referenceid;
    }
    // else no referenceid filter => fetch all (for Admin)

    const data = await collection
      .find(filter)
      .sort({ date_created: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("MongoDB fetch error (PO):", error);
    return res.status(500).json({ error: "Server error" });
  }
}
