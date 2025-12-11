"use client";
import React, { useEffect, useState } from "react";
import {
  Users,
  Car,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Navigation,
  MapPin,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { TripAssignment, TripRequest } from "@/types/trip-interfaces";
import { mockTripData } from "@/data/mock-trip-data";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import { parse, isValid, isAfter } from "date-fns";
//import Image from "next/image";

export default function TripAssignments() {
  const VALID_ASSIGNMENT_STATUSES = [
    "Assigned",
    "Accepted",
    "Rejected",
    "Started",
    "Completed",
    "Cancelled",
  ] as const;

  type AssignmentStatus = (typeof VALID_ASSIGNMENT_STATUSES)[number];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<TripAssignment | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Edit Assignment Form State
  const [editVehicleId, setEditVehicleId] = useState<string>("");
  const [editDriverId, setEditDriverId] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editInsuranceExpiry, setEditInsuranceExpiry] = useState<string>("");
  const [editMileage, setEditMileage] = useState<string>("");
  const [editLastService, setEditLastService] = useState<string>("");
  const [editNextService, setEditNextService] = useState<string>("");
  const [editSeatingCapacity, setEditSeatingCapacity] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editCurrentDriver, setEditCurrentDriver] = useState<string>("");
  const [editDriverLicenseExpiry, setEditDriverLicenseExpiry] =
    useState<string>("");
  const [editDepartureDate, setEditDepartureDate] = useState<string>("");
  const [editDepartureTime, setEditDepartureTime] = useState<string>("");
  const [editReturnDate, setEditReturnDate] = useState<string>("");
  const [editReturnTime, setEditReturnTime] = useState<string>("");
  const [editVehicleType, setEditVehicleType] = useState<string>("");
  const [editPassengerCount, setEditPassengerCount] = useState<string>("");
  //const [editAssignmentStatus, setEditAssignmentStatus] = useState<string>("");
  const [editAssignmentStatus, setEditAssignmentStatus] =
    useState<AssignmentStatus>("Assigned");
  const [editIsRoundTrip, setEditIsRoundTrip] = useState<boolean>(false);
  const [editEstimatedDistance, setEditEstimatedDistance] =
    useState<string>("");
  const [editEstimatedDuration, setEditEstimatedDuration] =
    useState<string>("");

  const [tripAssignments, setTripAssignments] = useState(
    mockTripData.assignments
  );

  const [selectedPreTrip, setSelectedPreTrip] = useState<
    TripAssignment["preTrip"] | null
  >(null);
  const [isPreTripDialogOpen, setIsPreTripDialogOpen] = useState(false);

  const tripRequests = mockTripData.requests;
  const requestMap = new Map(tripRequests.map((req) => [req.id, req]));

  const handleViewDetails = (assignment: TripAssignment) => {
    try {
      const request = requestMap.get(assignment.tripRequestId);
      if (!request) {
        toast.error(
          `No request found for tripRequestId: ${assignment.tripRequestId}`
        );
        return;
      }
      setSelectedAssignment(assignment);
      setSelectedRequest(request);
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error in handleViewDetails:", error);
      toast.error("Error in handleViewDetails:");
    }
  };

  const handleEditAssignment = (assignment: TripAssignment) => {
    try {
      const request = requestMap.get(assignment.tripRequestId);
      if (!request) {
        toast.error(
          `No request found for tripRequestId: ${assignment.tripRequestId}`
        );
        return;
      }

      // 🔹 Get the latest vehicle and driver from mockTripData
      const latestVehicle = mockTripData.vehicles.find(
        (v) => v.id === assignment.assignedVehicle.id
      );
      const latestDriver = mockTripData.drivers.find(
        (d) => d.id === assignment.assignedDriver.id
      );

      if (!latestVehicle || !latestDriver) {
        toast.error("Vehicle or driver data not found");
        return;
      }

      const today = new Date();
      const defaultInsuranceExpiry = new Date(
        today.setFullYear(today.getFullYear() + 1)
      )
        .toISOString()
        .split("T")[0]; // Default to 1 year from now

      setSelectedAssignment(assignment);
      setSelectedRequest(request);

      // Use latest vehicle & driver to populate edit form
      setEditVehicleId(latestVehicle.id.toString());
      setEditDriverId(latestDriver.id);
      setEditNotes(assignment.assignmentNotes || "");
      setEditInsuranceExpiry(
        latestVehicle.insuranceExpiry &&
          !isNaN(new Date(latestVehicle.insuranceExpiry).getTime())
          ? latestVehicle.insuranceExpiry
          : defaultInsuranceExpiry
      );
      setEditMileage(latestVehicle.mileage.toString());
      setEditLastService(latestVehicle.lastService);
      setEditNextService(latestVehicle.nextService);
      setEditSeatingCapacity(latestVehicle.seatingCapacity.toString());
      setEditStatus(latestVehicle.status);
      setEditCurrentDriver(latestDriver.name);
      setEditDriverLicenseExpiry(latestDriver.licenseExpiryDate);

      setEditDepartureDate(request.tripDetails.departureDate);
      setEditDepartureTime(request.tripDetails.departureTime);
      setEditReturnDate(request.tripDetails.returnDate || "");
      setEditReturnTime(request.tripDetails.returnTime || "");
      setEditVehicleType(request.requirements.vehicleType);
      setEditPassengerCount(request.requirements.passengerCount.toString());
      setEditAssignmentStatus(assignment.assignmentStatus);
      setEditIsRoundTrip(request.tripDetails.isRoundTrip);
      setEditEstimatedDistance(
        request.tripDetails.estimatedDistance.toString()
      );
      setEditEstimatedDuration(
        request.tripDetails.estimatedDuration.toString()
      );

      setIsAssignDialogOpen(true);
    } catch (error) {
      console.error("Error in handleViewDetails:", error);
      toast.error("Error in handleEditAssignment:");
    }
  };

  const handleUpdateAssignment = () => {
    if (
      !selectedAssignment ||
      !selectedRequest ||
      !editVehicleId ||
      !editDriverId
    ) {
      toast.error("Missing required data for updating assignment");
      return;
    }

    try {
      const selectedVehicle = mockTripData.vehicles.find(
        (v) => v.id === parseInt(editVehicleId)
      );
      const selectedDriver = mockTripData.drivers.find(
        (d) => d.id === editDriverId
      );

      if (!selectedVehicle || !selectedDriver) {
        toast.error("Selected vehicle or driver not found");
        return;
      }

      if (!selectedDriver.isAvailable) {
        toast.error("Selected driver is not available");
        return;
      }

      // Convert string inputs to numbers
      const mileage = parseFloat(editMileage);
      const seatingCapacity = parseInt(editSeatingCapacity);
      const passengerCount = parseInt(editPassengerCount);
      const estimatedDistance = parseFloat(editEstimatedDistance);
      const estimatedDuration = parseFloat(editEstimatedDuration);

      // Validate required numbers
      if (isNaN(mileage) || mileage < 0) {
        toast.error("Invalid mileage");
        return;
      }
      if (isNaN(seatingCapacity) || seatingCapacity < 1) {
        toast.error("Invalid seating capacity");
        return;
      }
      if (passengerCount > seatingCapacity) {
        toast.error("Passenger count exceeds seating capacity");
        return;
      }
      if (isNaN(estimatedDistance) || estimatedDistance <= 0) {
        toast.error("Invalid estimated distance");
        return;
      }
      if (isNaN(estimatedDuration) || estimatedDuration <= 0) {
        toast.error("Invalid estimated duration");
        return;
      }

      // Dates
      const scheduledDeparture = parse(
        `${editDepartureDate}T${editDepartureTime}:00Z`,
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
        new Date()
      );
      const scheduledReturn =
        editReturnDate && editReturnTime
          ? parse(
              `${editReturnDate}T${editReturnTime}:00Z`,
              "yyyy-MM-dd'T'HH:mm:ss'Z'",
              new Date()
            )
          : undefined;

      if (
        !isValid(scheduledDeparture) ||
        !isAfter(scheduledDeparture, new Date())
      ) {
        toast.error("Scheduled departure must be a valid future date");
        return;
      }
      if (
        scheduledReturn &&
        (!isValid(scheduledReturn) ||
          !isAfter(scheduledReturn, scheduledDeparture))
      ) {
        toast.error("Scheduled return must be after departure");
        return;
      }

      // Update vehicle in mock data
      const updatedVehicles = mockTripData.vehicles.map((v) =>
        v.id === selectedVehicle.id
          ? {
              ...v,
              mileage,
              seatingCapacity,
              insuranceExpiry: editInsuranceExpiry,
              lastService: editLastService,
              nextService: editNextService,
              status: editStatus,
              currentDriver: selectedDriver.name,
            }
          : v
      );
      mockTripData.vehicles = updatedVehicles;

      // Update driver in mock data
      const updatedDrivers = mockTripData.drivers.map((d) =>
        d.id === selectedDriver.id
          ? { ...d, licenseExpiryDate: editDriverLicenseExpiry }
          : d
      );
      mockTripData.drivers = updatedDrivers;

      // Update assignment
      const updatedAssignment: TripAssignment = {
        ...selectedAssignment,
        assignedVehicle: {
          ...selectedVehicle,
          mileage,
          seatingCapacity,
          insuranceExpiry: editInsuranceExpiry,
          lastService: editLastService,
          nextService: editNextService,
          status: editStatus,
          currentDriver: selectedDriver.name,
        },
        assignedDriver: {
          ...selectedDriver,
          licenseExpiryDate: editDriverLicenseExpiry,
        },
        assignmentNotes: editNotes,
        scheduledDeparture: scheduledDeparture.toISOString(),
        scheduledReturn: scheduledReturn
          ? scheduledReturn.toISOString()
          : undefined,
        assignmentStatus: editAssignmentStatus,
        updatedAt: new Date().toISOString(),
      };

      // Update state
      setTripAssignments((prev) =>
        prev.map((a) => (a.id === updatedAssignment.id ? updatedAssignment : a))
      );

      // Reset form
      setIsAssignDialogOpen(false);
      setEditVehicleId("");
      setEditDriverId("");
      setEditNotes("");
      setEditMileage("");
      setEditSeatingCapacity("");
      setEditInsuranceExpiry("");
      setEditLastService("");
      setEditNextService("");
      setEditStatus("");
      setEditCurrentDriver("");
      setEditDriverLicenseExpiry("");
      setEditDepartureDate("");
      setEditDepartureTime("");
      setEditReturnDate("");
      setEditReturnTime("");
      setEditVehicleType("");
      setEditPassengerCount("");
      setEditAssignmentStatus("Assigned");
      setEditIsRoundTrip(false);
      setEditEstimatedDistance("");
      setEditEstimatedDuration("");
      setSelectedAssignment(null);
      setSelectedRequest(null);

      toast.success("Assignment updated successfully!");
    } catch (error) {
      console.error("Error in handleUpdateAssignment:", error);
      toast.error("Error in handleUpdateAssignment");
    }
  };

  const filteredAssignments = tripAssignments.filter((assignment) => {
    const request = requestMap.get(assignment.tripRequestId);
    if (!request) return false;

    return (
      (assignment.requestNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
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
        assignment.assignmentStatus.toLowerCase().replace(" ", "-") ===
          statusFilter)
    );
  });

  const stats = {
    assigned: tripAssignments.filter((a) => a.assignmentStatus === "Assigned")
      .length,
    accepted: tripAssignments.filter((a) => a.assignmentStatus === "Accepted")
      .length,
    started: tripAssignments.filter((a) => a.assignmentStatus === "Started")
      .length,
    completed: tripAssignments.filter((a) => a.assignmentStatus === "Completed")
      .length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
      }
    > = {
      Assigned: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      Accepted: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Rejected: {
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" />,
      },
      Started: { variant: "default", icon: <Navigation className="h-3 w-3" /> },
      Completed: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Cancelled: { variant: "outline", icon: <XCircle className="h-3 w-3" /> },
    };
    const config = variants[status] || variants["Assigned"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredAssignments.length / pageSize) : 1;
  const paginatedDocuments = filteredAssignments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // const handleVehicleChange = (vehicleId: string) => {
  //   const vehicle = mockTripData.vehicles.find(
  //     (v) => v.id === parseInt(vehicleId)
  //   );
  //   if (!vehicle) {
  //     toast.error("Selected vehicle not found");
  //     return;
  //   }

  //   // Update form state with vehicle details
  //   setEditVehicleId(vehicleId);
  //   setEditMileage(vehicle.mileage.toString());
  //   setEditSeatingCapacity(vehicle.seatingCapacity.toString());
  //   setEditInsuranceExpiry(vehicle.insuranceExpiry || "");
  //   setEditLastService(vehicle.lastService);
  //   setEditNextService(vehicle.nextService);
  //   setEditStatus(vehicle.status);
  //   setEditCurrentDriver(vehicle.currentDriver || "");
  // };

  const handlePreTripChecklist = (assignment: TripAssignment) => {
    setSelectedPreTrip(assignment.preTrip || null);
    setIsPreTripDialogOpen(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3">
        <div>
          <h1 className="text-2xl">TRIP ASSIGNMENTS</h1>
          <p className="text-muted-foreground text-xs">
            Assign vehicles and drivers to approved trips
          </p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Auto Assign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.assigned}</div>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.accepted}</div>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.started}</div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Assignments</CardTitle>
          <CardDescription>
            Vehicle and driver assignments for approved trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
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
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="started">Started</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip Details</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pre-Trip</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((assignment) => {
                  const request = requestMap.get(assignment.tripRequestId);
                  if (!request) return null;

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {assignment.requestNumber}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {request.requestedBy.name}
                          </div>
                        </div>
                      </TableCell>

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
                          <div className="font-medium flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {assignment.assignedVehicle.currentDriver}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            License: {assignment.assignedDriver.licenseNumber}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Scheduled:{" "}
                            {formatDate(assignment.scheduledDeparture)}
                          </div>
                          {assignment.scheduledReturn && (
                            <div className="text-sm text-muted-foreground">
                              Return: {formatDate(assignment.scheduledReturn)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(assignment.assignmentStatus)}
                        {assignment.driverAcceptance && (
                          <div className="text-xs text-green-600 mt-1">
                            Driver {assignment.driverAcceptance.accepted}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {assignment.preTrip &&
                        assignment.preTrip.completedAt ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" /> Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" /> Pending
                          </Badge>
                        )}
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
                              onClick={() => handleViewDetails(assignment)}
                            >
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditAssignment(assignment)}
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit Assignment
                            </DropdownMenuItem>
                            {assignment.assignmentStatus === "Assigned" && (
                              <>
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2" />{" "}
                                  Accept Assignment
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <XCircle className="h-4 w-4 mr-2" /> Reject
                                  Assignment
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handlePreTripChecklist(assignment)}
                            >
                              <FileText className="h-4 w-4 mr-2" /> Pre-Trip
                              Checklist
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

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {paginatedDocuments.map((assignment) => {
              const request = requestMap.get(assignment.tripRequestId);
              if (!request) return null;

              return (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">
                      {assignment.requestNumber}
                    </div>
                    <div>
                      {assignment.assignmentStatus &&
                        getStatusBadge(assignment.assignmentStatus)}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />{" "}
                      {request.requestedBy.name}
                    </div>
                    <div className="font-medium flex items-center">
                      <Car className="h-4 w-4 mr-1" />{" "}
                      {assignment.assignedVehicle.registrationNo}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {assignment.assignedVehicle.make}{" "}
                      {assignment.assignedVehicle.model}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />{" "}
                      {assignment.assignedVehicle.currentDriver}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      License: {assignment.assignedDriver.licenseNumber}
                    </div>

                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" /> Scheduled:{" "}
                      {formatDate(assignment.scheduledDeparture)}
                    </div>
                    {assignment.scheduledReturn && (
                      <div className="text-sm text-muted-foreground">
                        Return: {formatDate(assignment.scheduledReturn)}
                      </div>
                    )}

                    <div>
                      <span className="font-medium">Pre-Trip:</span>{" "}
                      {assignment.preTrip && assignment.preTrip.completedAt ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </div>

                    {assignment.driverAcceptance && (
                      <div className="text-xs text-green-600 mt-1">
                        Driver {assignment.driverAcceptance.accepted}
                      </div>
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
                          onClick={() => handleViewDetails(assignment)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditAssignment(assignment)}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit Assignment
                        </DropdownMenuItem>
                        {assignment.assignmentStatus === "Assigned" && (
                          <>
                            <DropdownMenuItem>
                              <CheckCircle className="h-4 w-4 mr-2" /> Accept
                              Assignment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                              Assignment
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handlePreTripChecklist(assignment)}
                        >
                          <FileText className="h-4 w-4 mr-2" /> Pre-Trip
                          Checklist
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
                of {filteredAssignments.length} documents
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

      {/* Assignment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="w-[92vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl backdrop-blur-md transition-colors duration-300">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground">
              Assignment Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedRequest && selectedAssignment && (
                <>
                  Assignment for{" "}
                  <span className="font-medium text-primary">
                    {selectedAssignment.requestNumber}
                  </span>{" "}
                  — {selectedRequest.requestedBy.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-6">
            {selectedAssignment && selectedRequest && (
              <>
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-primary">
                    <MapPin className="w-5 h-5 text-primary" /> Trip Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">
                        Departure:
                      </span>{" "}
                      {selectedRequest.tripDetails.departureDate} at{" "}
                      {selectedRequest.tripDetails.departureTime}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Passengers:
                      </span>{" "}
                      {selectedRequest.requirements.passengerCount}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Round Trip:
                      </span>{" "}
                      {selectedRequest.tripDetails.isRoundTrip ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Estimated Distance:
                      </span>{" "}
                      {selectedRequest.tripDetails.estimatedDistance} km
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Estimated Duration:
                      </span>{" "}
                      {Math.floor(
                        selectedRequest.tripDetails.estimatedDuration / 60
                      )}
                      h {selectedRequest.tripDetails.estimatedDuration % 60}m
                    </div>
                    {selectedRequest.tripDetails.returnDate && (
                      <div>
                        <span className="font-medium text-foreground">
                          Return:
                        </span>{" "}
                        {selectedRequest.tripDetails.returnDate} at{" "}
                        {selectedRequest.tripDetails.returnTime}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium text-foreground">Route:</span>{" "}
                    {selectedRequest.tripDetails.fromLocation.address} →{" "}
                    {selectedRequest.tripDetails.toLocation.address}
                  </div>
                </section>
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-primary">
                    <Car className="w-5 h-5 text-primary" /> Assigned Vehicle
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">
                        Vehicle:
                      </span>{" "}
                      {selectedAssignment.assignedVehicle.registrationNo}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Model:
                      </span>{" "}
                      {selectedAssignment.assignedVehicle.make}{" "}
                      {selectedAssignment.assignedVehicle.model}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Type:</span>{" "}
                      {selectedAssignment.assignedVehicle.type}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">Fuel:</span>{" "}
                      {selectedAssignment.assignedVehicle.fuelType}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        Mileage:
                      </span>{" "}
                      {selectedAssignment.assignedVehicle.mileage} km
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        Last Service:
                      </span>{" "}
                      {selectedAssignment.assignedVehicle.lastService}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        Next Service:
                      </span>{" "}
                      {selectedAssignment.assignedVehicle.nextService}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        Seating Capacity:
                      </span>{" "}
                      {selectedAssignment.assignedVehicle.seatingCapacity}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        Status:
                      </span>{" "}
                      {selectedAssignment.assignedVehicle.status}
                    </div>
                  </div>
                </section>
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-primary">
                    <User className="w-5 h-5 text-primary" /> Assigned Driver
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Name:</span>{" "}
                      {selectedAssignment.assignedVehicle.currentDriver}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        Phone:
                      </span>{" "}
                      {selectedAssignment.assignedDriver.phoneNumber}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        License:
                      </span>{" "}
                      {selectedAssignment.assignedDriver.licenseNumber}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        License Expiry:
                      </span>{" "}
                      {selectedAssignment.assignedDriver.licenseExpiryDate}
                    </div>
                  </div>
                </section>
                {selectedAssignment.preTrip?.completedAt && (
                  <section className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-primary">
                      <ClipboardCheck className="w-5 h-5 text-primary" />{" "}
                      Pre-Trip Checklist
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          Fuel Level:
                        </span>{" "}
                        {selectedAssignment.preTrip.checklist.fuelLevel}%
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Vehicle Condition:
                        </span>{" "}
                        {selectedAssignment.preTrip.checklist.vehicleCondition}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">
                          Documents:
                        </span>
                        {selectedAssignment.preTrip.checklist
                          .documentsVerified ? (
                          <span className="flex items-center gap-1 text-green-500 font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-medium">
                            ✗ Not Verified
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Emergency Kit:
                        </span>{" "}
                        {selectedAssignment.preTrip.checklist
                          .emergencyKitPresent ? (
                          <span className="text-green-500 font-medium">
                            ✓ Present
                          </span>
                        ) : (
                          <span className="text-red-500 font-medium">
                            ✗ Missing
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          GPS:
                        </span>{" "}
                        {selectedAssignment.preTrip.checklist.gpsWorking ? (
                          <span className="text-green-500 font-medium">
                            ✓ Working
                          </span>
                        ) : (
                          <span className="text-red-500 font-medium">
                            ✗ Not Working
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Completed By:
                        </span>{" "}
                        {selectedAssignment.preTrip.completedBy}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium text-foreground">
                        Completed At:
                      </span>{" "}
                      {formatDate(selectedAssignment.preTrip.completedAt)}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
          <DialogFooter className="mt-4 border-t border-border pt-4">
            <Button
              onClick={() => setIsDetailsDialogOpen(false)}
              variant="secondary"
              className="px-6 py-2 text-sm font-medium rounded-lg hover:bg-muted transition"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="w-[92vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl backdrop-blur-md transition-colors duration-300">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground">
              Edit Assignment (Super Admin)
            </DialogTitle>
            <DialogDescription>
              Modify all assignment, vehicle, driver, and trip details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Assignment Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select
                    value={editVehicleId}
                    onValueChange={(vehicleId) => {
                      setEditVehicleId(vehicleId); // Update selected vehicle ID

                      // Find the selected vehicle in your mock data
                      const vehicle = mockTripData.vehicles.find(
                        (v) => v.id === parseInt(vehicleId)
                      );
                      if (!vehicle) return;

                      // Update all related fields
                      setEditMileage(vehicle.mileage.toString());
                      setEditSeatingCapacity(
                        vehicle.seatingCapacity.toString()
                      );
                      setEditInsuranceExpiry(vehicle.insuranceExpiry || "");
                      setEditLastService(vehicle.lastService);
                      setEditNextService(vehicle.nextService);
                      setEditStatus(vehicle.status);
                      setEditCurrentDriver(vehicle.currentDriver || "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTripData.vehicles
                        .filter((vehicle) => vehicle.status === "Available")
                        .map((vehicle) => (
                          <SelectItem
                            key={vehicle.id}
                            value={vehicle.id.toString()}
                          >
                            {vehicle.registrationNo} - {vehicle.make}{" "}
                            {vehicle.model}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Driver</Label>
                  <Select
                    value={editDriverId}
                    onValueChange={(value) => {
                      setEditDriverId(value);
                      const selectedDriver = mockTripData.drivers.find(
                        (d) => d.id === value
                      );
                      if (selectedDriver) {
                        setEditCurrentDriver(selectedDriver.name);
                        setEditDriverLicenseExpiry(
                          selectedDriver.licenseExpiryDate
                        );
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTripData.drivers
                        .filter((driver) => driver.isAvailable)
                        .map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name} - {driver.phoneNumber}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assignment Status</Label>
                <Select
                  value={editAssignmentStatus}
                  onValueChange={(value: AssignmentStatus) =>
                    setEditAssignmentStatus(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_ASSIGNMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignment Notes</Label>
                <Textarea
                  placeholder="Add any special instructions or notes..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Vehicle Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Insurance Expiry Date</Label>
                  <Input
                    type="date"
                    value={editInsuranceExpiry}
                    onChange={(e) => setEditInsuranceExpiry(e.target.value)}
                    min={new Date().toISOString().split("T")[0]} // Prevent past dates
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mileage (km)</Label>
                  <Input
                    type="number"
                    value={editMileage}
                    onChange={(e) => setEditMileage(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Service Date</Label>
                  <Input
                    type="date"
                    value={editLastService}
                    onChange={(e) => setEditLastService(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Service Date</Label>
                  <Input
                    type="date"
                    value={editNextService}
                    onChange={(e) => setEditNextService(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seating Capacity</Label>
                  <Input
                    type="number"
                    value={editSeatingCapacity}
                    onChange={(e) => setEditSeatingCapacity(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Available",
                        "On Trip",
                        "Under Repair",
                        "Maintenance",
                      ].map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Current Driver</Label>
                  <Input value={editCurrentDriver} readOnly disabled />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Driver Details</h4>
              <div className="space-y-2">
                <Label>License Expiry Date</Label>
                <Input
                  type="date"
                  value={editDriverLicenseExpiry}
                  onChange={(e) => setEditDriverLicenseExpiry(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Trip Schedule</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scheduled Departure Date</Label>
                  <Input
                    type="date"
                    value={editDepartureDate}
                    onChange={(e) => setEditDepartureDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scheduled Departure Time</Label>
                  <Input
                    type="time"
                    value={editDepartureTime}
                    onChange={(e) => setEditDepartureTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scheduled Return Date (Optional)</Label>
                  <Input
                    type="date"
                    value={editReturnDate}
                    onChange={(e) => setEditReturnDate(e.target.value)}
                    disabled={!editIsRoundTrip}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scheduled Return Time (Optional)</Label>
                  <Input
                    type="time"
                    value={editReturnTime}
                    onChange={(e) => setEditReturnTime(e.target.value)}
                    disabled={!editIsRoundTrip}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Round Trip</Label>
                  <input
                    type="checkbox"
                    checked={editIsRoundTrip}
                    onChange={(e) => setEditIsRoundTrip(e.target.checked)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Trip Requirements</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select
                    value={editVehicleType}
                    onValueChange={setEditVehicleType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Sedan", "SUV", "Hatchback", "Van", "Truck"].map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Passenger Count</Label>
                  <Input
                    type="number"
                    value={editPassengerCount}
                    onChange={(e) => setEditPassengerCount(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Distance (km)</Label>
                  <Input
                    type="number"
                    value={editEstimatedDistance}
                    onChange={(e) => setEditEstimatedDistance(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={editEstimatedDuration}
                    onChange={(e) => setEditEstimatedDuration(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setEditVehicleId("");
                setEditDriverId("");
                setEditNotes("");
                setEditInsuranceExpiry("");
                setEditMileage("");
                setEditLastService("");
                setEditNextService("");
                setEditSeatingCapacity("");
                setEditStatus("");
                setEditCurrentDriver("");
                setEditDriverLicenseExpiry("");
                setEditDepartureDate("");
                setEditDepartureTime("");
                setEditReturnDate("");
                setEditReturnTime("");
                setEditVehicleType("");
                setEditPassengerCount("");
                setEditAssignmentStatus("Assigned");
                setEditIsRoundTrip(false);
                setEditEstimatedDistance("");
                setEditEstimatedDuration("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateAssignment}>Update Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pre Trip Checklist */}
      <Dialog open={isPreTripDialogOpen} onOpenChange={setIsPreTripDialogOpen}>
        <DialogContent className="w-[90vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card text-foreground shadow-2xl backdrop-blur-md transition-colors duration-300">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Pre-Trip Checklist
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedPreTrip
                ? `Completed by: ${selectedPreTrip.completedBy || "N/A"}`
                : "No checklist available."}
            </DialogDescription>
          </DialogHeader>

          {selectedPreTrip ? (
            <div className="space-y-4 py-4">
              {/* Fuel Level */}
              <div className="p-3 rounded-lg border border-border bg-background shadow-sm flex justify-between items-center transition hover:shadow-md">
                <span className="font-medium">Fuel Level</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedPreTrip.checklist.fuelLevel}%
                </span>
              </div>

              {/* Vehicle Condition */}
              <div className="p-3 rounded-lg border border-border bg-background shadow-sm flex justify-between items-center transition hover:shadow-md">
                <span className="font-medium">Vehicle Condition</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedPreTrip.checklist.vehicleCondition}
                </span>
              </div>

              {/* Documents Verified */}
              <div className="p-3 rounded-lg border border-border bg-background shadow-sm flex justify-between items-center transition hover:shadow-md">
                <span className="font-medium">Documents Verified</span>
                <span
                  className={`text-sm font-medium ${
                    selectedPreTrip.checklist.documentsVerified
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {selectedPreTrip.checklist.documentsVerified ? "Yes" : "No"}
                </span>
              </div>

              {/* Emergency Kit */}
              <div className="p-3 rounded-lg border border-border bg-background shadow-sm flex justify-between items-center transition hover:shadow-md">
                <span className="font-medium">Emergency Kit Present</span>
                <span
                  className={`text-sm font-medium ${
                    selectedPreTrip.checklist.emergencyKitPresent
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {selectedPreTrip.checklist.emergencyKitPresent ? "Yes" : "No"}
                </span>
              </div>

              {/* GPS */}
              <div className="p-3 rounded-lg border border-border bg-background shadow-sm flex justify-between items-center transition hover:shadow-md">
                <span className="font-medium">GPS Working</span>
                <span
                  className={`text-sm font-medium ${
                    selectedPreTrip.checklist.gpsWorking
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {selectedPreTrip.checklist.gpsWorking ? "Yes" : "No"}
                </span>
              </div>

              {/* Photos */}
              {selectedPreTrip.photos && selectedPreTrip.photos.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-foreground">Photos</span>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {/* {selectedPreTrip.photos.map((url, idx) => (
                      <Image
                        key={idx}
                        src={url}
                        alt={`Pre-trip ${idx}`}
                        width={20}
                        height={20}
                        className="object-cover rounded-lg border border-border shadow-sm"
                      />
                    ))} */}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No checklist available for this assignment.
            </div>
          )}

          <DialogFooter className="mt-4 border-t border-border pt-4 flex justify-end">
            <Button
              onClick={() => setIsPreTripDialogOpen(false)}
              variant="secondary"
              className="px-6 py-2 rounded-lg hover:bg-muted transition"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
