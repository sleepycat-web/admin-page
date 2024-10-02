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

  console.log("Received request body:", req.body);

  try {
    const { startDate, endDate, branch } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log("Parsed dates:", { start, end });

    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log("Calculated days:", days);

    const previousStart = new Date(
      start.getTime() - days * 24 * 60 * 60 * 1000
    );
    const previousEnd = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    console.log("Previous period:", { previousStart, previousEnd });

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

    const collections = getCollectionNames(branch);
    console.log("Collection names for branch:", branch, collections);

    const expenseExcludedCategories = ["UPI Payment"];
    const revenueAdditionCategories = [
      "Extra UPI Payment",
      "Extra Cash Payment",
    ];

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
        const [orderResult, expenseResult, additionalRevenueResult] =
          await Promise.all([
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
                {
                  $match: {
                    ...dateQuery,
                    category: {
                      $nin: [
                        ...expenseExcludedCategories,
                        ...revenueAdditionCategories,
                      ],
                    },
                  },
                },
                { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
              ])
              .toArray(),
            db
              .collection(expenseCollection)
              .aggregate([
                {
                  $match: {
                    ...dateQuery,
                    category: { $in: revenueAdditionCategories },
                  },
                },
                {
                  $group: { _id: null, additionalRevenue: { $sum: "$amount" } },
                },
              ])
              .toArray(),
          ]);

        totalRevenue +=
          (orderResult[0]?.totalRevenue || 0) +
          (additionalRevenueResult[0]?.additionalRevenue || 0);
        totalOrders += orderResult[0]?.totalOrders || 0;
        totalExpenses += expenseResult[0]?.totalExpenses || 0;
      }

      console.log("Totals for period:", {
        periodStart,
        periodEnd,
        totalRevenue,
        totalOrders,
        totalExpenses,
      });
      return {
        revenue: totalRevenue,
        orders: totalOrders,
        expenses: totalExpenses,
      };
    };

    console.log("Fetching current totals...");
    const currentTotals = await getTotals(start, end, collections);
    console.log("Current totals:", currentTotals);

    console.log("Fetching previous totals...");
    const previousTotals = await getTotals(
      previousStart,
      previousEnd,
      collections
    );
    console.log("Previous totals:", previousTotals);

    const calculateGrowth = (current: number, previous: number): number => {
      console.log("Calculating growth for:", { current, previous });
      if (previous === 0) {
        const result = current ;
        console.log("Previous is zero, result:", result);
        return result;
      }
      const growthRate = ((current - previous) / previous) * 100;
      const result = growthRate ;
      console.log("Growth calculation:", { growthRate, result });
      return result;
    };

    const result: ResponseData = {
      revenue: calculateGrowth(currentTotals.revenue, previousTotals.revenue),
      orders: calculateGrowth(currentTotals.orders, previousTotals.orders),
      expenses: calculateGrowth(
        currentTotals.expenses,
        previousTotals.expenses
      ),
    };

    console.log("Final result:", result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in percentage API:", error);
    res.status(500).json({ revenue: 0, orders: 0, expenses: 0 });
  }
}
