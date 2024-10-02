import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

interface ResponseData {
  revenue: number;
  orders: number;
  expenses: number;
}

 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { startDate, endDate, branch } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
 
    const { db } = await connectToDatabase();

    const getCollectionNames = (branch: string) => {
      if (branch === "Sevoke") {
        return [{ orders: "OrderSevoke", expenses: "ExpenseSevoke" }];
      } else if (branch === "Dagapur") {
        return [{ orders: "OrderDagapur", expenses: "ExpenseDagapur" }];
      } else if (branch === "all") {
        return [
          { orders: "OrderSevoke", expenses: "ExpenseSevoke" },
          { orders: "OrderDagapur", expenses: "ExpenseDagapur" },
        ];
      } else {
        return [{ orders: "Orders", expenses: "Expenses" }];
      }
    };

    const getTotals = async (
      periodStart: Date,
      periodEnd: Date,
      collections: { orders: string; expenses: string }[]
    ) => {
      const dateQuery = { createdAt: { $gte: periodStart, $lt: periodEnd } };
      let totalRevenue = 0;
      let totalOrders = 0;
      let totalExpenses = 0;

      for (const {
        orders: orderCollection,
        expenses: expenseCollection,
      } of collections) {
        const [orderResult, expenseResult] = await Promise.all([
          db
            .collection(orderCollection)
            .aggregate([
              { $match: dateQuery },
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: "$total" },
                  totalOrders: { $sum: 1 },
                },
              },
            ])
            .toArray(),
          db
            .collection(expenseCollection)
            .aggregate([
              { $match: dateQuery },
              { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
            ])
            .toArray(),
        ]);

        totalRevenue += orderResult[0]?.totalRevenue || 0;
        totalOrders += orderResult[0]?.totalOrders || 0;
        totalExpenses += expenseResult[0]?.totalExpenses || 0;
      }

      return {
        revenue: totalRevenue,
        orders: totalOrders,
        expenses: totalExpenses,
      };
    };

    const collections = getCollectionNames(branch);
    const currentTotals = await getTotals(start, end, collections);

    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const calculateGrowth = async (
      current: number,
      metric: keyof ResponseData
    ) => {
      
        const previousStart = new Date(
          start.getTime() - (end.getTime() - start.getTime())
        );
        const previousTotals = await getTotals(
          previousStart,
          start,
          collections
        );
        const previous = previousTotals[metric];
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      // }
    };

    const result: ResponseData = {
      revenue: await calculateGrowth(currentTotals.revenue, "revenue"),
      orders: await calculateGrowth(currentTotals.orders, "orders"),
      expenses: await calculateGrowth(
        currentTotals.expenses,
        "expenses"
      ),
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in percentage API:", error);
    res.status(500).json({ revenue: 0, orders: 0, expenses: 0 });
  }
}
