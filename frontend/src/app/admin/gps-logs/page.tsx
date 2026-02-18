"use client";

import React, { useState, useEffect, JSX } from "react";
import {
  Map,
  Play,
  Search,
  MoreHorizontal,
  Eye,
  MapPin,
  Car,
  Clock,
  AlertTriangle,
  Shield,
  Activity,
  Route,
  Pause,
  RotateCcw,
  Navigation2,
} from "lucide-react";
import { toast } from "sonner";
import { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Slider } from "@/components/ui/slider";
import { fetchAPI } from "@/lib/api";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    timestamp: string;
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
  driverName?: string;
  startTime: string;
  endTime: string;
  distance: number;
  durationMinutes: number;
  avgSpeed: number;
  maxSpeed: number;
  startLocation?: string;
  endLocation?: string;
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

interface TripLogApiRow {
  id: string;
  trip_assignment_id?: string | null;
  tripAssignmentId?: string | null;
  trip_number?: string | null;
  tripNumber?: string | null;
  trip_date?: string;
  tripDate?: string;
  driver_name?: string | null;
  driverName?: string | null;
  vehicle_registration?: string | null;
  vehicleRegistration?: string | null;
  planned_distance?: number | null;
  actual_distance?: number | null;
  total_duration?: number | null;
  trip_assignments?: {
    id?: string;
    vehicles?: { registration_number?: string | null };
    drivers?: { first_name?: string | null; last_name?: string | null };
    trip_requests?: { request_number?: string | null };
  } | null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Component
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function GPSLogs() {
  // â”€â”€ GPS Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ UI Dialogs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [selectedLog, setSelectedLog] = useState<GPSLog | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);

  // â”€â”€ Trip Replay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [isReplayDialogOpen, setIsReplayDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripReplayData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentRoutePoint, setCurrentRoutePoint] = useState(0);

  // â”€â”€ Trip History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [isTripHistoryDialogOpen, setIsTripHistoryDialogOpen] = useState(false);
  const [selectedVehicleTrips, setSelectedVehicleTrips] = useState<TripReplayData[]>([]);
  const [replayTrips, setReplayTrips] = useState<TripReplayData[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // â”€â”€ Fetch GPS Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

        const json = await fetchAPI(`/gps-logs?${query}`);

        if (!json.success || !json.data) {
          throw new Error("Invalid API response");
        }

        setGpsLogs(json.data.logs || []);
        setPagination({
          page: json.data.pagination?.page ?? 1,
          limit: json.data.pagination?.limit ?? 10,
          total: json.data.pagination?.total ?? 0,
          totalPages: json.data.pagination?.totalPages ?? 1,
        });
      } catch (err) {
        setError("Failed to load GPS logs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGPSLogs();
  }, [currentPage, pageSize, searchTerm, statusFilter]);

  // â”€â”€ Playback effect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!isPlaying || !selectedTrip?.routePoints?.length) return;

    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        const step = playbackSpeed * 0.5; // adjust speed feel
        const next = prev + step;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, selectedTrip]);

  useEffect(() => {
    if (!selectedTrip?.routePoints?.length) return;
    const index = Math.floor(
      (currentProgress / 100) * (selectedTrip.routePoints.length - 1)
    );
    setCurrentRoutePoint(Math.max(0, Math.min(index, selectedTrip.routePoints.length - 1)));
  }, [currentProgress, selectedTrip]);

  // â”€â”€ Actions Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleViewDetails = (log: GPSLog) => {
    setSelectedLog(log);
    setIsDetailsDialogOpen(true);
  };

  const handleTrackOnMap = (log: GPSLog) => {
    setSelectedLog(log);
    setIsMapDialogOpen(true);
  };

  const mapTripLogToReplay = (trip: TripLogApiRow): TripReplayData | null => {
    const tripAssignmentId =
      trip.trip_assignment_id ||
      trip.tripAssignmentId ||
      trip.trip_assignments?.id ||
      null;
    if (!tripAssignmentId) return null;

    const vehicleNumber =
      trip.vehicle_registration ||
      trip.vehicleRegistration ||
      trip.trip_assignments?.vehicles?.registration_number ||
      null;

    const driverName =
      trip.driver_name ||
      trip.driverName ||
      `${trip.trip_assignments?.drivers?.first_name || ""} ${trip.trip_assignments?.drivers?.last_name || ""}`.trim() ||
      undefined;

    const startTime = (trip.trip_date || trip.tripDate || new Date().toISOString()) as string;
    return {
      tripId: tripAssignmentId,
      requestNumber:
        trip.trip_assignments?.trip_requests?.request_number ||
        trip.trip_number ||
        trip.tripNumber ||
        null,
      vehicleNumber,
      driverName,
      startTime,
      endTime: startTime,
      distance: Number(trip.actual_distance ?? trip.planned_distance ?? 0),
      durationMinutes: Number(trip.total_duration ?? 0),
      avgSpeed: 0,
      maxSpeed: 0,
      routePoints: [],
    };
  };

  const fetchTrips = async (vehicleNumber?: string): Promise<TripReplayData[]> => {
    const query = new URLSearchParams({
      page: "1",
      pageSize: "100",
      ...(vehicleNumber ? { searchTerm: vehicleNumber } : {}),
    }).toString();

    const response = (await fetchAPI(`/trip-logs?${query}`)) as { data?: TripLogApiRow[] };
    const list = Array.isArray(response?.data) ? response.data : [];

    return list
      .map(mapTripLogToReplay)
      .filter((trip): trip is TripReplayData => Boolean(trip))
      .filter((trip) => (vehicleNumber ? trip.vehicleNumber === vehicleNumber : true));
  };

  const handleTripHistory = async (log: GPSLog) => {
    setTripsLoading(true);
    try {
      const trips = await fetchTrips(log.vehicleNumber);
      setSelectedVehicleTrips(trips);
      setSelectedLog(log);
      setIsTripHistoryDialogOpen(true);
      if (!trips.length) toast.info("No real trip history found for this vehicle");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load trip history");
    } finally {
      setTripsLoading(false);
    }
  };

  const handleOpenReplay = async () => {
    setIsReplayDialogOpen(true);
    setSelectedTrip(null);
    setIsPlaying(false);
    setCurrentProgress(0);
    setTripsLoading(true);
    try {
      const trips = await fetchTrips();
      setReplayTrips(trips);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load replay trips");
    } finally {
      setTripsLoading(false);
    }
  };

  const handleSelectTrip = async (trip: TripReplayData) => {
    if (!trip.tripId) {
      toast.error("Trip assignment ID is missing");
      return;
    }

    setTripsLoading(true);
    try {
      const response = (await fetchAPI(`/gps-logs/replay/${trip.tripId}`)) as {
        data?: { replayData?: TripReplayData };
      };
      const replay = response?.data?.replayData;
      if (!replay) {
        toast.error("Replay data not found");
        return;
      }
      setSelectedTrip(replay);
      setCurrentProgress(0);
      setCurrentRoutePoint(0);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load replay data");
    } finally {
      setTripsLoading(false);
    }
  };

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleRestart = () => {
    setCurrentProgress(0);
    setCurrentRoutePoint(0);
    setIsPlaying(false);
  };


  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCoordinates = (lat: number, lng: number) =>
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: VariantProps<typeof badgeVariants>["variant"]; icon: JSX.Element }> = {
      Active: { variant: "default", icon: <Activity className="h-3 w-3" /> },
      Idle: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      Offline: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
      Emergency: { variant: "destructive", icon: <Shield className="h-3 w-3" /> },
      Maintenance: { variant: "outline", icon: <Car className="h-3 w-3" /> },
    };

    const cfg = map[status] || map.Offline;
    return (
      <Badge variant={cfg.variant} className="flex items-center gap-1.5">
        {cfg.icon} {status}
      </Badge>
    );
  };


  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl  tracking-tight">GPS TRACKING</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor vehicles in real-time and replay trips
          </p>
        </div>
        <Button onClick={handleOpenReplay}>
          <Play className="h-4 w-4 mr-2" />
          Trip Replay
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicle / driver / trip..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading / Error / Empty */}
      {loading && <div className="text-center py-12">Loading vehicles...</div>}
      {error && <div className="text-red-600 text-center py-12">{error}</div>}

      {!loading && !error && gpsLogs.length === 0 && (
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
          <p className="text-lg font-medium">No vehicles found</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && gpsLogs.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gpsLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.vehicleNumber}</TableCell>
                  <TableCell>{log.driverName || "â€”"}</TableCell>
                  <TableCell className="text-sm">
                    {log.location.address || "No address"}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatCoordinates(log.location.latitude, log.location.longitude)}
                    </div>
                  </TableCell>
                  <TableCell>{log.location.speed} km/h</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
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
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTrackOnMap(log)}>
                          <Map className="h-4 w-4 mr-2" />
                          Track on Map
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTripHistory(log)}>
                          <Route className="h-4 w-4 mr-2" />
                          Trip History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}â€“
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="px-3 py-2 text-sm">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Details Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Vehicle Details â€“ {selectedLog?.vehicleNumber}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-medium">Driver</div>
                  <div>{selectedLog.driverName || "Unassigned"}</div>
                </div>
                <div>
                  <div className="font-medium">Status</div>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
              </div>
              <div>
                <div className="font-medium">Last Location</div>
                <div className="mt-1">
                  {selectedLog.location.address || "No address available"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCoordinates(selectedLog.location.latitude, selectedLog.location.longitude)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-medium">Speed</div>
                  <div>{selectedLog.location.speed} km/h</div>
                </div>
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div>{formatDate(selectedLog.lastPing)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Map Dialog (placeholder) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Map View â€“ {selectedLog?.vehicleNumber}</DialogTitle>
          </DialogHeader>
          <div className="h-[400px] bg-muted rounded-md flex items-center justify-center">
            <div className="text-center">
              <Map className="h-16 w-16 mx-auto text-blue-400 mb-4" />
              <p className="text-muted-foreground">
                Map would show location at:<br />
                {selectedLog && formatCoordinates(selectedLog.location.latitude, selectedLog.location.longitude)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMapDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Trip Replay Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={isReplayDialogOpen} onOpenChange={setIsReplayDialogOpen}>
        <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation2 className="h-5 w-5" />
              Trip Replay
            </DialogTitle>
            <DialogDescription>
              Select a trip to replay the route
            </DialogDescription>
          </DialogHeader>

          {!selectedTrip ? (
            <div className="py-6">
              {tripsLoading ? (
                <p className="text-center text-muted-foreground py-12">Loading trips...</p>
              ) : replayTrips.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No real trips available for replay.</p>
              ) : (
                <div className="space-y-3">
                  {replayTrips.map((trip) => (
                    <Card
                      key={trip.tripId}
                      className="cursor-pointer hover:border-primary/50 transition"
                      onClick={() => handleSelectTrip(trip)}
                    >
                      <CardContent className="p-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{trip.vehicleNumber || "N/A"} - {trip.requestNumber || "N/A"}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatDate(trip.startTime)} • {trip.distance} km • {trip.durationMinutes} min
                            </div>
                          </div>
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Replay
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Trip Info */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-lg">
                    {selectedTrip.vehicleNumber} â€“ {selectedTrip.requestNumber}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatDate(selectedTrip.startTime)} â†’ {formatDate(selectedTrip.endTime)}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedTrip(null)}>
                  Back to list
                </Button>
              </div>

              {/* Map Placeholder */}
              <div className="h-80 bg-muted rounded-lg flex items-center justify-center relative">
                <div className="text-center">
                  <Map className="h-16 w-16 mx-auto text-blue-400 mb-4" />
                  <p>Route playback area</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Progress: {currentProgress.toFixed(0)}%
                  </p>
                </div>

                {/* Current position indicator */}
                {selectedTrip.routePoints[currentRoutePoint] && (
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs">
                    <div className="font-medium">Current position</div>
                    <div className="text-muted-foreground">
                      {formatCoordinates(
                        selectedTrip.routePoints[currentRoutePoint].latitude,
                        selectedTrip.routePoints[currentRoutePoint].longitude
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                <Button variant="outline" size="icon" onClick={handleRestart}>
                  <RotateCcw className="h-5 w-5" />
                </Button>

                <Button size="lg" className="px-10" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Play
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Speed:</span>
                  {[1, 2, 4].map(speed => (
                    <Button
                      key={speed}
                      variant={playbackSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>

              <Slider
                value={[currentProgress]}
                max={100}
                step={1}
                onValueChange={([val]) => {
                  setCurrentProgress(val);
                  setIsPlaying(false);
                }}
                className="mt-4"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplayDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Trip History Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={isTripHistoryDialogOpen} onOpenChange={setIsTripHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Trip History â€“ {selectedLog?.vehicleNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {tripsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading trip history...</div>
            ) : selectedVehicleTrips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No trip history available for this vehicle
              </div>
            ) : (
              selectedVehicleTrips.map(trip => (
                <Card key={trip.tripId} className="overflow-hidden">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {trip.requestNumber || "Unnamed Trip"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(trip.startTime)} â€“ {formatDate(trip.endTime)}
                      </div>
                      <div className="text-sm mt-1">
                        {trip.distance} km â€¢ Avg {trip.avgSpeed} km/h
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleSelectTrip(trip);
                        setIsTripHistoryDialogOpen(false);
                        setIsReplayDialogOpen(true);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Replay
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTripHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
