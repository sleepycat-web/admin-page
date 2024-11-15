import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import ExcelJS from "exceljs";
import { Column } from 'exceljs'; // Import the Column type

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

      // Cutoff date to exclude data before September 20, 2024
      const cutoffDate = new Date("2024-09-20T00:00:00Z");

      // Prepare queries
      const orderQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
      };

      const expenseQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
        category: {
          $nin: [
            "UPI Payment",
            "Extra Cash Payment",
            "Extra UPI Payment",
            "Drawings",
          ],
        },
      };

      const onlinePaymentQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
        category: { $in: ["UPI Payment", "Extra UPI Payment"] },
      };

      const extraCashQuery = {
        createdAt: { $gte: startDateTime, $lt: endDateTime },
        category: "Extra Cash Payment",
      };

      // Determine collections based on branch
      let orderCollections = ["OrderSevoke", "OrderDagapur"];
      let expenseCollections = ["ExpenseSevoke", "ExpenseDagapur"];
      let branchName = "Sevoke Road, Dagapur";
      if (branch !== "all") {
        orderCollections = [`Order${branch}`];
        expenseCollections = [`Expense${branch}`];
        branchName = branch === "Sevoke" ? "Sevoke Road" : "Dagapur";
      }

      // Fetch data
      const [
        ordersArrays,
        expensesArrays,
        onlinePaymentsArrays,
        extraCashArrays,
      ] = await Promise.all([
        Promise.all(
          orderCollections.map((collection) =>
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
          )
        ),
        Promise.all(
          expenseCollections.map((collection) =>
            db.collection(collection).find(expenseQuery).toArray()
          )
        ),
        Promise.all(
          expenseCollections.map((collection) =>
            db
              .collection(collection)
              .aggregate([
                { $match: onlinePaymentQuery },
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt",
                        timezone: "+05:30",
                      },
                    },
                    total: { $sum: "$amount" },
                  },
                },
              ])
              .toArray()
          )
        ),
        Promise.all(
          expenseCollections.map((collection) =>
            db
              .collection(collection)
              .aggregate([
                { $match: extraCashQuery },
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt",
                        timezone: "+05:30",
                      },
                    },
                    total: { $sum: "$amount" },
                  },
                },
              ])
              .toArray()
          )
        ),
      ]);

      // Flatten the results
      const orders = ordersArrays.flat();
      const expenses = expensesArrays.flat();
      const onlinePayments = onlinePaymentsArrays.flat();
      const extraCash = extraCashArrays.flat();

      // Process data day by day
      const dailyData: Record<
        string,
        {
          date: string;
          branch: string;
          revenue: number;
          expenses: number;
          profit: number;
          onlinePayments: number;
          cashPayments: number;
          otherExpenses: string[];
        }
      > = {};

      const dateRange = getDateRange(startDateTime, endDateTime);

      dateRange.forEach((date) => {
        const dateStr = date.toISOString().split("T")[0];
        if (date >= cutoffDate) {
          dailyData[dateStr] = {
            date: formatDate(date),
            branch: branchName,
            revenue: 0,
            expenses: 0,
            profit: 0,
            onlinePayments: 0,
            cashPayments: 0,
            otherExpenses: [],
          };
        }
      });

      // Process orders
      orders.forEach((order) => {
        const dateStr = order._id;
        if (dailyData[dateStr]) {
          dailyData[dateStr].revenue += order.revenue;
        }
      });

      // Process expenses
      expenses.forEach((expense) => {
        const dateStr = new Date(expense.createdAt).toISOString().split("T")[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].expenses += expense.amount;
          dailyData[dateStr].otherExpenses.push(
            `${expense.category}: ${expense.amount} - ${expense.comment}`
          );
        }
      });

      // Process online payments
      onlinePayments.forEach((payment) => {
        const dateStr = payment._id;
        if (dailyData[dateStr]) {
          dailyData[dateStr].onlinePayments += payment.total;
        }
      });

      // Process extra cash
      extraCash.forEach((cash) => {
        const dateStr = cash._id;
        if (dailyData[dateStr]) {
          dailyData[dateStr].revenue += cash.total;
        }
      });

      // Calculate profit and cash payments
      Object.keys(dailyData).forEach((dateStr) => {
        const day = dailyData[dateStr];
        day.profit = day.revenue - day.expenses;
        day.cashPayments = day.revenue - day.onlinePayments;
      });

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Insights Report");

      // Add headers

      // Define headers with the correct types
      const headers: Partial<Column>[] = [
        {
          header: "Date",
          key: "date",
          width: 20,
          alignment: { horizontal: "left", vertical: "top" } as const, // Correct
        },
        {
          header: "Branch",
          key: "branch",
          width: 20,
          alignment: { horizontal: "left", vertical: "top" } as const, // Correct
        },
        {
          header: "Revenue",
          key: "revenue",
          alignment: { horizontal: "left", vertical: "top" } as const, // Correct
        },
        {
          header: "Expenses",
          key: "expenses",
          alignment: { horizontal: "left", vertical: "top" } as const, // Correct
        },
        {
          header: "Profit",
          key: "profit",
          alignment: { horizontal: "left", vertical: "top" } as const, // Correct
        },
        {
          header: "Online Payments",
          key: "onlinePayments",
          width: 10,

          alignment: { horizontal: "left", vertical: "top" } as const, // Correct
        },
        {
          header: "Cash Payments",
          key: "cashPayments",
          width: 10,

          alignment: { horizontal: "left", vertical: "top" } as const, // Correct
        },
        {
          header: "Expense Details",
          key: "otherExpenses",
          width: 40,
          alignment: { horizontal: "left", vertical: "top" } as const, // Correct
        },
      ];

      worksheet.columns = headers;

    Object.values(dailyData).forEach((day) => {
      const row = worksheet.addRow({
        date: day.date,
        branch: day.branch,
        revenue: day.revenue,
        expenses: day.expenses,
        profit: day.profit,
        onlinePayments: day.onlinePayments,
        cashPayments: day.cashPayments,
        otherExpenses: day.otherExpenses.join("\n"),
      });

      // Align numeric cells explicitly (left aligned)
      row.getCell("revenue").alignment = { horizontal: "left" };
      row.getCell("expenses").alignment = { horizontal: "left" };
      row.getCell("profit").alignment = { horizontal: "left" };
      row.getCell("onlinePayments").alignment = { horizontal: "left" };
      row.getCell("cashPayments").alignment = { horizontal: "left" };
      row.getCell("otherExpenses").alignment = { wrapText: true }; // Wrap text for the expense details
    });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=insights_report.xlsx`
      );

      // Send the file
      res.send(buffer);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Error generating report" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// Helper function to format date in DD/MM/YYYY format
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}


// Helper function to generate date range
function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}
