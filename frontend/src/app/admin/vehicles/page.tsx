"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Car,
  Fuel,
  Calendar,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type?: string | null;
  ownership_type?: string | null;
  fuel_type?: string | null;
  seating_capacity?: number | null;
  availability_status?: string | null;
  operational_status?: string | null;
  created_at: string;
  updated_at: string;
}

interface VehicleFormData {
  registrationNo: string;
  make: string;
  model: string;
  year: string;
  type: string;
  source: string;
  fuelType: string;
  seatingCapacity: string;
  status: string;
}

interface MaintenanceRecord {
  id: string;
  actual_date: string;
  description: string;
  total_cost?: number | null;
  maintenance_type: string;
}

const vehicleTypes = ["Sedan", "SUV", "Hatchback", "Van", "Truck"];
const fuelTypes = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
const sourceTypes = ["Owned", "Leased", "Rented"];
const statusTypes = ["Available", "On Trip", "Under Repair", "Maintenance"];

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all-types");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [sourceFilter, setSourceFilter] = useState("all-sources");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isScheduleServiceDialogOpen, setIsScheduleServiceDialogOpen] =
    useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState<VehicleFormData>({
    registrationNo: "",
    make: "",
    model: "",
    year: "",
    type: "",
    source: "",
    fuelType: "",
    seatingCapacity: "",
    status: "",
  });

  const [maintenanceFormData, setMaintenanceFormData] = useState({
    date: "",
    description: "",
    cost: "",
  });

  const [scheduleServiceFormData, setScheduleServiceFormData] = useState({
    nextService: "",
  });

  // Fetch vehicles from backend
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (searchTerm) params.append("search", searchTerm);
      if (typeFilter !== "all-types") params.append("vehicle_type", typeFilter);
      if (statusFilter !== "all-status")
        params.append("availability_status", statusFilter);
      if (sourceFilter !== "all-sources")
        params.append("ownership_type", sourceFilter);

      const response = await fetch(`/vehicles?${params}`);
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      const result = await response.json();

      setVehicles(result.data || result);
      setTotal(result.pagination?.total || result.length || 0);
    } catch (err) {
      toast.error("Failed to load vehicles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchTerm,
    typeFilter,
    statusFilter,
    sourceFilter,
  ]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Initialize form when editing
  useEffect(() => {
    if (editingVehicle) {
      setFormData({
        registrationNo: editingVehicle.registration_number,
        make: editingVehicle.make,
        model: editingVehicle.model,
        year: editingVehicle.year.toString(),
        type: editingVehicle.vehicle_type || "",
        source: editingVehicle.ownership_type || "",
        fuelType: editingVehicle.fuel_type || "",
        seatingCapacity: editingVehicle.seating_capacity?.toString() || "",
        status: editingVehicle.availability_status || "",
      });
    } else {
      setFormData({
        registrationNo: "",
        make: "",
        model: "",
        year: "",
        type: "",
        source: "",
        fuelType: "",
        seatingCapacity: "",
        status: "",
      });
    }
  }, [editingVehicle]);

  const filteredVehicles = vehicles; // Already filtered server-side
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;
  const paginatedVehicles = filteredVehicles; // Already paginated from backend

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleCreateVehicle = () => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  };

  const handleViewMaintenanceLog = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setMaintenanceLoading(true);
    setMaintenanceRecords([]);

    try {
      const response = await fetch(`/vehicles/${vehicle.id}/maintenance-logs`);
      if (!response.ok) throw new Error("Failed to load logs");
      const data = await response.json();
      setMaintenanceRecords(data);
    } catch (err) {
      toast.error("Could not load maintenance history");
      console.error(err);
      setMaintenanceRecords([]);
    } finally {
      setMaintenanceLoading(false);
      setIsMaintenanceDialogOpen(true);
    }
  };

  const handleScheduleService = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setScheduleServiceFormData({ nextService: "" });
    setIsScheduleServiceDialogOpen(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const response = await fetch(`/vehicles/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Vehicle deleted");
      fetchVehicles();
    } catch (err) {
      toast.error("Failed to delete vehicle");
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleMaintenanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setMaintenanceFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleScheduleServiceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } = e.target;
    setScheduleServiceFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      registration_number: formData.registrationNo.trim(),
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: Number(formData.year),
      vehicle_type: formData.type || null,
      ownership_type: formData.source || null,
      fuel_type: formData.fuelType || null,
      seating_capacity: formData.seatingCapacity
        ? Number(formData.seatingCapacity)
        : null,
      availability_status: formData.status || "Available",
    };

    try {
      const method = editingVehicle ? "PUT" : "POST";
      const url = editingVehicle
        ? `/vehicles/${editingVehicle.id}`
        : "/vehicles";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed");
      }

      toast.success(editingVehicle ? "Vehicle updated" : "Vehicle added");
      setIsDialogOpen(false);
      fetchVehicles();
    } catch (err) {
      toast.error("Operation failed");
      console.error(err);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const payload = {
      vehicle_id: selectedVehicle.id,
      actual_date: maintenanceFormData.date
        ? new Date(maintenanceFormData.date).toISOString()
        : new Date().toISOString(),
      description: maintenanceFormData.description.trim(),
      total_cost: maintenanceFormData.cost
        ? Number(maintenanceFormData.cost)
        : 0, // set 0 instead of null
      maintenance_type: "General",
      status: "Completed",
    };

    try {
      const response = await fetch(
        `/vehicles/${selectedVehicle.id}/maintenance-logs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to save");
      const newRecord = await response.json();
      setMaintenanceRecords([...maintenanceRecords, newRecord]);
      setMaintenanceFormData({ date: "", description: "", cost: "" });
      toast.success("Record added");
    } catch (err) {
      toast.error("Failed to add record");
      console.error(err);
    }
  };

  const handleScheduleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // You can implement this when you have a backend endpoint for updating next service date
    toast.info("Schedule service feature coming soon");
    setIsScheduleServiceDialogOpen(false);
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const s = status || "Unknown";
    const variant =
      s === "Available"
        ? "default"
        : s === "On Trip"
        ? "secondary"
        : s === "Under Repair"
        ? "destructive"
        : "outline";
    return <Badge variant={variant}>{s}</Badge>;
  };

  const getSourceBadge = (source: string | null | undefined) => {
    const s = source || "Unknown";
    const variant = s === "Owned" ? "default" : "outline";
    return <Badge variant={variant}>{s}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">VEHICLE MANAGEMENT</h1>
          <p className="text-muted-foreground text-xs">
            Manage your fleet vehicles and their status
          </p>
        </div>
        <Button onClick={handleCreateVehicle}>
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Vehicles</CardTitle>
          <CardDescription>
            Complete list of vehicles in your fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
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
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-sources">All Sources</SelectItem>
                {sourceTypes.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
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
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      Loading vehicles...
                    </TableCell>
                  </TableRow>
                ) : paginatedVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No vehicles found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {vehicle.registration_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {vehicle.vehicle_type || "Unknown"}
                              </Badge>
                              {getSourceBadge(vehicle.ownership_type)}
                              <Badge
                                variant="secondary"
                                className="text-xs flex items-center"
                              >
                                <Fuel className="h-3 w-3 mr-1" />
                                {vehicle.fuel_type || "-"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vehicle.seating_capacity || "-"} seater
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vehicle.availability_status)}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditVehicle(vehicle)}
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit Vehicle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewMaintenanceLog(vehicle)}
                            >
                              <Settings className="h-4 w-4 mr-2" /> Maintenance
                              Log
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleScheduleService(vehicle)}
                            >
                              <Calendar className="h-4 w-4 mr-2" /> Schedule
                              Service
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remove Vehicle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {paginatedVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {vehicle.registration_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </div>
                  </div>
                  <div>{getStatusBadge(vehicle.availability_status)}</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Type: {vehicle.vehicle_type || "-"} | Fuel:{" "}
                  {vehicle.fuel_type || "-"} | Capacity:{" "}
                  {vehicle.seating_capacity || "-"}
                </div>
                <div className="flex justify-end mt-2 gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit Vehicle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleViewMaintenanceLog(vehicle)}
                      >
                        <Settings className="h-4 w-4 mr-2" /> Maintenance Log
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleScheduleService(vehicle)}
                      >
                        <Calendar className="h-4 w-4 mr-2" /> Schedule Service
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove Vehicle
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
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
              <span className="text-muted-foreground">of {total} vehicles</span>
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

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle
                  ? "Update vehicle details"
                  : "Register a new vehicle"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="registrationNo">Registration No.</Label>
                <Input
                  id="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="make" className="text-right">
                    Make
                  </Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">
                    Model
                  </Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={handleSelectChange("type")}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fuelType" className="text-right">
                    Fuel Type
                  </Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={handleSelectChange("fuelType")}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="source" className="text-right">
                    Source
                  </Label>
                  <Select
                    value={formData.source}
                    onValueChange={handleSelectChange("source")}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceTypes.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seatingCapacity">Seating Capacity</Label>
                <Input
                  id="seatingCapacity"
                  type="number"
                  value={formData.seatingCapacity}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleSelectChange("status")}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusTypes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingVehicle ? "Update" : "Add"} Vehicle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Maintenance Log Dialog */}
      <Dialog
        open={isMaintenanceDialogOpen}
        onOpenChange={setIsMaintenanceDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Maintenance Log - {selectedVehicle?.registration_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">History</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : maintenanceRecords.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No records
                      </TableCell>
                    </TableRow>
                  ) : (
                    maintenanceRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.actual_date}</TableCell>
                        <TableCell>{r.description}</TableCell>
                        <TableCell>
                          {r.total_cost
                            ? `₹${r.total_cost.toLocaleString()}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <form onSubmit={handleMaintenanceSubmit}>
              <h3 className="text-lg font-semibold mb-4">Add New Record</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={maintenanceFormData.date}
                    onChange={handleMaintenanceChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={maintenanceFormData.description}
                    onChange={handleMaintenanceChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={maintenanceFormData.cost}
                    onChange={handleMaintenanceChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit">Add Record</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isScheduleServiceDialogOpen}
        onOpenChange={setIsScheduleServiceDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Schedule Service - {selectedVehicle?.registration_number}
            </DialogTitle>
            <DialogDescription>
              Select the next service date for this vehicle.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleScheduleServiceSubmit}
            className="mt-4 space-y-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nextService" className="text-right">
                Next Service Date
              </Label>
              <Input
                id="nextService"
                type="date"
                value={scheduleServiceFormData.nextService}
                onChange={handleScheduleServiceChange}
                className="col-span-3"
              />
            </div>

            <DialogFooter>
              <Button type="submit">Schedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
