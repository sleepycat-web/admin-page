import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface DateRange {
  start: Date;
  end: Date;
}

interface DailyData {
  date: string;
  revenue: number;
  numberOfOrders: number;
  generalExpenses: number;
}

interface InsightsComponentProps {
  dateRange: DateRange;
  selectedBranch: string;
}

interface Totals {
  revenue: number;
  orders: number;
  expenses: number;
}

const InsightsComponent: React.FC<InsightsComponentProps> = ({
  dateRange,
  selectedBranch,
}) => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState<Totals>({
    revenue: 0,
    orders: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsightsData = useCallback(async () => {
     setIsLoading(true);
    try {
      const response = await fetch("/api/insights", {
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

      if (!Array.isArray(data)) {
        throw new Error("Received data is not an array");
      }

      // Filter out entries with invalid or zero values
      const validData = data.filter(
        (day) =>
          day.revenue > 0 || day.numberOfOrders > 0 || day.generalExpenses > 0
      );

      // Sort the data by date
      const sortedData = validData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setDailyData(sortedData);

      // Calculate totals
      const newTotals = sortedData.reduce(
        (acc: Totals, day: DailyData) => ({
          revenue: acc.revenue + day.revenue,
          orders: acc.orders + day.numberOfOrders,
          expenses: acc.expenses + day.generalExpenses,
        }),
        { revenue: 0, orders: 0, expenses: 0 }
      );
      setTotals(newTotals);
      setError(null);
    } catch (error) {
      console.error("Error fetching insights data:", error);
      setError(`Error fetching insights data: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedBranch]);

  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 p-4 bg-red-100 rounded">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>Total Revenue</CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 /> : formatCurrency(totals.revenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Total Orders</CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {" "}
              {isLoading ? <Loader2 /> : formatCurrency(totals.orders)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Total Expenses </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 /> : formatCurrency(totals.expenses)}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daily Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Expenses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyData.map((day: DailyData) => (
                  <TableRow key={day.date}>
                    <TableCell>{formatDate(day.date)}</TableCell>
                    <TableCell>{formatCurrency(day.revenue)}</TableCell>
                    <TableCell>{day.numberOfOrders}</TableCell>
                    <TableCell>{formatCurrency(day.generalExpenses)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsComponent;
