import React, { useState,   } from "react";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import InsightsComponent from "./insights";
 import { DateRange } from "react-day-picker";
import ExpensesComponent from "./expenses";
import OrdersComponent from "./orders";
// These would be separate components in real implementation

const Dashboard = () => {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: new Date(today.setHours(0, 0, 0, 0) + 5.5 * 60 * 60 * 1000),
    end: new Date(today.setHours(23, 59, 59, 999) + 5.5 * 60 * 60 * 1000),
  });
  const [selectedDateRange, setSelectedDateRange] = useState("today");
  const [selectedBranch, setSelectedBranch] = useState("all"); 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(
    undefined
  );
   
  // Add state to keep track of active tab and mounted tabs
  const [activeTab, setActiveTab] = useState("insights");
  const [mountedTabs, setMountedTabs] = useState<{ [key: string]: boolean }>({
    insights: true, // Initialize with the default active tab
  });
 
const handleDateReset = () => {
  setCustomDateRange(undefined);
};

const handleDateRangeChange = (value: string) => {
  setSelectedDateRange(value);

  // Get current UTC time
  const now = new Date();

  // Create start and end dates in UTC
  let start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  let end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  // Adjust by 5 hours 30 minutes (5.5 hours)
  const offsetHours = 5.5;
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  switch (value) {
    case "today":
      // Today in UTC: 00:00 to 23:59
      break;

    case "yesterday":
      // Yesterday in UTC
      start.setUTCDate(start.getUTCDate() - 1);
      end.setUTCDate(end.getUTCDate() - 1);
      break;

    case "thisWeek":
      // This week: From Monday to today in UTC
      const dayOfWeek = start.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setUTCDate(start.getUTCDate() + mondayOffset);
      break;

    case "previousWeek":
      // Previous week in UTC: Monday to Sunday
      const lastSundayOffset =
        start.getUTCDay() === 0 ? -7 : -start.getUTCDay();
      end.setUTCDate(end.getUTCDate() + lastSundayOffset);
      start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      break;

    case "thisMonth":
      // This month in UTC: From 1st to today
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      start.setUTCHours(0, 0, 0, 0);
      break;

    case "previousMonth":
      // Previous month in UTC
      start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
      );
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      break;

    case "thisYear":
      // This year in UTC: From 1st January to today
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      start.setUTCHours(0, 0, 0, 0);
      break;

    case "previousYear":
      // Previous year in UTC
      start = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
      end = new Date(Date.UTC(now.getUTCFullYear() - 1, 11, 31));
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      break;

    case "allTime":
      start = new Date(0); // Beginning of time in UTC
      end = new Date();
      end.setUTCHours(23, 59, 59, 999);
      break;

    case "custom":
      return; // Don't update dateRange for custom selection
  }

  setDateRange({ start, end });
  setCustomDateRange(undefined);
  setIsCalendarOpen(false);
};

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
  };

const handleCustomDateSelect = (range: DateRange | undefined) => {
  if (range?.from) {
    let start = new Date(range.from.getTime() + 5.5 * 60 * 60 * 1000);
    let end = new Date(
      (range.to || range.from).getTime() + 5.5 * 60 * 60 * 1000
    );

    // Ensure start is always before or equal to end
    if (end < start) {
      [start, end] = [end, start];
    }

    setDateRange({ start, end });
    setCustomDateRange({ from: start, to: end });
    setSelectedDateRange("custom");
  }
};

const handleDayClick = (day: Date, modifiers: Record<string, unknown>) => {
  if (modifiers.double) {
    const newRange = { from: day, to: day };
    handleCustomDateSelect(newRange);
    setIsCalendarOpen(false);
  }
};

