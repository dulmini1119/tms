"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  MoreHorizontal,
  Eye,
  Search,
  MapPin,
  CheckCircle,
  Route,
  Clock,
  Download,
  ChevronLast,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Star,
  Fuel,
  DollarSign,
  CreditCard,
  ActivityIcon,
  Users,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ── TYPES (Strictly matching your Schema) ────────────────────────────────────────────────────────

// Matches 'users' model structure
type UserBasic = {
  first_name: string;
  last_name: string;
};

// Matches 'drivers' model structure
type DriverBasic = {
  id: string;
  users?: UserBasic | null; // Relation to users table
  license_number?: string | null;
};

// Matches 'vehicles' model structure
type VehicleBasic = {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
};

// Matches 'trip_costs' model structure
type TripCosts = {
  id: string;
  base_fare: number | null;
  distance_charges: number | null;
  fuel_cost: number | null;
  toll_charges: number | null;
  parking_charges: number | null;
  waiting_charges: number | null;
  total_cost: number | null;
  currency: string | null;
};

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
  passenger_department: string | null;
  
  // Redundant fields in trip_logs (denormalized)
  driver_name: string | null;
  vehicle_registration: string | null;
  totalCost: number | null;

  // Ratings
  overall_rating: number | null;
  punctuality_rating: number | null;
  driver_behavior_rating: number | null;
  vehicle_condition_rating: number | null;
  comments: string | null;

  // Relations (Matching Schema: trip_assignments -> drivers -> users)
  trip_assignments: {
    id: string;
    // Relations from Schema
    drivers: DriverBasic | null;
    vehicles: VehicleBasic | null;
    // Nested relation to trip_costs
    trip_costs: TripCosts[]; 
  } | null;

  trip_requests: {
    id: string;
    purpose_description: string;
  } | null;
}

interface ApiResponse {
  data: TripLogDb[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface LogStats {
  notStarted: number;
  inProgress: number;
  completed: number;
  totalDistance: number;
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────

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
        (sum, log) => sum + (log.actual_distance ? Number(log.actual_distance) : 0),
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
      month: "short",
      year: "numeric",
    });
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Safe getter for Driver Name
  const getDriverName = (log: TripLogDb) => {
    if (log.driver_name) return log.driver_name; // Use redundant field if present
    // Else traverse: Assignment -> Drivers -> Users -> Name
    const fName = log.trip_assignments?.drivers?.users?.first_name;
    const lName = log.trip_assignments?.drivers?.users?.last_name;
    if (fName || lName) return `${fName || ""} ${lName || ""}`.trim();
    return "Unassigned";
  };

  // Safe getter for Vehicle Info
  const getVehicleInfo = (log: TripLogDb) => {
    if (log.vehicle_registration) return log.vehicle_registration;
    return log.trip_assignments?.vehicles?.registration_number || "Unassigned";
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
  };

