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
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
  users_business_units_head_idTousers?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  departments?: { name: string }[] | null;
  _count?: {
    users_users_business_unit_idTobusiness_units: number;
  };
}

export default function BusinessUnitsPage() {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => setCurrentPage(1), [debouncedSearch]);

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

const fetchBusinessUnits = useCallback(async () => {
  try {
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(pageSize));
    if (debouncedSearch) params.set("search", debouncedSearch);

    const res = await fetch(`/business-units?${params.toString()}`, {
      headers: getAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Try to parse JSON, but also capture plain text if JSON fails
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.warn("Failed to parse JSON from /business-units response:", parseErr);
      console.log("Response text:", text);
      toast.error("Server returned malformed response (see console).");
      return;
    }

    if (!res.ok) {
      // Show everything helpful in console
      console.error("BUSINESS UNITS ERROR:", {
        status: res.status,
        statusText: res.statusText,
        body: data,
        rawText: text,
      });

      // Try to show a friendly toast message from server
      const serverMsg = data.error?.message || data.message || data?.errors?.[0]?.message;
      toast.error(serverMsg || `Failed to load (status ${res.status})`);
      return;
    }

    // success
    setBusinessUnits(data.data?.businessUnits || []);
    setTotalItems(data.data?.total ?? 0);
    setTotalPages(data.data?.totalPages ?? 1);
  } catch (err) {
     if (err instanceof Error) {
      toast.error("Request timed out. Please try again.");
    } else if (err instanceof TypeError && err.message.includes('fetch')) {
      toast.error("Network error. Please check your connection.");
    } else {
      toast.error("Failed to load business units");
    }
    console.error("Error fetching business units:", err);
  } finally {
    setLoading(false);
  }
}, [currentPage, debouncedSearch, pageSize]);


  useEffect(() => {
    fetchBusinessUnits();
  }, [fetchBusinessUnits]);

  const handleCreate = () => {
    setEditingUnit(null);
    setFormData({ name: "", code: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (unit: BusinessUnit) => {
    setEditingUnit(unit);
    setFormData({ name: unit.name, code: unit.code });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return toast.error("Name is required");

    const url = editingUnit ? `/business-units/${editingUnit.id}` : "/business-units";
    const method = editingUnit ? "PUT" : "POST";
    const actionType = editingUnit ? "updating" : "creating";

    try {
      setActionLoading(actionType);
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: formData.name.trim(), code: formData.code.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.message || "Operation failed");
      }

      toast.success(editingUnit ? "Updated successfully" : "Created successfully");
      fetchBusinessUnits();
      setIsDialogOpen(false);
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this business unit permanently?")) return;

    try {
      const res = await fetch(`/business-units/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) return toast.error(data.message || "Delete failed");

      toast.success("Deleted successfully");
      fetchBusinessUnits();
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  };



  if (loading && businessUnits.length === 0)
    return <div className="flex justify-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">BUSINESS UNITS</h1>
          <p className="text-muted-foreground text-sm">
            Manage organizational business units
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Business Unit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Units List</CardTitle>
          <CardDescription>
            All business units in the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No business units found
                    </TableCell>
                  </TableRow>
                ) : (
                  businessUnits.map((bu) => (
                    <TableRow key={bu.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {bu.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bu.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {bu.users_business_units_head_idTousers ? (
                          <div>
                            <div className="font-medium">
                              {bu.users_business_units_head_idTousers.first_name}{" "}
                              {bu.users_business_units_head_idTousers.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {bu.users_business_units_head_idTousers.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No manager</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {bu._count?.users_users_business_unit_idTobusiness_units || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(bu)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(bu.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Business Unit" : "Create Business Unit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Technology Division"
              />
            </div>
            <div className="space-y-2">
              <Label>Code (optional)</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., TECH"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!!actionLoading}>
              {actionLoading === 'updating' || actionLoading === 'creating'
              ? "Processing..."
            : editingUnit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}