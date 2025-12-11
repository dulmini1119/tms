"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Building,
  Users,
  DollarSign,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: string | null;
  status: string;
  business_unit_id: string | null;
  head_id: string | null;
  budget_allocated: number | null;
  budget_utilized: number | null;
  budget_currency: string | null;
  fiscal_year: string | null;
  created_at: string;
  updated_at: string;
  business_units?: {
    id: string;
    name: string;
    code: string;
  } | null;
  users_departments_head_idTousers?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  _count?: {
    users_users_department_idTodepartments: number;
    vehicles: number;
    trip_requests: number;
  };
}

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [potentialHeads, setPotentialHeads] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [businessUnitFilter, setBusinessUnitFilter] =
    useState("all-business-units");
  const [statusFilter, setStatusFilter] = useState("all-status");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    type: "",
    status: "Active",
    business_unit_id: "",
    head_id: "",
    budget_allocated: "",
    budget_currency: "USD",
    fiscal_year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, businessUnitFilter, statusFilter]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append("page", currentPage.toString());
      query.append("limit", pageSize.toString());
      if (debouncedSearch) query.append("search", debouncedSearch);
      if (businessUnitFilter !== "all-business-units")
        query.append("business_unit_id", businessUnitFilter);
      if (statusFilter !== "all-status") query.append("status", statusFilter);

      const res = await fetch(`/departments?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const messages = Object.values(data.details).join(", ");
          return toast.error(messages);
        }
        return toast.error(data.message || "Failed to fetch departments");
      }

      setDepartments(data.data?.departments || []);
      setTotalDepartments(data.data?.total || 0);
      setTotalPages(data.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    businessUnitFilter,
    statusFilter,
    currentPage,
    pageSize,
  ]);

  const fetchBusinessUnits = useCallback(async () => {
    try {
      const res = await fetch(`/business-units`, { headers: getAuthHeaders() });
      const data = await res.json();

      if (!res.ok || !data.success)
        return toast.error("Failed to fetch business units");

      // Extract the array from the paginated response
      const units = Array.isArray(data.data.businessUnits)
        ? data.data.businessUnits
        : [];

      // Optional: add a "None" option at the top
      setBusinessUnits([{ id: "", name: "None" }, ...units]);

      console.log("Business Units Data:", units);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch business units");
    }
  }, []);

  const fetchPotentialHeads = useCallback(async () => {
    try {
      const res = await fetch(`/users?forDepartmentHead=true`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok)
        return toast.error("Failed to fetch potential department heads");

      console.log("Fetched Potential Heads:", data.data); // confirm structure

      setPotentialHeads(Array.isArray(data.data.users) ? data.data.users : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch potential department heads");
    }
  }, []);

  useEffect(() => {
    fetchBusinessUnits();
    fetchPotentialHeads();
    fetchDepartments();
  }, [fetchBusinessUnits, fetchPotentialHeads, fetchDepartments]);

  // --- HANDLERS ---

  const validateForm = () => {
    if (!formData.name.trim()) return "Department name is required";
    if (!formData.code.trim()) return "Department code is required";
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) return toast.error(error);

    const url = editingDepartment
      ? `/departments/${editingDepartment.id}`
      : "/departments";
    const method = editingDepartment ? "PUT" : "POST";

    const payload = {
      name: formData.name,
      code: formData.code,
      description: formData.description || null,
      type: formData.type || null,
      status: formData.status,
      business_unit_id: formData.business_unit_id || null,
      head_id: formData.head_id || null,
      budget_allocated: formData.budget_allocated
        ? parseFloat(formData.budget_allocated)
        : null,
      budget_currency: formData.budget_currency || null,
      fiscal_year: formData.fiscal_year || null,
    };

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.success === false && data.error && data.error.details) {
          const messages = Object.values(data.error.details).join(", ");
          return toast.error(messages);
        }
        return toast.error(
          data.error?.message || data.message || "Something went wrong"
        );
      }

      toast.success(
        editingDepartment ? "Department updated" : "Department created"
      );
      fetchDepartments();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this department permanently? This action cannot be undone."
      )
    )
      return;
    try {
      const res = await fetch(`/departments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return toast.error(data.message || "Failed to delete department");
      }
      toast.success("Department deleted");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete department");
    }
  };

  const resetForm = () => {
    setEditingDepartment(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      type: "",
      status: "Active",
      business_unit_id: "",
      head_id: "",
      budget_allocated: "",
      budget_currency: "USD",
      fiscal_year: new Date().getFullYear().toString(),
    });
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || "",
      type: department.type || "",
      status: department.status,
      business_unit_id: department.business_unit_id || "",
      head_id: department.head_id || "",
      budget_allocated: department.budget_allocated?.toString() || "",
      budget_currency: department.budget_currency || "USD",
      fiscal_year:
        department.fiscal_year || new Date().getFullYear().toString(),
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => (
    <Badge
      variant={status.toLowerCase() === "active" ? "default" : "secondary"}
    >
      {status}
    </Badge>
  );

  const formatCurrency = (
    amount: number | null,
    currency: string | null = "USD"
  ) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(Number(amount));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        Loading departments...
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">DEPARTMENT MANAGEMENT</h1>
          <p className="text-muted-foreground text-xs">
            Manage departments, their heads, and budget allocations
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            A list of all departments in your organization
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4 mb-6 lg:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={businessUnitFilter}
              onValueChange={setBusinessUnitFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Business Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-business-units">
                  All Business Units
                </SelectItem>
                {businessUnits
                  .filter((bu) => bu.id && bu.id !== "")
                  .map((bu) => (
                    <SelectItem key={bu.id} value={bu.id}>
                      {bu.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Business Unit</TableHead>
                  <TableHead>Department Head</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {dept.description || "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{dept.code}</Badge>
                    </TableCell>

                    <TableCell>{dept.business_units?.name || "-"}</TableCell>

                    <TableCell>
                      {dept.users_departments_head_idTousers ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {dept.users_departments_head_idTousers.first_name}{" "}
                            {dept.users_departments_head_idTousers.last_name}
                          </span>

                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No Head Assigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {formatCurrency(
                        dept.budget_allocated,
                        dept.budget_currency
                      )}
                    </TableCell>

                    <TableCell>{getStatusBadge(dept.status)}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(dept)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(dept.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="lg:hidden space-y-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="border rounded-lg p-4 shadow-sm bg-white dark:bg-neutral-900"
              >
                {/* NAME + CODE */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{dept.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {dept.description || "-"}
                    </div>
                  </div>
                  <Badge variant="outline">{dept.code}</Badge>
                </div>

                {/* INFO */}
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {dept.business_units?.name || "-"}
                  </div>

                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {dept.users_departments_head_idTousers ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {dept.users_departments_head_idTousers.first_name}{" "}
                          {dept.users_departments_head_idTousers.last_name}
                        </span>

                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        No Head Assigned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {formatCurrency(
                      dept.budget_allocated,
                      dept.budget_currency
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(dept.status)}
                  </div>

                  {dept._count && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-lg font-bold">
                          {dept._count.users_users_department_idTodepartments}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Users
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-lg font-bold">
                          {dept._count.vehicles}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vehicles
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-lg font-bold">
                          {dept._count.trip_requests}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Trips
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex justify-end mt-4 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(dept)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(dept.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, totalDepartments)} of{" "}
              {totalDepartments} departments
            </div>

            <div className="flex items-center gap-3">
              {/* Page Size */}
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              {/* Previous */}
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              {/* Page Numbers */}
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>

              {/* Next */}
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "Create Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Update department details"
                : "Fill details to create a department"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Name */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Code */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Code</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Type */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Type</Label>
              <Input
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Business Unit */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Business Unit</Label>
              <Select
                value={formData.business_unit_id ?? undefined}
                onValueChange={(v) =>
                  setFormData({ ...formData, business_unit_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {businessUnits
                    .filter((bu) => bu.id && bu.id !== "") // ensure value is non-empty
                    .map((bu) => (
                      <SelectItem key={bu.id} value={bu.id}>
                        {bu.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Head */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Department Head</Label>
              <Select
                value={formData.head_id ?? undefined}
                onValueChange={(v) => setFormData({ ...formData, head_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {potentialHeads
                    .filter((user) => user.position === "HOD")
                    .sort((a, b) =>
                      `${a.first_name} ${a.last_name}`.localeCompare(
                        `${b.first_name} ${b.last_name}`
                      )
                    )
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center justify-between w-full pr-2">
                          <span className="font-medium">
                            {user.first_name} {user.last_name}
                          </span>
                          <Badge variant="secondary" className="ml-3 text-xs">
                            HOD
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Budget Allocated */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Budget</Label>
              <Input
                type="number"
                value={formData.budget_allocated}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget_allocated: e.target.value,
                  })
                }
              />
            </div>

            {/* Currency */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Currency</Label>
              <Select
                value={formData.budget_currency}
                onValueChange={(v) =>
                  setFormData({ ...formData, budget_currency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LKR">LKR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fiscal Year */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right">Fiscal Year</Label>
              <Input
                value={formData.fiscal_year}
                onChange={(e) =>
                  setFormData({ ...formData, fiscal_year: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit}>
              {editingDepartment ? "Update Department" : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
