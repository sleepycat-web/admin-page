import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { db } = await connectToDatabase();
      const userCollection = db.collection("UserData");

      const { startDate, endDate } = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);

      const totalUserCount = await userCollection.countDocuments();

      const newUserCount = await userCollection.countDocuments({
        signupDate: { $gte: start, $lte: end },
      });

      res.status(200).json({
        totalCount: totalUserCount,
        newUserCount,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Error fetching user data" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
