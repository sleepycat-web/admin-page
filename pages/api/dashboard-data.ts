import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Db } from "mongodb";

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  branch: string;
}

interface DashboardData {
  totalRevenue: number;
  totalUsers: number;
  totalOrders: number;
  salesData: SalesDataPoint[];
  growthPercentage: number | null;
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

      // Calculate new signups
     const newSignups = await db.collection("UserData").countDocuments({
       signupDate: {
         $gte: new Date(startDate),
         $lte: new Date(endDate),
       },
     });
      // Calculate current period data
      const { totalRevenue, totalOrders, salesData } =
        await calculateRevenueAndOrders(db, startDate, endDate, branch);

      // Calculate previous period data
      const { totalRevenue: previousRevenue } = await calculateRevenueAndOrders(
        db,
        previousStartDate,
        previousEndDate,
        branch
      );

      // Calculate growth percentage
      const growthPercentage =
        previousRevenue !== 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : null;

      const response: DashboardData = {
        totalRevenue,
        totalUsers,
        totalOrders,
        salesData,
        growthPercentage,
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

async function calculateRevenueAndOrders(
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
  const salesData: SalesDataPoint[] = [];

  const startDateTime = new Date(
    new Date(startDate).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const endDateTime = new Date(
    new Date(endDate).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const orderQuery = {
    createdAt: { $gte: startDateTime, $lte: endDateTime },
    status: "fulfilled",
    order: "dispatched",
  };

  const branches = branch === "all" ? ["Sevoke", "Dagapur"] : [branch];

  for (const branchName of branches) {
    const collectionName = `Order${branchName}`;
    const orders = await db
      .collection(collectionName)
      .find(orderQuery)
      .toArray();

    const branchRevenue = orders.reduce(
      (sum: number, order: any) => sum + order.total,
      0
    );
    totalRevenue += branchRevenue;
    totalOrders += orders.length;

    // Group sales data by date
    const branchSalesData = orders.reduce(
      (
        acc: { [key: string]: { revenue: number; orders: number } },
        order: any
      ) => {
        const date = new Date(order.createdAt)
          .toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          .split(",")[0];
        if (!acc[date]) {
          acc[date] = { revenue: 0, orders: 0 };
        }
        acc[date].revenue += order.total;
        acc[date].orders += 1;
        return acc;
      },
      {}
    );

    Object.entries(branchSalesData).forEach(([date, data]) => {
      salesData.push({
        date,
        revenue: data.revenue,
        orders: data.orders,
        branch: branchName,
      });
    });
  }

  // Sort salesData by date
  salesData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { totalRevenue, totalOrders, salesData };
}
