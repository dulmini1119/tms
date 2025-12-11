"use client";
import React, { useState, useEffect } from "react";
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
  AlertTriangle,
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

interface Vehicles {
  id: number;
  registrationNo: string;
  make: string;
  model: string;
  year: number;
  type: string;
  source: string;
  fuelType: string;
  seatingCapacity: number;
  status: string;
  currentDriver: string;
  lastService: string;
  nextService: string;
  mileage: number;
  insuranceExpiry: string;
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
  currentDriver: string;
  lastService: string;
  nextService: string;
  mileage: string;
  insuranceExpiry: string;
}

interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  date: string;
  description: string;
  cost: number;
}

const initialVehicles: Vehicles[] = [
  {
    id: 1,
    registrationNo: "MH-12-AB-1234",
    make: "Honda",
    model: "City",
    year: 2022,
    type: "Sedan",
    source: "Owned",
    fuelType: "Petrol",
    seatingCapacity: 5,
    status: "Available",
    currentDriver: "Rajesh Kumar",
    lastService: "2024-01-10",
    nextService: "2024-04-10",
    mileage: 45000,
    insuranceExpiry: "2024-12-15",
  },
  {
    id: 2,
    registrationNo: "DL-03-CD-5678",
    make: "Maruti",
    model: "Swift Dzire",
    year: 2021,
    type: "Sedan",
    source: "Leased",
    fuelType: "CNG",
    seatingCapacity: 5,
    status: "On Trip",
    currentDriver: "Amit Sharma",
    lastService: "2024-01-05",
    nextService: "2024-04-05",
    mileage: 62000,
    insuranceExpiry: "2024-11-30",
  },
  {
    id: 3,
    registrationNo: "KA-05-EF-9012",
    make: "Toyota",
    model: "Innova Crysta",
    year: 2023,
    type: "SUV",
    source: "Owned",
    fuelType: "Diesel",
    seatingCapacity: 8,
    status: "Under Repair",
    currentDriver: "Priya Iyer",
    lastService: "2023-12-20",
    nextService: "2024-03-20",
    mileage: 28000,
    insuranceExpiry: "2025-01-20",
  },
  {
    id: 4,
    registrationNo: "TN-09-GH-3456",
    make: "Tata",
    model: "Nexon",
    year: 2022,
    type: "SUV",
    source: "Leased",
    fuelType: "Electric",
    seatingCapacity: 5,
    status: "Available",
    currentDriver: "Lakshmi Reddy",
    lastService: "2024-01-15",
    nextService: "2024-04-15",
    mileage: 35000,
    insuranceExpiry: "2024-10-25",
  },
  {
    id: 5,
    registrationNo: "MH-14-IJ-7890",
    make: "Mahindra",
    model: "Scorpio",
    year: 2020,
    type: "SUV",
    source: "Owned",
    fuelType: "Diesel",
    seatingCapacity: 7,
    status: "Available",
    currentDriver: "Suresh Patil",
    lastService: "2024-01-08",
    nextService: "2024-04-08",
    mileage: 78000,
    insuranceExpiry: "2024-09-10",
  },
];

