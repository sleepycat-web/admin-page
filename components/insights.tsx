import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2,TrendingDown,TrendingUp } from "lucide-react";
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
interface Growth {
  revenue: number;
  orders: number;
  expenses: number;
}

const CUTOFF_DATE = new Date("2024-09-20T00:00:00Z");

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
  }); const [isGrowth, setIsGrowth] = useState<boolean>(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 const [growth, setGrowth] = useState<Growth>({
   revenue: 0,
   orders: 0,
   expenses: 0,
 });
  const fetchInsightsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [insightsResponse, userCountResponse, percentageResponse] =
        await Promise.all([
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
          fetch("/api/percentage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              startDate: dateRange.start.toISOString(),
              endDate: dateRange.end.toISOString(),
              branch: selectedBranch,
            }),
          }),
        ]);

      const data: DailyData[] = await insightsResponse.json();
      const { totalCount: userCount, newUserCount } =
        await userCountResponse.json();

     const percentages: Growth = await percentageResponse.json();
     console.log("API Response:", percentages);
     setGrowth(percentages);
      console.log("State after setGrowth:", growth);
      
      setIsGrowth(dateRange.start > CUTOFF_DATE);
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

      // Calculate the number of days since cutoff
      const daysSinceCutoff = Math.ceil(
        (dateRange.end.getTime() - CUTOFF_DATE.getTime()) /
          (1000 * 60 * 60 * 24)
      );


    // Determine if it's a growth scenario
    const isGrowthScenario = dateRange.start > CUTOFF_DATE;
    setIsGrowth(isGrowthScenario);

    if (!isGrowthScenario) {
      // Calculate daily averages only if it's not a growth scenario
      const averages = {
        revenue: newTotals.revenue / daysSinceCutoff,
        orders: newTotals.orders / daysSinceCutoff,
        expenses: newTotals.expenses / daysSinceCutoff,
      };
      setGrowth(averages);
    } else {
      // If it's a growth scenario, use the percentages from the API
      setGrowth(percentages);
    }
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
 

  // Update the renderGrowthOrAverage function
 const renderGrowthOrAverage = (
   value: number,
   metricName: keyof typeof growth
 ) => {
   if (isGrowth) {
     const isPositive = value > 0;
     const color = isPositive ? "text-green-500" : "text-red-500";
     const Icon = isPositive ? TrendingUp : TrendingDown;
     return (
       <span className={`${color} flex items-center`}>
         {Math.abs(value).toFixed(2)}%
         <Icon className="ml-1" />
       </span>
     );
   } else {
     if (metricName === "orders") {
       return (
         <span className="text-neutral-400">
           Avg: {Math.floor(value)} / day
         </span>
       );
     } else {
       return (
         <span className="text-neutral-400">
           Avg: ₹{value.toFixed(2)} / day
         </span>
       );
     }
   }
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

                  <div className="text-xs">
                    {renderGrowthOrAverage(growth.revenue, "revenue")}
                  </div>
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
                  <div className="text-xs">
                    {renderGrowthOrAverage(growth.orders, "orders")}
                  </div>{" "}
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
                  <div className="text-xs">
                    {renderGrowthOrAverage(growth.expenses, "expenses")} 
                  </div>{" "}
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
                  <div className="text-xs text-neutral-400">
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
            <ResponsiveContainer className="py-2" width="100%" height={400}>
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
