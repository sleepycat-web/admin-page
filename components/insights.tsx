import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DateRange {
  start: Date;
  end: Date;
}

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  expenses: number;
  branch: string;
}

interface AggregatedSalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  expenses: number;
}

interface InsightsComponentProps {
  dateRange: DateRange;
  selectedBranch: string;
}

const InsightsComponent: React.FC<InsightsComponentProps> = ({
  dateRange,
  selectedBranch,
}) => {
  const [salesData, setSalesData] = useState<AggregatedSalesDataPoint[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  useEffect(() => {
    fetchInsightsData();
  }, [dateRange, selectedBranch]);

  const fetchInsightsData = async () => {
    try {
      const response = await fetch("/api/dashboard-data", {
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
      const data = await response.json();

      // Aggregate data across branches
      const aggregatedData = aggregateSalesData(data.salesData);
      setSalesData(aggregatedData);
      setTotalOrders(data.totalOrders);
    } catch (error) {
      console.error("Error fetching insights data:", error);
    }
  };

  const aggregateSalesData = (
    data: SalesDataPoint[]
  ): AggregatedSalesDataPoint[] => {
    const aggregated: { [key: string]: AggregatedSalesDataPoint } = {};

    data.forEach((point) => {
      if (!aggregated[point.date]) {
        aggregated[point.date] = {
          date: point.date,
          revenue: 0,
          orders: 0,
          expenses: 0,
        };
      }
      aggregated[point.date].revenue += point.revenue;
      aggregated[point.date].orders += point.orders;
      aggregated[point.date].expenses += point.expenses;
    });

    return Object.values(aggregated).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sales, Orders, and Expenses Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#82ca9d"
                name="Orders"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="expenses"
                stroke="#6A8FBF"
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default InsightsComponent;
