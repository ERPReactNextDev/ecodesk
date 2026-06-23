// pages/api/fetch-csr-quotations.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

if (!MONGODB_DB) {
  throw new Error("Please define the MONGODB_DB environment variable inside .env.local");
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const { db } = await connectToDatabase();
    const collection = db.collection("activity");

    // Build filter for quotation_number and ticket_reference_number
    const filter: any = {
      quotation_number: { $exists: true, $ne: "" },
      ticket_reference_number: { $exists: true, $ne: "" },
    };

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { quotation_number: { $regex: search, $options: "i" } },
        { ticket_reference_number: { $regex: search, $options: "i" } },
        { company_name: { $regex: search, $options: "i" } },
        { referenceid: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await collection.countDocuments(filter);

    // Get paginated data
    const skip = (page - 1) * limit;
    const data = await collection
      .find(filter)
      .sort({ date_created: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("MongoDB fetch error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
