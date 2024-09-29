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

  // Convert start and end dates to UTC
  const startDateTime = new Date(startDate);
  startDateTime.setUTCHours(0, 0, 0, 0);

  const endDateTime = new Date(endDate);
  endDateTime.setUTCHours(23, 59, 59, 999);

  const orderQuery = {
    createdAt: { $gte: startDateTime, $lte: endDateTime },
    status: "fulfilled",
    order: "dispatched",
  };

  const expenseQuery = {
    createdAt: { $gte: startDateTime, $lte: endDateTime },
    category: {
      $nin: ["UPI Payment", "Extra Cash Payment", "Extra UPI Payment"],
    },
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

    // Helper function to convert UTC to IST and format date
    const formatISTDate = (utcDate: Date): string => {
      const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000); // Add 5 hours 30 minutes
      return istDate.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    // Process orders
    orders.forEach((order) => {
      const date = formatISTDate(new Date(order.createdAt));

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

    // Process expenses
    expenses.forEach((expense) => {
      const date = formatISTDate(new Date(expense.createdAt));

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

    // Process extra payments
    const extraPaymentsQuery = {
      createdAt: { $gte: startDateTime, $lte: endDateTime },
      category: { $in: ["Extra Cash Payment", "Extra UPI Payment"] },
    };

    const extraPayments = await db
      .collection(orderCollectionName)
      .find(extraPaymentsQuery)
      .toArray();

    extraPayments.forEach((payment) => {
      const date = formatISTDate(new Date(payment.createdAt));

      if (!salesDataMap[date]) {
        salesDataMap[date] = {
          date,
          revenue: 0,
          orders: 0,
          expenses: 0,
          branch: branchName,
        };
      }

      salesDataMap[date].revenue += payment.total;
      totalRevenue += payment.total;
    });
  }

  // Convert salesDataMap object to array and sort by date
  const sortedSalesData = Object.values(salesDataMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { totalRevenue, totalOrders, salesData: sortedSalesData };
}