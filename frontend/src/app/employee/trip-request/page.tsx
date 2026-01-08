"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Eye, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner"; // ← install if missing: npm install sonner
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { TripApproval, TripRequest } from "@/types/trip-interfaces";

// Reuse your existing interfaces (TripRequest, TripApproval, etc.)
// ... (paste your interface definitions here)
interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}
interface EmployeeTripRequestsProps {
  user?: UserRole;
  viewMode?: "request" | "my-trips";
}

export default function EmployeeTripRequests({
  user,
  viewMode = "my-trips", // default to my-trips for employee page
}: EmployeeTripRequestsProps) {
  const [trips, setTrips] = useState<(TripRequest & { approval?: TripApproval })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<(TripRequest & { approval?: TripApproval }) | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTrip, setSelectedTrip] = useState<(TripRequest & { approval?: TripApproval }) | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const isEdit = Boolean(editingTrip);
  const isReadOnly = isEdit && editingTrip?.status !== "Pending";
  // Form state – flattened for simplicity (you can nest later)
  const [formData, setFormData] = useState({
    fromLocation: "",
    toLocation: "",
    departureDate: "",
    departureTime: "",
    returnDate: "",
    returnTime: "",
    purposeCategory: "Client Meeting",
    purposeDescription: "",
    vehicleType: "Sedan",
    passengerCount: 1,
    specialRequirements: "",
    acRequired: true,
    luggage: "Small bag",
    priority: "Medium",
    estimatedCost: 0,
  });

  // Fetch user's trips
  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("searchTerm", searchTerm);
      if (statusFilter !== "all") params.set("status", statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1));

      const res = await fetch(`/api/trip-requests?${params.toString()}`, {
        method: "GET",
        credentials: "include", // ← important: sends cookies (accessToken)
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please log in again.");
          // Optional: redirect to login
        }
        throw new Error("Failed to fetch trips");
      }

      const data = await res.json();
      // Assuming backend returns { data: TripRequest[], meta: {...} }
      setTrips(data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load your trip requests");
      toast.error("Could not load trips");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingTrip(null);
    setFormData({
      fromLocation: "",
      toLocation: "",
      departureDate: "",
      departureTime: "",
      returnDate: "",
      returnTime: "",
      purposeCategory: "Client Meeting",
      purposeDescription: "",
      vehicleType: "Sedan",
      passengerCount: 1,
      specialRequirements: "",
      acRequired: true,
      luggage: "Small bag",
      priority: "Medium",
      estimatedCost: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      tripDetails: {
        fromLocation: { address: formData.fromLocation },
        toLocation: { address: formData.toLocation },
        departureDate: formData.departureDate,
        departureTime: formData.departureTime,
        returnDate: formData.returnDate || undefined,
        returnTime: formData.returnTime || undefined,
        isRoundTrip: !!formData.returnDate && !!formData.returnTime,
        estimatedDistance: 0, // calculate or leave 0
        estimatedDuration: 0,
      },
      purpose: {
        category: formData.purposeCategory,
        description: formData.purposeDescription,
        projectCode: "",
        costCenter: "",
        businessJustification: "",
      },
      requirements: {
        vehicleType: formData.vehicleType,
        passengerCount: formData.passengerCount,
        specialRequirements: formData.specialRequirements,
        acRequired: formData.acRequired,
        luggage: formData.luggage,
      },
      priority: formData.priority,
      estimatedCost: formData.estimatedCost,
      approvalRequired: true,
    };

    const url = editingTrip ? `/api/trip-requests/${editingTrip.id}` : "/api/trip-requests";
    const method = editingTrip ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save request");
      }

      toast.success(editingTrip ? "Request updated!" : "Trip request submitted!");
      setIsNewRequestOpen(false);
      resetForm();
      fetchTrips(); // refresh list
    } catch (err) {
      setError((err as Error).message);
      toast.error("Something went wrong");
    }
  };

  const handleEdit = (trip: TripRequest & { approval?: TripApproval }) => {
    setEditingTrip(trip);
    setFormData({
      fromLocation: trip.tripDetails.fromLocation.address,
      toLocation: trip.tripDetails.toLocation.address,
      departureDate: trip.tripDetails.departureDate,
      departureTime: trip.tripDetails.departureTime,
      returnDate: trip.tripDetails.returnDate || "",
      returnTime: trip.tripDetails.returnTime || "",
      purposeCategory: trip.purpose.category,
      purposeDescription: trip.purpose.description,
      vehicleType: trip.requirements.vehicleType,
      passengerCount: trip.requirements.passengerCount,
      specialRequirements: trip.requirements.specialRequirements || "",
      acRequired: trip.requirements.acRequired,
      luggage: trip.requirements.luggage,
      priority: trip.priority,
      estimatedCost: trip.estimatedCost,
    });
    setIsNewRequestOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trip request?")) return;

    try {
      const res = await fetch(`/api/trip-requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Request deleted");
      fetchTrips();
    } catch (err) {
      toast.error("Failed to delete request");
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "default";
      case "Completed": return "secondary";
      case "Pending": return "destructive";
      case "Rejected": return "outline";
      default: return "secondary";
    }
  };

  const viewTrip = (trip: TripRequest & { approval?: TripApproval }) => {
    setSelectedTrip(trip);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {viewMode === "my-trips" ? "My Trips" : "Trip Requests"}
          </h1>
          <p className="text-muted-foreground">
            {viewMode === "my-trips"
              ? "View and manage your trip requests"
              : "Request new trips and track existing ones"}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsNewRequestOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Trip Request
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by destination, purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${trips.length} trips found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : trips.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No trip requests yet. Create one to get started!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => {
                    const latest = trip.approval?.approvalHistory?.[trip.approval.approvalHistory.length - 1];
                    return (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.requestNumber}</TableCell>
                        <TableCell>{trip.tripDetails.toLocation.address}</TableCell>
                        <TableCell>
                          {trip.tripDetails.departureDate} at {trip.tripDetails.departureTime}
                        </TableCell>
                        <TableCell>{trip.purpose.category}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(trip.status)}>{trip.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {latest && latest.action !== "Pending"
                            ? `${latest.approver.name} (${latest.action})`
                            : "Pending"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => viewTrip(trip)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {trip.status === "Pending" && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(trip)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => handleDelete(trip.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
<Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
  <DialogContent className="w-11/12 max-w-2xl mx-auto max-h-[88vh] sm:max-h[85vh] overflow-y-auto bg-white dark:bg-black rounded-2xl shadow-lg p-6 sm:p-8">
    <DialogHeader className="mb-6">
      <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {editingTrip ? "Edit Trip Request" : "New Trip Request"}
      </DialogTitle>
      <DialogDescription className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
        {editingTrip
          ? "Update your trip details. Changes are only allowed while Pending."
          : "Fill in the details. Your request will be sent for approval."}
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* FROM & TO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fromLocation">From Location</Label>
          <Input
            id="fromLocation"
            placeholder="Enter pickup location"
            value={formData.fromLocation}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange("fromLocation", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="toLocation">Destination</Label>
          <Input
            id="toLocation"
            placeholder="Enter destination"
            value={formData.toLocation}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange("toLocation", e.target.value)}
          />
        </div>
      </div>

      {/* DATE & TIME */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="departureDate">Departure Date</Label>
          <Input
            id="departureDate"
            type="date"
            value={formData.departureDate}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange("departureDate", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="departureTime">Departure Time</Label>
          <Input
            id="departureTime"
            type="time"
            value={formData.departureTime}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange("departureTime", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="returnDate">Return Date</Label>
          <Input
            id="returnDate"
            type="date"
            value={formData.returnDate}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange("returnDate", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="returnTime">Return Time</Label>
          <Input
            id="returnTime"
            type="time"
            value={formData.returnTime}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange("returnTime", e.target.value)}
          />
        </div>
      </div>

      {/* PURPOSE */}
      <div>
        <Label htmlFor="purposeCategory">Purpose Category</Label>
        <Select
          value={formData.purposeCategory}
          disabled={isReadOnly}
          onValueChange={(v) => handleInputChange("purposeCategory", v)}
        >
          <SelectTrigger id="purposeCategory">
            <SelectValue placeholder="Select purpose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Client Meeting">Client Meeting</SelectItem>
            <SelectItem value="Office Work">Office Work</SelectItem>
            <SelectItem value="Training">Training</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="purposeDescription">Purpose Description</Label>
        <Textarea
          id="purposeDescription"
          placeholder="Explain the reason for travel"
          value={formData.purposeDescription}
          disabled={isReadOnly}
          onChange={(e) => handleInputChange("purposeDescription", e.target.value)}
        />
      </div>

      {/* REQUIREMENTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="vehicleType">Vehicle Type</Label>
          <Select
            value={formData.vehicleType}
            disabled={isReadOnly}
            onValueChange={(v) => handleInputChange("vehicleType", v)}
          >
            <SelectTrigger id="vehicleType">
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any">Any</SelectItem>
              <SelectItem value="Car">Car</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Bus">Bus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="passengerCount">Passengers</Label>
          <Input
            id="passengerCount"
            type="number"
            min={1}
            value={formData.passengerCount}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange("passengerCount", Number(e.target.value))}
          />
        </div>

        <div>
          <Label htmlFor="acRequired">AC Required</Label>
          <Select
            value={formData.acRequired ? "yes" : "no"}
            disabled={isReadOnly}
            onValueChange={(v) => handleInputChange("acRequired", v === "yes")}
          >
            <SelectTrigger id="acRequired">
              <SelectValue placeholder="AC required?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PRIORITY & COST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            disabled={isReadOnly}
            onValueChange={(v) => handleInputChange("priority", v)}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="estimatedCost">Estimated Cost</Label>
          <Input
            id="estimatedCost"
            type="number"
            value={formData.estimatedCost}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange("estimatedCost", Number(e.target.value))}
          />
        </div>
      </div>

      {/* FOOTER */}
      <DialogFooter className="pt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsNewRequestOpen(false)}
        >
          Cancel
        </Button>

        {!isReadOnly && (
          <Button type="submit">
            {isEdit ? "Update Request" : "Submit Request"}
          </Button>
        )}
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>



      {/* View Details Dialog – keep your existing one */}
  <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Trip Details - {selectedTrip?.requestNumber}
            </DialogTitle>
            <DialogDescription>
              Complete information about your trip request
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>From Location</Label>
                  <p className="text-sm mt-1">
                    {selectedTrip.tripDetails.fromLocation.address}
                  </p>
                </div>
                <div>
                  <Label>Destination</Label>
                  <p className="text-sm mt-1">
                    {selectedTrip.tripDetails.toLocation.address}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Departure Date</Label>
                  <p className="text-sm mt-1">
                    {selectedTrip.tripDetails.departureDate}
                  </p>
                </div>
                <div>
                  <Label>Departure Time</Label>
                  <p className="text-sm mt-1">
                    {selectedTrip.tripDetails.departureTime}
                  </p>
                </div>
              </div>
              {selectedTrip.tripDetails.returnDate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Return Date</Label>
                    <p className="text-sm mt-1">
                      {selectedTrip.tripDetails.returnDate}
                    </p>
                  </div>
                  <div>
                    <Label>Return Time</Label>
                    <p className="text-sm mt-1">
                      {selectedTrip.tripDetails.returnTime}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <Label>Purpose</Label>
                <p className="text-sm mt-1">{selectedTrip.purpose.category}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTrip.purpose.description}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge
                    variant={getStatusColor(selectedTrip.status)}
                    aria-label={`Trip status: ${selectedTrip.status}`}
                  >
                    {selectedTrip.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Estimated Cost</Label>
                <p className="text-sm mt-1">
                  {selectedTrip.estimatedCost} {selectedTrip.currency}
                </p>
              </div>
              <div>
                <Label>Passengers</Label>
                <ul className="text-sm mt-1">
                  {selectedTrip.passengers.map((passenger, index) => (
                    <li key={index}>
                      {passenger.name} ({passenger.department})
                    </li>
                  ))}
                </ul>
              </div>
              {selectedTrip.approval &&
                selectedTrip.approval.approvalHistory.length > 0 && (
                  <div>
                    <Label>Approval History</Label>
                    <ul className="text-sm mt-1 space-y-2">
                      {selectedTrip.approval.approvalHistory.map(
                        (history, index) => (
                          <li key={index}>
                            <strong>{history.approver.name}</strong> (
                            {history.approver.role}) - {history.action} on{" "}
                            {new Date(history.timestamp).toLocaleString()}
                            {history.comments && (
                              <p className="text-muted-foreground">
                                {history.comments}
                              </p>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}