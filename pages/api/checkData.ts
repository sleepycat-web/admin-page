import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { phoneNumber } = req.body;
      const { db } = await connectToDatabase();

      const userData = await db.collection("UserData").findOne({ phoneNumber });

      if (userData) {
        res.status(200).json({ found: true, userData });
      } else {
        res.status(200).json({ found: false });
      }
    } catch (error) {
      res.status(500).json({ error: "Error checking user data" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
