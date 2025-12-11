"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
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

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string;
  employee_id: string;
  status: string;
  last_login: string | null;
}

interface Role {
  name: string;
  id: string;
  code: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [roleFilter, setRoleFilter] = useState("all-roles");
  const [statusFilter, setStatusFilter] = useState("all-status");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    employeeId: "",
    password: "",
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append("page", currentPage.toString());
      query.append("limit", pageSize.toString());
      if (debouncedSearch) query.append("search", debouncedSearch);
      if (roleFilter !== "all-roles") query.append("role", roleFilter);
      if (statusFilter !== "all-status") query.append("status", statusFilter);

      const res = await fetch(`/users?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const messages = Object.values(data.details).join(", ");
          return toast.error(messages);
        }
        return toast.error(data.message || "Failed to fetch users");
      }

      setUsers(data.data?.users || []);
      setTotalUsers(data.data?.pagination?.total || 0);
      setTotalPages(Math.ceil((data.data?.pagination?.total || 0) / pageSize));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, currentPage, pageSize]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`/roles`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) return toast.error("Failed to fetch roles");
      setRoles(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch roles");
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  const validateForm = () => {
    if (!formData.firstName.trim()) return "First Name is required";
    if (!formData.lastName.trim()) return "Last Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.role.trim()) return "Role is required";
    if (!formData.employeeId.trim()) return "Employee ID is required";
    if (!editingUser && !formData.password.trim())
      return "Password is required";
    return null;
  };

  // Add this function inside your Users component, before the handleSubmit function
  const mapRoleToBackendFormat = (roleCode: string): string => {
    const roleMap: { [key: string]: string } = {
      superadmin: "SUPERADMIN",
      vehicleadmin: "VEHICLE_ADMIN", // This is the key fix
      manager: "MANAGER",
      hod: "HOD",
      employee: "EMPLOYEE",
      driver: "DRIVER",
    };
    // Return the mapped value, or the original uppercase version as a fallback
    return roleMap[roleCode.toLowerCase()] || roleCode.toUpperCase();
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) return toast.error(error);

    const url = editingUser ? `/users/${editingUser.id}` : "/users";
    const method = editingUser ? "PUT" : "POST";

    const payload = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || null,
      position: mapRoleToBackendFormat(formData.role),
      employeeId: formData.employeeId,
      ...(editingUser ? {} : { password: formData.password }),
    };

    console.log("Submitting Payload: ", payload);

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("Server Response: ", data);

      if (!res.ok) {
        if (data.success === false && data.error && data.error.details) {
          const messages = Object.values(data.error.details).join(", ");
          return toast.error(messages);
        }
        return toast.error(
          data.error?.message || data.message || "Something went wrong"
        );
      }

      toast.success(editingUser ? "User updated" : "User created");
      fetchUsers();
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
    if (!confirm("Delete this user permanently?")) return;
    try {
      const res = await fetch(`/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const res = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Password reset email sent");
    } catch {
      toast.error("Failed to send reset email");
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      employeeId: "",
      password: "",
    });
  };

  const openEditDialog = (user: User) => {
    console.log("Editing User: ", user);
    console.log("User Position: ", user.position);
    setEditingUser(user);
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone || "",
      role: user.position,
      employeeId: user.employee_id,
      password: "",
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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        Loading users...
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">USER MANAGEMENT</h1>
          <p className="text-muted-foreground text-xs">
            Manage users, their roles, and access permissions
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A list of all users in your organization
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4 mb-6 lg:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-roles">All Roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.code}>
                    {r.name}
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
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {u.email}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {u.phone || "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{u.position}</Badge>
                    </TableCell>

                    <TableCell>{u.employee_id}</TableCell>

                    <TableCell>{getStatusBadge(u.status)}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_login
                        ? new Date(u.last_login).toLocaleString()
                        : "Never"}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(u)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleResetPassword(u.email)}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" /> Reset
                            Password
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(u.id)}
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
            {users.map((u) => (
              <div
                key={u.id}
                className="border rounded-lg p-4 shadow-sm bg-white dark:bg-neutral-900"
              >
                {/* NAME + EMAIL */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">
                      {u.first_name} {u.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <Mail className="h-3 w-3 mr-1" /> {u.email}
                    </div>
                  </div>

                  <Badge variant="outline">{u.position}</Badge>
                </div>

                {/* INFO */}
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" /> {u.phone || "-"}
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Employee ID:</span>
                    {u.employee_id}
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(u.status)}
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Last Login:</span>
                    {u.last_login
                      ? new Date(u.last_login).toLocaleString()
                      : "Never"}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex justify-end mt-4 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(u)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetPassword(u.email)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Reset
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(u.id)}
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
    {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
  </div>

  <div className="flex items-center gap-3">

    {/* Page Size */}
    <Select value={String(pageSize)} onValueChange={(value) => {
      setPageSize(Number(value));
      setCurrentPage(1);
    }}>
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
      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
    >
      Next
    </Button>
  </div>
</div>

        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user details"
                : "Fill details to create a user"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {[
              ["First Name", "firstName"],
              ["Last Name", "lastName"],
              ["Email", "email"],
              ["Phone", "phone"],
              ["Employee ID", "employeeId"],
            ].map(([label, key]) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{label}</Label>
                <Input
                  className="col-span-3"
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                />
              </div>
            ))}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!editingUser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Password</Label>
                <Input
                  type="password"
                  className="col-span-3"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit}>
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
