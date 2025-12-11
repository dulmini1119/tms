"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { toast } from "sonner"; 
import api from "@/lib/api";

interface Role {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_at: string;
  _count: {
    user_roles: number;
  };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // This function fetches ALL roles from the backend
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      // No pagination params are sent to the backend
      const response = await api.get<{ success: boolean; data: Role[] }>("/roles");
      setRoles(response.data.data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
      setRoles([]); // Ensure roles is an empty array on error
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it always fetches all

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // --- CLIENT-SIDE FILTERING & PAGINATION LOGIC ---
  
  // 1. Filter the roles based on the search term
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Calculate total pages based on the FILTERED list
  const totalPages = Math.ceil(filteredRoles.length / pageSize);

  // 3. Get the roles for the CURRENT PAGE from the FILTERED list
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );
  
  // Reset to page 1 whenever the search term or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);


  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, formData);
        toast.success("Role updated successfully");
      } else {
        await api.post("/roles", formData);
        toast.success("Role created successfully");
      }
      setIsDialogOpen(false);
      setFormData({ name: "", description: "" });
      setEditingRole(null);
      fetchRoles(); // Refetch all roles after a change
    } catch (error: unknown) {
      console.error("Error saving role:", error);
      toast.error("Operation failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role: Role) => {
    if (role.code === "SUPERADMIN") {
      toast.error("Super Admin role cannot be edited");
      return;
    }
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || "" });
    setIsDialogOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (role.code === "SUPERADMIN") {
      toast.error("Super Admin role cannot be deleted");
      return;
    }

    if (!confirm(`Delete role "${role.name}" permanently?`)) return;

    try {
      await api.delete(`/roles/${role.id}`);
      toast.success("Role deleted successfully");
      fetchRoles(); // Refetch all roles after a change
    } catch (error: unknown) {
      console.error("Error deleting role:", error);
      toast.error("Cannot delete role — users are assigned or it's protected");
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({ name: "", description: "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">ROLE MANAGEMENT</h1>
          <p className="text-muted-foreground text-xs">Manage system roles and permissions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>List of all system roles</CardDescription>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading roles...</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Use paginatedRoles here */}
                    {paginatedRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {role.name}
                            {role.code === "SUPERADMIN" && (
                              <Badge variant="secondary">Protected</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-md">
                            {role.description || "No description"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {role._count.user_roles}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {role.code}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEdit(role)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() => handleDelete(role)}
                                disabled={role.code === "SUPERADMIN"}
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {/* Use paginatedRoles here */}
                {paginatedRoles.map((role) => (
                  <Card key={role.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            <h3 className="font-semibold">{role.name}</h3>
                            {role.code === "SUPERADMIN" && <Badge>Protected</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {role.description || "No description"}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" /> {role._count.user_roles}
                            </span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {role.code}
                            </code>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEdit(role)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => handleDelete(role)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredRoles.length)} of {filteredRoles.length} roles
                  </p>
                  <div className="flex items-center gap-3">
                    {/* Page Size Selector */}
                    <Select value={String(pageSize)} onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1); // Reset to first page when size changes
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog - No changes here */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "Update role details" : "Add a new role to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Finance Manager"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description (Optional)</Label>
              <Textarea
                id="desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What can this role do?"
                rows={3}
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}