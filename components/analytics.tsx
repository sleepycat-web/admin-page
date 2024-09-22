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
import InsightsComponent from "./insights";
import { Loader2 } from "lucide-react"; // Import the Loader2 icon

// These would be separate components in real implementation
const ExpensesComponent = () => <div>Expenses Component</div>;
const OrdersComponent = () => <div>Orders Component</div>;

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

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedBranch]);

   const fetchData = async () => {
     setIsLoading(true);

     try {
       const { start, end } = dateRange;
       const previousStart = new Date(
         start.getTime() - (end.getTime() - start.getTime())
       );

       const response = await fetch("/api/dashboard-data", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           startDate: start.toISOString(), // Ensure correct formatting
           endDate: end.toISOString(), // Ensure correct formatting
           branch: selectedBranch,
           previousStartDate: previousStart.toISOString(),
           previousEndDate: start.toISOString(),
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

       // Here, ensure new signups are updated correctly
       setNewSignups(data.newSignups); // Ensure the state is updated correctly
     } catch (error) {
       console.error("Error fetching dashboard data:", error);
     } finally {
       setIsLoading(false);
     }
   };

  const handleDateRangeChange = (value: string) => {
    const end = today;
    let start = new Date(today);

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
      default:
        break;
    }

    setDateRange({ start, end });
    setSelectedDateRange(value);
  };

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
  };

  const formatDate = (date: Date) => {
    return date
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      .replace(",", "");
  };

  const getDateRangeDisplay = () => {
    if (selectedDateRange === "allTime") {
      return ` ${formatDate(today)}`;
    } else {
      return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex items-center space-x-2">
          <span>{getDateRangeDisplay()}</span>
          <Select
            onValueChange={handleDateRangeChange}
            value={selectedDateRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">1 Day</SelectItem>
              <SelectItem value="1week">1 Week</SelectItem>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
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
          <ExpensesComponent />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
