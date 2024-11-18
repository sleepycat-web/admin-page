import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
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
import { zonedTimeToUtc } from 'date-fns-tz';

const timeZone = 'Asia/Kolkata';
// These would be separate components in real implementation

const Dashboard = () => {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: new Date(today.setHours(0, 0, 0, 0)),
    end: new Date(today.setHours(23, 59, 59, 999)),
  });
  const [selectedDateRange, setSelectedDateRange] = useState("today");
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
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (value) {
      case "today":
        // Today: 00:00 AM to 11:59 PM
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "yesterday":
        // Yesterday: 00:00 AM to 11:59 PM
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;

      case "thisWeek":
        // This week: From Monday to today
        start = new Date(now);
        const dayOfWeek = start.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday
        start.setDate(start.getDate() + mondayOffset);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "previousWeek":
        // Previous week: Monday to Sunday
        start = new Date(now);
        const lastSundayOffset = start.getDay() === 0 ? -7 : -start.getDay();
        end.setDate(end.getDate() + lastSundayOffset);
        end.setHours(23, 59, 59, 999);

        start = new Date(end);
        start.setDate(start.getDate() - 6); // Previous Monday
        start.setHours(0, 0, 0, 0);
        break;

      case "thisMonth":
        // This month: From 1st to today
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "previousMonth":
        // Previous month: From 1st to last day of the previous month
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "thisYear":
        // This year: From 1st January to today
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "previousYear":
        // Previous year: From 1st January to 31st December of the previous year
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "allTime":
        start = new Date(0); // Beginning of time (1970)
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;

      case "custom":
        return; // Don't update dateRange for custom selection
    }
const utcStartDate = zonedTimeToUtc(start, timeZone);
const utcEndDate = zonedTimeToUtc(end, timeZone);
    
    setDateRange({
      start: utcStartDate,
      end: utcEndDate,
    });

     
    // Send utcStartDate and utcEndDate to the server
    setCustomDateRange(undefined);
    setIsCalendarOpen(false);
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
      const utcStartDate = zonedTimeToUtc(start, timeZone);
      const utcEndDate = zonedTimeToUtc(end, timeZone);
  
 setDateRange({
   start: utcStartDate,
   end: utcEndDate,
 });
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
          <TabsTrigger value="expenses">Finances</TabsTrigger>
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
