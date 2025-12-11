"use client";
import React, { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Download,
  Upload,
  Calendar,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Agreement {
  id: number;
  agreementNo: string;
  cabService: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Pending";
  ratePerKm: number;
  minimumFare: number;
  waitingCharges: number;
  nightCharges: number;
  documentFile: File | null;
  signedDate: string;
  renewalDue: string;
}

const initialAgreements: Agreement[] = [
  {
    id: 1,
    agreementNo: "AGR-2024-001",
    cabService: "City Cabs Ltd",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "Active",
    ratePerKm: 12,
    minimumFare: 150,
    waitingCharges: 2,
    nightCharges: 25,
    documentFile: null, // In a real app, this would be a File instance from backend
    signedDate: "2023-12-20",
    renewalDue: "2024-10-01",
  },
  {
    id: 2,
    agreementNo: "AGR-2024-002",
    cabService: "Swift Transport Co",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    status: "Active",
    ratePerKm: 15,
    minimumFare: 200,
    waitingCharges: 3,
    nightCharges: 30,
    documentFile: null,
    signedDate: "2024-02-15",
    renewalDue: "2024-12-01",
  },
  {
    id: 3,
    agreementNo: "AGR-2023-005",
    cabService: "Metro Cab Services",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    status: "Expired",
    ratePerKm: 10,
    minimumFare: 120,
    waitingCharges: 1.5,
    nightCharges: 20,
    documentFile: null,
    signedDate: "2023-05-15",
    renewalDue: "2024-03-01",
  },
  {
    id: 4,
    agreementNo: "AGR-2024-003",
    cabService: "Express Wheels",
    startDate: "2024-08-01",
    endDate: "2025-07-31",
    status: "Active",
    ratePerKm: 18,
    minimumFare: 250,
    waitingCharges: 4,
    nightCharges: 35,
    documentFile: null,
    signedDate: "2024-07-20",
    renewalDue: "2025-05-01",
  },
];

const cabServices = [
  "City Cabs Ltd",
  "Swift Transport Co",
  "Metro Cab Services",
  "Express Wheels",
  "Royal Travels",
  "Prime Cabs",
];

export default function CabAgreements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(
    null
  );
  const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements);
  const [formData, setFormData] = useState<Partial<Agreement>>({
    agreementNo: "",
    cabService: "",
    startDate: "",
    endDate: "",
    status: "Active",
    ratePerKm: 0,
    minimumFare: 0,
    waitingCharges: 0,
    nightCharges: 0,
    documentFile: null,
    signedDate: "",
    renewalDue: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAgreements = agreements.filter(
    (agreement) =>
      (agreement.agreementNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.cabService
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all-status" || agreement.status === statusFilter)
  );

  const handleEditAgreement = (agreement: Agreement) => {
    setEditingAgreement(agreement);
    setFormData(agreement);
    setIsDialogOpen(true);
  };

  const handleCreateAgreement = () => {
    setEditingAgreement(null);
    setFormData({
      agreementNo: "",
      cabService: "",
      startDate: "",
      endDate: "",
      status: "Active",
      ratePerKm: 0,
      minimumFare: 0,
      waitingCharges: 0,
      nightCharges: 0,
      documentFile: null,
      signedDate: "",
      renewalDue: "",
    });
    setIsDialogOpen(true);
  };

  const handleChange = (
    field: keyof Agreement,
    value: string | number | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleChange("documentFile", file);
  };

  const handleSubmit = () => {
    if (
      !formData.agreementNo ||
      !formData.cabService ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.status ||
      formData.ratePerKm === undefined ||
      formData.minimumFare === undefined ||
      formData.waitingCharges === undefined ||
      formData.nightCharges === undefined ||
      !formData.documentFile ||
      !formData.signedDate ||
      !formData.renewalDue
    ) {
      alert("Please fill in all required fields, including the document file.");
      return;
    }
    if (
      isNaN(new Date(formData.startDate).getTime()) ||
      isNaN(new Date(formData.endDate).getTime())
    ) {
      alert("Please provide valid start and end dates.");
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert("End date must be after start date.");
      return;
    }
    if (isNaN(new Date(formData.signedDate).getTime())) {
      alert("Please provide a valid signed date.");
      return;
    }
    if (isNaN(new Date(formData.renewalDue).getTime())) {
      alert("Please provide a valid renewal due date.");
      return;
    }
    if (
      formData.ratePerKm < 0 ||
      formData.minimumFare < 0 ||
      formData.waitingCharges < 0 ||
      formData.nightCharges < 0
    ) {
      alert("Rates and charges must be non-negative.");
      return;
    }
    if (
      agreements.some(
        (agreement) =>
          agreement.agreementNo === formData.agreementNo &&
          (!editingAgreement || agreement.id !== editingAgreement.id)
      )
    ) {
      alert("Agreement number must be unique.");
      return;
    }
    if (
      formData.documentFile &&
      formData.documentFile.type !== "application/pdf"
    ) {
      alert("Please upload a PDF file.");
      return;
    }

    if (editingAgreement) {
      setAgreements((prev) =>
        prev.map((agreement) =>
          agreement.id === editingAgreement.id
            ? { ...agreement, ...formData }
            : agreement
        )
      );
    } else {
      setAgreements((prev) => [
        ...prev,
        {
          ...formData,
          id: prev.length + 1,
        } as Agreement,
      ]);
    }
    setIsDialogOpen(false);
    setFormData({
      agreementNo: "",
      cabService: "",
      startDate: "",
      endDate: "",
      status: "Active",
      ratePerKm: 0,
      minimumFare: 0,
      waitingCharges: 0,
      nightCharges: 0,
      documentFile: null,
      signedDate: "",
      renewalDue: "",
    });
  };

  const handleDeleteAgreement = (id: number) => {
    setAgreements((prev) => prev.filter((agreement) => agreement.id !== id));
  };

  const handleDownloadAgreement = (documentFile: File | null) => {
    if (documentFile) {
      const url = URL.createObjectURL(documentFile);
      const link = document.createElement("a");
      link.href = url;
      link.download = documentFile.name;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert("No document file available for download.");
    }
  };

  const handleUploadNewVersion = (id: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      if (file) {
        if (file.type !== "application/pdf") {
          alert("Please upload a PDF file.");
          return;
        }
        setAgreements((prev) =>
          prev.map((agreement) =>
            agreement.id === id
              ? { ...agreement, documentFile: file }
              : agreement
          )
        );
      }
    };
    input.click();
  };

  const getStatusBadge = (status: string) => {
    const variant =
      status === "Active"
        ? "default"
        : status === "Expired"
        ? "destructive"
        : "secondary";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const isRenewalDue = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredAgreements.length / pageSize) : 1;
  const paginatedDocuments = filteredAgreements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">CAB AGREEMENTS</h1>
          <p className="text-muted-foreground text-xs">
            Manage agreements with cab service providers
          </p>
        </div>
        <Button onClick={handleCreateAgreement} className="hover:bg-cyan-700">
          <Plus className="h-4 w-4" />
          Add Agreement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Agreements</CardTitle>
          <CardDescription>
            Active and expired agreements with service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agreements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Cab Service</TableHead>
                  <TableHead>Validity Period</TableHead>
                  <TableHead>Rates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewal Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {agreement.agreementNo}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Signed: {agreement.signedDate}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {agreement.cabService}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {agreement.startDate} to {agreement.endDate}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>Rs.{agreement.ratePerKm}/km</div>
                      <div>Min: Rs.{agreement.minimumFare}</div>
                      <div>Wait: Rs.{agreement.waitingCharges}/min</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {isRenewalDue(agreement.renewalDue) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">{agreement.renewalDue}</span>
                      </div>
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
                            onClick={() =>
                              handleDownloadAgreement(agreement.documentFile)
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Agreement
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditAgreement(agreement)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Agreement
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUploadNewVersion(agreement.id)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Version
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAgreement(agreement.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Agreement
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
            {paginatedDocuments.map((agreement) => (
              <div
                key={agreement.id}
                className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{agreement.agreementNo}</h3>
                  </div>
                  {getStatusBadge(agreement.status)}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      Cab Service:
                    </span>{" "}
                    <br />
                    {agreement.cabService}
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {agreement.startDate} to {agreement.endDate}
                  </div>

                  <div className="space-y-1">
                    <div>Rs.{agreement.ratePerKm}/km</div>
                    <div>Min: Rs.{agreement.minimumFare}</div>
                    <div>Wait: Rs.{agreement.waitingCharges}/min</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isRenewalDue(agreement.renewalDue) && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span>Renewal Due: {agreement.renewalDue}</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Signed: {agreement.signedDate}
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
                        onClick={() =>
                          handleDownloadAgreement(agreement.documentFile)
                        }
                      >
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditAgreement(agreement)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleUploadNewVersion(agreement.id)}
                      >
                        <Upload className="h-4 w-4 mr-2" /> Upload Version
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteAgreement(agreement.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                of {filteredAgreements.length} documents
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
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingAgreement ? "Edit Agreement" : "Create New Agreement"}
            </DialogTitle>
            <DialogDescription>
              {editingAgreement
                ? "Update agreement details and rates"
                : "Create a new agreement with a cab service provider"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <Label htmlFor="agreementNo" className="text-left sm:text-right">
                Agreement No.
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="agreementNo"
                  value={formData.agreementNo || ""}
                  onChange={(e) => handleChange("agreementNo", e.target.value)}
                  className="w-full"
                  placeholder="AGR-2024-XXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <Label htmlFor="cabService" className="text-left sm:text-right">
                Cab Service
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Select
                  value={formData.cabService || ""}
                  onValueChange={(value) => handleChange("cabService", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select cab service" />
                  </SelectTrigger>
                  <SelectContent>
                    {cabServices.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <Label htmlFor="startDate" className="text-left sm:text-right">
                Start Date
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <Label htmlFor="endDate" className="text-left sm:text-right">
                End Date
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <Label htmlFor="status" className="text-left sm:text-right">
                Status
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Select
                  value={formData.status || ""}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <Label
                  htmlFor="ratePerKm"
                  className="text-left sm:text-right col-span-1 sm:col-span-2"
                >
                  Rate/Km (Rs.)
                </Label>
                <div className="col-span-1 sm:col-span-2">
                  <Input
                    id="ratePerKm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.ratePerKm || ""}
                    onChange={(e) =>
                      handleChange("ratePerKm", Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <Label
                  htmlFor="minimumFare"
                  className="text-left sm:text-right col-span-1 sm:col-span-2"
                >
                  Min Fare (Rs.)
                </Label>
                <div className="col-span-1 sm:col-span-2">
                  <Input
                    id="minimumFare"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.minimumFare || ""}
                    onChange={(e) =>
                      handleChange("minimumFare", Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <Label
                  htmlFor="waitingCharges"
                  className="col-span-1 sm:col-span-2"
                >
                  Waiting Charges (Rs./min)
                </Label>
                <div className="col-span-1 sm:col-span-2">
                  <Input
                    id="waitingCharges"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.waitingCharges || ""}
                    onChange={(e) =>
                      handleChange("waitingCharges", Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <Label
                  htmlFor="nightCharges"
                  className="col-span-1 sm:col-span-2"
                >
                  Night Charges (Rs.)
                </Label>
                <div className="col-span-1 sm:col-span-2">
                  <Input
                    id="nightCharges"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.nightCharges || ""}
                    onChange={(e) =>
                      handleChange("nightCharges", Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <Label htmlFor="documentFile" className="text-left sm:text-right">
                Document File
              </Label>
              <div className="col-span-1 sm:col-span-3">
                {/* Hidden file input */}
                <input
                  id="documentFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Styled label acting as file input */}
                <label
                  htmlFor="documentFile"
                  className="flex flex-col items-center justify-center w-full h-28 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 text-center"
                >
                  <Upload className="h-6 w-6 mb-2 text-blue-500" />
                  <span className="text-sm">Click or drag file to upload</span>
                  <span className="text-xs text-gray-400 mt-1">
                    Only PDF files are allowed
                  </span>
                </label>

                {/* Display selected file */}
                {formData.documentFile && (
                  <p className="text-sm text-gray-700 mt-2">
                    Selected:{" "}
                    <span className="font-medium">
                      {formData.documentFile.name}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <Label htmlFor="signedDate" className="text-left sm:text-right">
                Signed Date
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="signedDate"
                  type="date"
                  value={formData.signedDate || ""}
                  onChange={(e) => handleChange("signedDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <Label htmlFor="renewalDue" className="text-left sm:text-right">
                Renewal Due
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Input
                  id="renewalDue"
                  type="date"
                  value={formData.renewalDue || ""}
                  onChange={(e) => handleChange("renewalDue", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit}>
              {editingAgreement ? "Update Agreement" : "Create Agreement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
