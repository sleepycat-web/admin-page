import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { startDate, endDate, branch } = req.body;

   
    try {
      const { db } = await connectToDatabase();

      const startDateTime = new Date(startDate);
      startDateTime.setHours(5, 30, 0, 0); // Set to 5:30 AM

      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1); // Add one day
      endDateTime.setHours(5, 30, 0, 0); // Set to 5:30 AM

      // Determine the collections to query
      const collections =
        branch === "all"
          ? ["BookingSevoke", "BookingDagapur"]
          : [`Booking${branch.charAt(0).toUpperCase() + branch.slice(1)}`];

      // Detailed query for logging
      const query = {
        createdAt: {
          $gte: startDateTime, // Ensure this is a Date object
          $lte: endDateTime, // Ensure this is a Date object
        },
      };

      // Aggregation pipeline with extensive logging
      const aggregateCollection = async (collectionName: string) => {
        const results = await db
          .collection(collectionName)
          .find(query)
          .toArray();

        return results;
      };

      // Perform query on all collections
      const bookingsPromises = collections.map(aggregateCollection);
      const bookingsResults = await Promise.all(bookingsPromises);

      // Flatten results
      const allBookings = bookingsResults.flat();

      res.status(200).json({
        totalBookings: allBookings.length,
        promoCodeUsage: allBookings.filter((b) => b.promoCode).length,
        bookings: allBookings,
      });
    } catch (error) {
      res.status(500).json({
        error: "Error fetching bookings",
        details: (error as Error).message,
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
