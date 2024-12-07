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

interface OrderItem {
  item: {
    name: string;
  };
  quantity: number;
  totalPrice: number;
  selectedOptions: Record<string, string[]>;
}

interface Order {
  _id: string;
  customerName: string;
  phoneNumber: string;
  total: number | null;
  createdAt: string;
  status: string;
  items: OrderItem[];
  appliedPromo?: AppliedPromo;
  selectedLocation: string;
  subOrders?: Order[]; // Add this line
}

interface GroupedOrder extends Order {
  subOrders: Order[];
}

interface AppliedPromo {
  code: string;
  percentage: number;
}

interface OrdersComponentProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  selectedBranch: string;
}

const OrdersComponent: React.FC<OrdersComponentProps> = ({
  dateRange,
  selectedBranch,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Order;
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [totalOrdersSum, setTotalOrdersSum] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 30;
  const [promoCodePercentage, setPromoCodePercentage] = useState(0);

 const calculatePromoCodePercentage = useCallback(() => {
   const totalOrders = groupedOrders.length;
   const ordersWithPromo = groupedOrders.filter(
     (order) =>
       order.appliedPromo ||
       order.subOrders.some((subOrder) => subOrder.appliedPromo)
   );
   const percentage =
     totalOrders > 0 ? (ordersWithPromo.length / totalOrders) * 100 : 0;
   setPromoCodePercentage(percentage);
 }, [groupedOrders]);

 const calculateTotalOrdersSum = useCallback(() => {
   const sum = groupedOrders.reduce(
     (acc, order) =>
       acc +
       (order.total || 0) +
       order.subOrders.reduce(
         (sum, subOrder) => sum + (subOrder.total || 0),
         0
       ),
     0
   );
   setTotalOrdersSum(sum);
 }, [groupedOrders]);

  useEffect(() => {
    calculateTotalOrdersSum();
    calculatePromoCodePercentage();
  }, [groupedOrders, calculateTotalOrdersSum, calculatePromoCodePercentage]);

   const formatDateRange = () => {
     const startDate = new Date(0);
     if (dateRange.start.getTime() === startDate.getTime()) {
       return `Orders till ${format(dateRange.end, "MMMM d yyyy")}`;
     } else {
       return `${format(dateRange.start, "MMMM d yyyy")} - ${format(
         dateRange.end,
         "MMMM d yyyy"
       )}`;
     }
   };
  useEffect(() => {
    calculateTotalOrdersSum();
    calculatePromoCodePercentage();
  }, [groupedOrders, calculateTotalOrdersSum, calculatePromoCodePercentage]);


   const fetchOrders = useCallback(async () => {
     setIsLoading(true);
     try {
       const response = await fetch("/api/orders", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           startDate: dateRange.start,
           endDate: dateRange.end,
           branch: selectedBranch,
         }),
       });

       if (response.ok) {
         const data = await response.json();
         setOrders(data);
       } else {
         console.error("Failed to fetch orders");
       }
     } catch (error) {
       console.error("Error fetching orders:", error);
     } finally {
       setIsLoading(false);
     }
   }, [dateRange.start, dateRange.end, selectedBranch]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


