import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(401).json({ error: "No session found" });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(sessionCookie),
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    return res.status(200).json({
      userId: user._id.toString(),
      Email: user.Email,
      Name: user.Name,
      Department: user.Department,
      Status: user.Status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
