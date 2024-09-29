import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { startDate, endDate, branch } = req.body;

    try {
      const { db } = await connectToDatabase();

      // Adjust start and end dates
      const startDateTime = new Date(startDate);
      startDateTime.setHours(5, 30, 0, 0); // Set to 5:30 AM

      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1); // Add one day
      endDateTime.setHours(5, 30, 0, 0); // Set to 5:30 AM

      const query: Record<string, unknown> = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
      };

      if (branch !== "all") {
        query.selectedLocation = branch;
      }

      const orders = await db
        .collection("OrderSevoke")
        .aggregate([
          { $match: query },
          {
            $project: {
              _id: 1,
              customerName: 1,
              phoneNumber: 1,
              total: { $subtract: ["$total", "$tableDeliveryCharge"] }, // Exclude table delivery charge
              createdAt: 1,
              status: 1,
              items: 1, // Include the items array
            },
          },
        ])
        .toArray();

      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Error fetching orders" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
