// File: pages/api/user-count.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { db } = await connectToDatabase();
      const userCollection = db.collection("UserData");
      const userCount = await userCollection.countDocuments();
      res.status(200).json({ count: userCount });
    } catch (error) {
      console.error("Error fetching user count:", error);
      res.status(500).json({ error: "Error fetching user count" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
