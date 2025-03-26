import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import { format, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { useNavigate } from "react-router-dom";
import { LogSheet, DutyStatusChange } from "../types";
import { fetchLogSheets } from "../store/slices/logSlice";
import DailyLogGrid from "../components/DailyLogGrid";

interface DailyLogSummary {
  date: string;
  totalActiveHours: number;
  totalCompletedHours: number;
  logs: LogSheet[];
  dutyStatusChanges: DutyStatusChange[];
}

export default function LogsList() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dailyLogs, setDailyLogs] = useState<DailyLogSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { logSheets = [], loading, error } = useSelector((state: RootState) => state.logs);

  useEffect(() => {
    dispatch(fetchLogSheets("all"));
  }, [dispatch]);

  useEffect(() => {
    // Group logs by date and calculate summaries
    const groupedLogs = logSheets.reduce<Record<string, DailyLogSummary>>((acc, log) => {
      const date = format(parseISO(log.start_time), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = {
          date,
          totalActiveHours: 0,
          totalCompletedHours: 0,
          logs: [],
          dutyStatusChanges: [],
        };
      }

      // Calculate hours for each status
      const hours = (new Date(log.end_time || log.start_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60);
      switch (log.status) {
        case "active":
          acc[date].totalActiveHours += hours;
          break;
        case "completed":
          acc[date].totalCompletedHours += hours;
          break;
      }

      acc[date].logs.push(log);
      acc[date].dutyStatusChanges.push(...log.duty_status_changes);
      return acc;
    }, {});

    // Sort logs by date in descending order
    const sortedLogs = Object.values(groupedLogs).sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return isAfter(dateA, dateB) ? -1 : isEqual(dateA, dateB) ? 0 : 1;
    });

    // Filter logs by search query
    const filteredLogs = searchQuery
      ? sortedLogs.filter((log) => {
          const date = format(parseISO(log.date), "MMM dd, yyyy");
          return date.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : sortedLogs;

    setDailyLogs(filteredLogs);
  }, [logSheets, searchQuery]);

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const handleViewLog = (date: string) => {
    setSelectedDate(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (selectedDate) {
    const selectedLog = dailyLogs.find(log => log.date === selectedDate);
    if (!selectedLog) return null;
    console.log(selectedLog);
    const date = parseISO(selectedLog.date);
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Daily Log</h1>
          <Button
            variant="outline"
            onClick={() => setSelectedDate(null)}
          >
            Back to List
          </Button>
        </div>
        <DailyLogGrid
          date={{
            month: format(date, "MM"),
            day: format(date, "dd"),
            year: format(date, "yyyy"),
          }}
          logs={selectedLog.logs}
          dutyStatusChanges={selectedLog.dutyStatusChanges}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Daily Logs</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {dailyLogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? "No logs found matching your search."
              : "No logs found. Start a trip to create logs."}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => navigate("/trip/new")}
              className="bg-primary-600 text-white hover:bg-primary-700"
            >
              Start New Trip
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Active Hours</TableHead>
                <TableHead>Completed Hours</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyLogs.map((dailyLog) => (
                <TableRow key={dailyLog.date}>
                  <TableCell className="font-medium">
                    {format(parseISO(dailyLog.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {formatHours(dailyLog.totalActiveHours)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {formatHours(dailyLog.totalCompletedHours)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewLog(dailyLog.date)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

