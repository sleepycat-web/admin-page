import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  total: number;
  createdAt: string;
  status: string;
  items: OrderItem[];
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
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Order;
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" }); // Set initial sort config
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [totalOrdersSum, setTotalOrdersSum] = useState(0);
  
  const calculateTotalOrdersSum = () => {
    const sum = filteredOrders.reduce((acc, order) => acc + order.total, 0);
    setTotalOrdersSum(sum);
  };
  useEffect(() => {
    calculateTotalOrdersSum();
  }, [filteredOrders]);

  useEffect(() => {
    fetchOrders();
  }, [dateRange, selectedBranch]);

useEffect(() => {
  filterAndSortOrders();
}, [orders, searchTerm, sortConfig]);
  
  const fetchOrders = async () => {
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
  };

const filterAndSortOrders = () => {
  const filtered = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phoneNumber.includes(searchTerm)
  );

  filtered.sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  setFilteredOrders(filtered);
};

  const sortOrders = (key: keyof Order) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    setFilteredOrders(
      [...filteredOrders].sort((a, b) => {
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
      })
    );
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

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full max-w-sm mb-4"
      />
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => (
            <React.Fragment key={order._id}>
              <TableRow>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOrderExpansion(order._id)}
                  >
                    {expandedOrders.has(order._id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.phoneNumber}</TableCell>
                <TableCell>₹{order.total.toFixed(2)}</TableCell>
                <TableCell>
                  {format(
                    new Date(order.createdAt),
                    " MMMM d yyyy 'at' h:mm a"
                  )}
                </TableCell>
                <TableCell>{order.status}</TableCell>
              </TableRow>
              {expandedOrders.has(order._id) && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="p-4">
                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="border-b pb-2">
                            <div className="flex justify-between items-start">
                              <div className="font-medium">
                                {item.item.name}
                              </div>
                              <div className="text-right">
                                <div>Qty: {item.quantity}</div>
                                <div>₹{item.totalPrice.toFixed(2)}</div>
                              </div>
                            </div>
                            <div className="text-sm grid">
                              {Object.entries(item.selectedOptions).map(
                                ([optionName, optionValues]) => (
                                  <div key={optionName}>
                                    <span className="font-semibold">
                                      {optionName}:
                                    </span>{" "}
                                    {optionValues.join(", ")}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                        {order.items.length > 1 && (
                          <div className="flex justify-end font-semibold">
                            Total: ₹
                            {order.items
                              .reduce((sum, item) => sum + item.totalPrice, 0)
                              .toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      {totalOrdersSum > 0 && (
        <div className="flex justify-end mt-4 font-semibold text-lg">
          Total of All Orders: ₹{totalOrdersSum.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default OrdersComponent;
