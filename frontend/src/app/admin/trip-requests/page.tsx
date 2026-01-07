"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Building2,
  Eye,
  Search,
  MapPin,
  Users,
  Activity,
  DollarSign,
  ChevronLast,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TripRequest, Priority } from "@/types/trip-interfaces";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── TYPES ────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────

export default function TripRequests() {
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrips, setTotalTrips] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [departmentFilter, setDepartmentFilter] = useState("all-departments");
  const [priorityFilter, setPriorityFilter] = useState("all-priorities");

  // Modals
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TripRequest | null>(
    null
  );
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(
    null
  );

  // Form State (only editable fields)
  const [formData, setFormData] = useState<Partial<TripRequest>>({
    tripDetails: {
      fromLocation: { address: "", coordinates: undefined },
      toLocation: { address: "", coordinates: undefined },
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
      specialRequirements: "",
      acRequired: true,
      luggage: "Light",
    },
    priority: "Medium" as Priority,
    estimatedCost: 0,
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
  }, [debouncedSearch, statusFilter, departmentFilter, priorityFilter]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/auth/me", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setCurrentUser(data.user || data);
      } catch (err) {
        console.error("Failed to load current user", err);
        toast.error("Could not load your profile");
      }
    };
    fetchCurrentUser();
  }, [getAuthHeaders]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/departments?limit=100", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDepartments(data.data?.departments || []);
    } catch {
      console.error("Failed to fetch departments");
    }
  }, [getAuthHeaders]);

  // Fetch trip requests
  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (debouncedSearch) query.set("searchTerm", debouncedSearch);
      if (statusFilter !== "all-status") query.set("status", statusFilter);
      if (departmentFilter !== "all-departments")
        query.set("department", departmentFilter);
      if (priorityFilter !== "all-priorities")
        query.set("priority", priorityFilter);

      const res = await fetch(`/trip-requests?${query}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setTripRequests(data.data || []);
      setTotalTrips(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load trip requests");
      setTripRequests([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    statusFilter,
    departmentFilter,
    priorityFilter,
    getAuthHeaders,
  ]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // ── HELPERS ──────────────────────────────────────────────────────────────

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // For status
  const getStatusBadgeVariant = (
    status: string
  ): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "Approved":
      case "Completed":
        return "default";
      case "Rejected":
      case "Cancelled":
        return "destructive";
      case "Assigned":
      case "In Progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  // For priority
  const getPriorityBadgeVariant = (
    priority: string
  ): "default" | "destructive" | "outline" | "secondary" => {
    switch (priority) {
      case "Urgent":
        return "destructive";
      case "High":
        return "secondary";
      case "Medium":
        return "outline";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  // ── HANDLERS ─────────────────────────────────────────────────────────────

  const handleViewDetails = (request: TripRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (request: TripRequest) => {
    setEditingRequest(request);
    setFormData({
      tripDetails: { ...request.tripDetails },
      purpose: { ...request.purpose },
      requirements: { ...request.requirements },
      priority: request.priority,
      estimatedCost: request.estimatedCost,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (request: TripRequest) => {
    if (!window.confirm(`Delete request #${request.requestNumber}?`)) return;

    try {
      const res = await fetch(`/trip-requests/${request.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setTripRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast.success("Request deleted");
    } catch {
      toast.error("Failed to delete request");
    }
  };

  const resetForm = () => {
    setEditingRequest(null);
    setFormData({
      tripDetails: {
        fromLocation: { address: "", coordinates: undefined },
        toLocation: { address: "", coordinates: undefined },
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
        specialRequirements: "",
        acRequired: true,
        luggage: "Light",
      },
      priority: "Medium" as Priority,
      estimatedCost: 0,
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.tripDetails?.fromLocation?.address ||
      !formData.tripDetails?.toLocation?.address
    ) {
      toast.error("From and To locations are required");
      return;
    }

    const payload = {
      tripDetails: formData.tripDetails,
      purpose: formData.purpose,
      requirements: formData.requirements,
      priority: formData.priority,
      estimatedCost: formData.estimatedCost,
      approvalRequired: true, // can be made configurable later
    };

    const url = editingRequest
      ? `/trip-requests/${editingRequest.id}`
      : "/trip-requests";
    const method = editingRequest ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.errors?.join(", ") || "Failed to save request");
        return;
      }

      toast.success(editingRequest ? "Request updated" : "Request created");
      setIsDialogOpen(false);
      resetForm();
      fetchTrips();
    } catch {
      toast.error("Network error while saving");
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 ">
      {/* Header + New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="p-4">
          <h1 className="text-2xl">TRIP REQUESTS</h1>
          <p className="text-muted-foreground text-xs">
            Manage employee travel requests
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <Card>
          <CardHeader className="pb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardHeader className="pb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-200" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {tripRequests.filter((r) => r.status === "Pending").length}
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader className="pb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {tripRequests.filter((r) => r.status === "In Progress").length}
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className="pb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              Rs.
              {tripRequests
                .reduce((sum, r) => sum + (r.estimatedCost || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>Filter and manage trip requests</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
            {/* Search */}
            <div className="flex-1 min-w-60 relative">
              <Input
                placeholder="Search by number, location, requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
            </div>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                {[
                  "Pending",
                  "Approved",
                  "Rejected",
                  "Cancelled",
                  "Assigned",
                  "In Progress",
                  "Completed",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Department */}
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-departments">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-priorities">All Priorities</SelectItem>
                {["Low", "Medium", "High", "Urgent"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading requests...
            </div>
          ) : tripRequests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No requests found
            </div>
          ) : (
            <>
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
                    {tripRequests.length > 0 ? (
                      tripRequests.map((request) => (
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
                                <User className="h-3 w-3 mr-1" />{" "}
                                {request.requestedBy.name}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Building2 className="h-3 w-3 mr-1" />{" "}
                                {request.requestedBy.department}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm flex items-center">
                                {/* MapPin SVG fallback */}
                                <MapPin className="h-3 w-3 mr-1 inline" />
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
                            <Badge
                              variant={getStatusBadgeVariant(request.status)}
                            >
                              {request.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={getPriorityBadgeVariant(
                                request.priority
                              )}
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {tripRequests.length > 0 ? (
                  tripRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border rounded-lg p-4 shadow-sm bg-card"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">
                          {request.requestNumber}
                        </div>
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
                          {/* MapPin fallback */}
                          <MapPin className="h-4 w-4 mr-1" />
                          {request.tripDetails.fromLocation.address.substring(
                            0,
                            20
                          )}
                          ...
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />{" "}
                          {request.tripDetails.departureDate}
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
                          <span className="font-medium">Cost:</span> Rs.{" "}
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
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(request)}
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(request)}
                              className="text-destructive"
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
            </>
          )}

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
                of {totalTrips} documents
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRequest ? "Edit Trip Request" : "New Trip Request"}
            </DialogTitle>
            <DialogDescription>
              {editingRequest
                ? "Update the trip Details. Changes will be saved when you  Click Update."
                : "Fill in the trip information to submit a new request. Required Fields are marked with *"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Submitting As – Read-only */}
            <section className="p-4 border rounded-lg bg-muted/40">
              <h3 className="font-medium mb-3">Submitting as</h3>
              {currentUser ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Name</div>
                    <div className="font-medium">{currentUser.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Email</div>
                    <div>{currentUser.email}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Employee ID
                    </div>
                    <div>{currentUser.employeeId || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Department
                    </div>
                    <div>{currentUser.department || "Unassigned"}</div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  Loading your profile...
                </div>
              )}
            </section>

            {/* Trip Details */}
            <section className="p-4 border rounded-lg bg-muted/40">
              <h3 className="font-medium mb-3">Trip Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>From Location *</Label>
                  <Input
                    value={formData.tripDetails?.fromLocation?.address || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tripDetails: {
                          ...prev.tripDetails!,
                          fromLocation: {
                            ...prev.tripDetails!.fromLocation!,
                            address: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Enter pickup location"
                  />
                </div>
                <div>
                  <Label>To Location *</Label>
                  <Input
                    value={formData.tripDetails?.toLocation?.address || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tripDetails: {
                          ...prev.tripDetails!,
                          toLocation: {
                            ...prev.tripDetails!.toLocation!,
                            address: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Enter destination"
                  />
                </div>
                <div>
                  <Label>Departure Date *</Label>
                  <Input
                    type="date"
                    value={formData.tripDetails?.departureDate || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tripDetails: {
                          ...prev.tripDetails!,
                          departureDate: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Departure Time *</Label>
                  <Input
                    type="time"
                    value={formData.tripDetails?.departureTime || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tripDetails: {
                          ...prev.tripDetails!,
                          departureTime: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* Purpose */}
            <section className="p-4 border rounded-lg bg-muted/40">
              <h3 className="font-medium mb-3">Purpose of Travel</h3>
              <div className="space-y-4">
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.purpose?.description || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        purpose: {
                          ...prev.purpose!,
                          description: e.target.value,
                        },
                      }))
                    }
                    placeholder="Briefly describe the purpose..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={formData.purpose?.category || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          purpose: {
                            ...prev.purpose!,
                            category: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Estimated Cost (LKR)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.estimatedCost || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          estimatedCost: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Priority */}
            <section className="p-4 border rounded-lg bg-muted/40">
              <h3 className="font-medium mb-3">Priority</h3>
              <Select
                value={formData.priority}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, priority: v as Priority }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingRequest ? "Update Request" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog – keep your original or simplify similarly */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Trip Request Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <>
                <section className="p-4 border rounded bg-muted/30">
                  <h4 className="font-semibold">General Info</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>Request #: {selectedRequest.requestNumber}</div>
                    <div>Status: {selectedRequest.status}</div>
                    <div>Priority: {selectedRequest.priority}</div>
                    <div>Cost: Rs. {selectedRequest.estimatedCost}</div>
                  </div>
                </section>
                <section className="p-4 border rounded bg-muted/30">
                  <h4 className="font-semibold">Requester</h4>
                  <div className="text-sm mt-2">
                    {selectedRequest.requestedBy.name} -{" "}
                    {selectedRequest.requestedBy.department}
                  </div>
                </section>
                <section className="p-4 border rounded bg-muted/30">
                  <h4 className="font-semibold">Route</h4>
                  <div className="text-sm mt-2">
                    From: {selectedRequest.tripDetails.fromLocation.address}
                    <br />
                    To: {selectedRequest.tripDetails.toLocation.address}
                    <br />
                    Date:{" "}
                    {formatDate(
                      selectedRequest.tripDetails.departureDate
                    )} at {selectedRequest.tripDetails.departureTime}
                  </div>
                </section>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
