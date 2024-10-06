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

    const startDateTime = new Date(startDate);
    startDateTime.setHours(5, 30, 0, 0); // Set to 5:30 AM

    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1); // Add one day
    endDateTime.setHours(5, 29, 59, 999); // Set to 5:29:59.999 AM

    const days = Math.ceil(
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24)
    );

    const previousStart = new Date(startDateTime);
    previousStart.setDate(previousStart.getDate() - days);

    const previousEnd = new Date(endDateTime);
    previousEnd.setDate(previousEnd.getDate() - days);

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

    const expenseExcludedCategories = ["UPI Payment","Drawings",];
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
        const [
          orderResult,
          expenseResult,
          excludedExpensesResult,
          additionalRevenueResult,
        ] = await Promise.all([
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
                $match: dateQuery,
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
                  category: {
                    $in: [
                      ...expenseExcludedCategories,
                      ...revenueAdditionCategories,
                    ],
                  },
                },
              },
              { $group: { _id: null, excludedExpenses: { $sum: "$amount" } } },
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
        totalExpenses +=
          (expenseResult[0]?.totalExpenses || 0) -
          (excludedExpensesResult[0]?.excludedExpenses || 0);
      }

      return {
        revenue: totalRevenue,
        orders: totalOrders,
        expenses: totalExpenses,
      };
    };

    const currentTotals = await getTotals(
      startDateTime,
      endDateTime,
      collections
    );
    const previousTotals = await getTotals(
      previousStart,
      previousEnd,
      collections
    );

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current;
      return ((current - previous) / previous) * 100;
    };

    const result: ResponseData = {
      revenue: calculateGrowth(currentTotals.revenue, previousTotals.revenue),
      orders: calculateGrowth(currentTotals.orders, previousTotals.orders),
      expenses: calculateGrowth(
        currentTotals.expenses,
        previousTotals.expenses
      ),
    };

    res.status(200).json(result);
   } catch (error) {
    res.status(500).json({ revenue: 0, orders: 0, expenses: 0 });
  }
}
