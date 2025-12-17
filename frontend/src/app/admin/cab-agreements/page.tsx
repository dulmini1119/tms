"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  Upload,
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
import { toast } from "sonner";

// ---------------- TYPES ----------------
interface RateCard {
  id: string;
  rate_per_km: number;
  minimum_fare: number;
  waiting_charges: number;
  night_charges: number;
}

interface CabService {
  id: string;
  name: string;
}

interface CabAgreement {
  id?: string;
  agreement_number: string;
  title: string;
  cab_service_id: string;
  cab_services?: CabService;
  status?: string;
  priority?: "Low" | "Medium" | "High";
  start_date: string;
  end_date: string;
  auto_renewal?: boolean;
  renewal_period?: string;
  client_company_name?: string;
  client_contact_person?: string;
  client_email?: string;
  client_phone?: string;
  contract_value?: number;
  currency?: string;
  payment_terms?: string;
  payment_schedule?: string;
  document_url?: string;
  document_file?: File;
  agreement_rate_cards?: RateCard[];
  created_at?: string;
  updated_at?: string;
}

// ---------------- COMPONENT ----------------
export default function CabAgreements() {
  const [agreements, setAgreements] = useState<CabAgreement[]>([]);
  const [cabServices, setCabServices] = useState<CabService[]>([]);
  const [selectedAgreement, setSelectedAgreement] =
    useState<CabAgreement | null>(null);
  const [formData, setFormData] = useState<CabAgreement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewAgreement, setViewAgreement] = useState<CabAgreement | null>(null);

  const isEditMode = Boolean(selectedAgreement);

  // ---------------- FETCH DATA ----------------
  const fetchAgreements = async () => {
    try {
      const res = await fetch(`/cab-agreements`);
      const response = await res.json();
      if (response && Array.isArray(response.data)) {
        setAgreements(response.data);
      } else {
        setAgreements([]);
      }
    } catch (err) {
      console.error("Error fetching agreements:", err);
      setAgreements([]);
    }
  };

  const fetchCabServices = async () => {
    try {
      const res = await fetch("/cab-services");
      const data = await res.json();
      setCabServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching cab services:", err);
    }
  };

  useEffect(() => {
    fetchAgreements();
    fetchCabServices();
  }, []);

  // ---------------- VALIDATION ----------------
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData?.agreement_number)
      newErrors.agreement_number = "Agreement number is required";
    if (!formData?.title) newErrors.title = "Title is required";
    if (!formData?.cab_service_id)
      newErrors.cab_service_id = "Cab service is required";
    if (!formData?.start_date) newErrors.start_date = "Start date is required";
    if (!formData?.end_date) newErrors.end_date = "End date is required";
    if (
      formData?.start_date &&
      formData?.end_date &&
      new Date(formData.end_date) <= new Date(formData.start_date)
    ) {
      newErrors.end_date = "End date must be after start date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!formData || !validateForm()) return;

    const fd = new FormData();

    fd.append("agreement_number", formData.agreement_number);
    fd.append("title", formData.title);
    fd.append("cab_service_id", formData.cab_service_id);
    fd.append("status", formData.status || "Draft");
    fd.append("start_date", formData.start_date);
    fd.append("end_date", formData.end_date);
    if (formData.auto_renewal !== undefined)
      fd.append("auto_renewal", String(formData.auto_renewal));
    if (formData.renewal_period)
      fd.append("renewal_period", formData.renewal_period);
    if (formData.client_company_name)
      fd.append("client_company_name", formData.client_company_name);
    if (formData.client_contact_person)
      fd.append("client_contact_person", formData.client_contact_person);
    if (formData.client_email) fd.append("client_email", formData.client_email);
    if (formData.client_phone) fd.append("client_phone", formData.client_phone);
    if (formData.contract_value)
      fd.append("contract_value", String(formData.contract_value));
    if (formData.currency) fd.append("currency", formData.currency);
    if (formData.payment_terms)
      fd.append("payment_terms", formData.payment_terms);
    if (formData.payment_schedule)
      fd.append("payment_schedule", formData.payment_schedule);

    // ✅ Attach file with the correct field name
    if (formData.document_file)
      fd.append("documentFile", formData.document_file);

    try {
      const res = await fetch(
        isEditMode
          ? `/cab-agreements/${selectedAgreement?.id}`
          : "/cab-agreements",
        {
          method: isEditMode ? "PUT" : "POST",
          body: fd,
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to save agreement");
        return;
      }

      setIsDialogOpen(false);
      fetchAgreements();
      toast.success("Agreement saved successfully");
    } catch (err) {
      console.error("Network error:", err);
      toast.error("Error submitting agreement");
    }
  };

  // ---------------- DIALOG ACTIONS ----------------
  const handleCreate = () => {
    setSelectedAgreement(null);
    setFormData({
      agreement_number: "",
      title: "",
      cab_service_id: "",
      start_date: "",
      end_date: "",
    } as CabAgreement);
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleEdit = (agreement: CabAgreement) => {
    setSelectedAgreement(agreement);
    setFormData({ ...agreement });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agreement?")) return;
    try {
      const res = await fetch(`/cab-agreements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchAgreements();
      toast.success("Agreement deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete agreement");
    }
  };

  const handleView = (agreement: CabAgreement) => {
    setViewAgreement(agreement);
    setIsViewOpen(true);
  };

  // ---------------- DATE FORMATTING ----------------
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge>Unknown</Badge>;
    const variant =
      status === "Active"
        ? "default"
        : status === "Expired"
        ? "destructive"
        : "secondary";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const isRenewalDue = (endDate: string) => {
    if (!endDate) return false;
    const today = new Date();
    const end = new Date(endDate);
    const diffDays = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 30 && diffDays > 0;
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <TableRow>
      <TableCell
        colSpan={2}
        className="bg-muted text-sm font-semibold text-muted-foreground uppercase tracking-wide py-3"
      >
        {title}
      </TableCell>
    </TableRow>
  );

  const DetailRow = ({
    label,
    value,
    isComponent = false,
  }: {
    label: string;
    value: React.ReactNode;
    isComponent?: boolean;
  }) => (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium text-muted-foreground w-1/3">
        {label}
      </TableCell>
      <TableCell>
        {isComponent ? value : <span className="font-medium">{value}</span>}
      </TableCell>
    </TableRow>
  );

  // ---------------- FILTER ----------------
  const filteredAgreements = agreements.filter((a) => {
    const term = searchTerm.toLowerCase();
    const number = a.agreement_number.toLowerCase();
    const name = a.cab_services?.name.toLowerCase() || "";
    const status = a.status || "";
    return (
      (number.includes(term) || name.includes(term)) &&
      (statusFilter === "all-status" || status === statusFilter)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">CAB AGREEMENTS</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" /> Add Agreement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Agreements</CardTitle>
          <CardDescription>Active and expired agreements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agreements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Cab Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAgreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {agreement.agreement_number}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {agreement.title}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{agreement.cab_services?.name || "-"}</TableCell>

                    <TableCell>{getStatusBadge(agreement.status)}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(agreement.start_date)} to{" "}
                        {formatDate(agreement.end_date)}
                        {isRenewalDue(agreement.end_date || "") && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
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
                          <DropdownMenuItem
                            onClick={() => handleView(agreement)}
                          >
                            <Search className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(agreement)}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(agreement.id || "")}
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

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-4">
            {filteredAgreements.map((agreement) => (
              <div
                key={agreement.id}
                className="
        rounded-xl
        border
        bg-background
        shadow-sm
        p-4
        space-y-3
      "
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {agreement.agreement_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {agreement.title}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(agreement)}>
                        <Search className="h-4 w-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(agreement)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(agreement.id || "")}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Cab Service */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Cab Service:</span>{" "}
                  <span className="font-medium">
                    {agreement.cab_services?.name || "-"}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(agreement.status)}
                </div>

                {/* Validity */}
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {formatDate(agreement.start_date)} –{" "}
                  {formatDate(agreement.end_date)}
                  {isRenewalDue(agreement.end_date || "") && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ---------------- CREATE / EDIT DIALOG ---------------- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Agreement" : "Create Agreement"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update details" : "Fill in agreement details"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label>Agreement Number</Label>
              <Input
                value={formData?.agreement_number || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, agreement_number: e.target.value } : prev
                  )
                }
                placeholder="AGR-2025-001"
                className={`w-full ${
                  errors.agreement_number ? "border-red-500" : ""
                }`}
              />

              {errors.agreement_number && (
                <p className="text-red-500 text-sm">
                  {errors.agreement_number}
                </p>
              )}
            </div>

            <div>
              <Label>Title</Label>
              <Input
                value={formData?.title || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, title: e.target.value } : prev
                  )
                }
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            <div>
              <Label>Cab Service</Label>
              <Select
                value={formData?.cab_service_id || ""}
                onValueChange={(value) => {
                  const selectedService = cabServices.find(
                    (c) => c.id === value
                  );
                  setFormData((prev) =>
                    prev
                      ? {
                          ...prev,
                          cab_service_id: value,
                          cab_services: selectedService
                            ? {
                                id: selectedService.id,
                                name: selectedService.name,
                              }
                            : prev.cab_services,
                        }
                      : prev
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cab service" />
                </SelectTrigger>
                <SelectContent>
                  {cabServices.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cab_service_id && (
                <p className="text-red-500 text-sm">{errors.cab_service_id}</p>
              )}
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData?.status || "Draft"}
                onValueChange={(value) =>
                  setFormData((prev) =>
                    prev ? { ...prev, status: value } : prev
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={
                  formData?.start_date ? formData.start_date.split("T")[0] : ""
                }
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, start_date: e.target.value } : prev
                  )
                }
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm">{errors.start_date}</p>
              )}
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={
                  formData?.end_date ? formData.end_date.split("T")[0] : ""
                }
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, end_date: e.target.value } : prev
                  )
                }
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm">{errors.end_date}</p>
              )}
            </div>

            <div>
              <Label>Agreement Document</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      setFormData((prev) =>
                        prev ? { ...prev, document_file: file } : prev
                      );
                  }}
                />
                <Upload className="w-5 h-5 text-gray-500" />
              </div>
              {formData?.document_url && (
                <p className="text-sm text-gray-500 mt-1">
                  Uploaded: {formData.document_url}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ---------------- VIEW DIALOG ---------------- */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Agreement Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Complete information of the selected agreement
            </DialogDescription>
          </DialogHeader>

          {viewAgreement && (
            <div className="mt-4 rounded-xl border bg-muted/30">
              <Table>
                <TableBody>
                  {/* BASIC INFO */}
                  <SectionHeader title="Basic Information" />

                  <DetailRow
                    label="Agreement Number"
                    value={viewAgreement.agreement_number}
                  />
                  <DetailRow label="Title" value={viewAgreement.title} />
                  <DetailRow
                    label="Cab Service"
                    value={viewAgreement.cab_services?.name || "-"}
                  />
                  <DetailRow
                    label="Status"
                    value={getStatusBadge(viewAgreement.status)}
                    isComponent
                  />
                  <DetailRow
                    label="Priority"
                    value={viewAgreement.priority || "-"}
                  />

                  {/* DATES */}
                  <SectionHeader title="Dates" />

                  <DetailRow
                    label="Start Date"
                    value={formatDate(viewAgreement.start_date)}
                  />
                  <DetailRow
                    label="End Date"
                    value={formatDate(viewAgreement.end_date)}
                  />
                  <DetailRow
                    label="Auto Renewal"
                    value={viewAgreement.auto_renewal ? "Yes" : "No"}
                  />
                  <DetailRow
                    label="Renewal Period"
                    value={viewAgreement.renewal_period || "-"}
                  />

                  {/* CLIENT INFO */}
                  <SectionHeader title="Client Information" />

                  <DetailRow
                    label="Client Company"
                    value={viewAgreement.client_company_name || "-"}
                  />
                  <DetailRow
                    label="Contact Person"
                    value={viewAgreement.client_contact_person || "-"}
                  />
                  <DetailRow
                    label="Client Email"
                    value={viewAgreement.client_email || "-"}
                  />
                  <DetailRow
                    label="Client Phone"
                    value={viewAgreement.client_phone || "-"}
                  />

                  {/* FINANCIAL */}
                  <SectionHeader title="Financial Details" />

                  <DetailRow
                    label="Contract Value"
                    value={
                      viewAgreement.contract_value
                        ? `${viewAgreement.currency || ""} ${
                            viewAgreement.contract_value
                          }`
                        : "-"
                    }
                  />
                  <DetailRow
                    label="Payment Terms"
                    value={viewAgreement.payment_terms || "-"}
                  />
                  <DetailRow
                    label="Payment Schedule"
                    value={viewAgreement.payment_schedule || "-"}
                  />

                  {/* DOCUMENT */}
                  <SectionHeader title="Documents" />

                  <TableRow className="hover:bg-muted/50">
                    <TableCell className="font-medium text-muted-foreground w-1/3">
                      Agreement Document
                    </TableCell>
                    <TableCell>
                      {viewAgreement.document_url ? (
                        <a
                          href={viewAgreement.document_url}
                          target="_blank"
                          className="text-primary font-medium underline underline-offset-4"
                        >
                          View Document
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>

                  {/* META */}
                  <SectionHeader title="Meta Information" />

                  <DetailRow
                    label="Created At"
                    value={
                      viewAgreement.created_at
                        ? formatDate(viewAgreement.created_at)
                        : "-"
                    }
                  />
                  <DetailRow
                    label="Updated At"
                    value={
                      viewAgreement.updated_at
                        ? formatDate(viewAgreement.updated_at)
                        : "-"
                    }
                  />
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
