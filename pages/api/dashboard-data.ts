import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Db } from "mongodb";

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  expenses: number;
  branch: string;
}

interface DashboardData {
  totalRevenue: number;
  totalUsers: number;
  totalOrders: number;
  salesData: SalesDataPoint[];
  growthPercentage: number | null;
  orderGrowthPercentage: number | null;
  newSignups: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { startDate, endDate, branch, previousStartDate, previousEndDate } =
      req.body;

    try {
      const { db } = await connectToDatabase();

      // Calculate total users
      const totalUsers = await db.collection("UserData").countDocuments();

      // Calculate new signups for the selected date range
      const newSignups = await db.collection("UserData").countDocuments({
        signupDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });

      // Calculate current period data
      const { totalRevenue, totalOrders, salesData } =
        await calculateRevenueOrdersAndExpenses(db, startDate, endDate, branch);

      // Calculate previous period data
      const { totalRevenue: previousRevenue, totalOrders: previousOrders } =
        await calculateRevenueOrdersAndExpenses(
          db,
          previousStartDate,
          previousEndDate,
          branch
        );

      // Calculate growth percentages
      const growthPercentage =
        previousRevenue !== 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : null;

      const orderGrowthPercentage =
        previousOrders !== 0
          ? ((totalOrders - previousOrders) / previousOrders) * 100
          : null;

      const response: DashboardData = {
        totalRevenue,
        totalUsers,
        totalOrders,
        salesData,
        growthPercentage,
        orderGrowthPercentage,
        newSignups,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Error fetching dashboard data" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function calculateRevenueOrdersAndExpenses(
  db: Db,
  startDate: string,
  endDate: string,
  branch: string
): Promise<{
  totalRevenue: number;
  totalOrders: number;
  salesData: SalesDataPoint[];
}> {
  let totalRevenue = 0;
  let totalOrders = 0;
  const salesDataMap: { [key: string]: SalesDataPoint } = {};

  const startDateTime = new Date(startDate);
  const endDateTime = new Date(endDate);

  // Adjust end time to 23:59:59.999 if start and end are on the same day
  if (startDateTime.toDateString() === endDateTime.toDateString()) {
    endDateTime.setHours(23, 59, 59, 999);
  }

  const orderQuery = {
    createdAt: { $gte: startDateTime, $lte: endDateTime },
    status: "fulfilled",
    order: "dispatched",
  };

  const expenseQuery = {
    createdAt: { $gte: startDateTime, $lte: endDateTime },
    category: { $ne: "UPI payment" },
  };

  const branches = branch === "all" ? ["Sevoke", "Dagapur"] : [branch];

  for (const branchName of branches) {
    const orderCollectionName = `Order${branchName}`;
    const expenseCollectionName = `Expense${branchName}`;

    // Fetch orders
    const orders = await db
      .collection(orderCollectionName)
      .find(orderQuery)
      .toArray();

    // Fetch expenses
    const expenses = await db
      .collection(expenseCollectionName)
      .find(expenseQuery)
      .toArray();

    orders.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
      });

      if (!salesDataMap[date]) {
        salesDataMap[date] = {
          date,
          revenue: 0,
          orders: 0,
          expenses: 0,
          branch: branchName,
        };
      }

      salesDataMap[date].revenue += order.total;
      salesDataMap[date].orders += 1;
      totalRevenue += order.total;
      totalOrders += 1;
    });

    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt).toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
      });

      if (!salesDataMap[date]) {
        salesDataMap[date] = {
          date,
          revenue: 0,
          orders: 0,
          expenses: 0,
          branch: branchName,
        };
      }

      salesDataMap[date].expenses += expense.amount;
    });
  }

  // Convert salesDataMap object to array and sort by date
  const sortedSalesData = Object.values(salesDataMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { totalRevenue, totalOrders, salesData: sortedSalesData };
}
