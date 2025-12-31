"use client";

import React, { useEffect, useState, useCallback } from "react"; // Using your global axios instance
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

// --- TYPES ---
interface Department {
  id: string;
  name: string;
}

// --- COMPONENT ---
export default function TripRequests() {
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
  const [editingRequest, setEditingRequest] = useState<TripRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(null);

  // Form State (Matches TripRequest interface)
  const [formData, setFormData] = useState<Partial<TripRequest>>({
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
    priority: "Medium",
    status: "Pending",
    approvalRequired: true,
    estimatedCost: 0,
    currency: "LKR",
    // Arrays
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
  });

  // --- EFFECTS ---

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset Page on Filter Change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, departmentFilter, priorityFilter]);

  // Auth Headers Helper
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  // Fetch Departments (For Dropdown)
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch(`/departments?limit=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.data?.departments) {
        setDepartments(data.data.departments);
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  }, [getAuthHeaders]);

  // Fetch Trip Requests
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append("page", currentPage.toString());
      query.append("pageSize", pageSize.toString());
      if (debouncedSearch) query.append("searchTerm", debouncedSearch);
      if (statusFilter !== "all-status") query.append("status", statusFilter);
      if (departmentFilter !== "all-departments") query.append("department", departmentFilter);
      if (priorityFilter !== "all-priorities") query.append("priority", priorityFilter);

      const res = await fetch(`/trip-requests?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch trips");
      }

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
  }, [currentPage, debouncedSearch, statusFilter, departmentFilter, priorityFilter, pageSize, getAuthHeaders]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // --- HELPERS ---

  const formatDate = (s?: string) => {
    if (!s) return "N/A";
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approved":
      case "Completed": return "default";
      case "Rejected":
      case "Cancelled": return "destructive";
      case "Assigned":
      case "In Progress": return "secondary";
      default: return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "Urgent": return "destructive";
      case "High": return "secondary";
      case "Medium": return "outline";
      default: return "outline";
    }
  };

  // --- TRANSFORMATION LOGIC (Frontend <-> Backend) ---

  // Helper to map Flat DB -> Nested Frontend
  // (This is usually done in the backend service, but done here if backend sends flat data directly)
  // Assuming backend sends nested structure based on our previous discussions.
  // If backend sends flat, we use mapDbToFrontend here. For now, assuming backend sends
  // a structure compatible with 'TripRequest' interface via the API we built earlier.

  // Helper to map Nested Frontend -> Flat DB (For POST/PUT)
  const mapFormToPayload = (data: Partial<TripRequest>) => {
    return {
      request_number: data.requestNumber,
      requested_by_user_id: data.requestedBy?.id,
      
      // Trip Details
      from_location_address: data.tripDetails?.fromLocation?.address || "",
      from_location_latitude: data.tripDetails?.fromLocation?.coordinates?.lat || null,
      from_location_longitude: data.tripDetails?.fromLocation?.coordinates?.lng || null,
      
      to_location_address: data.tripDetails?.toLocation?.address,
      to_location_latitude: data.tripDetails?.toLocation?.coordinates?.lat || null,
      to_location_longitude: data.tripDetails?.toLocation?.coordinates?.lng || null,
      
      departure_date: data.tripDetails?.departureDate || null,
      departure_time: data.tripDetails?.departureTime || null, // Assuming backend handles time string
      
      return_date: data.tripDetails?.returnDate || null,
      return_time: data.tripDetails?.returnTime || null,
      is_round_trip: data.tripDetails?.isRoundTrip,
      estimated_distance: data.tripDetails?.estimatedDistance ?? 0,
      estimated_duration: data.tripDetails?.estimatedDuration ?? 0,

      // Purpose
      purpose_category: data.purpose?.category || "",
      purpose_description: data.purpose?.description || "",
      project_code: data.purpose?.projectCode,
      cost_center: data.purpose?.costCenter,
      business_justification: data.purpose?.businessJustification,

      // Requirements
      vehicle_type_required: data.requirements?.vehicleType || null,
      passenger_count: data.requirements?.passengerCount ?? 1,
      luggage: data.requirements?.luggage  || null,
      ac_required: data.requirements?.acRequired,
      special_requirements: data.requirements?.specialRequirements || null,

      // Meta
      priority: data.priority,
      status: data.status,
      estimated_cost: data.estimatedCost,
      approval_required: data.approvalRequired,
    };
  };

  // --- HANDLERS ---

  const handleViewDetails = (request: TripRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (request: TripRequest) => {
    setEditingRequest(request);
    // Deep copy to prevent reference issues
    setFormData(JSON.parse(JSON.stringify(request)));
    setIsDialogOpen(true);
  };

  const handleDelete = async (doc: TripRequest) => {
    const from = doc.tripDetails.fromLocation.address.split(",")[0];
    const to = doc.tripDetails.toLocation.address.split(",")[0];

    if (window.confirm(`Delete #${doc.requestNumber}?\n${from} to ${to}`)) {
      try {
        const res = await fetch(`/trip-requests/${doc.id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to delete");

        setTripRequests((prev) => prev.filter((d) => d.id !== doc.id));
        toast.success(`Deleted #${doc.requestNumber}`);
      } catch (error) {
        toast.error("Failed to delete request");
        console.error("Delete request error:", error);
      }
    }
  };

  const resetForm = () => {
    setEditingRequest(null);
    setFormData({
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
      priority: "Medium",
      status: "Pending",
      approvalRequired: true,
      estimatedCost: 0,
      currency: "LKR",
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
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.requestedBy?.name || !formData.tripDetails?.fromLocation?.address) {
      return toast.error("Please fill required fields (Name, From Address)");
    }

    const payload = mapFormToPayload(formData);
    const url = editingRequest ? `/trip-requests/${editingRequest.id}` : "/trip-requests";
    const method = editingRequest ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data.message || data.error?.message || "Something went wrong";
        const details = Array.isArray(data.errors) ? data.errors.join(",") : "";
        return console.error(details || message);
      }

      toast.success(editingRequest ? "Request updated" : "Request created");
      setIsDialogOpen(false);
      resetForm();
      fetchTrips();
    } catch (err) {
      toast.error("Failed to submit request");
      console.error("Submit request error:", err);
    }
  };

  // --- RENDER ---

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl font-semibold">TRIP REQUESTS</h1>
          <p className="text-muted-foreground text-xs">
            Manage and track trip requests from employees
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> New Request
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
            <div className="text-2xl font-semibold">{totalTrips}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              Rs.
              {tripRequests.reduce((sum, r) => sum + (r.estimatedCost || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Requests</CardTitle>
          <CardDescription>List of all trip requests with status</CardDescription>
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
                {["Pending", "Approved", "Rejected", "Cancelled", "Assigned", "In Progress", "Completed"].map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-departments">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-priorities">All Priorities</SelectItem>
                {["Low", "Medium", "High", "Urgent"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">Loading...</div>
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
                              <div className="font-medium">{request.requestNumber}</div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(request.tripDetails.departureDate)}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center">
                                <User className="h-3 w-3 mr-1" /> {request.requestedBy.name}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Building2 className="h-3 w-3 mr-1" /> {request.requestedBy.department}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {request.tripDetails.fromLocation.address.substring(0, 25)}...
                              </div>
                              <div className="text-sm text-muted-foreground">
                                to {request.tripDetails.toLocation.address.substring(0, 25)}...
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {request.tripDetails.departureDate} {request.tripDetails.departureTime}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge variant={getPriorityBadgeVariant(request.priority)}>
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
                                <DropdownMenuItem onClick={() => handleViewDetails(request)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(request)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(request)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    <div key={request.id} className="border rounded-lg p-4 shadow-sm bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{request.requestNumber}</div>
                        <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center"><User className="h-4 w-4 mr-1" /> {request.requestedBy.name} ({request.requestedBy.department})</div>
                        <div className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {request.tripDetails.fromLocation.address.substring(0, 20)}...</div>
                        <div className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {request.tripDetails.departureDate}</div>
                        <div>
                          <span className="font-medium">Priority:</span> <Badge variant={getPriorityBadgeVariant(request.priority)}>{request.priority}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Cost:</span> Rs. {request.estimatedCost.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleViewDetails(request)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleEdit(request)}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleDelete(request)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">No requests found</div>
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Show</span>
              <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((s) => (<SelectItem key={s} value={s.toString()}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">of {totalTrips} documents</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</Button>
                <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingRequest ? "Edit Trip Request" : "Create New Trip Request"}</DialogTitle>
            <DialogDescription>
              {editingRequest ? "Update the trip request details below" : "Fill in the information to create a new trip request"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Requester Info */}
            <section className="p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold mb-3">Requester Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={formData.requestedBy?.name || ""} onChange={e => setFormData(f => ({...f, requestedBy: {...f.requestedBy!, name: e.target.value}}))} /></div>
                <div><Label>Email *</Label><Input value={formData.requestedBy?.email || ""} onChange={e => setFormData(f => ({...f, requestedBy: {...f.requestedBy!, email: e.target.value}}))} /></div>
                <div><Label>Employee ID</Label><Input value={formData.requestedBy?.employeeId || ""} onChange={e => setFormData(f => ({...f, requestedBy: {...f.requestedBy!, employeeId: e.target.value}}))} /></div>
                <div><Label>Department</Label><Input value={formData.requestedBy?.department || ""} onChange={e => setFormData(f => ({...f, requestedBy: {...f.requestedBy!, department: e.target.value}}))} /></div>
              </div>
            </section>

            {/* Trip Details */}
            <section className="p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold mb-3">Trip Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>From *</Label><Input value={formData.tripDetails?.fromLocation?.address || ""} onChange={e => setFormData(f => ({...f, tripDetails: {...f.tripDetails!, fromLocation: {...f.tripDetails!.fromLocation!, address: e.target.value}}}))} /></div>
                <div><Label>To *</Label><Input value={formData.tripDetails?.toLocation?.address || ""} onChange={e => setFormData(f => ({...f, tripDetails: {...f.tripDetails!, toLocation: {...f.tripDetails!.toLocation!, address: e.target.value}}}))} /></div>
                <div><Label>Date *</Label><Input type="date" value={formData.tripDetails?.departureDate || ""} onChange={e => setFormData(f => ({...f, tripDetails: {...f.tripDetails!, departureDate: e.target.value}}))} /></div>
                <div><Label>Time *</Label><Input type="time" value={formData.tripDetails?.departureTime || ""} onChange={e => setFormData(f => ({...f, tripDetails: {...f.tripDetails!, departureTime: e.target.value}}))} /></div>
              </div>
            </section>

            {/* Purpose */}
            <section className="p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold mb-3">Purpose</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Category</Label><Input value={formData.purpose?.category || ""} onChange={e => setFormData(f => ({...f, purpose: {...f.purpose!, category: e.target.value}}))} /></div>
                <div><Label>Description</Label><Textarea value={formData.purpose?.description || ""} onChange={e => setFormData(f => ({...f, purpose: {...f.purpose!, description: e.target.value}}))} /></div>
              </div>
            </section>

            {/* Meta */}
            <section className="p-4 rounded-lg border bg-muted/30">
               <h3 className="font-semibold mb-3">Meta</h3>
               <div className="grid grid-cols-2 gap-4">
                 <div><Label>Priority</Label>
                   <Select value={formData.priority} onValueChange={v => setFormData(f => ({...f, priority: v as Priority}))}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Urgent">Urgent</SelectItem></SelectContent>
                   </Select>
                 </div>
                 <div><Label>Estimated Cost</Label><Input type="number" value={formData.estimatedCost || ""} onChange={e => setFormData(f => ({...f, estimatedCost: Number(e.target.value)}))} /></div>
               </div>
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingRequest ? "Update Request" : "Create Request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog (Read Only) */}
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
                    <div className="text-sm mt-2">{selectedRequest.requestedBy.name} - {selectedRequest.requestedBy.department}</div>
                 </section>
                 <section className="p-4 border rounded bg-muted/30">
                    <h4 className="font-semibold">Route</h4>
                    <div className="text-sm mt-2">
                      From: {selectedRequest.tripDetails.fromLocation.address}<br/>
                      To: {selectedRequest.tripDetails.toLocation.address}<br/>
                      Date: {formatDate(selectedRequest.tripDetails.departureDate)} at {selectedRequest.tripDetails.departureTime}
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