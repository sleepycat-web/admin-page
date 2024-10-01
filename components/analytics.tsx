import React, { useState,   } from "react";
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
    start: new Date(0),
    end: today,
  });
  const [selectedDateRange, setSelectedDateRange] = useState("allTime");
  const [selectedBranch, setSelectedBranch] = useState("all"); 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(
    undefined
  );
   
 
 
const handleDateReset = () => {
  setCustomDateRange(undefined);
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
    let start = range.from;
    let end = range.to || range.from;

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
