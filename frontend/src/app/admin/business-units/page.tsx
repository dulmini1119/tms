"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Building,
  Briefcase,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BusinessUnits {
  id: number;
  name: string;
  code: string;
  manager: string;
  managerEmail: string;
  department: string;
  employeeCount: number;
  budget: number;
  established: string;
}

const initialBusinessUnits: BusinessUnits[] = [
  {
    id: 1,
    name: "Technology",
    code: "TECH",
    manager: "John Smith",
    managerEmail: "john.smith@company.com",
    department: "Information Technology",
    employeeCount: 78,
    budget: 5500000,
    established: "2020-01-01",
  },
  {
    id: 2,
    name: "Sales & Marketing",
    code: "SM",
    manager: "Sarah Johnson",
    managerEmail: "sarah.johnson@company.com",
    department: "Marketing",
    employeeCount: 56,
    budget: 3200000,
    established: "2020-01-01",
  },
  {
    id: 3,
    name: "Administration",
    code: "ADMIN",
    manager: "Mike Wilson",
    managerEmail: "mike.wilson@company.com",
    department: "Human Resources",
    employeeCount: 42,
    budget: 2100000,
    established: "2020-01-01",
  },
  {
    id: 4,
    name: "Finance",
    code: "FIN",
    manager: "Emily Davis",
    managerEmail: "emily.davis@company.com",
    department: "Finance",
    employeeCount: 35,
    budget: 1800000,
    established: "2020-01-01",
  },
  {
    id: 5,
    name: "Operations",
    code: "OPS",
    manager: "David Brown",
    managerEmail: "david.brown@company.com",
    department: "Operations",
    employeeCount: 89,
    budget: 4200000,
    established: "2020-01-01",
  },
];

const availableManagers = [
  "John Smith",
  "Sarah Johnson",
  "Mike Wilson",
  "Emily Davis",
  "David Brown",
  "Lisa Anderson",
  "Tom Garcia",
  "Maria Rodriguez",
];

const availableDepartments = [
  "Information Technology",
  "Marketing",
  "Sales",
  "Human Resources",
  "Legal",
  "Facilities",
  "Finance",
  "Accounting",
  "Treasury",
  "Operations",
  "Supply Chain",
  "Quality",
];

export default function BusinessUnits() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBU, setEditingBU] = useState<BusinessUnits | null>(null);
  const [businessUnits, setBusinessUnits] =
    useState<BusinessUnits[]>(initialBusinessUnits);
  const [formData, setFormData] = useState<Partial<BusinessUnits>>({
    id: 0,
    name: "",
    code: "",
    manager: "",
    managerEmail: "",
    department: "",
    budget: 0,
    established: new Date().toISOString().split("T")[0],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Simulate fetching employeeCount from a backend
  useEffect(() => {
    // Replace this with an actual API call to fetch employee counts
    const fetchEmployeeCounts = async () => {
      // Mock API response: { businessUnitId: number, employeeCount: number }[]
      const mockResponse = [
        { businessUnitId: 1, employeeCount: 78 },
        { businessUnitId: 2, employeeCount: 56 },
        { businessUnitId: 3, employeeCount: 42 },
        { businessUnitId: 4, employeeCount: 35 },
        { businessUnitId: 5, employeeCount: 89 },
      ];

      setBusinessUnits((prev) =>
        prev.map((bu) => {
          const count =
            mockResponse.find((r) => r.businessUnitId === bu.id)
              ?.employeeCount || bu.employeeCount;
          return { ...bu, employeeCount: count };
        })
      );
    };

    fetchEmployeeCounts();
  }, []);

  const filteredBusinessUnits = businessUnits.filter(
    (bu) =>
      bu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bu.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bu.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bu.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditBU = (bu: BusinessUnits) => {
    setEditingBU(bu);
    setFormData({
      id: bu.id,
      name: bu.name,
      code: bu.code,
      manager: bu.manager,
      managerEmail: bu.managerEmail,
      department: bu.department,
      budget: bu.budget,
      established: bu.established,
    });
    setIsDialogOpen(true);
  };

  const handleCreateBU = () => {
    setEditingBU(null);
    setFormData({
      id: 0,
      name: "",
      code: "",
      manager: "",
      managerEmail: "",
      department: "",
      budget: 0,
      established: new Date().toISOString().split("T")[0],
    });
    setIsDialogOpen(true);
  };

  const handleChange = (field: keyof BusinessUnits, value: string | number) => {
    setFormData((prev) => {
      const newManagerEmail =
        field === "manager" &&
        typeof value === "string" &&
        value.trim() &&
        value.includes(" ")
          ? `${value.trim().toLowerCase().replace(/\s+/g, ".")}@company.com`
          : prev.managerEmail;

      return {
        ...prev,
        [field]: value,
        managerEmail: newManagerEmail,
      };
    });
  };

  const handleSubmit = () => {
    if (
      !formData.name ||
      !formData.code ||
      !formData.manager ||
      !formData.department
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingBU) {
      setBusinessUnits((prev) =>
        prev.map((bu) =>
          bu.id === editingBU.id
            ? { ...bu, ...formData, id: bu.id, employeeCount: bu.employeeCount }
            : bu
        )
      );
    } else {
      setBusinessUnits((prev) => [
        ...prev,
        {
          ...formData,
          id: prev.length + 1,
          employeeCount: 0, // Default to 0; will be updated by system
          established:
            formData.established || new Date().toISOString().split("T")[0],
        } as BusinessUnits,
      ]);
    }
    setIsDialogOpen(false);
    setFormData({
      id: 0,
      name: "",
      code: "",
      manager: "",
      managerEmail: "",
      department: "",
      budget: 0,
      established: new Date().toISOString().split("T")[0],
    });
  };

  const handleDelete = (id: number) => {
    setBusinessUnits((prev) => prev.filter((bu) => bu.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${new Intl.NumberFormat("en-LK", {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredBusinessUnits.length / pageSize) : 1;
  const paginatedDocuments = filteredBusinessUnits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">BUSINESS UNITS</h1>
          <p className="text-muted-foreground text-xs">
            Manage business units and their departmental structure
          </p>
        </div>
        <Button onClick={handleCreateBU}>
          <Plus className="h-4 w-4" />
          Add Business Unit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Units</CardTitle>
          <CardDescription>
            Overview of all business units in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search business units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocuments.map((bu) => (
                    <TableRow key={bu.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{bu.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {bu.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium">{bu.manager}</div>
                          <div className="text-sm text-muted-foreground">
                            {bu.managerEmail}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {bu.department}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{bu.employeeCount}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(bu.budget)}
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
                            <DropdownMenuItem onClick={() => handleEditBU(bu)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(bu.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {paginatedDocuments.map((bu) => (
              <div
                key={bu.id}
                className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">{bu.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {bu.code}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditBU(bu)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(bu.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Manager:
                    </p>
                    <p>{bu.manager}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Email:</p>
                    <p className="truncate">{bu.managerEmail}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Department:
                    </p>
                    <p>{bu.department}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Employees:
                    </p>
                    <p>{bu.employeeCount}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Budget:</p>
                    <p>{formatCurrency(bu.budget)}</p>
                  </div>
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
                of {filteredBusinessUnits.length} documents
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingBU ? "Edit Business Unit" : "Create New Business Unit"}
            </DialogTitle>
            <DialogDescription>
              {editingBU
                ? "Update business unit information and settings"
                : "Add a new business unit to the organization"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                value={formData.code || ""}
                onChange={(e) => handleChange("code", e.target.value)}
                className="col-span-3"
                placeholder="e.g., TECH, SM, ADMIN"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">
                Manager
              </Label>
              <Select
                value={formData.manager || ""}
                onValueChange={(value) => handleChange("manager", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {availableManagers.map((manager) => (
                    <SelectItem key={manager} value={manager}>
                      {manager}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Select
                value={formData.department || ""}
                onValueChange={(value) => handleChange("department", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget" className="text-right">
                Budget (Rs.)
              </Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget || ""}
                onChange={(e) => handleChange("budget", Number(e.target.value))}
                className="col-span-3"
                placeholder="Annual budget"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="established" className="text-right">
                Established
              </Label>
              <Input
                id="established"
                type="date"
                value={formData.established || ""}
                onChange={(e) => handleChange("established", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSubmit}>
              {editingBU ? "Update Business Unit" : "Create Business Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