  const handleExportLogs = async () => {
    const exportPromise = new Promise<void>((resolve, reject) => {
      try {
        const csvContent = [
          ["Trip Number", "Status", "Driver", "Vehicle", "Distance (km)", "Duration"],
          ...tripLogs.map((log) => [
            log.trip_number,
            log.trip_status,
            getDriverName(log),
            getVehicleInfo(log),
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

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header + Export */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl font-bold">TRIP LOGS</h1>
          <p className="text-muted-foreground text-xs">
            Execution data, GPS logs, and detailed costs
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
          <CardTitle>Execution Data</CardTitle>
          <CardDescription>
            Detailed breakdown of trip costs, routes, and driver performance
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
              {/* Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip & Passenger</TableHead>
                      <TableHead>Vehicle & Driver</TableHead>
                      <TableHead>Route & Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.trip_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {log.trip_requests?.purpose_description || "General Trip"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {log.passenger_name} ({log.passenger_department})
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">
                            {getVehicleInfo(log)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.trip_assignments?.vehicles?.make}{" "}
                            {log.trip_assignments?.vehicles?.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Driver: {getDriverName(log)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-green-500" />
                            {log.from_location}
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-red-500" />
                            {log.to_location}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDuration(log.total_duration)} • {log.actual_distance} km
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {tripLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 bg-card text-card-foreground"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">{log.trip_number}</div>
                      <Badge variant={getStatusBadgeVariant(log.trip_status)}>
                        {log.trip_status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>{log.passenger_name}</div>
                      <div className="font-medium">
                        {getVehicleInfo(log)} - {getDriverName(log)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {log.from_location} → {log.to_location}
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                        View Details
                      </Button>
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
                  {[10, 25, 50].map((s) => (
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
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled>{currentPage}</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Trip Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog && (
                <>Detailed execution data for {selectedLog.trip_number}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 py-4">
              {/* Grid 1: Overview & Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overview */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <ActivityIcon className="h-4 w-4 mr-2" /> Trip Overview
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusBadgeVariant(selectedLog.trip_status)}>
                        {selectedLog.trip_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDate(selectedLog.trip_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span>{selectedLog.actual_distance || 0} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDuration(selectedLog.total_duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" /> Route
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-xs text-muted-foreground uppercase font-bold mb-1">From</span>
                      <div className="text-foreground">{selectedLog.from_location || "N/A"}</div>
                    </div>
                    <div className="border-l-2 border-muted pl-3">
                      <span className="block text-xs text-muted-foreground uppercase font-bold mb-1">To</span>
                      <div className="text-foreground">{selectedLog.to_location || "N/A"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Assignment & Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" /> Assignment
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-xs text-muted-foreground uppercase font-bold mb-1">Driver</span>
                      <div className="font-medium">{getDriverName(selectedLog)}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedLog.trip_assignments?.drivers?.license_number || "License not available"}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="block text-xs text-muted-foreground uppercase font-bold mb-1">Vehicle</span>
                      <div className="font-medium">{getVehicleInfo(selectedLog)}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedLog.trip_assignments?.vehicles?.make} {selectedLog.trip_assignments?.vehicles?.model} ({selectedLog.trip_assignments?.vehicles?.year})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Star className="h-4 w-4 mr-2" /> Performance
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Overall:</span>
                      <span className="flex items-center font-medium">
                        {selectedLog.overall_rating || "N/A"} <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Punctuality:</span>
                      <span>{selectedLog.punctuality_rating || "N/A"}/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Driver Behavior:</span>
                      <span>{selectedLog.driver_behavior_rating || "N/A"}/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Vehicle Condition:</span>
                      <span>{selectedLog.vehicle_condition_rating || "N/A"}/5</span>
                    </div>
                    {selectedLog.comments && (
                      <div className="pt-2">
                        <span className="block text-xs text-muted-foreground uppercase font-bold mb-1">Comments</span>
                        <p className="text-xs italic text-foreground">{selectedLog.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Costs (From trip_costs relation) */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="font-semibold mb-4 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" /> Financial Breakdown
                </h4>
                
                {/* Check if detailed trip_costs exist, otherwise fall back to simple log fields */}
                {selectedLog.trip_assignments?.trip_costs && selectedLog.trip_assignments.trip_costs.length > 0 ? (
                  <div className="space-y-3">
                    {selectedLog.trip_assignments.trip_costs.map((cost, idx) => (
                      <div key={cost.id || idx} className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-background p-3 rounded border">
                        <div>
                           <span className="block text-xs text-muted-foreground">Base Fare</span>
                           <span className="font-medium">₹{cost.base_fare || 0}</span>
                        </div>
                        <div>
                           <span className="block text-xs text-muted-foreground">Distance</span>
                           <span className="font-medium">₹{cost.distance_charges || 0}</span>
                        </div>
                        <div>
                           <span className="block text-xs text-muted-foreground">Fuel</span>
                           <span className="font-medium flex items-center"><Fuel className="h-3 w-3 mr-1" /> ₹{cost.fuel_cost || 0}</span>
                        </div>
                         <div>
                           <span className="block text-xs text-muted-foreground">Tolls</span>
                           <span className="font-medium flex items-center"><CreditCard className="h-3 w-3 mr-1" /> ₹{cost.toll_charges || 0}</span>
                        </div>
                        <div>
                           <span className="block text-xs text-muted-foreground">Parking</span>
                           <span className="font-medium">₹{cost.parking_charges || 0}</span>
                        </div>
                        <div className="col-span-2 md:col-span-3 border-t mt-1 pt-2 flex justify-between items-center">
                           <span className="text-xs text-muted-foreground">Total</span>
                           <span className="font-bold text-lg">₹{cost.total_cost || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Detailed breakdown not available. <br />
                    <span className="font-medium">Total Log Cost: ₹{selectedLog.totalCost || "0"}</span>
                  </div>
                )}
              </div>

            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}