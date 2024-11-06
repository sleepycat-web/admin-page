import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
 
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
      const startDateTime = new Date(startDate);
      startDateTime.setHours(5, 30, 0, 0); // Set to 5:30 AM

      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1); // Add one day
      endDateTime.setHours(5, 30, 0, 0); // Set to 5:30 AM

      const dateFilter = {
        createdAt: {
          $gte: startDateTime,
          $lte: endDateTime,
        },
      };

      let categoryFilter = {};

      if (category && category !== "General Expenses") {
        if (category === "Online Payments") {
          // Include both "UPI Payment" and "Extra UPI Payment"
          categoryFilter = {
            category: { $in: ["UPI Payment", "Extra UPI Payment"] },
          };
        } else if (category === "Cash Payments") {
          categoryFilter = { category: "Extra Cash Payment" };
        }
        else if (category === "Extra Payments") { 
           categoryFilter = {
             category: { $in: ["Extra Cash Payment", "Extra UPI Payment"] },
           };
        }
        else {
          categoryFilter = { category: category };
        }
      } else {
        categoryFilter = {
          category: {
            $nin: ["UPI Payment", "Extra UPI Payment", "Extra Cash Payment","Drawings","Opening Cash"],
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
