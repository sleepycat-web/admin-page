import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

interface DailyStats {
  date: string;
  numberOfOrders: number;
  generalExpenses: number;
  revenue: number;
}

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
      endDateTime.setHours(5, 29, 59, 999); // Set to 5:29:59.999 AM

      // Fetch orders
      let orderQuery: Record<string, unknown> = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
      };

      if (branch !== "all") {
        orderQuery.selectedLocation = branch;
      }

      const orders = await db
        .collection("OrderSevoke")
        .aggregate([
          { $match: orderQuery },
          {
            $project: {
              createdAt: 1,
              total: 1,
              selectedLocation: 1,
            },
          },
        ])
        .toArray();

      // Fetch expenses
      let expenseCollections = ["ExpenseSevoke", "ExpenseDagapur"];
      if (branch !== "all") {
        expenseCollections = [`Expense${branch}`];
      }

      const expenseQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
      };

      const expensesPromises = expenseCollections.map((collection) =>
        db.collection(collection).find(expenseQuery).toArray()
      );

      const expensesArrays = await Promise.all(expensesPromises);
      const expenses = expensesArrays.flat();

      // Process data day by day
      const dailyStats: { [key: string]: DailyStats } = {};
      const dateRange = getDateRange(startDateTime, endDateTime);

      dateRange.forEach((date) => {
        const dateStr = date.toISOString().split("T")[0];
        dailyStats[dateStr] = {
          date: dateStr,
          numberOfOrders: 0,
          generalExpenses: 0,
          revenue: 0,
        };
      });

      // Process orders
      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const dateStr = getAdjustedDateStr(orderDate);
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].numberOfOrders++;
          dailyStats[dateStr].revenue += order.total;
        }
      });

      // Process expenses
      expenses.forEach((expense) => {
        const expenseDate = new Date(expense.createdAt);
        const dateStr = getAdjustedDateStr(expenseDate);

        if (dailyStats[dateStr]) {
          if (
            expense.category === "Extra Cash Payment" ||
            expense.category === "Extra UPI Payment"
          ) {
            dailyStats[dateStr].revenue += expense.amount;
          } else {
            dailyStats[dateStr].generalExpenses += expense.amount;
          }
        }
      });

      const result = Object.values(dailyStats);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Error fetching data" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function getDateRange(start: Date, end: Date): Date[] {
  const dates = [];
  const current = new Date(start);
  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getAdjustedDateStr(date: Date): string {
  const adjustedDate = new Date(date);
  if (
    adjustedDate.getHours() < 5 ||
    (adjustedDate.getHours() === 5 && adjustedDate.getMinutes() < 30)
  ) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  return adjustedDate.toISOString().split("T")[0];
}
