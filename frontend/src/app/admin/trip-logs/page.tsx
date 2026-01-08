"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  MoreHorizontal,
  Eye,
  Search,
  MapPin,
  Users,
  Activity,
  CheckCircle,
  Route,
  Clock,
  Download,
  ChevronLast,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  Navigation,
} from "lucide-react";
// import { TripLog } from "@/types/trip-interfaces"; // Assuming you have this, else defined below
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── TYPES (Strict) ────────────────────────────────────────────────────────

// Interface matching the JSON structure returned by your Backend API
interface TripLogDb {
  id: string;
  trip_number: string;
  trip_status: string;
  trip_date: string;
  from_location: string | null;
  to_location: string | null;
  actual_distance: number | null;
  total_duration: number | null;
  passenger_name: string | null;
  driver_name: string | null;
  vehicle_registration: string | null;
  created_at: string;
  total_cost: number | null;
  // Relations
  trip_requests: {
    id: string;
    purpose: string; // Assuming 'purpose' is a string in DB, adjust if object
  } | null;
  trip_assignments: {
    id: string;
    driver: { name: string } | null;
    vehicle: { registration_no: string; make: string; model: string } | null;
  } | null;
}

// Interface matching the API Response wrapper
interface ApiResponse {
  data: TripLogDb[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Interface for the Stats calculated in frontend
interface LogStats {
  notStarted: number;
  inProgress: number;
  completed: number;
  totalDistance: number;
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────

export default function TripLogs() {
  const [tripLogs, setTripLogs] = useState<TripLogDb[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TripLogDb | null>(null);

  // Stats State
  const [stats, setStats] = useState<LogStats>({
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    totalDistance: 0,
  });

  // ── EFFECTS ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  // Fetch Trip Logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (debouncedSearch) query.set("searchTerm", debouncedSearch);
      if (statusFilter !== "all") query.set("status", statusFilter);

      // URL matching your previous backend setup
      const res = await fetch(`/trip-logs?${query}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch trip logs");
      
      const data: ApiResponse = await res.json();

      setTripLogs(data.data || []);
      setTotalDocs(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 1);

      // Calculate Stats
      const notStarted = data.data.filter((l) => l.trip_status === "Not Started").length;
      const inProgress = data.data.filter((l) =>
        ["Started", "In Transit", "Arrived", "Waiting", "Return Journey"].includes(l.trip_status)
      ).length;
      const completed = data.data.filter((l) => l.trip_status === "Completed").length;
      const totalDistance = data.data.reduce(
        (sum, log) => sum + (log.actual_distance || 0),
        0
      );

      setStats({ notStarted, inProgress, completed, totalDistance });

    } catch (err) {
      console.error(err);
      toast.error("Failed to load trip logs");
      setTripLogs([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    statusFilter,
    getAuthHeaders,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── HELPERS ──────────────────────────────────────────────────────────────

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "Completed":
        return "default";
      case "Cancelled":
        return "destructive";
      case "In Transit":
      case "Arrived":
        return "secondary";
      case "Not Started":
        return "outline";
      default:
        return "outline";
    }
  };

  // ── HANDLERS ─────────────────────────────────────────────────────────────

  const handleViewDetails = (log: TripLogDb) => {
    setSelectedLog(log);
    setIsDetailsDialogOpen(true);
  };

  const handleTrackLive = (log: TripLogDb) => {
    toast.info(`Initiating live tracking for ${log.trip_number}`);
    // Implement routing logic here
  };

  const handleExportLogs = async () => {
    const exportPromise = new Promise<void>((resolve, reject) => {
      try {
        // Note: You might want to fetch ALL logs for export, not just paginated
        const csvContent = [
          ["Request Number", "Status", "Driver", "Vehicle", "Distance (km)", "Duration"],
          ...tripLogs.map((log) => [
            log.trip_number,
            log.trip_status,
            log.driver_name || "N/A",
            log.vehicle_registration || "N/A",
            log.actual_distance || 0,
            formatDuration(log.total_duration),
          ]),
        ]
          .map((row) => row.join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "trip_logs.csv";
        a.click();
        window.URL.revokeObjectURL(url);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(exportPromise, {
      loading: "Exporting logs...",
      success: "Downloaded successfully!",
      error: "Failed to export logs",
    });
  };

  const handleGenerateReport = (log: TripLogDb) => {
    toast.info(`Generating report for ${log.trip_number}`);
    // Implement report generation logic
  };

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header + Export Button */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">TRIP LOGS</h1>
          <p className="text-muted-foreground text-xs">
            View trip execution data and GPS logs
          </p>
        </div>
        <Button onClick={handleExportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{stats.notStarted}</div>
                <p className="text-sm text-muted-foreground">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Route className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.totalDistance.toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground">Total KM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Execution Data</CardTitle>
          <CardDescription>
            Real-time trip logs with GPS tracking and performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trip logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Transit">In Transit</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading logs...
            </div>
          ) : tripLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No logs found
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip Details</TableHead>
                      <TableHead>Vehicle & Driver</TableHead>
                      <TableHead>Route & Timing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.trip_number}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {log.trip_requests?.purpose || "General Trip"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Passenger: {log.passenger_name || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created: {formatDate(log.created_at)}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {log.vehicle_registration || "Unassigned"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.trip_assignments?.vehicle?.make}{" "}
                              {log.trip_assignments?.vehicle?.model}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.driver_name || "Unassigned"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm flex items-start">
                              <MapPin className="h-3 w-3 mr-1 mt-0.5 text-green-500" />
                              <span className="text-xs">
                                {log.from_location || "N/A"}
                              </span>
                            </div>
                            <div className="text-sm flex items-start">
                              <MapPin className="h-3 w-3 mr-1 mt-0.5 text-red-500" />
                              <span className="text-xs">
                                {log.to_location || "N/A"}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Distance: {log.actual_distance || 0} km
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Duration: {formatDuration(log.total_duration)}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(log.trip_status)}>
                            {log.trip_status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTrackLive(log)}>
                                <Navigation className="h-4 w-4 mr-2" /> Track Live
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGenerateReport(log)}>
                                <Activity className="h-4 w-4 mr-2" /> Generate Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {tripLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">{log.trip_number}</div>
                      <Badge variant={getStatusBadgeVariant(log.trip_status)}>
                        {log.trip_status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>{log.trip_requests?.purpose || "General Trip"}</div>
                      <div>Passenger: {log.passenger_name || "N/A"}</div>
                      <div className="font-medium">
                        {log.vehicle_registration || "Unassigned"}
                      </div>
                      <div>
                        {log.trip_assignments?.vehicle?.make}{" "}
                        {log.trip_assignments?.vehicle?.model}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {log.from_location} → {log.to_location}
                      </div>
                      <div>
                        Dist: {log.actual_distance} km, Dur:{" "}
                        {formatDuration(log.total_duration)}
                      </div>
                    </div>

                    <div className="flex justify-end mt-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTrackLive(log)}>
                            <Navigation className="h-4 w-4 mr-2" /> Track Live
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateReport(log)}>
                            <Activity className="h-4 w-4 mr-2" /> Generate Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                of {totalDocs} documents
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="icon" disabled>
                  {currentPage}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Log Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[825px] max-h-[85vh] overflow-y-auto rounded-xl border border-border shadow-lg bg-background">
          <DialogHeader className=" top-0  bg-background/90 backdrop-blur-md border-b border-border pb-3">
            <DialogTitle className="text-xl font-semibold">
              Trip Log Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedLog && (
                <>Detailed trip execution data for {selectedLog.trip_number}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedLog && (
              <>
                {/* Trip Overview */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
                  <h4 className="font-semibold text-foreground mb-3">
                    Trip Overview
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Status:
                      </span>{" "}
                      {selectedLog.trip_status}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Distance:
                      </span>{" "}
                      {selectedLog.actual_distance || 0} km
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Duration:
                      </span>{" "}
                      {formatDuration(selectedLog.total_duration)}
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
                  <h4 className="font-semibold mb-3 text-foreground">
                    Route Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Start:
                      </span>{" "}
                      {selectedLog.from_location}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        End:
                      </span>{" "}
                      {selectedLog.to_location}
                    </div>
                  </div>
                </div>

                {/* Cost Information */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
                  <h4 className="font-semibold mb-3 text-foreground">
                    Cost Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                     <div>
                      <span className="font-medium text-muted-foreground">
                        Total Cost:
                      </span>{" "}
                      Rs. {selectedLog.total_cost?.toLocaleString() || "0"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="border-t border-border mt-4 pt-3 bottom-0 bg-background/90 backdrop-blur-md">
            <Button
              onClick={() => setIsDetailsDialogOpen(false)}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}