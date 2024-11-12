// /pages/api/fetchCashBalanceDetails.ts
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { db } = await connectToDatabase();

      // Fetch cash balance details
      const cashBalanceDetailsCollection = db.collection("CashBalanceDetails");
      const cashBalanceDetails = await cashBalanceDetailsCollection
        .find({})
        .toArray();

      res.status(200).json(cashBalanceDetails);
    } catch (error: unknown) {
      res.status(500).json({
        message: "Error fetching cash balance details",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
