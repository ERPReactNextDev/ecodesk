import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ error: "Reference ID required" });
  }

  try {
    const db = await connectToDatabase();

    const user = await db.collection("users").findOne(
      { ReferenceID: reference },
      {
        projection: {
          Firstname: 1,
          Lastname: 1,
          ReferenceID: 1,
          Connection: 1,
        },
      }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}
