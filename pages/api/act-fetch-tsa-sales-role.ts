// pages/api/act-fetch-tsa-sales-role.ts
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
    const role = req.headers["x-user-role"];
    const referenceid = req.headers["x-reference-id"];

    if (!role || typeof role !== "string") {
      return res.status(401).json({
        error: "Unauthorized: role missing",
      });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("activity");

    let filter: any = {};

    // 🔐 ACCESS CONTROL (Ticket-style)
    if (role === "Admin") {
      filter = {}; // Admin sees all
    } else {
      if (!referenceid || typeof referenceid !== "string") {
        return res.status(403).json({
          error: "Forbidden: referenceid required for non-admin users",
        });
      }

      // 🔑 ONLY OWN RECORDS
      filter = {
        referenceid: referenceid,
      };
    }

    // Optional: you may uncomment this later if you want TSA-only rows
    // filter.tsa_handling_time = { $exists: true };

    const data = await collection.find(filter).toArray();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("TSA sales fetch error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
