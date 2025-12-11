"use client";
import React, { useState, useEffect, useMemo } from "react";

import {
  Navigation,
  Map,
  Play,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  MapPin,
  Car,
  User,
  Clock,
  Gauge,
  Fuel,
  AlertTriangle,
  Shield,
  Activity,
  Route,
  Pause,
  RotateCcw,
  FastForward,
  TrendingUp,
  Navigation2,
} from "lucide-react";
import { mockSystemData } from "@/data/mock-system-data";
import { GPSLog } from "@/types/system-interfaces";
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
import { Progress } from "@/components/ui/progress";
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
import { Slider } from "@/components/ui/slider";

interface TripReplayData {
  tripId: string;
  requestNumber: string;
  vehicleNumber: string;
  driverName: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  routePoints: Array<{
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
  }>;
}

export default function GPSLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<GPSLog | null>(null);

  // Trip Replay State
  const [isReplayDialogOpen, setIsReplayDialogOpen] = useState(false);
  const [replaySearchTerm, setReplaySearchTerm] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<TripReplayData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentRoutePoint, setCurrentRoutePoint] = useState(0);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isTripHistoryDialogOpen, setIsTripHistoryDialogOpen] = useState(false);
  const [selectedVehicleTrips, setSelectedVehicleTrips] = useState<
    TripReplayData[]
  >([]);
  const [exportFields, setExportFields] = useState({
    timestamp: true,
    latitude: true,
    longitude: true,
    speed: true,
    heading: true,
  });
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Get GPS logs data
  const gpsLogs = mockSystemData.gpsLogs;

  // Mock trip replay data - in a real app, this would come from an API
  const mockTripReplays = useMemo<TripReplayData[]>(
    () => [
      {
        tripId: "TRIP-001",
        requestNumber: "REQ-2024-001",
        vehicleNumber: "MH-01-AB-1234",
        driverName: "Rahul Sharma",
        startTime: "2025-10-13T09:00:00",
        endTime: "2025-10-13T11:30:00",
        startLocation: "Bandra West, Mumbai",
        endLocation: "Andheri East, Mumbai",
        distance: 18.5,
        duration: 150,
        avgSpeed: 42,
        maxSpeed: 65,
        routePoints: Array.from({ length: 50 }, (_, i) => ({
          timestamp: new Date(Date.now() - (50 - i) * 180000).toISOString(),
          latitude: 19.0596 + i * 0.001,
          longitude: 72.8295 + i * 0.001,
          speed: Math.floor(Math.random() * 60) + 20,
          heading: Math.floor(Math.random() * 360),
        })),
      },
      {
        tripId: "TRIP-002",
        requestNumber: "REQ-2024-002",
        vehicleNumber: "MH-02-CD-5678",
        driverName: "Priya Patel",
        startTime: "2025-10-13T10:15:00",
        endTime: "2025-10-13T12:00:00",
        startLocation: "Powai, Mumbai",
        endLocation: "BKC, Mumbai",
        distance: 12.3,
        duration: 105,
        avgSpeed: 38,
        maxSpeed: 58,
        routePoints: Array.from({ length: 40 }, (_, i) => ({
          timestamp: new Date(Date.now() - (40 - i) * 157500).toISOString(),
          latitude: 19.1136 + i * 0.0008,
          longitude: 72.8697 + i * 0.0008,
          speed: Math.floor(Math.random() * 55) + 15,
          heading: Math.floor(Math.random() * 360),
        })),
      },
      {
        tripId: "TRIP-003",
        requestNumber: "REQ-2024-003",
        vehicleNumber: "MH-03-EF-9012",
        driverName: "Amit Kumar",
        startTime: "2025-10-13T14:00:00",
        endTime: "2025-10-13T15:45:00",
        startLocation: "Lower Parel, Mumbai",
        endLocation: "Worli, Mumbai",
        distance: 8.7,
        duration: 105,
        avgSpeed: 35,
        maxSpeed: 52,
        routePoints: Array.from({ length: 35 }, (_, i) => ({
          timestamp: new Date(Date.now() - (35 - i) * 180000).toISOString(),
          latitude: 18.9987 + i * 0.0006,
          longitude: 72.8247 + i * 0.0006,
          speed: Math.floor(Math.random() * 50) + 10,
          heading: Math.floor(Math.random() * 360),
        })),
      },
    ],
    []
  );

  // Playback effect
  useEffect(() => {
    if (!isPlaying || !selectedTrip) return;

    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        const next = prev + playbackSpeed * 2;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, selectedTrip]);

  // Update current route point based on progress
  useEffect(() => {
    if (selectedTrip) {
      const pointIndex = Math.floor(
        (currentProgress / 100) * (selectedTrip.routePoints.length - 1)
      );
      setCurrentRoutePoint(pointIndex);
    }
  }, [currentProgress, selectedTrip]);

  const filteredLogs = useMemo(() => {
    return gpsLogs.filter((log) => {
      return (
        (log.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.location.address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (statusFilter === "all" || log.status.toLowerCase() === statusFilter)
      );
    });
  }, [gpsLogs, searchTerm, statusFilter]);

  const filteredTrips = useMemo(() => {
    return mockTripReplays.filter((trip) => {
      return (
        trip.vehicleNumber
          .toLowerCase()
          .includes(replaySearchTerm.toLowerCase()) ||
        trip.driverName
          .toLowerCase()
          .includes(replaySearchTerm.toLowerCase()) ||
        trip.requestNumber
          .toLowerCase()
          .includes(replaySearchTerm.toLowerCase())
      );
    });
  }, [mockTripReplays, replaySearchTerm]);

  const handleExportGPSData = () => {
    const csvContent = [
      [
        "Vehicle Number",
        "Driver Name",
        "Latitude",
        "Longitude",
        "Speed",
        "Status",
      ],
      ...gpsLogs.map((log) => [
        log.vehicleNumber,
        log.driverName,
        log.location.latitude,
        log.location.longitude,
        log.location.speed || 0,
        log.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gps_logs.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportRouteData = (trip: TripReplayData) => {
    if (!trip.routePoints || trip.routePoints.length === 0) {
      console.log("No route data available to export");
      return;
    }

    // Build headers and data based on selected fields
    const headers = [];
    if (exportFields.timestamp) headers.push("Timestamp");
    if (exportFields.latitude) headers.push("Latitude");
    if (exportFields.longitude) headers.push("Longitude");
    if (exportFields.speed) headers.push("Speed");
    if (exportFields.heading) headers.push("Heading");

    const csvContent = [
      headers,
      ...trip.routePoints.map((point) => {
        const row = [];
        if (exportFields.timestamp) row.push(point.timestamp);
        if (exportFields.latitude) row.push(point.latitude);
        if (exportFields.longitude) row.push(point.longitude);
        if (exportFields.speed) row.push(point.speed);
        if (exportFields.heading) row.push(point.heading);
        return row;
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip_${trip.tripId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleTrackOnMap = (log: GPSLog) => {
    setSelectedLog(log);
    setIsMapDialogOpen(true);
  };

  const handleTripHistory = (log: GPSLog) => {
    const vehicleTrips = mockTripReplays.filter(
      (trip) => trip.vehicleNumber === log.vehicleNumber
    );
    setSelectedVehicleTrips(vehicleTrips);
    setIsTripHistoryDialogOpen(true);
  };

  const handleExportData = (log: GPSLog) => {
    const csvContent = [
      [
        "Vehicle Number",
        "Driver Name",
        "Latitude",
        "Longitude",
        "Speed",
        "Status",
        "Timestamp",
      ],
      [
        log.vehicleNumber,
        log.driverName,
        log.location.latitude,
        log.location.longitude,
        log.location.speed || 0,
        log.status,
        log.location.timestamp,
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gps_log_${log.vehicleNumber}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate stats
  const stats = {
    totalVehicles: gpsLogs.length,
    activeVehicles: gpsLogs.filter((log) => log.status === "Active").length,
    offlineVehicles: gpsLogs.filter((log) => log.status === "Offline").length,
    emergencyAlerts: gpsLogs.filter(
      (log) => log.panicButton || log.speedAlerts.isViolation
    ).length,
    averageSpeed: Math.round(
      gpsLogs.reduce((sum, log) => sum + (log.location.speed || 0), 0) /
        gpsLogs.length
    ),
    totalDistance: gpsLogs.reduce((sum, log) => sum + log.mileage, 0),
  };

  const handleViewDetails = (log: GPSLog) => {
    setSelectedLog(log);
    setIsDetailsDialogOpen(true);
  };

  const handleOpenReplayDialog = () => {
    setIsReplayDialogOpen(true);
    setSelectedTrip(null);
    setIsPlaying(false);
    setCurrentProgress(0);
  };

  const handleSelectTrip = (trip: TripReplayData) => {
    setSelectedTrip(trip);
    setCurrentProgress(0);
    setCurrentRoutePoint(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentProgress(0);
    setCurrentRoutePoint(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const handleProgressChange = (value: number[]) => {
    setCurrentProgress(value[0]);
    setIsPlaying(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
        color: string;
      }
    > = {
      Active: {
        variant: "default",
        icon: <Activity className="h-3 w-3" />,
        color: "text-green-600",
      },
      Idle: {
        variant: "secondary",
        icon: <Clock className="h-3 w-3" />,
        color: "text-yellow-600",
      },
      Offline: {
        variant: "destructive",
        icon: <AlertTriangle className="h-3 w-3" />,
        color: "text-red-600",
      },
      Emergency: {
        variant: "destructive",
        icon: <Shield className="h-3 w-3" />,
        color: "text-red-700",
      },
      Maintenance: {
        variant: "outline",
        icon: <Car className="h-3 w-3" />,
        color: "text-gray-600",
      },
    };
    const config = variants[status] || variants["Offline"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getGeofenceStatus = (status: string) => {
    const colors = {
      Inside: "text-green-600",
      Outside: "text-blue-600",
      Violation: "text-red-600",
    };
    return (
      <span
        className={`text-xs ${
          colors[status as keyof typeof colors] || "text-gray-600"
        }`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
          <h1 className="text-2xl">GPS TRACKING</h1>
          <p className="text-muted-foreground text-xs">
            Real-time GPS monitoring and trip playback
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleOpenReplayDialog}>
            <Play className="h-4 w-4 mr-2" />
            Trip Replay
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" onClick={handleExportGPSData} />
            Export GPS Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalVehicles}</div>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.activeVehicles}</div>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.offlineVehicles}
                </div>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.emergencyAlerts}
                </div>
                <p className="text-sm text-muted-foreground">Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live GPS Tracking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Live GPS Tracking</CardTitle>
          <CardDescription>
            Real-time vehicle locations and status monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* GPS Logs Table */}
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle & Driver</TableHead>
                  <TableHead>Location & Address</TableHead>
                  <TableHead>Speed & Movement</TableHead>
                  <TableHead>Vehicle Status</TableHead>
                  <TableHead>Alerts & Violations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center">
                          <Car className="h-3 w-3 mr-1" />
                          {log.vehicleNumber}
                        </div>
                        <div className="text-sm flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {log.driverName}
                        </div>
                        {log.requestNumber && (
                          <div className="text-xs text-muted-foreground">
                            Trip: {log.requestNumber}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          ID: {log.vehicleId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-start">
                          <MapPin className="h-3 w-3 mr-1 mt-0.5 text-blue-500" />
                          <span className="text-xs">
                            {log.location.address || "Address not available"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCoordinates(
                            log.location.latitude,
                            log.location.longitude
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Accuracy: {log.location.accuracy}m
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated: {formatDate(log.location.timestamp)}
                        </div>
                        <div className="text-xs">
                          Geofence: {getGeofenceStatus(log.geofenceStatus)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          <Gauge className="h-3 w-3 mr-1" />
                          {log.location.speed || 0} km/h
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Heading: {log.location.heading || 0}°
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Mileage: {log.mileage.toLocaleString()} km
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ignition: {log.ignitionStatus}
                        </div>
                        {log.speedAlerts.isViolation && (
                          <Badge variant="destructive" className="text-xs">
                            Speed Violation
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(log.status)}
                        <div className="flex items-center space-x-1">
                          <Fuel className="h-3 w-3" />
                          <Progress
                            value={log.fuelLevel}
                            className="w-16 h-2"
                          />
                          <span className="text-xs">{log.fuelLevel}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {log.panicButton && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Panic Alert
                          </Badge>
                        )}
                        {log.speedAlerts.violationCount > 0 && (
                          <div className="text-xs text-red-600">
                            Speed Violations: {log.speedAlerts.violationCount}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Speed Limit: {log.speedAlerts.speedLimit} km/h
                        </div>
                      </div>
                    </TableCell>
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
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTrackOnMap(log)}
                          >
                            <Map className="h-4 w-4 mr-2" />
                            Track on Map
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTripHistory(log)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Trip History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportData(log)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
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
            {paginatedDocuments.map((log) => (
              <div
                key={log.id}
                className="border border-border rounded-xl p-4 shadow-sm bg-background space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="text-sm flex items-center font-medium">
                    <Car className="h-3 w-3 mr-1" />
                    {log.vehicleNumber}
                  </div>
                  {getStatusBadge(log.status)}
                </div>

                <div className="text-sm text-muted-foreground flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {log.driverName}
                </div>

                <div className="text-xs text-muted-foreground">
                  Location: {log.location.address || "N/A"}
                </div>

                <div className="text-xs text-muted-foreground">
                  Speed: {log.location.speed || 0} km/h | Fuel: {log.fuelLevel}%
                </div>

                <div className="text-xs text-muted-foreground">
                  Updated: {formatDate(log.location.timestamp)}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-muted-foreground">
                    {log.speedAlerts.isViolation && (
                      <Badge variant="destructive" className="text-xs">
                        Speed Violation
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTrackOnMap(log)}>
                        <Map className="h-4 w-4 mr-2" />
                        Track on Map
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTripHistory(log)}>
                        <Play className="h-4 w-4 mr-2" />
                        Trip History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportData(log)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
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

      {/* GPS Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto bg-background border border-border rounded-2xl shadow-2xl p-6">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              GPS Tracking Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedLog && (
                <>Detailed GPS information for {selectedLog.vehicleNumber}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-6">
            {selectedLog && (
              <>
                {/* === Vehicle & Driver Info === */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-border bg-muted/20">
                    <h4 className="font-medium text-lg mb-2">
                      Vehicle Information
                    </h4>
                    <div className="text-sm space-y-1">
                      <div>
                        Vehicle Number:{" "}
                        <span className="font-semibold">
                          {selectedLog.vehicleNumber}
                        </span>
                      </div>
                      <div>Vehicle ID: {selectedLog.vehicleId}</div>
                      <div>
                        Current Mileage: {selectedLog.mileage.toLocaleString()}{" "}
                        km
                      </div>
                      <div>Status: {selectedLog.status}</div>
                      <div>Ignition: {selectedLog.ignitionStatus}</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/20">
                    <h4 className="font-medium text-lg mb-2">
                      Driver Information
                    </h4>
                    <div className="text-sm space-y-1">
                      <div>Driver Name: {selectedLog.driverName}</div>
                      <div>Driver ID: {selectedLog.driverId}</div>
                      {selectedLog.requestNumber && (
                        <div>Current Trip: {selectedLog.requestNumber}</div>
                      )}
                    </div>
                  </div>
                </section>

                {/* === Location Details === */}
                <section className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                  <h4 className="font-medium text-lg">Location Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>Latitude: {selectedLog.location.latitude}</div>
                    <div>Longitude: {selectedLog.location.longitude}</div>
                    <div>
                      Altitude: {selectedLog.location.altitude || "N/A"} m
                    </div>
                    <div>Accuracy: {selectedLog.location.accuracy} m</div>
                    <div>Speed: {selectedLog.location.speed || 0} km/h</div>
                    <div>Heading: {selectedLog.location.heading || 0}°</div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Address:</span>{" "}
                    {selectedLog.location.address || "Address not available"}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Last Updated:</span>{" "}
                    {formatDate(selectedLog.location.timestamp)}
                  </div>
                </section>

                {/* === Vehicle Status === */}
                <section className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                  <h4 className="font-medium text-lg">Vehicle Status</h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: "Fuel Level", value: selectedLog.fuelLevel },
                      {
                        label: "Battery Level",
                        value: selectedLog.batteryLevel,
                      },
                      {
                        label: "Signal Strength",
                        value: selectedLog.signalStrength,
                      },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="flex items-center space-x-2">
                          <Progress value={item.value} className="flex-1" />
                          <span className="text-sm">{item.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      Engine Temperature:{" "}
                      {selectedLog.engineTemperature || "N/A"}°C
                    </div>
                    <div>Air Conditioning: {selectedLog.ac ? "On" : "Off"}</div>
                    <div>Geofence Status: {selectedLog.geofenceStatus}</div>
                    <div>
                      Panic Button:{" "}
                      {selectedLog.panicButton ? "ACTIVATED" : "Normal"}
                    </div>
                  </div>
                </section>

                {/* === Speed Monitoring === */}
                <section className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                  <h4 className="font-medium text-lg">Speed Monitoring</h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      Current Speed: {selectedLog.speedAlerts.currentSpeed} km/h
                    </div>
                    <div>
                      Speed Limit: {selectedLog.speedAlerts.speedLimit} km/h
                    </div>
                    <div>
                      Violation Status:{" "}
                      {selectedLog.speedAlerts.isViolation
                        ? "🚨 VIOLATION"
                        : "Normal"}
                    </div>
                    <div>
                      Total Violations: {selectedLog.speedAlerts.violationCount}
                    </div>
                  </div>
                </section>

                {/* === Device Information === */}
                <section className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                  <h4 className="font-medium text-lg">Device Information</h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>Device ID: {selectedLog.deviceInfo.deviceId}</div>
                    <div>IMEI: {selectedLog.deviceInfo.imei}</div>
                    <div>
                      Firmware Version: {selectedLog.deviceInfo.firmwareVersion}
                    </div>
                    <div>
                      Network Provider: {selectedLog.deviceInfo.networkProvider}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Last Ping:</span>{" "}
                    {formatDate(selectedLog.lastPing)}
                  </div>
                </section>

                {/* === Timestamps === */}
                <section className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                  <h4 className="font-medium text-lg">Timestamps</h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>Created: {formatDate(selectedLog.createdAt)}</div>
                    <div>Last Updated: {formatDate(selectedLog.updatedAt)}</div>
                  </div>
                </section>
              </>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="px-6 rounded-lg"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip Replay Dialog */}
      <Dialog open={isReplayDialogOpen} onOpenChange={setIsReplayDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation2 className="h-5 w-5" />
              Trip Replay & Route Playback
            </DialogTitle>
            <DialogDescription>
              Select a completed trip to replay its route with real-time
              playback controls
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!selectedTrip ? (
              // Trip Selection View
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle number, driver, or trip ID..."
                    value={replaySearchTerm}
                    onChange={(e) => setReplaySearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Trip List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredTrips.map((trip) => (
                    <Card
                      key={trip.tripId}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectTrip(trip)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                {trip.requestNumber}
                              </Badge>
                              <div className="flex items-center gap-2 text-sm">
                                <Car className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {trip.vehicleNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{trip.driverName}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  Start Location
                                </div>
                                <div className="text-sm flex items-start gap-1">
                                  <MapPin className="h-3 w-3 text-green-500 mt-0.5" />
                                  <span>{trip.startLocation}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(trip.startTime)}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  End Location
                                </div>
                                <div className="text-sm flex items-start gap-1">
                                  <MapPin className="h-3 w-3 text-red-500 mt-0.5" />
                                  <span>{trip.endLocation}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(trip.endTime)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-1">
                                <Route className="h-4 w-4 text-purple-500" />
                                <span>{trip.distance} km</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span>{trip.duration} min</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Gauge className="h-4 w-4 text-blue-500" />
                                <span>Avg: {trip.avgSpeed} km/h</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span>Max: {trip.maxSpeed} km/h</span>
                              </div>
                            </div>
                          </div>

                          <Button size="sm" className="ml-4">
                            <Play className="h-4 w-4 mr-2" />
                            Replay
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredTrips.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No trips found matching your search</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Playback View
              <div className="space-y-6">
                {/* Trip Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {selectedTrip.requestNumber}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {selectedTrip.vehicleNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{selectedTrip.driverName}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(selectedTrip.startTime)} →{" "}
                      {formatDate(selectedTrip.endTime)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTrip(null)}
                  >
                    ← Back to Trips
                  </Button>
                </div>

                {/* Map Placeholder */}
                <Card className="bg-slate-50">
                  <CardContent className="p-0">
                    <div className="relative h-[350px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="text-center space-y-2">
                        <Map className="h-16 w-16 mx-auto text-blue-400" />
                        <div className="text-sm text-muted-foreground">
                          Interactive Route Map
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Showing playback at {currentProgress.toFixed(0)}%
                        </div>
                      </div>

                      {/* Current Location Indicator */}
                      {selectedTrip.routePoints[currentRoutePoint] && (
                        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-1">
                          <div className="text-xs font-medium">
                            Current Position
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCoordinates(
                              selectedTrip.routePoints[currentRoutePoint]
                                .latitude,
                              selectedTrip.routePoints[currentRoutePoint]
                                .longitude
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Gauge className="h-3 w-3" />
                            {
                              selectedTrip.routePoints[currentRoutePoint].speed
                            }{" "}
                            km/h
                          </div>
                        </div>
                      )}

                      {/* Route Info */}
                      <div className="absolute top-4 left-4 space-y-2">
                        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 text-xs">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="font-medium">Start:</span>
                          <span className="text-muted-foreground">
                            {selectedTrip.startLocation}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 text-xs">
                          <MapPin className="h-3 w-3 text-red-500" />
                          <span className="font-medium">End:</span>
                          <span className="text-muted-foreground">
                            {selectedTrip.endLocation}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Playback Controls */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    {/* Progress Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Trip Progress
                        </span>
                        <span className="font-medium">
                          {currentProgress.toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        value={[currentProgress]}
                        onValueChange={handleProgressChange}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0:00</span>
                        <span>
                          {currentRoutePoint + 1} /{" "}
                          {selectedTrip.routePoints.length} points
                        </span>
                        <span>{selectedTrip.duration}:00</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRestart}
                        disabled={currentProgress === 0}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>

                      <Button
                        size="lg"
                        onClick={handlePlayPause}
                        className="px-8"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-5 w-5 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            {currentProgress >= 100 ? "Replay" : "Play"}
                          </>
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <FastForward className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <DropdownMenuItem
                            onClick={() => handleSpeedChange(0.5)}
                          >
                            <span
                              className={
                                playbackSpeed === 0.5 ? "font-medium" : ""
                              }
                            >
                              0.5x Speed
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSpeedChange(1)}
                          >
                            <span
                              className={
                                playbackSpeed === 1 ? "font-medium" : ""
                              }
                            >
                              1x Speed
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSpeedChange(2)}
                          >
                            <span
                              className={
                                playbackSpeed === 2 ? "font-medium" : ""
                              }
                            >
                              2x Speed
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSpeedChange(4)}
                          >
                            <span
                              className={
                                playbackSpeed === 4 ? "font-medium" : ""
                              }
                            >
                              4x Speed
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Badge variant="outline" className="ml-2">
                        {playbackSpeed}x
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Trip Statistics */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Route className="h-5 w-5 text-purple-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Distance
                          </div>
                          <div className="text-lg font-medium">
                            {selectedTrip.distance} km
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Duration
                          </div>
                          <div className="text-lg font-medium">
                            {selectedTrip.duration} min
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Avg Speed
                          </div>
                          <div className="text-lg font-medium">
                            {selectedTrip.avgSpeed} km/h
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Max Speed
                          </div>
                          <div className="text-lg font-medium">
                            {selectedTrip.maxSpeed} km/h
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {selectedTrip && (
              <div className="flex items-center gap-2 w-full justify-between">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Route Data
                </Button>
                <Button onClick={() => setIsReplayDialogOpen(false)}>
                  Close
                </Button>
              </div>
            )}
            {!selectedTrip && (
              <Button onClick={() => setIsReplayDialogOpen(false)}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-[900px] rounded-2xl max-h-[90vh] border border-border bg-background shadow-lg overflow-y-auto">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <DialogTitle className="text-lg font-semibold text-foreground">
                Vehicle Location
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Current location of{" "}
              <span className="font-medium">{selectedLog?.vehicleNumber}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Map Area */}
          <div className="relative h-[400px] rounded-xl bg-muted flex flex-col items-center justify-center gap-3 mt-4 border border-border">
            <MapPin className="h-12 w-12 text-blue-400 animate-bounce" />
            <p className="text-sm text-muted-foreground text-center">
              Map showing (
              <span className="font-medium">
                {selectedLog?.location.latitude}
              </span>
              ,{" "}
              <span className="font-medium">
                {selectedLog?.location.longitude}
              </span>
              )
            </p>

            {/* Optional — Add overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsMapDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip Replay Dialog */}
      <Dialog open={isReplayDialogOpen} onOpenChange={setIsReplayDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-border bg-background">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Navigation2 className="h-5 w-5 text-blue-600" />
              Trip Replay & Route Playback
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Select a completed trip to replay its route with real-time
              playback controls.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {!selectedTrip ? (
              <>
                {/* 🔍 Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle number, driver, or trip ID..."
                    value={replaySearchTerm}
                    onChange={(e) => setReplaySearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* 📋 Trip List */}
                <div className="space-y-3">
                  {filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => (
                      <Card
                        key={trip.tripId}
                        className="cursor-pointer transition hover:bg-accent/60 border border-border/60"
                        onClick={() => handleSelectTrip(trip)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center flex-wrap gap-3">
                                <Badge variant="outline" className="font-mono">
                                  {trip.requestNumber}
                                </Badge>
                                <div className="flex items-center gap-2 text-sm">
                                  <Car className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">
                                    {trip.vehicleNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  <span>{trip.driverName}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Start Location
                                  </div>
                                  <div className="text-sm flex items-start gap-1">
                                    <MapPin className="h-3 w-3 text-green-500 mt-0.5" />
                                    <span>{trip.startLocation}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(trip.startTime)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    End Location
                                  </div>
                                  <div className="text-sm flex items-start gap-1">
                                    <MapPin className="h-3 w-3 text-red-500 mt-0.5" />
                                    <span>{trip.endLocation}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(trip.endTime)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Route className="h-4 w-4 text-purple-500" />
                                  <span>{trip.distance} km</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-orange-500" />
                                  <span>{trip.duration} min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Gauge className="h-4 w-4 text-blue-500" />
                                  <span>Avg: {trip.avgSpeed} km/h</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  <span>Max: {trip.maxSpeed} km/h</span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" className="ml-4">
                              <Play className="h-4 w-4 mr-2" />
                              Replay
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No trips found matching your search</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* 🧭 Selected Trip Info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center flex-wrap gap-3">
                      <Badge variant="outline" className="font-mono">
                        {selectedTrip.requestNumber}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {selectedTrip.vehicleNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{selectedTrip.driverName}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(selectedTrip.startTime)} →{" "}
                      {formatDate(selectedTrip.endTime)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTrip(null)}
                  >
                    ← Back to Trips
                  </Button>
                </div>

                {/* 🗺️ Route Map Simulation */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-border/40">
                  <CardContent className="p-0 relative h-[350px] flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Map className="h-16 w-16 mx-auto text-blue-400" />
                      <div className="text-sm text-muted-foreground">
                        Interactive Route Map
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Showing playback at {currentProgress.toFixed(0)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ⏯ Playback Controls */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Trip Progress
                      </span>
                      <span className="font-medium">
                        {currentProgress.toFixed(0)}%
                      </span>
                    </div>

                    <Slider
                      value={[currentProgress]}
                      onValueChange={handleProgressChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>0:00</span>
                      <span>
                        {currentRoutePoint + 1} /{" "}
                        {selectedTrip.routePoints.length} points
                      </span>
                      <span>{selectedTrip.duration}:00</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRestart}
                        disabled={currentProgress === 0}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="lg"
                        onClick={handlePlayPause}
                        className="px-8"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-5 w-5 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            {currentProgress >= 100 ? "Replay" : "Play"}
                          </>
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <FastForward className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          {[0.5, 1, 2, 4].map((speed) => (
                            <DropdownMenuItem
                              key={speed}
                              onClick={() => handleSpeedChange(speed)}
                            >
                              <span
                                className={
                                  playbackSpeed === speed ? "font-medium" : ""
                                }
                              >
                                {speed}x Speed
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Badge variant="outline" className="ml-2">
                        {playbackSpeed}x
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 📊 Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      icon: <Route className="h-5 w-5 text-purple-500" />,
                      label: "Distance",
                      value: `${selectedTrip.distance} km`,
                    },
                    {
                      icon: <Clock className="h-5 w-5 text-orange-500" />,
                      label: "Duration",
                      value: `${selectedTrip.duration} min`,
                    },
                    {
                      icon: <Gauge className="h-5 w-5 text-blue-500" />,
                      label: "Avg Speed",
                      value: `${selectedTrip.avgSpeed} km/h`,
                    },
                    {
                      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
                      label: "Max Speed",
                      value: `${selectedTrip.maxSpeed} km/h`,
                    },
                  ].map((stat, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 flex items-center gap-2">
                        {stat.icon}
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {stat.label}
                          </div>
                          <div className="text-lg font-medium">
                            {stat.value}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            {selectedTrip ? (
              <div className="flex items-center gap-2 w-full justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExportDialogOpen(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Route Data
                </Button>
                <Button onClick={() => setIsReplayDialogOpen(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsReplayDialogOpen(false)}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip History Dialog */}
      <Dialog
        open={isTripHistoryDialogOpen}
        onOpenChange={setIsTripHistoryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trip History</DialogTitle>
            <DialogDescription>
              Past trips for {selectedLog?.vehicleNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {selectedVehicleTrips.map((trip) => (
              <Card key={trip.tripId}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTrips.includes(trip.tripId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTrips([...selectedTrips, trip.tripId]);
                        } else {
                          setSelectedTrips(
                            selectedTrips.filter((id) => id !== trip.tripId)
                          );
                        }
                      }}
                    />
                    <Badge variant="outline">{trip.requestNumber}</Badge>
                    <div>
                      {trip.startLocation} → {trip.endLocation}
                    </div>
                    <div>{formatDate(trip.startTime)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTrip(trip);
                        setCurrentProgress(0);
                        setCurrentRoutePoint(0);
                        setIsPlaying(false);
                        setIsReplayDialogOpen(true);
                        setIsTripHistoryDialogOpen(false);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Replay
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportRouteData(trip)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Route Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {selectedVehicleTrips.length === 0 && (
              <div className="text-center py-12">No trips found</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                selectedTrips.forEach((tripId) => {
                  const trip = selectedVehicleTrips.find(
                    (t) => t.tripId === tripId
                  );
                  if (trip) handleExportRouteData(trip);
                });
              }}
              disabled={selectedTrips.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Selected Trips
            </Button>
            <Button onClick={() => setIsTripHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Field Selection Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Fields to Export</DialogTitle>
            <DialogDescription>
              Choose the fields to include in the exported route data for trip{" "}
              {selectedTrip?.requestNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="timestamp"
                checked={exportFields.timestamp}
                onChange={(e) =>
                  setExportFields({
                    ...exportFields,
                    timestamp: e.target.checked,
                  })
                }
              />
              <label htmlFor="timestamp" className="text-sm">
                Timestamp
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="latitude"
                checked={exportFields.latitude}
                onChange={(e) =>
                  setExportFields({
                    ...exportFields,
                    latitude: e.target.checked,
                  })
                }
              />
              <label htmlFor="latitude" className="text-sm">
                Latitude
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="longitude"
                checked={exportFields.longitude}
                onChange={(e) =>
                  setExportFields({
                    ...exportFields,
                    longitude: e.target.checked,
                  })
                }
              />
              <label htmlFor="longitude" className="text-sm">
                Longitude
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="speed"
                checked={exportFields.speed}
                onChange={(e) =>
                  setExportFields({ ...exportFields, speed: e.target.checked })
                }
              />
              <label htmlFor="speed" className="text-sm">
                Speed
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="heading"
                checked={exportFields.heading}
                onChange={(e) =>
                  setExportFields({
                    ...exportFields,
                    heading: e.target.checked,
                  })
                }
              />
              <label htmlFor="heading" className="text-sm">
                Heading
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedTrip) {
                  handleExportRouteData(selectedTrip);
                  setIsExportDialogOpen(false);
                }
              }}
              disabled={
                !selectedTrip ||
                !Object.values(exportFields).some((field) => field)
              }
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
