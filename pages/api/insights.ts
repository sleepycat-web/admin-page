import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

interface DailyStats {
  date: string;
  numberOfOrders: number;
  generalExpenses: number;
  revenue: number;
  profit: number;
  online?: number;  // Changed from upiPayment to online
}

interface OrderQuery {
  createdAt: {
    $gte: Date;
    $lt: Date;
  };
  status: string;
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

      // Prepare queries
      const orderQuery: OrderQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
        status: "fulfilled",
      };

      const extraQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
        category: { $in: ["Extra Cash Payment", "Extra UPI Payment"] },
      };
      const expenseQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
        category: {
          $nin: [
            "UPI Payment",
            "Extra Cash Payment",
            "Extra UPI Payment",
            "Drawings",
            "Opening Cash",
          ],
        },
      };

      // Replace occurrences of upiPaymentQuery with onlinePaymentQuery
      const onlinePaymentQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
        category: "UPI Payment",
      };

      // Determine collections based on branch
      let orderCollections = ["OrderSevoke", "OrderDagapur"];
      let expenseCollections = ["ExpenseSevoke", "ExpenseDagapur"];
      if (branch !== "all") {
        orderCollections = [`Order${branch}`];
        expenseCollections = [`Expense${branch}`];
      }

      // Fetch orders
      // Update the orders aggregation pipeline
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
                revenue: {
                  $sum: {
                    $subtract: [
                      "$total",
                      { $ifNull: ["$tableDeliveryCharge", 0] },
                    ],
                  },
                },
              },
            },
          ])
          .toArray()
      );

      // Fetch extra payments
      const extraPaymentsPromises = expenseCollections.map((collection) =>
        db
          .collection(collection)
          .aggregate([
            {
              $match: extraQuery,
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: {
                      $subtract: [
                        "$createdAt",
                        5.5 * 60 * 60 * 1000, // Subtract 5 hours and 30 minutes
                      ],
                    },
                    timezone: "+00:00", // Use UTC
                  },
                },
                extraPayments: { $sum: "$amount" },
              },
            },
          ])
          .toArray()
      );

      // Fetch expenses
      const expensesPromises = expenseCollections.map((collection) =>
        db.collection(collection).find(expenseQuery).toArray()
      );

      // Fetch online Payment expenses
      const onlinePaymentsPromises = expenseCollections.map((collection) =>
        db
          .collection(collection)
          .aggregate([
            { $match: onlinePaymentQuery },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: {
                      $subtract: [
                        "$createdAt",
                        5.5 * 60 * 60 * 1000, // Subtract 5 hours and 30 minutes
                      ],
                    },
                    timezone: "+00:00", // Use UTC
                  },
                },
                totalOnlinePayment: { $sum: "$amount" },
              },
            },
          ])
          .toArray()
      );

      // Wait for all promises to resolve
      const [ordersArrays, extraPaymentsArrays, expensesArrays, onlinePaymentsArrays] =
        await Promise.all([
          Promise.all(orderPromises),
          Promise.all(extraPaymentsPromises),
          Promise.all(expensesPromises),
          Promise.all(onlinePaymentsPromises),  // Changed from upiPaymentsPromises
        ]);

      // Flatten the results
      const orders = ordersArrays.flat();
      const extraPayments = extraPaymentsArrays.flat();
      const expenses = expensesArrays.flat();
      const onlinePayments = onlinePaymentsArrays.flat();

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
          profit: 0,
        };
      });

      // Process orders
      orders.forEach((order) => {
        const dateStr = order._id;
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].numberOfOrders += order.numberOfOrders;
          dailyStats[dateStr].revenue += order.revenue;
          dailyStats[dateStr].profit += order.revenue;
        }
      });

      // Process extra payments
      extraPayments.forEach((payment) => {
        const dateStr = payment._id;
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].revenue += payment.extraPayments;
          dailyStats[dateStr].profit += payment.extraPayments;
        }
      });

      // Process expenses
      expenses.forEach((expense) => {
        const expenseDate = new Date(expense.createdAt);
        const adjustedExpenseDate = new Date(
          expenseDate.getTime() - (5 * 60 + 30) * 60000
        );
        const dateStr = adjustedExpenseDate.toISOString().split("T")[0];

        if (dailyStats[dateStr]) {
          dailyStats[dateStr].generalExpenses += expense.amount;
          dailyStats[dateStr].profit -= expense.amount;
        }
      });

      // Process online payment data
      onlinePayments.forEach((payment) => {
        const dateStr = payment._id;
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].online = payment.totalOnlinePayment;
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
