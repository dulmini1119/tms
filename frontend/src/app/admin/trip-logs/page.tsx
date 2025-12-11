"use client";
import React, { useState } from "react";
import {
  FileText,
  Navigation,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  MapPin,
  Clock,
  AlertTriangle,
  Car,
  User,
  Route,
  Star,
  Activity,
  Timer,
  CheckCircle,
} from "lucide-react";
import { TripAssignment, TripLog, TripRequest } from "@/types/trip-interfaces";
import { mockTripData } from "@/data/mock-trip-data";
import { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function TripLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TripLog | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(
    null
  );
  const [selectedAssignment, setSelectedAssignment] =
    useState<TripAssignment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get trip logs and related data
  const tripLogs = mockTripData.logs;
  const tripRequests = mockTripData.requests;
  const tripAssignments = mockTripData.assignments;

  // Create maps for quick lookup
  const requestMap = new Map(tripRequests.map((req) => [req.id, req]));
  const assignmentMap = new Map(
    tripAssignments.map((assign) => [assign.id, assign])
  );

  const filteredLogs = tripLogs.filter((log) => {
    const request = requestMap.get(log.tripRequestId);
    const assignment = assignmentMap.get(log.tripAssignmentId);
    if (!request || !assignment) return false;

    return (
      (log.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.assignedDriver.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.assignedVehicle.registrationNo
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.requestedBy.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" ||
        log.tripStatus.toLowerCase().replace(" ", "-") === statusFilter)
    );
  });

  // Calculate stats
  const stats = {
    notStarted: tripLogs.filter((l) => l.tripStatus === "Not Started").length,
    inProgress: tripLogs.filter((l) =>
      [
        "Started",
        "In Transit",
        "Arrived",
        "Waiting",
        "Return Journey",
      ].includes(l.tripStatus)
    ).length,
    completed: tripLogs.filter((l) => l.tripStatus === "Completed").length,
    totalDistance: tripLogs.reduce(
      (sum, log) => sum + (log.actualRoute.totalDistance || 0),
      0
    ),
  };

  // Handlers for actions and buttons
  const handleExportLogs = () => {
    const exportPromise = new Promise((resolve) => {
      try {
        const csvContent = [
          [
            "Request Number",
            "Status",
            "Driver",
            "Vehicle",
            "Distance (km)",
            "Duration",
          ],
          ...filteredLogs.map((log) => {
            const assignment = assignmentMap.get(log.tripAssignmentId);
            return [
              log.requestNumber,
              log.tripStatus,
              assignment?.assignedDriver.name || "N/A",
              assignment?.assignedVehicle.registrationNo || "N/A",
              log.actualRoute.totalDistance || 0,
              formatDuration(log.actualRoute.totalDuration || 0),
            ];
          }),
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

        resolve("Downloaded successfully!");
      } catch (error) {
        console.error("Error in handleViewDetails:", error);
        toast.error("Failed to export logs");
      }
    });

    toast.promise(exportPromise, {
      loading: "Exporting all trip logs...",
      success: "Trip logs downloaded successfully!",
      error: "Failed to export trip logs.",
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleViewDetails = (log: TripLog) => {
    const request = requestMap.get(log.tripRequestId);
    const assignment = assignmentMap.get(log.tripAssignmentId);
    if (!request || !assignment) {
      console.error("Request or assignment not found for log:", log.id);
      return;
    }

    setSelectedLog(log);
    setSelectedRequest(request);
    setSelectedAssignment(assignment);
    setIsDetailsDialogOpen(true);
  };

  const handleTrackLive = (log: TripLog) => {
    // Logic to initiate live tracking for the selected trip
    console.log("Initiating live tracking for trip:", log.requestNumber);
    // Example: Redirect to a live tracking page or open a map view
    // window.location.href = `/live-tracking/${log.gpsTracking.trackingId}`;
    // Alternatively, open a modal with a map component
  };

  const handleExportLog = (log: TripLog) => {
    const exportPromiseLog = new Promise<void>((resolve, reject) => {
      try {
        const request = requestMap.get(log.tripRequestId);
        const assignment = assignmentMap.get(log.tripAssignmentId);
        if (!request || !assignment) {
          reject("Missing request or assignment data.");
          return;
        }

        const csvContent = [
          ["Field", "Value"],
          ["Request Number", log.requestNumber],
          ["Status", log.tripStatus],
          ["Driver", assignment.assignedDriver.name],
          [
            "Vehicle",
            `${assignment.assignedVehicle.make} ${assignment.assignedVehicle.model}`,
          ],
          ["Distance", `${log.actualRoute.totalDistance || 0} km`],
          ["Duration", formatDuration(log.actualRoute.totalDuration || 0)],
          ["Start Location", log.actualRoute.startLocation.address],
          ["End Location", log.actualRoute.endLocation.address],
        ]
          .map((row) => row.join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trip_log_${log.requestNumber}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(exportPromiseLog, {
      loading: "Exporting trip log...",
      success: `Trip log ${log.requestNumber} downloaded successfully!`,
      error: "Failed to export trip log.",
    });
  };

  const handleGenerateReport = (log: TripLog) => {
    // Logic to generate a detailed report for the trip
    console.log("Generating report for trip:", log.requestNumber);
    // Example: Call an API to generate a PDF report or display a report preview
    // try {
    //   const response = await fetch(`/api/reports/trip/${log.id}`);
    //   const reportUrl = await response.json();
    //   window.open(reportUrl, '_blank');
    // } catch (error) {
    //   console.error('Failed to generate report:', error);
    // }
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedLog(null);
    setSelectedRequest(null);
    setSelectedAssignment(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
      }
    > = {
      "Not Started": {
        variant: "outline",
        icon: <Clock className="h-3 w-3" />,
      },
      Started: { variant: "default", icon: <Navigation className="h-3 w-3" /> },
      "In Transit": {
        variant: "default",
        icon: <Activity className="h-3 w-3" />,
      },
      Arrived: { variant: "secondary", icon: <MapPin className="h-3 w-3" /> },
      Waiting: { variant: "secondary", icon: <Timer className="h-3 w-3" /> },
      "Return Journey": {
        variant: "default",
        icon: <Route className="h-3 w-3" />,
      },
      Completed: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Cancelled: {
        variant: "destructive",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
    };
    const config = variants[status] || variants["Not Started"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredLogs.length / pageSize) : 1;
  const paginatedDocuments = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
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

      {/* Trip Logs Table */}
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
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="started">Started</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trip Logs Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip Details</TableHead>
                  <TableHead>Vehicle & Driver</TableHead>
                  <TableHead>Route & Timing</TableHead>
                  <TableHead>GPS & Tracking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((log) => {
                  const request = requestMap.get(log.tripRequestId);
                  const assignment = assignmentMap.get(log.tripAssignmentId);
                  if (!request || !assignment) return null;

                  return (
                    <TableRow key={log.id}>
                      {/* Trip Details */}
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.requestNumber}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {request.purpose.description}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <User className="h-3 w-3 mr-1" />{" "}
                            {request.requestedBy.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {formatDate(log.createdAt)}
                          </div>
                        </div>
                      </TableCell>

                      {/* Vehicle & Driver */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center">
                            <Car className="h-3 w-3 mr-1" />
                            {assignment.assignedVehicle.registrationNo}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.assignedVehicle.make}{" "}
                            {assignment.assignedVehicle.model}
                          </div>
                          <div className="text-sm flex items-center">
                            <User className="h-3 w-3 mr-1" />{" "}
                            {assignment.assignedDriver.name}
                          </div>
                        </div>
                      </TableCell>

                      {/* Route & Timing */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-start">
                            <MapPin className="h-3 w-3 mr-1 mt-0.5 text-green-500" />
                            <span className="text-xs">
                              {log.actualRoute.startLocation.address}
                            </span>
                          </div>
                          <div className="text-sm flex items-start">
                            <MapPin className="h-3 w-3 mr-1 mt-0.5 text-red-500" />
                            <span className="text-xs">
                              {log.actualRoute.endLocation.address}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Distance: {log.actualRoute.totalDistance || 0} km
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Duration:{" "}
                            {formatDuration(log.actualRoute.totalDuration || 0)}
                          </div>
                          {log.timing.delays.length > 0 && (
                            <div className="text-xs text-orange-600">
                              {log.timing.delays.length} delay(s)
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* GPS & Tracking */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-center">
                            <Navigation className="h-3 w-3 mr-1" />
                            GPS:{" "}
                            {log.gpsTracking.enabled ? "Active" : "Inactive"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Speed Alerts: {log.gpsTracking.speedAlerts}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Geo Violations: {log.gpsTracking.geoFenceViolations}
                          </div>
                          {log.gpsTracking.currentLocation && (
                            <Badge variant="secondary" className="text-xs">
                              Live Tracking
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {getStatusBadge(log.tripStatus)}
                        {log.timing.waitingTime > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Wait: {log.timing.waitingTime} min
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(log)}
                            >
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTrackLive(log)}
                            >
                              <Navigation className="h-4 w-4 mr-2" /> Track Live
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExportLog(log)}
                            >
                              <Download className="h-4 w-4 mr-2" /> Export Log
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGenerateReport(log)}
                            >
                              <FileText className="h-4 w-4 mr-2" /> Generate
                              Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4">
            {paginatedDocuments.map((log) => {
              const request = requestMap.get(log.tripRequestId);
              const assignment = assignmentMap.get(log.tripAssignmentId);
              if (!request || !assignment) return null;

              return (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{log.requestNumber}</div>
                    {getStatusBadge(log.tripStatus)}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>{request.purpose.description}</div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />{" "}
                      {request.requestedBy.name}
                    </div>

                    <div className="font-medium flex items-center">
                      <Car className="h-4 w-4 mr-1" />{" "}
                      {assignment.assignedVehicle.registrationNo}
                    </div>
                    <div>
                      {assignment.assignedVehicle.make}{" "}
                      {assignment.assignedVehicle.model}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />{" "}
                      {assignment.assignedDriver.name}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Route: {log.actualRoute.startLocation.address} →{" "}
                      {log.actualRoute.endLocation.address}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Distance: {log.actualRoute.totalDistance || 0} km,
                      Duration:{" "}
                      {formatDuration(log.actualRoute.totalDuration || 0)}
                    </div>
                    {log.timing.delays.length > 0 && (
                      <div className="text-xs text-orange-600">
                        {log.timing.delays.length} delay(s)
                      </div>
                    )}

                    <div className="flex items-center">
                      <Navigation className="h-4 w-4 mr-1" /> GPS:{" "}
                      {log.gpsTracking.enabled ? "Active" : "Inactive"}
                    </div>
                    {log.gpsTracking.currentLocation && (
                      <Badge variant="secondary" className="text-xs">
                        Live Tracking
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-end mt-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTrackLive(log)}>
                          <Navigation className="h-4 w-4 mr-2" /> Track Live
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportLog(log)}>
                          <Download className="h-4 w-4 mr-2" /> Export Log
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleGenerateReport(log)}
                        >
                          <FileText className="h-4 w-4 mr-2" /> Generate Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>

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
                of {filteredLogs.length} documents
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
                  First
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let num;
                  if (totalPages <= 5) num = i + 1;
                  else if (currentPage <= 3) num = i + 1;
                  else if (currentPage >= totalPages - 2)
                    num = totalPages - 4 + i;
                  else num = currentPage - 2 + i;
                  return num;
                }).map((num) => (
                  <Button
                    key={num}
                    variant={currentPage === num ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(num)}
                    className="w-9 h-9"
                  >
                    {num}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
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
              {selectedRequest && selectedLog && (
                <>
                  Detailed trip execution data for{" "}
                  <span className="font-medium">
                    {selectedLog.requestNumber}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedLog && selectedRequest && selectedAssignment && (
              <>
                {/* Section Wrapper */}
                <div className="space-y-5">
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
                        {selectedLog.tripStatus}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Distance:
                        </span>{" "}
                        {selectedLog.actualRoute.totalDistance || 0} km
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Duration:
                        </span>{" "}
                        {formatDuration(
                          selectedLog.actualRoute.totalDuration || 0
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timing Information */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
                    <h4 className="font-semibold mb-3 text-foreground">
                      Timing Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Scheduled Start:
                        </span>{" "}
                        {formatDate(selectedLog.timing.scheduledStart)}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Actual Start:
                        </span>{" "}
                        {formatDate(selectedLog.timing.actualStart || "")}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Scheduled End:
                        </span>{" "}
                        {formatDate(selectedLog.timing.scheduledEnd)}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Actual End:
                        </span>{" "}
                        {formatDate(selectedLog.timing.actualEnd || "")}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Waiting Time:
                        </span>{" "}
                        {selectedLog.timing.waitingTime} mins
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Delays:
                        </span>{" "}
                        {selectedLog.timing.delays.length}
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
                        {selectedLog.actualRoute.startLocation.address}
                        <div className="text-xs text-muted-foreground">
                          Started at:{" "}
                          {formatDate(
                            selectedLog.actualRoute.startLocation.timestamp
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          End:
                        </span>{" "}
                        {selectedLog.actualRoute.endLocation.address}
                        {selectedLog.actualRoute.endLocation.timestamp && (
                          <div className="text-xs text-muted-foreground">
                            Arrived at:{" "}
                            {formatDate(
                              selectedLog.actualRoute.endLocation.timestamp
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Waypoints:
                        </span>{" "}
                        {selectedLog.actualRoute.waypoints.length} stops
                      </div>
                    </div>
                  </div>

                  {/* GPS Tracking */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
                    <h4 className="font-semibold mb-3 text-foreground">
                      GPS Tracking
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Tracking ID:
                        </span>{" "}
                        {selectedLog.gpsTracking.trackingId}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Status:
                        </span>{" "}
                        {selectedLog.gpsTracking.enabled
                          ? "Active"
                          : "Inactive"}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Last Ping:
                        </span>{" "}
                        {formatDate(selectedLog.gpsTracking.lastPing)}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Speed Alerts:
                        </span>{" "}
                        {selectedLog.gpsTracking.speedAlerts}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Geo Violations:
                        </span>{" "}
                        {selectedLog.gpsTracking.geoFenceViolations}
                      </div>
                    </div>
                  </div>

                  {/* Fuel Consumption */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
                    <h4 className="font-semibold mb-3 text-foreground">
                      Fuel Consumption
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Start Reading:
                        </span>{" "}
                        {selectedLog.fuelConsumption.startReading} km
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          End Reading:
                        </span>{" "}
                        {selectedLog.fuelConsumption.endReading || "N/A"} km
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Fuel Used:
                        </span>{" "}
                        {selectedLog.fuelConsumption.fuelUsed || 0} L
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Fuel Cost/L:
                        </span>{" "}
                        ₹{selectedLog.fuelConsumption.fuelCostPerLiter}
                      </div>
                    </div>
                  </div>

                  {/* Incidents */}
                  {selectedLog.incidents.length > 0 && (
                    <div className="rounded-lg border border-border bg-destructive/5 p-4 shadow-sm">
                      <h4 className="font-semibold mb-3 text-destructive">
                        Incidents
                      </h4>
                      {selectedLog.incidents.map((incident, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-3 space-y-1 bg-background/50"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="destructive">{incident.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(incident.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm">{incident.description}</div>
                          <div className="text-xs text-muted-foreground">
                            Location: {incident.location.address}
                          </div>
                          <div className="text-xs">
                            Severity: {incident.severity} • Resolved:{" "}
                            {incident.resolved ? "Yes" : "No"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Passenger Feedback */}
                  {selectedLog.passengerFeedback && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
                      <h4 className="font-semibold mb-3 text-foreground">
                        Passenger Feedback
                      </h4>
                      <div className="border rounded-lg p-3 space-y-2 bg-background/50">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">
                            {selectedLog.passengerFeedback.rating}/5
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(
                              selectedLog.passengerFeedback.timestamp
                            )}
                          </span>
                        </div>
                        <div className="text-sm">
                          {selectedLog.passengerFeedback.comments}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                          <div>
                            Driver Behavior:{" "}
                            {
                              selectedLog.passengerFeedback.categories
                                .driverBehavior
                            }
                            /5
                          </div>
                          <div>
                            Vehicle Condition:{" "}
                            {
                              selectedLog.passengerFeedback.categories
                                .vehicleCondition
                            }
                            /5
                          </div>
                          <div>
                            Punctuality:{" "}
                            {
                              selectedLog.passengerFeedback.categories
                                .punctuality
                            }
                            /5
                          </div>
                          <div>
                            Route Optimization:{" "}
                            {
                              selectedLog.passengerFeedback.categories
                                .routeOptimization
                            }
                            /5
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Post-Trip Inspection */}
                  {selectedLog.postTrip.completedAt && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
                      <h4 className="font-semibold mb-3 text-foreground">
                        Post-Trip Inspection
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Vehicle Condition:
                          </span>{" "}
                          {selectedLog.postTrip.vehicleCondition}
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Final Mileage:
                          </span>{" "}
                          {selectedLog.postTrip.mileageEnd} km
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Fuel Level:
                          </span>{" "}
                          {selectedLog.postTrip.fuelLevel}%
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Maintenance Required:
                          </span>{" "}
                          {selectedLog.postTrip.maintenanceRequired
                            ? "Yes"
                            : "No"}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-muted-foreground">
                            Completed By:
                          </span>{" "}
                          {selectedLog.postTrip.completedBy} on{" "}
                          {formatDate(selectedLog.postTrip.completedAt)}
                        </div>
                      </div>
                      {selectedLog.postTrip.damageReport && (
                        <div className="text-sm mt-2">
                          <span className="font-medium text-muted-foreground">
                            Damage Report:
                          </span>{" "}
                          {selectedLog.postTrip.damageReport}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="border-t border-border mt-4 pt-3 bottom-0 bg-background/90 backdrop-blur-md">
            <Button
              onClick={handleCloseDetailsDialog}
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
