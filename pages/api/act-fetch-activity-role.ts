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
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const role = req.headers["x-user-role"];
    const referenceid = req.headers["x-reference-id"];

    if (!role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("activity");

    let filter: any = {};

    // 🔐 ACCESS CONTROL
    if (role === "Admin") {
      filter = {};
    } else {
      if (!referenceid || typeof referenceid !== "string") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      filter = { referenceid };
    }

    const data = await collection.find(filter).toArray();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (e) {
    console.log("Activity fetch issue:", e);
    return res.status(500).json({
      success: false,
      message: "Internal server issue",
    });
  }
}
