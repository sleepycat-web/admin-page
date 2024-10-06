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

      // Determine the collections to query based on the branch
      let collections = [];
      if (branch === "all") {
        collections = ["OrderSevoke", "OrderDagapur"];
      } else {
        collections = [
          `Order${branch.charAt(0).toUpperCase() + branch.slice(1)}`,
        ];
      }

      // Function to perform aggregation on a single collection
      const aggregateCollection = async (collectionName: string) => {
        return db
          .collection(collectionName)
          .aggregate([
            { $match: query },
            {
              $project: {
                _id: 1,
                customerName: 1,
                phoneNumber: 1,
                total: {
                  $cond: {
                    if: {
                      $and: [
                        { $isNumber: "$total" },
                        { $isNumber: "$tableDeliveryCharge" },
                      ],
                    },
                    then: { $subtract: ["$total", "$tableDeliveryCharge"] },
                    else: "$total",
                  },
                },
                createdAt: 1,
                status: 1,
                items: 1,
                appliedPromo: 1,
                selectedLocation: 1,
              },
            },
          ])
          .toArray();
      };

      // Perform aggregation on all required collections
      const ordersPromises = collections.map(aggregateCollection);
      const ordersArrays = await Promise.all(ordersPromises);

      // Flatten the array of arrays into a single array of orders
      const orders = ordersArrays.flat();

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
