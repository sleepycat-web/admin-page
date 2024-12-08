import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface Booking {
  _id: string;
    name: string;
    date: string;
  phone: string;
  finalPrice: number;
  location: string;
  createdAt: string;
  startTime: string;
  endTime: string;
  cabin: string;
  promoCode?: {
    code: string;
    percentage: number;
  };
  modifiedAt?: string;
}

interface ApiResponse {
  totalBookings: number;
  promoCodeUsage: number;
  bookings: Booking[];
}

interface BookingsComponentProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  selectedBranch: string;
}

const subtractTime = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() - 5);
  newDate.setMinutes(newDate.getMinutes() - 30);
  return newDate;
};

const BookingsComponent: React.FC<BookingsComponentProps> = ({
  dateRange,
  selectedBranch,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Booking;
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 30;
  const [promoCodePercentage, setPromoCodePercentage] = useState(0);
  const [totalBookingsSum, setTotalBookingsSum] = useState(0);

const fetchBookings = useCallback(async () => {
  setIsLoading(true);
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        branch: selectedBranch,
      }),
    });

    const data: ApiResponse = await response.json();

    if (response.ok) {
      setBookings(data.bookings || []);
    } else {
      console.error("API Error:", data);
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  } finally {
    setIsLoading(false);
  }
}, [dateRange.start, dateRange.end, selectedBranch]);
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filterAndSortBookings = useCallback(() => {
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = bookings.filter((booking) => {
      return (
        booking.name.toLowerCase().includes(searchTermLower) ||
        booking.phone.includes(searchTermLower) ||
        booking.finalPrice.toString().includes(searchTermLower) ||
        booking.location.toLowerCase().includes(searchTermLower) ||
        format(new Date(booking.createdAt), "MMMM d yyyy")
          .toLowerCase()
          .includes(searchTermLower) ||
        (booking.modifiedAt &&
          format(new Date(booking.modifiedAt), "MMMM d yyyy")
            .toLowerCase()
            .includes(searchTermLower))
      );
    });

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, sortConfig]);

  useEffect(() => {
    filterAndSortBookings();
  }, [filterAndSortBookings]);

  const calculatePromoCodePercentage = useCallback(() => {
    const total = bookings.length;
    const withPromo = bookings.filter(booking => booking.promoCode).length;
    const percentage = total > 0 ? (withPromo / total) * 100 : 0;
    setPromoCodePercentage(percentage);
  }, [bookings]);

  const calculateTotalBookingsSum = useCallback(() => {
    const sum = bookings.reduce((acc, booking) => acc + booking.finalPrice, 0);
    setTotalBookingsSum(sum);
  }, [bookings]);

  useEffect(() => {
    calculatePromoCodePercentage();
    calculateTotalBookingsSum();
  }, [bookings, calculatePromoCodePercentage, calculateTotalBookingsSum]);

  const showBranchColumn = selectedBranch === "all";

  const sortBookings = (key: keyof Booking) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBookings((prevState) => {
      const newState = new Set(prevState);
      if (newState.has(bookingId)) {
        newState.delete(bookingId);
      } else {
        newState.add(bookingId);
      }
      return newState;
    });
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
    setCurrentPage(1);
  };

  const indexOfLastBooking = showAll
    ? filteredBookings.length
    : currentPage * bookingsPerPage;
  const indexOfFirstBooking = showAll ? 0 : indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );

  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

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

  const renderBookingDetails = (booking: Booking) => {
    return (
      <div className="">
        <div>
          <strong>Date:</strong>{" "}
          {format(new Date(booking.date), "MMMM d yyyy ")}
        </div>
        <div className="flex items-center space-x-2">
          <div>
            <strong>Start Time:</strong> {booking.startTime}
          </div>
          <div>
            <strong>End Time:</strong> {booking.endTime}
          </div>
        </div>
        <div>
          <strong>Cabin:</strong> {booking.cabin}
        </div>

        {booking.modifiedAt && (
          <div>
            <strong>Modified At:</strong>{" "}
            {format(
              subtractTime(new Date(booking.modifiedAt)),
              "MMMM d yyyy 'at' h:mm a"
            )}
          </div>
        )}
        <div className="border-b mb-2 mt-2 pb-2"></div>
        {booking.promoCode && (
          <div className="text-right text-green-600">
            Promo Applied: {booking.promoCode.code} (
            {booking.promoCode.percentage}% off)
          </div>
        )}
        <div className="text-right font-bold text-lg">
          Total: ₹{booking.finalPrice.toFixed(2)}
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return format(subtractTime(new Date(dateString)), "MMMM d yyyy 'at' h:mm a");
  };

  const formatDateRange = () => {
    const startDate = new Date(0);
    if (dateRange.start.getTime() === startDate.getTime()) {
      return `Bookings till ${format(dateRange.end, "MMMM d yyyy")}`;
    } else {
      return `${format(dateRange.start, "MMMM d yyyy")} - ${format(
        dateRange.end,
        "MMMM d yyyy"
      )}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm mb-4"
        />
        <Button onClick={toggleShowAll} variant="outline">
          {showAll ? "Show Paginated" : "Show All"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => sortBookings("name")}
                className="w-full justify-start"
              >
                Customer Name{" "}
                {sortConfig?.key === "name" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </Button>
            </TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => sortBookings("finalPrice")}
                className="w-full justify-start"
              >
                Total{" "}
                {sortConfig?.key === "finalPrice" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => sortBookings("createdAt")}
                className="w-full justify-start"
              >
                Created{" "}
                {sortConfig?.key === "createdAt" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </Button>
            </TableHead>
            {showBranchColumn && (
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => sortBookings("location")}
                  className="w-full justify-start"
                >
                  Branch{" "}
                  {sortConfig?.key === "location" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </Button>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={showBranchColumn ? 6 : 5}
                className="text-center"
              >
                <Loader2 className="mx-auto animate-spin" />
              </TableCell>
            </TableRow>
          ) : (
            currentBookings.map((booking) => (
              <React.Fragment key={booking._id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookingExpansion(booking._id)}
                    >
                      {expandedBookings.has(booking._id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{booking.name}</TableCell>
                  <TableCell>{booking.phone}</TableCell>
                  <TableCell>₹{booking.finalPrice.toFixed(2)}</TableCell>
                  <TableCell>{formatDate(booking.createdAt)}</TableCell>
                  {showBranchColumn && (
                    <TableCell>{booking.location}</TableCell>
                  )}
                </TableRow>
                {expandedBookings.has(booking._id) && (
                  <TableRow>
                    <TableCell colSpan={showBranchColumn ? 6 : 5}>
                      <div className="p-4">{renderBookingDetails(booking)}</div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
      {!isLoading && (
        <div className="flex justify-between items-center mt-4">
          <div className="flex flex-col">
            <div className=" text-gray-300">
              Promo Code Usage: {promoCodePercentage.toFixed(2)}%
            </div>
            <div className="font-semibold text-lg">
              Booking Count: {bookings.length}
            </div>
            <div className="font-semibold text-lg">
              Total of All Bookings: ₹{totalBookingsSum.toFixed(2)}
            </div>
          </div>
          <TableCaption>{formatDateRange()}</TableCaption>
          {!showAll && (
            <div className="flex space-x-2 mt-2">
              {renderPaginationButtons()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingsComponent;