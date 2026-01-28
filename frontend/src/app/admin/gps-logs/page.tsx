"use client";

import React, { useState, useEffect, useMemo, JSX } from "react";
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

// ────────────────────────────────────────────────
// Types (aligned with your backend response)
// ────────────────────────────────────────────────

interface GPSLog {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string | null;
  driverName: string;
  requestNumber: string | null;
  location: {
    latitude: number;
    longitude: number;
    address: string | null;
    speed: number;
    heading: number;
    accuracy: number;
    altitude: number;
    timestamp: string; // ISO string
  };
  status: "Active" | "Idle" | "Offline" | "Emergency" | "Maintenance";
  ignitionStatus: string | null;
  fuelLevel: number;
  mileage: number;
  batteryLevel: number;
  signalStrength: number;
  panicButton: boolean;
  geofenceStatus: string | null;
  speedAlerts: {
    currentSpeed: number;
    speedLimit: number | null;
    isViolation: boolean;
    violationCount: number;
  };
  lastPing: string;
  createdAt: string;
  updatedAt: string;
}

interface TripReplayData {
  tripId: string;
  requestNumber: string | null;
  vehicleNumber: string | null;
  startTime: string;
  endTime: string;
  distance: number;
  durationMinutes: number;
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────

export default function GPSLogs() {
  // ── Main GPS Logs State ───────────────────────────────
  const [gpsLogs, setGpsLogs] = useState<GPSLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Details / Map Dialog ──────────────────────────────
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<GPSLog | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);

  // ── Trip Replay State ─────────────────────────────────
  const [isReplayDialogOpen, setIsReplayDialogOpen] = useState(false);
  const [replaySearchTerm, setReplaySearchTerm] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<TripReplayData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentRoutePoint, setCurrentRoutePoint] = useState(0);
  const [isTripHistoryDialogOpen, setIsTripHistoryDialogOpen] = useState(false);
  const [selectedVehicleTrips, setSelectedVehicleTrips] = useState<TripReplayData[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  // ── Export states ─────────────────────────────────────
  const [exportFields, setExportFields] = useState({
    timestamp: true,
    latitude: true,
    longitude: true,
    speed: true,
    heading: true,
  });
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Fetch GPS Logs ────────────────────────────────────
  useEffect(() => {
    const fetchGPSLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          ...(searchTerm.trim() && { searchTerm: searchTerm.trim() }),
          ...(statusFilter !== "all" && { status: statusFilter }),
        }).toString();

        const res = await fetch(`/gps-logs?${query}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch GPS logs");

        const json = await res.json();
        // Adjust according to your actual response shape
        setGpsLogs(json.logs || []);
        setPagination({
          page: json.pagination?.page || 1,
          limit: json.pagination?.limit || 10,
          total: json.pagination?.total || 0,
          totalPages: json.pagination?.totalPages || 1,
        });
      } catch (err) {
        setError("Could not load GPS data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGPSLogs();
  }, [currentPage, pageSize, searchTerm, statusFilter]);

  // ── Fetch single log details when opening dialog ──────
  const handleViewDetails = async (log: GPSLog) => {
    setSelectedLog(log);
    setIsDetailsDialogOpen(true);

    // Optional: fetch more detailed data if needed
    // try {
    //   const res = await fetch(`/gps-logs/${log.id}`);
    //   const json = await res.json();
    //   setSelectedLog(json.log);
    // } catch {}
  };

  // ── Export full filtered list ─────────────────────────
  const handleExportGPSData = () => {
    const query = new URLSearchParams({
      ...(searchTerm.trim() && { searchTerm: searchTerm.trim() }),
      ...(statusFilter !== "all" && { status: statusFilter }),
    }).toString();

    window.location.href = `/gps-logs/export?${query}`;
  };

  // ── Open trip replay dialog ───────────────────────────
  const handleOpenReplayDialog = () => {
    setIsReplayDialogOpen(true);
    setSelectedTrip(null);
    setIsPlaying(false);
    setCurrentProgress(0);
  };

  // ── Select & fetch trip replay data ───────────────────
  const handleSelectTrip = async (trip: TripReplayData) => {
    try {
      const res = await fetch(`/gps-logs/replay/${trip.tripId}`);
      if (!res.ok) throw new Error("Failed to load trip replay");

      const json = await res.json();
      setSelectedTrip(json.replayData);
      setCurrentProgress(0);
      setCurrentRoutePoint(0);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
      alert("Could not load trip replay data");
    }
  };

  // ── Playback logic ────────────────────────────────────
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

  useEffect(() => {
    if (selectedTrip) {
      const pointIndex = Math.floor(
        (currentProgress / 100) * (selectedTrip.routePoints.length - 1)
      );
      setCurrentRoutePoint(pointIndex);
    }
  }, [currentProgress, selectedTrip]);

  // ── Trip History for a vehicle ────────────────────────
  const handleTripHistory = (log: GPSLog) => {
    // In real app you would fetch trip history for this vehicle
    // For now we simulate with mock – replace with real API later
    // Example: fetch(`/gps-logs/trips?vehicleId=${log.vehicleId}`)
    setSelectedVehicleTrips([]); // ← replace with real data
    setIsTripHistoryDialogOpen(true);
  };

  // ── Export single trip route ──────────────────────────
  const handleExportRouteData = (trip: TripReplayData) => {
    if (!trip.routePoints?.length) return;

    const headers: string[] = [];
    if (exportFields.timestamp) headers.push("Timestamp");
    if (exportFields.latitude) headers.push("Latitude");
    if (exportFields.longitude) headers.push("Longitude");
    if (exportFields.speed) headers.push("Speed");
    if (exportFields.heading) headers.push("Heading");

    const rows = trip.routePoints.map((point) => {
      const row: string[] = [];
      if (exportFields.timestamp) row.push(point.timestamp);
      if (exportFields.latitude) row.push(point.latitude.toString());
      if (exportFields.longitude) row.push(point.longitude.toString());
      if (exportFields.speed) row.push(point.speed.toString());
      if (exportFields.heading) row.push(point.heading.toString());
      return row;
    });

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip_${trip.tripId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Helpers ───────────────────────────────────────────
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCoordinates = (lat: number, lng: number) =>
    `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: VariantProps<typeof badgeVariants>["variant"]; icon: JSX.Element; color: string }
    > = {
      Active: { variant: "default", icon: <Activity className="h-3 w-3" />, color: "text-green-600" },
      Idle: { variant: "secondary", icon: <Clock className="h-3 w-3" />, color: "text-yellow-600" },
      Offline: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" />, color: "text-red-600" },
      Emergency: { variant: "destructive", icon: <Shield className="h-3 w-3" />, color: "text-red-700" },
      Maintenance: { variant: "outline", icon: <Car className="h-3 w-3" />, color: "text-gray-600" },
    };

    const config = variants[status] || variants["Offline"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  // ───────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">GPS Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Real-time vehicle monitoring & trip playback
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleOpenReplayDialog}>
            <Play className="h-4 w-4 mr-2" />
            Trip Replay
          </Button>
          <Button onClick={handleExportGPSData}>
            <Download className="h-4 w-4 mr-2" />
            Export GPS Data
          </Button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading GPS data...
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicle, driver, trip..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
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

          {/* Table – Desktop */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle & Driver</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Speed & Status</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gpsLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{log.vehicleNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.driverName || "—"}
                      </div>
                      {log.requestNumber && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Trip: {log.requestNumber}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {log.location.address || "No address"}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatCoordinates(log.location.latitude, log.location.longitude)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        {log.location.speed} km/h
                      </div>
                      {getStatusBadge(log.status)}
                    </TableCell>

                    <TableCell>
                      {log.panicButton && (
                        <Badge variant="destructive">Panic</Badge>
                      )}
                      {log.speedAlerts.isViolation && (
                        <Badge variant="destructive" className="ml-2">
                          Speed violation
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsMapDialogOpen(true)}>
                            <Map className="h-4 w-4 mr-2" />
                            View on Map
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTripHistory(log)}>
                            <Play className="h-4 w-4 mr-2" />
                            Trip History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Prev
              </Button>

              <span className="px-4 text-sm">
                Page {currentPage} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Details Dialog ──────────────────────────────────── */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>GPS Log Details – {selectedLog?.vehicleNumber}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="grid gap-6 py-4">
              {/* Add your detailed content here – similar to previous version */}
              <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Replay Dialog & other dialogs ───────────────────── */}
      {/* ... keep your existing replay, map, export dialogs ... */}
      {/* Just remember to use handleSelectTrip(trip) when user clicks replay */}
    </div>
  );
}