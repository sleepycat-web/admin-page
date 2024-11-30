import React, { useEffect, useState, useMemo } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "./ui/table"; // Import shadcn table components

type CashBalanceDetails = {
  id: string; // or number, depending on your data
  location: string;
  amountEntered: number;
  actualAmount: number;
  difference: number;
  status: string;
  createdAt: string;
};

const CashBalanceComp = () => {
  const [balances, setBalances] = useState<{ [key: string]: number }>({});
  const [cashBalanceDetails, setCashBalanceDetails] = useState<
    CashBalanceDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<string>("All Branches");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const response = await fetch("/api/fetchCashBalance");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setBalances(data);
      } catch (error: unknown) {
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchBalanceDetails = async () => {
      try {
        const response = await fetch("/api/fetchCashEntries");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data: CashBalanceDetails[] = await response.json();
        setCashBalanceDetails(data);
      } catch (error: unknown) {
        setErrorDetails(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchBalances();
    fetchBalanceDetails();
  }, []);

  const locations = ["All Branches", "Sevoke Road", "Dagapur"];

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    };
    return date
      .toLocaleString("en-US", options)
      .replace(",", " at")
      .replace(/am|pm/i, (match) => match.toUpperCase());
  };

  const handleSort = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortedCashBalanceDetails = useMemo(() => {
    return cashBalanceDetails
      .filter(
        (detail) =>
          selectedLocation === "All Branches" ||
          detail.location === selectedLocation
      )
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [cashBalanceDetails, selectedLocation, sortDirection]);

  const indexOfLastItem = showAll
    ? sortedCashBalanceDetails.length
    : currentPage * itemsPerPage;
  const indexOfFirstItem = showAll ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = sortedCashBalanceDetails.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedCashBalanceDetails.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

  const renderSortableHeader = () => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={handleSort}
        className="w-full justify-start"
      >
        Date {sortDirection === "asc" ? "↑" : "↓"}
      </Button>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold md:block hidden">Cash Balance</h1>
      <div className="mb-4"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sevoke Road Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : error ? (
              <div>Error fetching cash balances: {error}</div>
            ) : (
              <p className="text-lg">
                ₹
                {balances.Sevoke?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dagapur Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : error ? (
              <div>Error fetching cash balances: {error}</div>
            ) : (
              <p className="text-lg">
                ₹
                {balances.Dagapur?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAll(!showAll)} variant="outline">
            {showAll ? "Show Paginated" : "Show All"}
          </Button>
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Amount Entered</TableHead>
              <TableHead>Actual Amount</TableHead>
              <TableHead>Difference</TableHead>
              {renderSortableHeader()}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingDetails ? (
              <TableCell colSpan={5} className="text-center">
                <Loader2 className="mx-auto animate-spin" />
              </TableCell>
            ) : errorDetails ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-red-500">
                  Error fetching cash balance details: {errorDetails}
                </TableCell>
              </TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((detail) => (
                <TableRow key={detail.id}>
                  <TableCell>{detail.location}</TableCell>
                  <TableCell>
                    ₹
                    {detail.amountEntered.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    ₹
                    {detail.actualAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell
                    className={
                      detail.difference > 0
                        ? "text-green-500"
                        : detail.difference < 0
                        ? "text-red-500"
                        : "text-white"
                    }
                  >
                    ₹{detail.difference.toFixed(2)} (
                    {detail.status.charAt(0).toUpperCase() +
                      detail.status.slice(1)}
                    )
                  </TableCell>
                  <TableCell>{formatDate(detail.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loadingDetails && !showAll && sortedCashBalanceDetails.length > 0 && (
          <div className="flex justify-end mt-4">
            <div className="flex space-x-2">{renderPaginationButtons()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashBalanceComp;
