import React, { useState, useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

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
  // const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("General Expenses");
  const [sortColumn, setSortColumn] = useState<keyof Expense>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const expensesPerPage = 30;

  const categories = [
    "General Expenses",
    "Online Payments",
    "Cash Payments",
    "Extra Payments",
    "Opening Cash",
    "Drawings",
    "Supplier",
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

 
 const fetchExpenses = useCallback(async () => {
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
   } catch (error) {
     console.error("Error fetching expenses:", error);
     setExpenses([]);
   } finally {
     setIsLoading(false);
   }
 }, [dateRange, selectedBranch, category]);


   const filterExpenses = useCallback(() => {
     const filtered = expenses.filter((expense) =>
       Object.values(expense).some((value) => {
         const stringValue = value.toString().toLowerCase();
         const searchTerms = searchTerm.toLowerCase().split(" ");
         return searchTerms.every((term) => stringValue.includes(term));
       })
     );
     setFilteredExpenses(filtered);
     setCurrentPage(1);
   }, [expenses, searchTerm]);
  
    useEffect(() => {
      fetchExpenses();
    }, [fetchExpenses]);

    useEffect(() => {
      filterExpenses();
    }, [filterExpenses]);

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

  const indexOfLastExpense = showAll
    ? sortedExpenses.length
    : currentPage * expensesPerPage;
  const indexOfFirstExpense = showAll
    ? 0
    : indexOfLastExpense - expensesPerPage;
  const currentExpenses = sortedExpenses.slice(
    indexOfFirstExpense,
    indexOfLastExpense
  );
const calculateTotal = () => {
  if (searchTerm) {
    // If there's a search term, calculate total only for displayed expenses
    return currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  } else {
    // If no search term, calculate total for all filtered expenses
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }
};
  const totalPages = Math.ceil(sortedExpenses.length / expensesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toggleShowAll = () => {
    setShowAll(!showAll);
    setCurrentPage(1);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    buttons.push(
      <Button
        key="prev"
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    );

    for (let i = 1; i <= Math.min(maxVisiblePages, totalPages); i++) {
      buttons.push(
        <Button
          key={i}
          onClick={() => paginate(i)}
          variant={currentPage === i ? "default" : "outline"}
        >
          {i}
        </Button>
      );
    }

    if (totalPages > maxVisiblePages) {
      buttons.push(<span key="ellipsis">...</span>);

      if (currentPage > maxVisiblePages && currentPage < totalPages - 1) {
        buttons.push(
          <Button
            key={currentPage}
            onClick={() => paginate(currentPage)}
            variant="default"
          >
            {currentPage}
          </Button>
        );
      }

      if (totalPages - 1 > maxVisiblePages) {
        buttons.push(
          <Button
            key={totalPages - 1}
            onClick={() => paginate(totalPages - 1)}
            variant={currentPage === totalPages - 1 ? "default" : "outline"}
          >
            {totalPages - 1}
          </Button>
        );
      }

      buttons.push(
        <Button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          variant={currentPage === totalPages ? "default" : "outline"}
        >
          {totalPages}
        </Button>
      );
    }

    buttons.push(
      <Button
        key="next"
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    );

    return buttons;
  };
 const renderSortableHeader = (column: keyof Expense, label: string) => (
   <TableHead>
     <Button
       variant="ghost"
       onClick={() => handleSort(column)}
       className="w-full justify-start"
     >
       {label} {sortColumn === column && (sortDirection === "asc" ? "↑" : "↓")}
     </Button>
   </TableHead>
 );
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
        <div className="flex justify-between items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat, index) => (
                <React.Fragment key={cat}>
                  <SelectItem value={cat}>{cat}</SelectItem>
                  {(index === 3 || index === 5) && (
                    <SelectSeparator/>
                  )}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={toggleShowAll} variant="outline">
            {showAll ? "Show Paginated" : "Show All"}
          </Button>
        </div>
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
                {renderSortableHeader("category", "Category")}
                {renderSortableHeader("amount", "Amount")}
                {renderSortableHeader("comment", "Comment")}
                {selectedBranch === "all" &&
                  renderSortableHeader("branch", "Branch")}
                {renderSortableHeader("createdAt", "Date")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentExpenses.map((expense) => (
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
          <div className="flex justify-between items-center mt-4">
            <p className="text-xl font-bold">
              Total: ₹{calculateTotal().toFixed(2)}
            </p>{" "}
            {!showAll && (
              <div className="flex space-x-2">{renderPaginationButtons()}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ExpensesComponent;
