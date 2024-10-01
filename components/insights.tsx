import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
  userCount: number;

  newUserCount: number;
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
    userCount: 0,
    newUserCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsightsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [insightsResponse, userCountResponse] = await Promise.all([
        fetch("/api/insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
            branch: selectedBranch,
          }),
        }),
        fetch("/api/usercount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
          }),
        }),
      ]);

      const data: DailyData[] = await insightsResponse.json();
      const { totalCount: userCount, newUserCount } =
        await userCountResponse.json();

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
          userCount: userCount,
          newUserCount: newUserCount,
        }),
        {
          revenue: 0,
          orders: 0,
          expenses: 0,
          userCount: userCount,
          newUserCount: newUserCount,
        }
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
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 p-4 bg-red-100 rounded">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            Total Revenue
          </CardHeader>
          <CardContent>
            <div className="">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {" "}
                    {formatCurrency(totals.revenue)}
                  </div>

                  <div className="text-xs">Here will be %</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            Total Orders
          </CardHeader>
          <CardContent>
            <div className="">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold"> {totals.orders}</div>

                  <div className="text-xs">Here will be %</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            Total Expenses
          </CardHeader>
          <CardContent>
            <div className="">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {" "}
                    {formatCurrency(totals.expenses)}
                  </div>

                  <div className="text-xs">Here will be %</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            Total Users
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{totals.userCount}</div>
                <div>
                  <div className="text-xs">
                    {totals.newUserCount} new sign-ups in the last time period
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue, Orders, and Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "Revenue" || name === "Expenses") {
                      return [formatCurrency(value), name];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => formatDate(label as string)}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="numberOfOrders"
                  name="Orders"
                  stroke="#82ca9d"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="generalExpenses"
                  name="Expenses"
                  stroke="#6A8FBF"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsComponent;
