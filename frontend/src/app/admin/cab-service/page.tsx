"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Car,
  Phone,
  Mail,
  FileText,
  Globe,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Interface should match the data structure returned by your API.
// `vehicles_count` is a derived property and should be calculated on the backend.
interface CabService {
  id: string;
  name: string;
  code: string;
  type?: string;
  status?: "Active" | "Inactive";
  registration_number?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  primary_contact_email?: string;
  address_street?: string;
  website?: string;
  service_areas?: string[];
  is_24x7?: boolean;
  created_at: string; // This will be our "Joined Date"
  vehicles_count?: number; // Expected from the API, not in the main table schema
}

export default function CabServices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CabService | null>(null);
  const [cabServices, setCabServices] = useState<CabService[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<CabService>>({
    name: "",
    code: "",
    type: "",
    registration_number: "",
    primary_contact_name: "",
    primary_contact_phone: "",
    primary_contact_email: "",
    address_street: "",
    website: "",
    service_areas: [],
    status: "Active",
    is_24x7: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchCabServices();
  }, []);

  const fetchCabServices = async () => {
    try {
      setIsLoading(true);
      // The backend should handle filtering out records where deleted_at is not null
      const res = await fetch("/cab-services", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cab services");
      const data = await res.json();
      setCabServices(data || []);
    } catch (error) {
      console.error("Error fetching cab services:", error);
      toast.error("An error occurred while fetching cab services.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = cabServices.filter(
    (service) =>
      (service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.primary_contact_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        service.registration_number
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all-status" || service.status === statusFilter)
  );

  const handleChange = <K extends keyof CabService>(
    field: K,
    value: CabService[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateService = () => {
    setEditingService(null);
    setFormData({
      name: "",
      code: "",
      type: "",
      registration_number: "",
      primary_contact_name: "",
      primary_contact_phone: "",
      primary_contact_email: "",
      address_street: "",
      website: "",
      service_areas: [],
      status: "Active",
      is_24x7: false,
    });
    setIsDialogOpen(true);
  };

  const handleEditService = (service: CabService) => {
    setEditingService(service);
    setFormData({ ...service });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.service_areas?.length) {
      toast.error("Name, Code, and Service Areas are required.");
      return;
    }

    if (
      formData.primary_contact_phone &&
      !/^\+94\d{9}$/.test(formData.primary_contact_phone)
    ) {
      toast.error("Phone must be in format +94XXXXXXXXX");
      return;
    }

    if (
      formData.primary_contact_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)
    ) {
      toast.error("Invalid email format");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        name: formData.name,
        code: formData.code,
        type: formData.type || null,
        status: formData.status,
        registration_number: formData.registration_number || null,
        primary_contact_name: formData.primary_contact_name || null,
        primary_contact_email: formData.primary_contact_email || null,
        primary_contact_phone: formData.primary_contact_phone || null,
        address_street: formData.address_street || null,
        website: formData.website || null,
        service_areas: formData.service_areas || [],
        is_24x7: formData.is_24x7 || false,
      };
      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const res = await fetch(
        editingService ? `/cab-services/${editingService.id}` : "/cab-services",
        {
          method: editingService ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save cab service");
      }

      await fetchCabServices();
      setIsDialogOpen(false);
      toast.success(
        editingService ? "Updated successfully" : "Created successfully"
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to save cab service");
    } finally {
      setIsLoading(false);
    }
  };

  // Soft delete: updates the 'deleted_at' field instead of removing the record.
// This is the new, correct function
const handleDeactivate = async (id: string, name: string) => {
  if (!confirm(`Are you sure you want to deactivate "${name}"? This can be reversed.`)) return;
  try {
    setIsLoading(true);
    // Use the correct DELETE route
    const res = await fetch(`/cab-services/${id}`, {
      method: "DELETE", // <-- Correct method
      credentials: "include",
      // No body or special headers are needed for this route
    });
    if (!res.ok) throw new Error("Failed to deactivate service");
    await fetchCabServices();
    toast.success("Deactivated successfully");
  } catch (error) {
    console.error(error);
    toast.error("Failed to deactivate cab service");
  } finally {
    setIsLoading(false);
  }
};

  const getStatusBadge = (status?: string) => (
    <Badge variant={status === "Active" ? "default" : "secondary"}>
      {status || "Inactive"}
    </Badge>
  );

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredServices.length / pageSize) : 1;
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-center">
        <div className="p-3">
          <h1 className="text-2xl">CAB SERVICE</h1>
          <p className="text-muted-foreground text-xs">
            Manage cab service providers and their details
          </p>
        </div>
        <Button onClick={handleCreateService} className="hover:bg-cyan-700">
          <Plus className="h-4 w-4" />
          Add Cab Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Providers</CardTitle>
          <CardDescription>
            List of registered cab service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Provider</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Business Reg No</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Joined:{" "}
                            {new Date(service.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {service.primary_contact_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Phone className="h-3 w-3 mr-1" />{" "}
                          {service.primary_contact_phone}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1" />{" "}
                          {service.primary_contact_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-mono">
                          {service.registration_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>{service.vehicles_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditService(service)}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              alert(`Viewing agreements for ${service.name}`)
                            }
                          >
                            <FileText className="h-4 w-4 mr-2" /> Agreements
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeactivate(service.id, service.name)
                            }
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {paginatedServices.map((service) => (
              <div
                key={service.id}
                className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{service.name}</h3>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      Contact:
                    </span>{" "}
                    <br />
                    {service.primary_contact_name} —{" "}
                    {service.primary_contact_phone}
                    <br />
                    {service.primary_contact_email}
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    <span className="text-foreground text-sm">
                      Reg No: {service.registration_number}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(service.created_at).toLocaleDateString()}
                  </p>
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
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          alert(`Viewing agreements for ${service.name}`)
                        }
                      >
                        <FileText className="h-4 w-4 mr-2" /> Agreements
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDeactivate(service.id, service.name)
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Deactivate
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
                of {filteredServices.length} services
              </span>
            </div>
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
        </CardContent>
      </Card>

      {/* Dialog / Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:w-[80vw] md:w-[60vw] lg:w-[625px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Cab Service" : "Add New Cab Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update cab service provider information"
                : "Register a new cab service provider"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Company Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Code */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code || ""}
                onChange={(e) => handleChange("code", e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type || ""}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Taxi">Taxi</SelectItem>
                  <SelectItem value="Ride-sharing">Ride-sharing</SelectItem>
                  <SelectItem value="Luxury">Luxury</SelectItem>
                  <SelectItem value="Airport Transfer">
                    Airport Transfer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Registration Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="registration_number">Business Reg No.</Label>
              <Input
                id="registration_number"
                value={formData.registration_number || ""}
                onChange={(e) =>
                  handleChange("registration_number", e.target.value)
                }
                className="col-span-3"
                placeholder="e.g., BR-123456789"
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="primary_contact_name">Contact Person</Label>
              <Input
                id="primary_contact_name"
                value={formData.primary_contact_name || ""}
                onChange={(e) =>
                  handleChange("primary_contact_name", e.target.value)
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="primary_contact_phone">Phone</Label>
              <Input
                id="primary_contact_phone"
                value={formData.primary_contact_phone || ""}
                onChange={(e) =>
                  handleChange("primary_contact_phone", e.target.value)
                }
                className="col-span-3"
                placeholder="+94XXXXXXXXX"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="primary_contact_email">Email</Label>
              <Input
                id="primary_contact_email"
                value={formData.primary_contact_email || ""}
                onChange={(e) =>
                  handleChange("primary_contact_email", e.target.value)
                }
                className="col-span-3"
              />
            </div>

            {/* Website */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="website">Website</Label>
              <div className="col-span-3 relative">
                <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  value={formData.website || ""}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className="pl-8"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="address_street">Address</Label>
              <Textarea
                id="address_street"
                value={formData.address_street || ""}
                onChange={(e) => handleChange("address_street", e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>

            {/* Service Areas */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="service_areas">
                Service Areas (comma separated)
              </Label>
              <Input
                id="service_areas"
                value={formData.service_areas?.join(", ") || ""}
                onChange={(e) =>
                  handleChange(
                    "service_areas",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                className="col-span-3"
                placeholder="e.g., Colombo, Kandy, Galle"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || ""}
                onValueChange={(value: "Active" | "Inactive") =>
                  handleChange("status", value)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 24x7 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_24x7">24x7 Service</Label>
              <Input
                id="is_24x7"
                type="checkbox"
                checked={!!formData.is_24x7}
                onChange={(e) => handleChange("is_24x7", e.target.checked)}
                className="col-span-3 w-5 h-5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {editingService ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
