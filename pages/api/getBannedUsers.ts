import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { db } = await connectToDatabase();

      const bannedUsers = await db
        .collection("UserData")
        .find({ banStatus: true })
        .project({
          name: 1,
          phoneNumber: 1,
          banDate: 1,
          banHistory: 1,
          _id: 0,
        })
        .toArray();

      res.status(200).json(bannedUsers);
    } catch (error) {
      res.status(500).json({ error: "Error fetching banned users" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
