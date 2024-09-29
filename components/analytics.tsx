import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import InsightsComponent from "./insights";
import { Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import ExpensesComponent from "./expenses";
import OrdersComponent from "./orders";
// These would be separate components in real implementation

const Dashboard = () => {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: new Date(0),
    end: today,
  });
  const [selectedDateRange, setSelectedDateRange] = useState("allTime");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [growthPercentage, setGrowthPercentage] = useState<number | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderGrowthPercentage, setOrderGrowthPercentage] = useState<
    number | null
  >(null);
  const [newSignups, setNewSignups] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(
    undefined
  );

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedBranch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = dateRange;
      let previousStart, previousEnd;

      if (start.getTime() === end.getTime()) {
        // If start and end are the same, set previous period to the day before
        previousEnd = subDays(start, 1);
        previousStart = new Date(previousEnd);
        previousStart.setHours(0, 0, 0, 0);
      } else {
        const duration = end.getTime() - start.getTime();
        previousStart = new Date(start.getTime() - duration);
        previousEnd = new Date(start);
      }

      const response = await fetch("/api/dashboard-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          branch: selectedBranch,
          previousStartDate: previousStart.toISOString(),
          previousEndDate: previousEnd.toISOString(),
        }),
      });
      const data = await response.json();
      setTotalRevenue(data.totalRevenue);
      setTotalUsers(data.totalUsers);
      setGrowthPercentage(
        data.growthPercentage !== undefined ? data.growthPercentage : null
      );
      setTotalOrders(data.totalOrders);
      setOrderGrowthPercentage(data.orderGrowthPercentage);
      setNewSignups(data.newSignups);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (value: string) => {
    setSelectedDateRange(value);
    if (value === "custom") {
      setIsCalendarOpen(false);
    } else {
      setIsCalendarOpen(false);
      const end = new Date();
      let start = new Date();

      switch (value) {
        case "1day":
          start.setDate(end.getDate() - 1);
          break;
        case "1week":
          start.setDate(end.getDate() - 7);
          break;
        case "1month":
          start.setMonth(end.getMonth() - 1);
          break;
        case "1year":
          start.setFullYear(end.getFullYear() - 1);
          break;
        case "allTime":
          start = new Date(0);
          break;
      }

      setDateRange({ start, end });
      setCustomDateRange(undefined);
    }
  };

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      const start = range.from;
      const end = range.to || range.from;
      setDateRange({ start, end });
      setCustomDateRange(range);
    }
  };

  const getDateRangeDisplay = () => {
    if (selectedDateRange === "custom" && customDateRange?.from) {
      const start = format(customDateRange.from, "MMMM d yyyy");
      const end = customDateRange.to
        ? format(customDateRange.to, "MMMM d yyyy")
        : start;
      return `${start} - ${end}`;
    } else if (
      selectedDateRange === "allTime" ||
      (selectedDateRange === "custom" && !customDateRange?.from)
    ) {
      return format(new Date(), "MMMM d yyyy");
    } else {
      return `${format(dateRange.start, "MMMM d yyyy")} - ${format(
        dateRange.end,
        "MMMM d yyyy"
      )}`;
    }
  };

  const getGrowthDisplay = (value: number | null, label: string) => {
    if (value === null) {
      return <p className="text-xs">Growth data unavailable</p>;
    }
    const color = value >= 0 ? "text-green-600" : "text-red-600";
    return (
      <p className={`text-xs ${color}`}>
        {value.toFixed(2)}% {value >= 0 ? "growth" : "decline"} in {label} from
        previous period
      </p>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <span className="text-sm">{getDateRangeDisplay()}</span>
          <Select
            onValueChange={handleDateRangeChange}
            value={selectedDateRange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">1 Day</SelectItem>
              <SelectItem value="1week">1 Week</SelectItem>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {selectedDateRange === "custom" && (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full sm:w-[280px] justify-start text-left font-normal ${
                    !customDateRange && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "LLL dd y")} -{" "}
                        {format(customDateRange.to, "LLL dd y")}
                      </>
                    ) : (
                      format(customDateRange.from, "LLL dd y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={handleCustomDateSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                ₹{totalRevenue.toFixed(2)}
              </div>
            )}
            {!isLoading && getGrowthDisplay(growthPercentage, "revenue")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {newSignups} new sign-ups in the last time period
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalOrders}</div>
                {getGrowthDisplay(orderGrowthPercentage, "orders")}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Select onValueChange={handleBranchChange} value={selectedBranch}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          <SelectItem value="Sevoke">Sevoke Road</SelectItem>
          <SelectItem value="Dagapur">Dagapur</SelectItem>
        </SelectContent>
      </Select>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="insights">
          <InsightsComponent
            dateRange={dateRange}
            selectedBranch={selectedBranch}
          />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesComponent
            dateRange={dateRange}
            selectedBranch={selectedBranch}
          />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersComponent
            dateRange={dateRange}
            selectedBranch={selectedBranch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
