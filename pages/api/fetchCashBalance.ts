// /pages/api/fetchCashBalance.ts
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb"; // Adjust the import path as necessary

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { db } = await connectToDatabase();

      const locations = ["Sevoke", "Dagapur"];
      const results: { [key: string]: number } = {};

      for (const location of locations) {
        const orderCollectionName = `Order${location}`;
        const expenseCollectionName = `Expense${location}`;

        const orderCollection = db.collection(orderCollectionName);
        const expenseCollection = db.collection(expenseCollectionName);

        const [orderTotals, expenses] = await Promise.all([
          orderCollection
            .aggregate([
              { $match: { status: "fulfilled" } },
              {
                $group: {
                  _id: null,
                  total: { $sum: "$total" },
                  tableDeliveryChargeTotal: { $sum: "$tableDeliveryCharge" },
                },
              },
            ])
            .toArray(),
          expenseCollection.find({}).toArray(),
        ]);

        let totalOrders = orderTotals.length > 0 ? orderTotals[0].total : 0;
        const tableDeliveryChargeTotal =
          orderTotals.length > 0 ? orderTotals[0].tableDeliveryChargeTotal : 0;
        let totalExpenses = 0;
        let extraCashPayments = 0;

        expenses.forEach((expense) => {
          if (
            expense.category === "Extra Cash Payment" ||
            expense.category === "Opening Cash"
          ) {
            extraCashPayments += expense.amount;
          } else if (expense.category !== "Extra UPI Payment") {
            totalExpenses += expense.amount;
          }
        });

        totalOrders =
          totalOrders - tableDeliveryChargeTotal + extraCashPayments;

        // Calculate all-time counter balance excluding UPI payments from expenses
        const allTimeCounterBalance = totalOrders - totalExpenses;

        results[location] = allTimeCounterBalance;
      }

      res.status(200).json(results);
    } catch (error: unknown) {
      res.status(500).json({
        message: "Error fetching all-time data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
