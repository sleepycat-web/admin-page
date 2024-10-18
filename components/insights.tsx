import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
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
interface Totals {
  revenue: number;
  orders: number;
  expenses: number;
  userCount: number;
  newUserCount: number;
  profit: number; // Add this line
}

interface Growth {
  revenue: number;
  orders: number;
  expenses: number;
  profit: number; // Add this line
}

const CUTOFF_DATE = new Date("2024-09-20T00:00:00Z");

interface InsightsComponentProps {
  dateRange: DateRange;
  selectedBranch: string;
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
    profit: 0,  
  }); const [isGrowth, setIsGrowth] = useState<boolean>(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 const [growth, setGrowth] = useState<Growth>({
   revenue: 0,
   orders: 0,
   expenses: 0,
   profit: 0,  
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
      setGrowth(percentages);
       
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
          profit: acc.profit + (day.revenue - day.generalExpenses), // Add this line
        }),
        {
          revenue: 0,
          orders: 0,
          expenses: 0,
          userCount: userCount,
          newUserCount: newUserCount,
          profit: 0, // Add this line
        }
      );

     const isAllTime = dateRange.start.getTime() === 0;

     // Determine the effective start date
     const effectiveStartDate = isAllTime
       ? CUTOFF_DATE
       : dateRange.start < CUTOFF_DATE
       ? CUTOFF_DATE
       : dateRange.start;

     // Calculate the number of days in the effective range
     const daysDiff = Math.max(
       1,
       Math.ceil(
         (dateRange.end.getTime() - effectiveStartDate.getTime()) /
           (1000 * 60 * 60 * 24)
       )
     );

     // Filter data to only include entries from the effective start date
     const effectiveData = validData.filter(
       (day) => new Date(day.date) >= effectiveStartDate
     );

     // For "All Time" selection or when start date is before cutoff, use the length of effectiveData
     // Otherwise, use daysDiff
     const effectiveDays =
       isAllTime || dateRange.start < CUTOFF_DATE
         ? effectiveData.length
         : daysDiff;

     // Determine if it's a growth scenario
     const isGrowthScenario = !isAllTime && effectiveStartDate > CUTOFF_DATE;
      setIsGrowth(isGrowthScenario);
      
        if (!isGrowthScenario) {
          // Calculate daily averages
          const averages = {
            revenue: newTotals.revenue / effectiveDays,
            orders: newTotals.orders / effectiveDays,
            expenses: newTotals.expenses / effectiveDays,
            profit: newTotals.profit / effectiveDays,
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
     const displayValue = isNaN(value) ? 0 : value;

     if (metricName === "orders") {
       return (
         <span className="text-neutral-400">
           Avg: {Math.floor(displayValue)} / day
         </span>
       );
     } else {
       return (
         <span className="text-neutral-400">
           Avg: ₹{displayValue.toFixed(2)} / day
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            Gross Profit
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {" "}
                  {formatCurrency(totals.profit)}
                </div>
                <div className="text-xs">
                  {renderGrowthOrAverage(growth.profit, "profit")}
                </div>{" "}
              </>
            )}
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
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <span>Download Report</span>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InsightsComponent;
