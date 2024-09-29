import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
import { startOfDay, endOfDay, parseISO, addHours, addMinutes } from "date-fns";

interface Expense {
  _id: string;
  category: string;
  amount: number;
  comment: string;
  createdAt: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { branch, startDate, endDate, category } = req.body;
      const { db } = await connectToDatabase();

      // Parse dates from ISO string
      // const startDateTime = startOfDay(parseISO(startDate));
      // const endDateTime = endOfDay(parseISO(endDate));

      // // Add 5 hours and 30 minutes to startDateTime and endDateTime
      // const adjustedStartDateTime = addMinutes(addHours(startDateTime, 5), 30);
      // const adjustedEndDateTime = addMinutes(addHours(endDateTime, 5), 30);

      // const dateFilter = {
      //   createdAt: {
      //     $gte: adjustedStartDateTime,
      //     $lte: adjustedEndDateTime,
      //   },
      // };
      
      // Don't add hours/minutes here
      const startDateTime = startOfDay(parseISO(startDate));
      const endDateTime = endOfDay(parseISO(endDate));

      // No need for time addition here
      const dateFilter = {
        createdAt: {
          $gte: startDateTime,
          $lte: endDateTime,
        },
      };

      let categoryFilter = {};

      if (category && category !== "General") {
        if (category === "Online Payments") {
          // Include both "UPI Payment" and "Extra UPI Payment"
          categoryFilter = {
            category: { $in: ["UPI Payment", "Extra UPI Payment"] },
          };
        } else if (category === "Cash Payments") {
          categoryFilter = { category: "Extra Cash Payment" };
        } else {
          categoryFilter = { category: category };
        }
      } else {
        categoryFilter = {
          category: {
            $nin: ["UPI Payment", "Extra UPI Payment", "Extra Cash Payment"],
          },
        };
      }

      let expenses: Expense[] = [];
      let total = 0;

      if (branch === "all") {
        const branches = ["Sevoke", "Dagapur"];
        for (const branchName of branches) {
          const collection = db.collection<Expense>(`Expense${branchName}`);
          const branchExpenses = await collection
            .aggregate<Expense>([
              { $match: { ...dateFilter, ...categoryFilter } },
              { $addFields: { branch: branchName } },
            ])
            .toArray();
          expenses.push(...branchExpenses);
        }
      } else {
        const collection = db.collection<Expense>(`Expense${branch}`);
        expenses = await collection
          .aggregate<Expense>([
            { $match: { ...dateFilter, ...categoryFilter } },
            { $addFields: { branch: branch } },
          ])
          .toArray();
      }

      total = expenses.reduce((acc, expense) => acc + expense.amount, 0);

      res.status(200).json({ expenses, total });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Unable to fetch expenses" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
