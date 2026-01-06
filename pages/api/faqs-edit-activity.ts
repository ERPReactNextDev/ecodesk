import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

/* 🔒 Runtime env checks */
if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

if (!MONGODB_DB) {
  throw new Error(
    "Please define the MONGODB_DB environment variable inside .env.local"
  );
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { _id, title, items } = req.body;

    /* ------------------------------
       VALIDATION
    ------------------------------ */
    if (!_id) {
      return res.status(400).json({ error: "Missing FAQ _id" });
    }

    // ✅ IMPORTANT FIX
    if (!ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid FAQ ID" });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    const faqObjectId = new ObjectId(_id);

    const { db } = await connectToDatabase();
    const collection = db.collection("faqs");

    /* ------------------------------
       FETCH EXISTING FAQ
    ------------------------------ */
    const existingFaq = await collection.findOne({
      _id: faqObjectId,
    });

    if (!existingFaq) {
      return res.status(404).json({ error: "FAQ not found" });
    }

    /* ------------------------------
       BUILD SET + UNSET
    ------------------------------ */
    const setFields: Record<string, string> = {};
    const unsetFields: Record<string, string> = {};
    const maxIndex = items.length;

    items.forEach((item: any, index: number) => {
      const i = index + 1;

      if (!item.description?.trim()) {
        throw new Error(`Description ${i} is empty`);
      }

      setFields[`description_${i}`] = item.description.trim();

      if (item.subtitle?.trim()) {
        setFields[`subtitle_${i}`] = item.subtitle.trim();
      } else {
        unsetFields[`subtitle_${i}`] = "";
      }
    });

    /* ------------------------------
       REMOVE EXTRA OLD FIELDS
    ------------------------------ */
    Object.keys(existingFaq).forEach((key) => {
      const match = key.match(/^(description|subtitle)_(\d+)$/);
      if (match) {
        const index = Number(match[2]);
        if (index > maxIndex) {
          unsetFields[key] = "";
        }
      }
    });

    /* ------------------------------
       UPDATE
    ------------------------------ */
    await collection.updateOne(
      { _id: faqObjectId },
      {
        ...(Object.keys(unsetFields).length > 0
          ? { $unset: unsetFields }
          : {}),
        $set: {
          title,
          ...setFields,
          date_updated: new Date().toISOString(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
    });
  } catch (error: any) {
    console.error("MongoDB update error:", error);
    return res.status(500).json({
      error: error.message || "Failed to update FAQ",
    });
  }
}
