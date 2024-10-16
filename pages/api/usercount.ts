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
      const startDateTime = new Date(startDate);
      startDateTime.setHours(5, 30, 0, 0); // Set to 5:30 AM

      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1); // Add one day
      endDateTime.setHours(5, 29, 59, 999); // Set to 5:29:59.999 AM

      const totalUserCount = await userCollection.countDocuments();

      const newUserCount = await userCollection.countDocuments({
        signupDate: { $gte: startDateTime, $lte: endDateTime },
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
