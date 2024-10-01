import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

interface DailyStats {
  date: string;
  numberOfOrders: number;
  generalExpenses: number;
  revenue: number;
}
// Add this new interface for the order query
interface OrderQuery {
  createdAt: {
    $gte: Date;
    $lt: Date;
  };
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

      // Fetch orders (new logic)
       const orderQuery: OrderQuery = {
         createdAt: { $gte: startDateTime, $lt: endDateTime },
       };

      let orderCollections = ["OrderSevoke", "OrderDagapur"];
      if (branch !== "all") {
        orderCollections = [`Order${branch}`];
      }

      const orderPromises = orderCollections.map((collection) =>
        db
          .collection(collection)
          .aggregate([
            { $match: orderQuery },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: "+05:30",
                  },
                },
                numberOfOrders: { $sum: 1 },
                revenue: { $sum: "$total" },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray()
      );

      const ordersArrays = await Promise.all(orderPromises);
      const orders = ordersArrays.flat();

      // Fetch expenses (original logic)
      let expenseCollections = ["ExpenseSevoke", "ExpenseDagapur"];
      if (branch !== "all") {
        expenseCollections = [`Expense${branch}`];
      }

      const expenseQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
        category: {
          $nin: ["UPI Payment", "Extra Cash Payment", "Extra UPI Payment"],
        },
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

      // Process orders (new logic)
      orders.forEach((order) => {
        const dateStr = order._id;
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].numberOfOrders += order.numberOfOrders;
          dailyStats[dateStr].revenue += order.revenue;
        }
      });

      // Process expenses (original logic)
      expenses.forEach((expense) => {
        const expenseDate = new Date(expense.createdAt);
        const adjustedExpenseDate = new Date(
          expenseDate.getTime() - (5 * 60 + 30) * 60000
        ); // Subtract 5 hours and 30 minutes
        const dateStr = adjustedExpenseDate.toISOString().split("T")[0];

        if (dailyStats[dateStr]) {
          dailyStats[dateStr].generalExpenses += expense.amount;
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