const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 1,
    vehicleId: 1,
    date: "2024-01-10",
    description: "Oil change and tire rotation",
    cost: 5000,
  },
  {
    id: 2,
    vehicleId: 1,
    date: "2023-07-15",
    description: "Brake pad replacement",
    cost: 8000,
  },
  {
    id: 3,
    vehicleId: 2,
    date: "2024-01-05",
    description: "CNG system inspection",
    cost: 3000,
  },
];

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
  const [editingVehicle, setEditingVehicle] = useState<Vehicles | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicles | null>(null);
  const [vehicles, setVehicles] = useState<Vehicles[]>(initialVehicles);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >(initialMaintenanceRecords);
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
    currentDriver: "",
    lastService: "",
    nextService: "",
    mileage: "",
    insuranceExpiry: "",
  });
  const [maintenanceFormData, setMaintenanceFormData] = useState<{
    date: string;
    description: string;
    cost: string;
  }>({
    date: "",
    description: "",
    cost: "",
  });
  const [scheduleServiceFormData, setScheduleServiceFormData] = useState<{
    nextService: string;
  }>({
    nextService: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Initialize formData when editing a vehicle
  useEffect(() => {
    if (editingVehicle) {
      setFormData({
        registrationNo: editingVehicle.registrationNo,
        make: editingVehicle.make,
        model: editingVehicle.model,
        year: editingVehicle.year.toString(),
        type: editingVehicle.type,
        source: editingVehicle.source,
        fuelType: editingVehicle.fuelType,
        seatingCapacity: editingVehicle.seatingCapacity.toString(),
        status: editingVehicle.status,
        currentDriver: editingVehicle.currentDriver,
        lastService: editingVehicle.lastService,
        nextService: editingVehicle.nextService,
        mileage: editingVehicle.mileage.toString(),
        insuranceExpiry: editingVehicle.insuranceExpiry,
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
        currentDriver: "",
        lastService: "",
        nextService: "",
        mileage: "",
        insuranceExpiry: "",
      });
    }
  }, [editingVehicle]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    return (
      (vehicle.registrationNo
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.currentDriver
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      (typeFilter === "all-types" || vehicle.type === typeFilter) &&
      (statusFilter === "all-status" || vehicle.status === statusFilter) &&
      (sourceFilter === "all-sources" || vehicle.source === sourceFilter)
    );
  });

  const handleEditVehicle = (vehicle: Vehicles) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleCreateVehicle = () => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  };

  const handleViewMaintenanceLog = (vehicle: Vehicles) => {
    setSelectedVehicle(vehicle);
    setIsMaintenanceDialogOpen(true);
  };

  const handleScheduleService = (vehicle: Vehicles) => {
    setSelectedVehicle(vehicle);
    setScheduleServiceFormData({ nextService: vehicle.nextService });
    setIsScheduleServiceDialogOpen(true);
  };

  const handleDeleteVehicle = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      setVehicles(vehicles.filter((v) => v.id !== id));
      setMaintenanceRecords(
        maintenanceRecords.filter((record) => record.vehicleId !== id)
      );
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registrationNo || !formData.make || !formData.model) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (
      Number(formData.year) < 1900 ||
      Number(formData.year) > new Date().getFullYear()
    ) {
      toast.error("Please enter a valid year");
      return;
    }
    if (Number(formData.seatingCapacity) <= 0) {
      toast.error("Seating capacity must be a positive number");
      return;
    }
    if (Number(formData.mileage) < 0) {
      toast.error("Mileage cannot be negative");
      return;
    }
    const vehicleData: Vehicles = {
      id: editingVehicle ? editingVehicle.id : Date.now(),
      registrationNo: formData.registrationNo || "",
      make: formData.make || "",
      model: formData.model || "",
      year: Number(formData.year) || 0,
      type: formData.type || "",
      source: formData.source || "",
      fuelType: formData.fuelType || "",
      seatingCapacity: Number(formData.seatingCapacity) || 0,
      status: formData.status || "",
      currentDriver: formData.currentDriver || "",
      lastService: formData.lastService || "",
      nextService: formData.nextService || "",
      mileage: Number(formData.mileage) || 0,
      insuranceExpiry: formData.insuranceExpiry || "",
    };
    if (editingVehicle) {
      setVehicles(
        vehicles.map((v) => (v.id === editingVehicle.id ? vehicleData : v))
      );
    } else {
      setVehicles([...vehicles, vehicleData]);
    }
    setIsDialogOpen(false);
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    if (
      !maintenanceFormData.date ||
      !maintenanceFormData.description ||
      !maintenanceFormData.cost
    ) {
      alert("Please fill in all maintenance fields");
      return;
    }
    if (Number(maintenanceFormData.cost) < 0) {
      alert("Cost cannot be negative");
      return;
    }
    const newRecord: MaintenanceRecord = {
      id: Date.now(),
      vehicleId: selectedVehicle.id,
      date: maintenanceFormData.date,
      description: maintenanceFormData.description,
      cost: Number(maintenanceFormData.cost),
    };
    setMaintenanceRecords([...maintenanceRecords, newRecord]);
    setMaintenanceFormData({ date: "", description: "", cost: "" });
    // Optionally update lastService if this is a service record
    setVehicles(
      vehicles.map((v) =>
        v.id === selectedVehicle.id
          ? { ...v, lastService: maintenanceFormData.date }
          : v
      )
    );
  };

  const handleScheduleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !scheduleServiceFormData.nextService) {
      alert("Please select a valid service date");
      return;
    }
    const serviceDate = new Date(scheduleServiceFormData.nextService);
    const today = new Date();
    if (serviceDate <= today) {
      alert("Service date must be in the future");
      return;
    }
    setVehicles(
      vehicles.map((v) =>
        v.id === selectedVehicle.id
          ? { ...v, nextService: scheduleServiceFormData.nextService }
          : v
      )
    );
    setIsScheduleServiceDialogOpen(false);
    setScheduleServiceFormData({ nextService: "" });
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string) => {
    const variant =
      status === "Available"
        ? "default"
        : status === "On Trip"
        ? "secondary"
        : status === "Under Repair"
        ? "destructive"
        : "outline";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const variant = source === "Owned" ? "default" : "outline";
    return <Badge variant={variant}>{source}</Badge>;
  };

  const isServiceDue = (nextServiceDate: string) => {
    const service = new Date(nextServiceDate);
    const today = new Date();
    const diffTime = service.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredVehicles.length / pageSize) : 1;
  const paginatedDocuments = filteredVehicles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {vehicle.registrationNo}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {vehicle.type}
                            </Badge>
                            {getSourceBadge(vehicle.source)}
                            <Badge
                              variant="secondary"
                              className="text-xs flex items-center"
                            >
                              <Fuel className="h-3 w-3 mr-1" />
                              {vehicle.fuelType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {vehicle.currentDriver}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.seatingCapacity} seater
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(vehicle.status)}</TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Next: {vehicle.nextService}
                        </div>
                        {isServiceDue(vehicle.nextService) && (
                          <div className="flex items-center text-yellow-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span className="text-xs">Service Due</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-sm">
                        {vehicle.mileage.toLocaleString()} km
                      </span>
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
                            onClick={() => handleEditVehicle(vehicle)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Vehicle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewMaintenanceLog(vehicle)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Maintenance Log
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleScheduleService(vehicle)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Service
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Vehicle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {paginatedDocuments.map((vehicle) => (
              <div
                key={vehicle.id}
                className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{vehicle.registrationNo}</h3>
                  </div>
                  {getStatusBadge(vehicle.status)}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Driver:</span>{" "}
                    <br />
                    {vehicle.currentDriver} ({vehicle.seatingCapacity} seater)
                  </div>

                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    Next Service: {vehicle.nextService}
                  </div>
                  {isServiceDue(vehicle.nextService) && (
                    <div className="flex items-center text-yellow-600 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Service Due
                    </div>
                  )}

                  <div className="flex items-center space-x-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {vehicle.type}
                    </Badge>
                    {getSourceBadge(vehicle.source)}
                    <Badge
                      variant="secondary"
                      className="text-xs flex items-center"
                    >
                      <Fuel className="h-3 w-3 mr-1" /> {vehicle.fuelType}
                    </Badge>
                  </div>

                  <div className="text-sm font-mono mt-1">
                    Mileage: {vehicle.mileage.toLocaleString()} km
                  </div>

                  <div className="text-sm">
                    Make/Model: {vehicle.make} {vehicle.model} ({vehicle.year})
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
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
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
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
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
                of {filteredVehicles.length} documents
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

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:w-[90vw] md:w-[90vw] lg:w-[925px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl overflow-x-hidden">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle
                  ? "Update vehicle information and details"
                  : "Register a new vehicle in the fleet"}
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
                  placeholder="MH-12-AB-1234"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="grid grid-cols-4 items-center gap-6">
                  <Label htmlFor="make" className="text-right col-span-2">
                    Make
                  </Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={handleChange}
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-4 items-center">
                  <Label htmlFor="model" className="text-right col-span-1">
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
              <div className="grid grid-cols-2 gap-8">
                <div className="grid grid-cols-4 items-center gap-6">
                  <Label htmlFor="year" className="text-right col-span-2">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={handleChange}
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right col-span-1">
                    Type
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={handleSelectChange("type")}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="grid grid-cols-4 items-center gap-6">
                  <Label htmlFor="fuelType" className="text-right col-span-2">
                    Fuel Type
                  </Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={handleSelectChange("fuelType")}
                  >
                    <SelectTrigger className="col-span-2">
                      <SelectValue placeholder="Select fuel" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((fuel) => (
                        <SelectItem key={fuel} value={fuel}>
                          {fuel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="source" className="text-right col-span-1">
                    Source
                  </Label>
                  <Select
                    value={formData.source}
                    onValueChange={handleSelectChange("source")}
                  >
                    <SelectTrigger className="col-span-2">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceTypes.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
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
                  placeholder="e.g., 5"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={handleSelectChange("status")}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusTypes.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentDriver" className="text-right">
                  Current Driver
                </Label>
                <Input
                  id="currentDriver"
                  value={formData.currentDriver}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastService" className="text-right">
                  Last Service
                </Label>
                <Input
                  id="lastService"
                  type="date"
                  value={formData.lastService}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nextService" className="text-right">
                  Next Service
                </Label>
                <Input
                  id="nextService"
                  type="date"
                  value={formData.nextService}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mileage" className="text-right">
                  Mileage (km)
                </Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="e.g., 45000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
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
        <DialogContent className="sm:w-[90vw] md:w-[90vw] lg:w-[925px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>
              Maintenance Log for {selectedVehicle?.registrationNo}
            </DialogTitle>
            <DialogDescription>
              View and add maintenance records for this vehicle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Maintenance History</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Cost (Rs.)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords
                    .filter(
                      (record) => record.vehicleId === selectedVehicle?.id
                    )
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.description}</TableCell>
                        <TableCell>{record.cost.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {maintenanceRecords.filter(
                (record) => record.vehicleId === selectedVehicle?.id
              ).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No maintenance records found.
                </p>
              )}
            </div>
            <form onSubmit={handleMaintenanceSubmit}>
              <h3 className="text-lg font-semibold">
                Add New Maintenance Record
              </h3>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={maintenanceFormData.date}
                    onChange={handleMaintenanceChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={maintenanceFormData.description}
                    onChange={handleMaintenanceChange}
                    className="col-span-3"
                    placeholder="e.g., Oil change and tire rotation"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost" className="text-right">
                    Cost (Rs.)
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    value={maintenanceFormData.cost}
                    onChange={handleMaintenanceChange}
                    className="col-span-3"
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Record</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Service Dialog */}
      <Dialog
        open={isScheduleServiceDialogOpen}
        onOpenChange={setIsScheduleServiceDialogOpen}
      >
        <DialogContent className="sm:w-[90vw] md:w-[90vw] lg:w-[600px] p-4 sm:p-6 rounded-2xl">
          <form onSubmit={handleScheduleServiceSubmit}>
            <DialogHeader>
              <DialogTitle>
                Schedule Service for {selectedVehicle?.registrationNo}
              </DialogTitle>
              <DialogDescription>
                Set the next service date for this vehicle.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            </div>
            <DialogFooter>
              <Button type="submit">Schedule Service</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