const handleTabChange = (tab: string) => {
  setActiveTab(tab);
  if (!mountedTabs[tab]) {
    setMountedTabs((prev) => ({ ...prev, [tab]: true }));
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

  // const getGrowthDisplay = (value: number | null, label: string) => {
  //   if (value === null) {
  //     return <p className="text-xs">Growth data unavailable</p>;
  //   }
  //   const color = value >= 0 ? "text-green-600" : "text-red-600";
  //   return (
  //     <p className={`text-xs ${color}`}>
  //       {value.toFixed(2)}% {value >= 0 ? "growth" : "decline"} in {label} from
  //       previous period
  //     </p>
  //   );
  // };
  console.log(dateRange)
   return (
     <div className="p-4 space-y-4">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
         <h1 className="text-3xl font-bold">Insights</h1>

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
               <SelectItem value="today">Today</SelectItem>
               <SelectItem value="yesterday">Yesterday</SelectItem>
               <SelectSeparator />
               <SelectItem value="thisWeek">This Week</SelectItem>
               <SelectItem value="previousWeek">Previous Week</SelectItem>
               <SelectSeparator />
               <SelectItem value="thisMonth">This Month</SelectItem>
               <SelectItem value="previousMonth">Previous Month</SelectItem>
               <SelectSeparator />
               <SelectItem value="thisYear">This Year</SelectItem>
               <SelectItem value="previousYear">Previous Year</SelectItem>
               <SelectSeparator />
               <SelectItem value="allTime">All Time</SelectItem>
               <SelectItem value="custom">Custom Range</SelectItem>
             </SelectContent>
           </Select>
           {selectedDateRange === "custom" && (
             <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
               <PopoverTrigger asChild>
                 <Button
                   variant="outline"
                   className="w-full sm:w-[280px] justify-start text-left font-normal relative"
                 >
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   {customDateRange?.from ? (
                     <>
                       {format(customDateRange.from, "LLL dd yyyy")} -{" "}
                       {customDateRange.to
                         ? format(customDateRange.to, "LLL dd yyyy")
                         : format(customDateRange.from, "LLL dd yyyy")}
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDateReset();
                         }}
                         className="h-8 w-8 absolute right-1 top-1/2 transform -translate-y-1/2"
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </>
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
                   onDayClick={handleDayClick}
                 />
               </PopoverContent>
             </Popover>
           )}
         </div>
       </div>

       <Select
         onValueChange={handleBranchChange}
         value={selectedBranch}
        
       >
         <SelectTrigger className="w-[180px] ">
           <SelectValue  placeholder="Select branch" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Branches</SelectItem>
           <SelectItem value="Sevoke">Sevoke Road</SelectItem>
           <SelectItem value="Dagapur">Dagapur</SelectItem>
         </SelectContent>
       </Select>

       <Tabs value={activeTab} className="w-full ">
         <TabsList className="mb-2">
           <TabsTrigger
             value="insights"
             onClick={() => handleTabChange("insights")}
           >
             Insights
           </TabsTrigger>
           <TabsTrigger
             value="expenses"
             onClick={() => handleTabChange("expenses")}
           >
             Finances
           </TabsTrigger>
           <TabsTrigger
             value="orders"
             onClick={() => handleTabChange("orders")}
           >
             Orders
           </TabsTrigger>
         </TabsList>

         {/* Remove TabsContent components */}
         {/* Render all mounted components and control their visibility */}
         <div>
           {mountedTabs["insights"] && (
             <div
               style={{ display: activeTab === "insights" ? "block" : "none" }}
             >
               <InsightsComponent
                 dateRange={dateRange}
                 selectedBranch={selectedBranch}
               />
             </div>
           )}
           {mountedTabs["expenses"] && (
             <div
               style={{ display: activeTab === "expenses" ? "block" : "none" }}
             >
               <ExpensesComponent
                 dateRange={dateRange}
                 selectedBranch={selectedBranch}
               />
             </div>
           )}
           {mountedTabs["orders"] && (
             <div
               style={{ display: activeTab === "orders" ? "block" : "none" }}
             >
               <OrdersComponent
                 dateRange={dateRange}
                 selectedBranch={selectedBranch}
               />
             </div>
           )}
         </div>
       </Tabs>
     </div>
   );
};

export default Dashboard;
