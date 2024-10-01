import React, { useState, useEffect } from "react";
import { format, subHours, subMinutes } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Expense {
  _id: string;
  category: string;
  amount: number;
  comment: string;
  createdAt: string;
  branch?: string;
}

interface ExpensesComponentProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  selectedBranch: string;
}

const ExpensesComponent: React.FC<ExpensesComponentProps> = ({
  dateRange,
  selectedBranch,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("General");
  const [sortColumn, setSortColumn] = useState<keyof Expense>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    "General",
    "Online Payments",
    "Cash Payments",
    "Supplier",
    "Drawings",
    "Suspense",
    "Salary",
    "Rent",
    "Electricity",
    "Others",
  ];

  const formatDateRange = () => {
    const startDate = new Date(0);
    if (dateRange.start.getTime() === startDate.getTime()) {
      return `Expenses till ${format(dateRange.end, "MMMM d yyyy")}`;
    } else {
      return `${format(dateRange.start, "MMMM d yyyy")} - ${format(
        dateRange.end,
        "MMMM d yyyy"
      )}`;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [dateRange, selectedBranch, category]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch: selectedBranch,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          category,
        }),
      });
      const data = await response.json();
      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setExpenses([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };
 const filterExpenses = () => {
   const filtered = expenses.filter((expense) =>
     Object.values(expense).some((value) => {
       const stringValue = value.toString().toLowerCase();
       const searchTerms = searchTerm.toLowerCase().split(" ");
       return searchTerms.every((term) => stringValue.includes(term));
     })
   );
   setFilteredExpenses(filtered);
 };

  const handleSort = (column: keyof Expense) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === undefined || bValue === undefined) {
      return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const formatDateWithOffset = (dateString: string) => {
    const date = new Date(dateString);
    const offsetDate = subMinutes(subHours(date, 5), 30);
    return format(offsetDate, "MMMM d yyyy 'at' h:mm a");
  };

  return (
    <>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm mb-2"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat, index) => (
              <React.Fragment key={cat}>
                <SelectItem value={cat}>{cat}</SelectItem>
                {index === 2 && <SelectSeparator />}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div>
          <Table>
            <TableCaption>{formatDateRange()}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("category")}
                >
                  Category
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  Amount
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("comment")}
                >
                  Comment
                </TableHead>
                {selectedBranch === "all" && (
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("branch")}
                  >
                    Branch
                  </TableHead>
                )}
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("createdAt")}
                >
                  Date & Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.amount}</TableCell>
                  <TableCell>{expense.comment}</TableCell>
                  {selectedBranch === "all" && (
                    <TableCell>{expense.branch}</TableCell>
                  )}
                  <TableCell>
                    {formatDateWithOffset(expense.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xl font-bold">Total: ₹{total.toFixed(2)}</p>
        </div>
      )}
    </>
  );
};

export default ExpensesComponent;