const filterAndSortOrders = useCallback(() => {
  const searchTermLower = searchTerm.toLowerCase();
  const filtered = orders.filter((order) => {
    const hasPromo =
      order.appliedPromo ||
      order.subOrders?.some((subOrder) => subOrder.appliedPromo);
    return (
      order.customerName.toLowerCase().includes(searchTermLower) ||
      order.phoneNumber.includes(searchTermLower) ||
      (order.total?.toString() || "").includes(searchTermLower) ||
      order.status.toLowerCase().includes(searchTermLower) ||
      format(new Date(order.createdAt), "MMMM d yyyy")
        .toLowerCase()
        .includes(searchTermLower) ||
      order.selectedLocation.toLowerCase().includes(searchTermLower) ||
      (searchTermLower === "promo" && hasPromo)
    );
  });

  // Group orders by customer name and date
  const grouped = filtered.reduce<Record<string, GroupedOrder>>(
    (acc, order) => {
      const key = `${order.customerName}_${format(
        new Date(order.createdAt),
        "yyyy-MM-dd"
      )}`;
      if (!acc[key]) {
        acc[key] = { ...order, subOrders: [] };
      } else {
        acc[key].subOrders.push(order);
      }
      return acc;
    },
    {}
  );

  const groupedArray = Object.values(grouped);

  groupedArray.sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  setGroupedOrders(groupedArray);
  setCurrentPage(1);
}, [orders, searchTerm, sortConfig]);

  const showBranchColumn = selectedBranch === "all";
  
  useEffect(() => {
    filterAndSortOrders();
  }, [filterAndSortOrders]);

  const sortOrders = (key: keyof Order) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prevState) => {
      const newState = new Set(prevState);
      if (newState.has(orderId)) {
        newState.delete(orderId);
      } else {
        newState.add(orderId);
      }
      return newState;
    });
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
    setCurrentPage(1);
  };

  const indexOfLastOrder = showAll
    ? groupedOrders.length
    : currentPage * ordersPerPage;
  const indexOfFirstOrder = showAll ? 0 : indexOfLastOrder - ordersPerPage;
  const currentGroupedOrders = groupedOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
 
  const totalPages = Math.ceil(groupedOrders.length / ordersPerPage);

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

  const renderOrderItems = (groupedOrder: GroupedOrder) => {
    const allOrders = [groupedOrder, ...groupedOrder.subOrders];
    const groupTotal = allOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );
    const hasMultipleOrders = allOrders.length > 1;

    return (
      <div className="space-y-4">
        {allOrders.map((order, index) => (
          <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
            {hasMultipleOrders && (
              <>
                <div className="font-semibold">Order {index + 1}</div>
                <div className="text-sm">
                  Time: {format(new Date(order.createdAt), "h:mm a")}
                </div>
              </>
            )}
            {order.items.map((item, itemIndex) => (
              <div key={itemIndex} className="border-b mb-2 mt-2 pb-2">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{item.item.name}</div>
                  <div className="text-right">
                    <div>Qty: {item.quantity}</div>
                    <div>₹{item.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-sm grid">
                  {Object.entries(item.selectedOptions).map(
                    ([optionName, optionValues]) => (
                      <div key={optionName}>
                        <span className="font-semibold">{optionName}:</span>{" "}
                        {optionValues.join(", ")}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-col items-end mt-2">
              {order.appliedPromo && (
                <div className="text-green-600">
                  Promo Applied: {order.appliedPromo.code} (
                  {order.appliedPromo.percentage}% off)
                </div>
              )}
              <div className="font-semibold text-base">
                {hasMultipleOrders ? "Subtotal" : "Total:"} ₹
                {order.total !== null ? order.total.toFixed(2) : "N/A"}
              </div>
            </div>
          </div>
        ))}
        {hasMultipleOrders && (
          <div className="flex justify-end mt-4">
            <div className="font-bold text-lg">
              Total: ₹{groupTotal.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    );
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
                onClick={() => sortOrders("customerName")}
                className="w-full justify-start"
              >
                Customer Name{" "}
                {sortConfig?.key === "customerName" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </Button>
            </TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => sortOrders("total")}
                className="w-full justify-start"
              >
                Total{" "}
                {sortConfig?.key === "total" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => sortOrders("createdAt")}
                className="w-full justify-start"
              >
                Date{" "}
                {sortConfig?.key === "createdAt" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            {showBranchColumn && (
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => sortOrders("selectedLocation")}
                  className="w-full justify-start"
                >
                  Branch{" "}
                  {sortConfig?.key === "selectedLocation" &&
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
                colSpan={showBranchColumn ? 7 : 6}
                className="text-center"
              >
                
                  <Loader2 className="mx-auto animate-spin" />
                 
              </TableCell>
            </TableRow>
          ) : (
            currentGroupedOrders.map((groupedOrder) => (
              <React.Fragment key={groupedOrder._id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderExpansion(groupedOrder._id)}
                    >
                      {expandedOrders.has(groupedOrder._id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{groupedOrder.customerName}</TableCell>
                  <TableCell>{groupedOrder.phoneNumber}</TableCell>
                  <TableCell>
                    ₹
                    {(
                      (groupedOrder.total || 0) +
                      groupedOrder.subOrders.reduce(
                        (sum, order) => sum + (order.total || 0),
                        0
                      )
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(groupedOrder.createdAt),
                      "MMMM d yyyy 'at' h:mm a"
                    )}
                  </TableCell>
                  <TableCell>{groupedOrder.status}</TableCell>
                  {showBranchColumn && (
                    <TableCell>{groupedOrder.selectedLocation}</TableCell>
                  )}
                </TableRow>
                {expandedOrders.has(groupedOrder._id) && (
                  <TableRow>
                    <TableCell colSpan={showBranchColumn ? 7 : 6}>
                      <div className="p-4">
                        {renderOrderItems(groupedOrder)}
                      </div>
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
              Order Count: {orders.length}
            </div>
            <div className="font-semibold text-lg">
              Total of All Orders: ₹{totalOrdersSum.toFixed(2)}
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

export default OrdersComponent;