import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}
if (!MONGODB_DB) {
  throw new Error("Please define MONGODB_DB in .env.local");
}

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI!);
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
    const { referenceid, ...payload } = req.body;

    if (!referenceid) {
      return res.status(400).json({ error: "referenceid is required" });
    }

    const { db } = await connectToDatabase();

    const insertData = {
      referenceid,
      ...payload,
      date_created: new Date(),
      date_updated: new Date(),
    };

    const result = await db.collection("departmental-csr").insertOne(insertData);

    return res.status(200).json({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (error: any) {
    console.error("Departmental Save Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
}
