import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connect() {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { referenceid } = req.query;

    if (!referenceid) {
      return res.status(400).json({ error: "referenceid is required" });
    }

    const { db } = await connect();

    const data = await db
      .collection("departmental-csr")
      .find({ referenceid })
      .sort({ date_created: -1 })
      .toArray();

    res.status(200).json({ success: true, data });
  } catch (e: any) {
    console.error("Fetch Error:", e);
    res.status(500).json({ error: e.message });
  }
}
