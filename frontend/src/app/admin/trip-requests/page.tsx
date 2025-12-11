"use client";
import React, { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  User,
  Building2,
  Eye,
} from "lucide-react";
import { Priority, TripRequest, TripStatus } from "@/types/trip-interfaces";
import { mockTripRequests } from "@/data/mock-trip-data";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const departments = ["Sales", "Marketing", "IT", "Finance", "Operations", "HR"];
const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];
const statusTypes: TripStatus[] = [
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
  "Assigned",
  "In Progress",
  "Completed",
];

export default function TripRequests() {
  const [tripRequests, setTripRequests] =
    useState<TripRequest[]>(mockTripRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [departmentFilter, setDepartmentFilter] = useState("all-departments");
  const [priorityFilter, setPriorityFilter] = useState("all-priorities");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TripRequest | null>(
    null
  );
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Full form state
  const [form, setForm] = useState<Partial<TripRequest>>({
    requestedBy: {
      id: "",
      name: "",
      email: "",
      department: "",
      employeeId: "",
      phoneNumber: "",
      designation: "",
      managerName: "",
      costCenter: "",
    },

    tripDetails: {
      fromLocation: { address: "" },
      toLocation: { address: "" },
      departureDate: "",
      departureTime: "",
      returnDate: "",
      returnTime: "",
      isRoundTrip: false,
      estimatedDistance: 0,
      estimatedDuration: 0,
      //tripType: "",
    },
    purpose: {
      category: "Business Meeting",
      description: "",
      projectCode: "",
      costCenter: "",
      businessJustification: "",
    },
    requirements: {
      vehicleType: "Any",
      passengerCount: 1,
      luggage: "Light",
      acRequired: true,
      //driverRequired: true,
      specialRequirements: "",
      //specialInstructions: "",
      //luggageRequirements: "",
    },
    priority: "Medium",
    estimatedCost: 0,
    currency: "LKR",
    status: "Pending",
    passengers: [],
    approvalWorkflow: [],
    attachments: [],
    auditTrail: [],
    costBreakdown: undefined,
    billing: undefined,
    id: "",
    requestNumber: "",
    createdAt: "",
    updatedAt: "",
    approvalRequired: true,
  });

  // Date formatter (consistent across server/client)
  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const formatDate = useMemo(() => {
    return (s?: string) => (s ? dateFormatter.format(new Date(s)) : "N/A");
  }, [dateFormatter]);

  // Filter logic
  const filteredRequests = tripRequests.filter((request) => {
    const matchesSearch =
      request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.tripDetails.fromLocation.address
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.tripDetails.toLocation.address
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all-status" || request.status === statusFilter;
    const matchesDepartment =
      departmentFilter === "all-departments" ||
      request.requestedBy.department === departmentFilter;
    const matchesPriority =
      priorityFilter === "all-priorities" ||
      request.priority === priorityFilter;

    return (
      matchesSearch && matchesStatus && matchesDepartment && matchesPriority
    );
  });

  // Pagination
  const totalPages =
    pageSize > 0 ? Math.ceil(filteredRequests.length / pageSize) : 1;
  const paginatedDocuments = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, priorityFilter]);

  // Badge variants
  const getStatusBadgeVariant = (status: TripStatus) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      case "Cancelled":
        return "destructive";
      case "Assigned":
        return "secondary";
      case "In Progress":
        return "secondary";
      case "Completed":
        return "default";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case "Urgent":
        return "destructive";
      case "High":
        return "secondary";
      case "Medium":
        return "outline";
      default:
        return "outline";
    }
  };

  // Handlers
  const handleViewDetails = (request: TripRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (request: TripRequest) => {
    setEditingRequest(request);
    setForm({
      ...request,
      requestedBy: { ...request.requestedBy },
      tripDetails: {
        ...request.tripDetails,
        fromLocation: { ...request.tripDetails.fromLocation },
        toLocation: { ...request.tripDetails.toLocation },
      },
      purpose: { ...request.purpose },
      requirements: { ...request.requirements },
      passengers: request.passengers ? [...request.passengers] : [],
      approvalWorkflow: request.approvalWorkflow
        ? [...request.approvalWorkflow]
        : [],
      attachments: request.attachments ? [...request.attachments] : [],
      auditTrail: request.auditTrail ? [...request.auditTrail] : [],
      costBreakdown: request.costBreakdown
        ? { ...request.costBreakdown }
        : undefined,
      billing: request.billing ? { ...request.billing } : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (doc: TripRequest) => {
    const from = doc.tripDetails.fromLocation.address.split(",")[0];
    const to = doc.tripDetails.toLocation.address.split(",")[0];

    if (window.confirm(`Delete #${doc.requestNumber}?\n${from} to ${to}`)) {
      setTripRequests((prev) => prev.filter((d) => d.id !== doc.id));

      const toastId = toast.success(
        <div className="flex items-center gap-4 w-full">
          <span>Deleted #{doc.requestNumber}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTripRequests((prev) => [...prev, doc]);
              toast.dismiss(toastId);
            }}
          >
            Undo
          </Button>
        </div>,
        { duration: 5000 }
      );
    }
  };

  const resetForm = () => {
    setForm({
      requestedBy: {
        id: "",
        name: "",
        email: "",
        department: "",
        employeeId: "",
        phoneNumber: "",
        designation: "",
        managerName: "",
        costCenter: "",
      },

      tripDetails: {
        fromLocation: { address: "" },
        toLocation: { address: "" },
        departureDate: "",
        departureTime: "",
        returnDate: "",
        returnTime: "",
        isRoundTrip: false,
        estimatedDistance: 0,
        estimatedDuration: 0,
      },
      purpose: {
        category: "Business Meeting",
        description: "",
        projectCode: "",
        costCenter: "",
        businessJustification: "",
      },
      requirements: {
        vehicleType: "Any",
        passengerCount: 1,
        luggage: "Light",
        acRequired: true,

        specialRequirements: "",
      },
      priority: "Medium",
      estimatedCost: 0,
      currency: "LKR",
      status: "Pending",
      passengers: [],
      approvalWorkflow: [],
      attachments: [],
      auditTrail: [],
      costBreakdown: undefined,
      billing: undefined,
      id: "",
      requestNumber: "",
      createdAt: "",
      updatedAt: "",
      approvalRequired: true,
    });
    setEditingRequest(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.requestedBy?.name || !form.tripDetails?.fromLocation?.address) {
      toast.error("Please fill all required fields");
      return;
    }

    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear(); // e.g., 2024

    // Count how many requests exist for this year
    const yearCount = tripRequests.filter((r) =>
      r.requestNumber?.startsWith(`TR-${currentYear}-`)
    ).length;

    // Generate next ID: TR-2024-01, TR-2024-02, etc.
    const tripId =
      editingRequest?.requestNumber ??
      `TR-${currentYear}-${String(yearCount + 1).padStart(2, "0")}`;

    const baseRequest: TripRequest = {
      id: editingRequest?.id ?? `req-${Date.now()}`,
      requestNumber: tripId,
      createdAt: editingRequest?.createdAt ?? now,
      updatedAt: now,
      status: editingRequest?.status ?? "Pending",
      approvalRequired: form.approvalRequired ?? true,
      passengers: form.passengers ?? [],
      approvalWorkflow: form.approvalWorkflow ?? [],
      attachments: form.attachments ?? [],
      auditTrail: editingRequest?.auditTrail ?? [],
      currency: "LKR",
      ...form,
      requestedBy: form.requestedBy!,
      tripDetails: {
        ...form.tripDetails!,
        fromLocation: form.tripDetails!.fromLocation ?? { address: "" },
        toLocation: form.tripDetails!.toLocation ?? { address: "" },
      },
      purpose: form.purpose!,
      requirements: form.requirements!,
    } as TripRequest;

    // Save
    if (editingRequest) {
      setTripRequests((prev) =>
        prev.map((r) => (r.id === editingRequest.id ? baseRequest : r))
      );
      toast.success(`Request ${tripId} updated`);
    } else {
      setTripRequests((prev) => [...prev, baseRequest]);
      toast.success(`Request ${tripId} created`);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="p-3">
          <h1 className="text-2xl font-semibold">TRIP REQUESTS</h1>
          <p className="text-muted-foreground text-xs">
            Manage and track trip requests from employees
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{tripRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {tripRequests.filter((r) => r.status === "Pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {tripRequests.filter((r) => r.status === "In Progress").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              Rs.
              {tripRequests
                .reduce((sum, r) => sum + r.estimatedCost, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total estimated</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Requests ({filteredRequests.length})</CardTitle>
          <CardDescription>
            List of all trip requests with their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex-1 relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
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
                <SelectItem value="all-status">All Status</SelectItem>
                {statusTypes.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-departments">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-priorities">All Priorities</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Details</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Trip Information</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.length > 0 ? (
                  paginatedDocuments.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {request.requestNumber}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(request.tripDetails.departureDate)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {request.requestedBy.name}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {request.requestedBy.department}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {request.tripDetails.fromLocation.address.substring(
                              0,
                              25
                            )}
                            ...
                          </div>
                          <div className="text-sm text-muted-foreground">
                            to{" "}
                            {request.tripDetails.toLocation.address.substring(
                              0,
                              25
                            )}
                            ...
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {request.tripDetails.departureDate}{" "}
                            {request.tripDetails.departureTime}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={getPriorityBadgeVariant(request.priority)}
                        >
                          {request.priority}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center">
                          Rs. {request.estimatedCost.toLocaleString()}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(request)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(request)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{request.requestNumber}</div>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />{" "}
                      {request.requestedBy.name} (
                      {request.requestedBy.department})
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {request.tripDetails.fromLocation.address.substring(
                        0,
                        25
                      )}
                      ... to{" "}
                      {request.tripDetails.toLocation.address.substring(0, 25)}
                      ...
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {request.tripDetails.departureDate}{" "}
                      {request.tripDetails.departureTime}
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>{" "}
                      <Badge
                        variant={getPriorityBadgeVariant(request.priority)}
                      >
                        {request.priority}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Estimated Cost:</span> Rs.{" "}
                      {request.estimatedCost.toLocaleString()}
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
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(request)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(request)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(request)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                No requests found
              </div>
            )}
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
                of {filteredRequests.length} documents
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-lg bg-background border border-border">
          {/* Sticky Header */}
          <DialogHeader className=" top-0  bg-background/90 backdrop-blur-md border-b border-border pb-3">
            <DialogTitle className="text-lg font-semibold">
              {editingRequest ? "Edit Trip Request" : "Create New Trip Request"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingRequest
                ? "Update the trip request details below"
                : "Fill in the information to create a new trip request"}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8 py-4">
            {/* Requester Section */}
            <section className="p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="font-semibold text-foreground text-base mb-3">
                Requester Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={form.requestedBy?.name ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        requestedBy: {
                          ...f.requestedBy!,
                          name: e.target.value,
                        },
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.requestedBy?.email ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        requestedBy: {
                          ...f.requestedBy!,
                          email: e.target.value,
                        },
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Employee ID *</Label>
                  <Input
                    value={form.requestedBy?.employeeId ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        requestedBy: {
                          ...f.requestedBy!,
                          employeeId: e.target.value,
                        },
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Department *</Label>
                  <Select
                    value={form.requestedBy?.department ?? ""}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        requestedBy: { ...f.requestedBy!, department: v },
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Trip Details Section */}
            <section className="p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="font-semibold text-foreground text-base mb-3">
                Trip Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From *</Label>
                  <Input
                    value={form.tripDetails?.fromLocation?.address ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tripDetails: {
                          ...f.tripDetails!,
                          fromLocation: { address: e.target.value },
                        },
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>To *</Label>
                  <Input
                    value={form.tripDetails?.toLocation?.address ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tripDetails: {
                          ...f.tripDetails!,
                          toLocation: { address: e.target.value },
                        },
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.tripDetails?.departureDate ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tripDetails: {
                          ...f.tripDetails!,
                          departureDate: e.target.value,
                        },
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={form.tripDetails?.departureTime ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tripDetails: {
                          ...f.tripDetails!,
                          departureTime: e.target.value,
                        },
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Priority & Cost Section */}
            <section className="p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="font-semibold text-foreground text-base mb-3">
                Priority & Cost
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={form.priority ?? "Medium"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, priority: v as Priority }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Cost *</Label>
                  <Input
                    type="number"
                    value={form.estimatedCost ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estimatedCost: Number(e.target.value),
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Sticky Footer */}
            <DialogFooter className=" bottom-0 bg-background/90 backdrop-blur-md border-t border-border mt-4 pt-3 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRequest ? "Update Request" : "Create Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-lg bg-background border border-border">
          <DialogHeader className=" top-0  bg-background/90 backdrop-blur-md border-b border-border pb-3">
            <DialogTitle className="text-lg font-semibold">
              Trip Request Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Complete information about the trip request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {selectedRequest && (
              <>
                {/* Section Wrapper */}
                <section className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-semibold mb-3 text-foreground">
                    Request Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Request Number: {selectedRequest.requestNumber}</div>
                    <div>Status: {selectedRequest.status}</div>
                    <div>Priority: {selectedRequest.priority}</div>
                    <div>
                      Approval Required:{" "}
                      {selectedRequest.approvalRequired ? "Yes" : "No"}
                    </div>
                  </div>
                </section>

                <section className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-semibold mb-3 text-foreground">
                    Requester Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Name: {selectedRequest.requestedBy.name}</div>
                    <div>
                      Employee ID: {selectedRequest.requestedBy.employeeId}
                    </div>
                    <div>Email: {selectedRequest.requestedBy.email}</div>
                    <div>
                      Phone: {selectedRequest.requestedBy.phoneNumber || "N/A"}
                    </div>
                    <div>
                      Department: {selectedRequest.requestedBy.department}
                    </div>
                    <div>
                      Designation:{" "}
                      {selectedRequest.requestedBy.designation || "N/A"}
                    </div>
                    <div>
                      Manager:{" "}
                      {selectedRequest.requestedBy.managerName || "N/A"}
                    </div>
                    <div>
                      Cost Center:{" "}
                      {selectedRequest.requestedBy.costCenter || "N/A"}
                    </div>
                  </div>
                </section>

                <section className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-semibold mb-3 text-foreground">
                    Trip Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      Departure Date:{" "}
                      {formatDate(selectedRequest.tripDetails.departureDate)}
                    </div>
                    <div>
                      Departure Time:{" "}
                      {selectedRequest.tripDetails.departureTime}
                    </div>
                    <div>
                      Return Date:{" "}
                      {selectedRequest.tripDetails.returnDate || "One-way trip"}
                    </div>
                    <div>
                      Return Time:{" "}
                      {selectedRequest.tripDetails.returnTime || "N/A"}
                    </div>
                    <div>
                      Duration:{" "}
                      {Math.round(
                        (selectedRequest.tripDetails.estimatedDuration / 60) *
                          100
                      ) / 100}{" "}
                      hours
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div>
                      <span className="font-medium">From:</span>{" "}
                      {selectedRequest.tripDetails.fromLocation.address}
                    </div>
                    <div>
                      <span className="font-medium">To:</span>{" "}
                      {selectedRequest.tripDetails.toLocation.address}
                    </div>
                    <div>
                      <span className="font-medium">Distance:</span>{" "}
                      {selectedRequest.tripDetails.estimatedDistance} km
                    </div>
                  </div>
                </section>

                {/* You can reuse the same pattern below for each section */}
                {/* Just wrap each logical group in a <section> like above */}

                {/* Example: Purpose Section */}
                <section className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-semibold mb-3 text-foreground">
                    Purpose & Category
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Category: {selectedRequest.purpose.category}</div>
                    <div>
                      Business Justification:{" "}
                      {selectedRequest.purpose.businessJustification || "N/A"}
                    </div>
                    <div>
                      Project Code:{" "}
                      {selectedRequest.purpose.projectCode || "N/A"}
                    </div>
                    <div>
                      Cost Center: {selectedRequest.purpose.costCenter || "N/A"}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Description:</span>
                    <div className="mt-1 p-2 rounded bg-muted text-sm">
                      {selectedRequest.purpose.description}
                    </div>
                  </div>
                </section>

                {/* You can continue applying this same section styling
              for requirements, passengers, approvals, etc. */}

                <section className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-semibold mb-3 text-foreground">
                    System Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Created: {formatDate(selectedRequest.createdAt)}</div>
                    <div>
                      Last Updated: {formatDate(selectedRequest.updatedAt)}
                    </div>
                    <div>Status: {selectedRequest.status}</div>
                    <div>Request ID: {selectedRequest.id}</div>
                  </div>
                </section>
              </>
            )}
          </div>

          <DialogFooter className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border mt-4 pt-3">
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
