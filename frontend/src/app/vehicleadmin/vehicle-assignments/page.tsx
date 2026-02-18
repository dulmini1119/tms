"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Search, Eye, Car, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type TripRow = {
  id: string;
  requestNumber: string;
  employee: string;
  employeePhone: string;
  department: string;
  destination: string;
  fromLocation: string;
  date: string;
  time: string;
  returnTime: string;
  purpose: string;
  status: string;
  priority: string;
  vehicleType: string;
  passengers: number;
  estimatedDistance: string;
  assignedVehicle?: string | null;
  assignedDriver?: string | null;
};

type VehicleRow = {
  id: string;
  make: string;
  model: string;
  licensePlate: string;
  type: string;
  seating: number;
  driver: string;
  driverPhone: string;
  status: string;
  location: string;
  fuelLevel: number;
};

type DriverRow = {
  id: string;
  name: string;
  phone: string;
};

type AssignmentData = {
  trips: TripRow[];
  vehicles: VehicleRow[];
  drivers: DriverRow[];
};

async function fetchPortal(path: string, options?: RequestInit) {
  const primary = await fetch(path, { credentials: "include", ...options });
  const contentType = primary.headers.get("content-type") || "";
  if (primary.ok && contentType.includes("application/json")) {
    return primary;
  }
  return fetch(`http://localhost:3001${path}`, {
    credentials: "include",
    ...options,
  });
}

export default function VehicleAssignments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTrip, setSelectedTrip] = useState<TripRow | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [assignmentRemarks, setAssignmentRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssignmentData>({
    trips: [],
    vehicles: [],
    drivers: [],
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPortal("/portal/vehicle-admin/assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const payload = await res.json();
      setData({
        trips: Array.isArray(payload?.trips) ? payload.trips : [],
        vehicles: Array.isArray(payload?.vehicles) ? payload.vehicles : [],
        drivers: Array.isArray(payload?.drivers) ? payload.drivers : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTrips = useMemo(() => {
    return data.trips.filter((trip) => {
      const matchesSearch =
        trip.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.requestNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || trip.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data.trips, searchTerm, statusFilter]);

  const availableVehicles = data.vehicles.filter(
    (vehicle) => vehicle.status === "available",
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting-vehicle":
        return "destructive";
      case "vehicle-assigned":
        return "default";
      case "completed":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleVehicleAssignment = (trip: TripRow) => {
    setSelectedTrip(trip);
    setSelectedVehicle("");
    setSelectedDriver("");
    setAssignmentRemarks("");
    setIsAssignModalOpen(true);
  };

  const submitVehicleAssignment = async () => {
    if (!selectedTrip || !selectedVehicle || !selectedDriver) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchPortal("/portal/vehicle-admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripRequestId: selectedTrip.id,
          vehicleId: selectedVehicle,
          driverId: selectedDriver,
          assignmentNotes: assignmentRemarks,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to assign vehicle");
      }

      setIsAssignModalOpen(false);
      setSelectedTrip(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Vehicle Assignments</h1>
          <p className="text-muted-foreground">
            Assign vehicles and drivers to approved trips
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="awaiting-vehicle">
                  Awaiting Vehicle
                </SelectItem>
                <SelectItem value="vehicle-assigned">
                  Vehicle Assigned
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trip Assignments</CardTitle>
          <CardDescription>
            {filteredTrips.length} trip(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-sm text-muted-foreground">
              Loading assignments...
            </div>
          )}
          {!loading && error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Trip Details</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Vehicle Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trip.employee}</div>
                        <div className="text-sm text-muted-foreground">
                          {trip.department}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trip.employeePhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trip.destination}</div>
                        <div className="text-sm text-muted-foreground">
                          From: {trip.fromLocation}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trip.purpose}
                        </div>
                        <div className="mt-1 flex gap-1">
                          <Badge
                            variant={getPriorityColor(trip.priority)}
                            className="text-xs"
                          >
                            {trip.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {trip.vehicleType}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {trip.date}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {trip.time} - {trip.returnTime || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Distance: {trip.estimatedDistance}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trip.assignedVehicle ? (
                        <div>
                          <div className="font-medium text-sm">
                            {trip.assignedVehicle}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Driver: {trip.assignedDriver || "N/A"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No vehicle assigned
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(trip.status)}>
                        {trip.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {trip.status === "awaiting-vehicle" && (
                          <Button
                            size="sm"
                            onClick={() => handleVehicleAssignment(trip)}
                            className="gap-1"
                          >
                            <Car className="h-3 w-3" />
                            Assign
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredTrips.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No trips found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Assign Vehicle - {selectedTrip?.requestNumber}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select an available vehicle and driver for this trip
            </DialogDescription>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-4 sm:space-y-6">
              {/* Trip Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Trip Details
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-sm wrap-break-words">
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <strong className="min-w-[90px]">Employee:</strong>
                    <span>
                      {selectedTrip.employee} ({selectedTrip.employeePhone})
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <strong className="min-w-[90px]">Route:</strong>
                    <span>
                      {selectedTrip.fromLocation} → {selectedTrip.destination}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <strong className="min-w-[90px]">Date & Time:</strong>
                    <span>
                      {selectedTrip.date} at {selectedTrip.time}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <strong className="min-w-[90px]">Purpose:</strong>
                    <span>{selectedTrip.purpose}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Select */}
              <div className="w-full">
                <label className="text-sm font-medium">Select Vehicle</label>

                <Select
                  value={selectedVehicle}
                  onValueChange={setSelectedVehicle}
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Choose an available vehicle" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Driver Select */}
              <div className="w-full">
                <label className="text-sm font-medium">Select Driver</label>

                <Select
                  value={selectedDriver}
                  onValueChange={setSelectedDriver}
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>

                  <SelectContent>
                    {!data.drivers.length && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No drivers available
                      </div>
                    )}

                    {data.drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name || "Unnamed Driver"} (
                        {driver.phone || "N/A"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remarks */}
              <div className="w-full">
                <label className="text-sm font-medium">
                  Assignment Remarks
                </label>

                <Textarea
                  value={assignmentRemarks}
                  onChange={(e) => setAssignmentRemarks(e.target.value)}
                  placeholder="Any special instructions..."
                  className="mt-1 w-full min-h-20 sm:min-h-[100px]"
                />
              </div>

              {/* Buttons */}
              <div className="w-full sm:w-auto flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-full"
                >
                  Cancel
                </Button>

                <Button
                  onClick={submitVehicleAssignment}
                  className="w-full gap-2"
                  disabled={!selectedVehicle || !selectedDriver || submitting}
                >
                  <CheckCircle className="h-4 w-4" />

                  {submitting ? "Assigning..." : "Assign Vehicle"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
