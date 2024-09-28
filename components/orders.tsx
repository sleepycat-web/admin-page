import React from "react";
import { format } from "date-fns";

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
  const formatDateRange = () => {
    const startDate = new Date(0); // January 1, 1970 (beginning of time for JavaScript)
    if (dateRange.start.getTime() === startDate.getTime()) {
      return ` ${format(dateRange.end, "MMMM d yyyy")}`;
    } else {
      return `${format(dateRange.start, "MMMM d yyyy")} - ${format(
        dateRange.end,
        "MMMM d yyyy"
      )}`;
    }
  };

  return (
    <div>
      <h2>Orders</h2>
      <p>Date Range: {formatDateRange()}</p>
     Selected Branch: {selectedBranch === 'all' ? 'All Branches' : selectedBranch}      {/* Add your Orders-related content here */}
    </div>
  );
};

export default OrdersComponent;
