import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
import { Collection, Document } from "mongodb";

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

 let pipeline: Document[] = [];

 // Adjust the dates to IST (+5:30 hours)
 const adjustDate = (date: string) => {
   const d = new Date(date);
   return new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
 };

 const dateFilter = {
   createdAt: {
     $gte: adjustDate(startDate),
     $lte: adjustDate(endDate),
   },
 };

      let categoryFilter: Document = {};
      if (category && category !== "General") {
        if (category === "Online Payments") {
          categoryFilter = { category: "UPI Payment" };
        } else if (category === "Cash Payments") {
          categoryFilter = { category: "Extra Cash Payment" };
        }
      } else {
        categoryFilter = {
          category: {
            $nin: ["UPI Payment", "Extra UPI Payment", "Extra Cash Payment"],
          },
        };
      }

      if (branch === "all") {
        const sevokeExpenses = await db
          .collection<Expense>("ExpenseSevoke")
          .aggregate([
            { $match: { ...dateFilter, ...categoryFilter } },
            { $addFields: { branch: "Sevoke" } },
          ])
          .toArray();

        const dagapurExpenses = await db
          .collection<Expense>("ExpenseDagapur")
          .aggregate([
            { $match: { ...dateFilter, ...categoryFilter } },
            { $addFields: { branch: "Dagapur" } },
          ])
          .toArray();

        const expenses = [...sevokeExpenses, ...dagapurExpenses];
        const total = expenses.reduce(
          (acc, expense) => acc + expense.amount,
          0
        );

        res.status(200).json({ expenses, total });
      } else {
        const collection = db.collection<Expense>(`Expense${branch}`);
        pipeline = [
          { $match: { ...dateFilter, ...categoryFilter } },
          { $addFields: { branch: branch } },
        ];

        const expenses = await collection
          .aggregate<Expense>(pipeline)
          .toArray();
        const total = expenses.reduce(
          (acc, expense) => acc + expense.amount,
          0
        );

        res.status(200).json({ expenses, total });
      }
    } catch (error) {
      res.status(500).json({ error: "Unable to fetch expenses" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
