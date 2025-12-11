"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
  FileText,
  User,
  Upload,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  RefreshCw,
  Archive,
} from "lucide-react";
import { DriverDocument } from "@/types/system-interfaces";
import { mockSystemData } from "@/data/mock-system-data";
import { Badge, badgeVariants } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
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
import { VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function DriverDocuments() {
  /* -------------------------- STATE -------------------------- */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<DriverDocument | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [DriverDocuments, setDriverDocuments] = useState<DriverDocument[]>(
    mockSystemData.driverDocuments
  );

  // Type-safe document type mapping
  const documentTypeMap = {
    "driving-license": "Driving_License",
    "medical-certificate": "Medical_Certificate",
    "police-verification": "Police_Verification",
    "training-certificate": "Training_Certificate",
    "insurance-policy": "Insurance_Policy",
  } as const;

  type DocumentTypeKey = keyof typeof documentTypeMap;

  // Category mapping
  const categoryMap = {
    Driving_License: "Identity",
    Medical_Certificate: "Medical",
    Police_Verification: "Legal",
    Training_Certificate: "Training",
    Insurance_Policy: "Insurance",
  } as const;

  /* Edit form */
  const [editFormData, setEditFormData] = useState<Partial<DriverDocument>>({
    documentName: "",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    issuingAuthority: "",
    notes: "",
    verifiedBy: "",
    verifiedAt: "",
    renewalCost: 0,
    currency: "LKR",
    vendor: "",
    contactNumber: "",
    priority: "Low" as const,
  });

  /* -------------------------- DERIVED DATA -------------------------- */
  const calculateDaysToExpiry = (expiryDate?: string): number | undefined => {
    if (!expiryDate) return undefined;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateComplianceScore = (doc: DriverDocument): number => {
    let score = 50;
    if (doc.status === "Valid") score += 30;
    if (doc.verifiedBy) score += 10;
    const days = calculateDaysToExpiry(doc.expiryDate);
    if (days !== undefined) {
      if (days > 90) score += 10;
      else if (days <= 30) score -= 10;
      else if (days <= 0) score -= 20;
    }
    if (doc.priority === "High" && doc.status !== "Valid") score -= 15;
    return Math.max(0, Math.min(100, score));
  };

  const calculateRiskLevel = (
    doc: DriverDocument
  ): DriverDocument["riskLevel"] => {
    const days = calculateDaysToExpiry(doc.expiryDate);
    if (doc.status === "Expired" || doc.status === "Rejected")
      return "Critical";
    if (days !== undefined && days <= 0) return "Critical";
    if (days !== undefined && days <= 30) return "High";
    if (days !== undefined && days <= 90) return "Medium";
    if (!doc.verifiedBy) return "Medium";
    if (doc.priority === "High" || doc.priority === "Critical") return "Medium";
    return "Low";
  };

  const enrichDocument = (doc: DriverDocument): DriverDocument => ({
    ...doc,
    daysToExpiry: calculateDaysToExpiry(doc.expiryDate),
    complianceScore: calculateComplianceScore(doc),
    riskLevel: calculateRiskLevel(doc),
  });

  const filteredDocuments = DriverDocuments.map(enrichDocument).filter(
    (doc) => {
      const matchesSearch =
        doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        doc.status.toLowerCase().replace("_", "-") === statusFilter;
      const matchesType =
        typeFilter === "all" ||
        doc.documentType.toLowerCase().replace("_", "-") === typeFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        doc.category.toLowerCase() === categoryFilter;
      const matchesDriver =
        driverFilter === "all" || doc.driverName === driverFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesCategory &&
        matchesDriver
      );
    }
  );

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredDocuments.length / pageSize) : 1;
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, categoryFilter]);

  const stats = {
    totalDocuments: DriverDocuments.length,
    validDocuments: DriverDocuments.filter((d) => d.status === "Valid").length,
    expiredDocuments: DriverDocuments.filter((d) => d.status === "Expired")
      .length,
    expiringSoon: DriverDocuments.filter((d) => d.status === "Expiring_Soon")
      .length,
    avgComplianceScore: Math.round(
      DriverDocuments.reduce((s, d) => s + calculateComplianceScore(d), 0) /
        DriverDocuments.length
    ),
    criticalRisk: DriverDocuments.filter(
      (d) => calculateRiskLevel(d) === "Critical"
    ).length,
  };

  const uniqueDrivers = [...new Set(DriverDocuments.map((d) => d.driverName))];

  /* -------------------------- HANDLERS -------------------------- */

  const handleViewDetails = (document: DriverDocument) => {
    setSelectedDocument(enrichDocument(document));
    setIsDetailsDialogOpen(true);
  };

  const handleDownload = (doc: DriverDocument) => {
    if (!doc.fileUrl) {
      toast.error("No file attached");
      return;
    }
    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.download = doc.fileName || `${doc.documentName}.pdf`;
    a.click();
    toast.success("Download started");
  };

  const handleEdit = (document: DriverDocument) => {
    setSelectedDocument(document);
    setEditFormData({
      ...document,
      issueDate: document.issueDate.split("T")[0],
      expiryDate: document.expiryDate?.split("T")[0] ?? "",
      renewalCost: document.renewalCost ?? 0,
      priority: document.priority,
    });
    setIsEditMode(true);
    setIsDetailsDialogOpen(true);
  };

  const handleRenew = (document: DriverDocument) => {
    handleEdit(document);
    setEditFormData((prev) => ({
      ...prev,
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      renewalCost: 0,
    }));
  };

  const handleSubmit = useCallback(() => {
    if (!selectedDocument) {
      toast.error("No document selected");
      return;
    }

    const required = {
      documentName: editFormData.documentName?.trim(),
      documentNumber: editFormData.documentNumber?.trim(),
      issueDate: editFormData.issueDate,
      expiryDate: editFormData.expiryDate,
      issuingAuthority: editFormData.issuingAuthority?.trim(),
    };

    const missing = Object.entries(required)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      toast.error("Missing required fields", {
        description: `Please fill: ${missing.join(", ")}`,
      });
      return;
    }

    const updated: DriverDocument = {
      ...selectedDocument,
      documentName: editFormData.documentName!,
      documentNumber: editFormData.documentNumber!,
      issueDate: new Date(editFormData.issueDate!).toISOString(),
      expiryDate: editFormData.expiryDate
        ? new Date(editFormData.expiryDate).toISOString()
        : undefined,
      issuingAuthority: editFormData.issuingAuthority!,
      notes: editFormData.notes || undefined,
      verifiedBy: editFormData.verifiedBy || undefined,
      verifiedAt: editFormData.verifiedAt || undefined,
      renewalCost:
        editFormData.renewalCost! > 0 ? editFormData.renewalCost : undefined,
      currency: editFormData.currency || undefined,
      vendor: editFormData.vendor || undefined,
      contactNumber: editFormData.contactNumber || undefined,
      priority:
        (editFormData.priority as DriverDocument["priority"]) || "Medium",

      fileName: selectedFile?.name || selectedDocument.fileName,
      fileType:
        selectedFile?.type.split("/")[1].toUpperCase() ||
        selectedDocument.fileType,
      fileSize: selectedFile
        ? `${(selectedFile.size / 1024).toFixed(2)} KB`
        : selectedDocument.fileSize,
      fileUrl: selectedFile
        ? URL.createObjectURL(selectedFile)
        : selectedDocument.fileUrl,

      updatedAt: new Date().toISOString(),
      auditTrail: [
        ...selectedDocument.auditTrail,
        {
          action: "Document Edited",
          performedBy: "Admin",
          timestamp: new Date().toISOString(),
          comments: "Updated via edit dialog",
        },
      ],
    };

    setDriverDocuments((prev) =>
      prev.map((d) => (d.id === selectedDocument.id ? updated : d))
    );

    toast.success(`${updated.documentName} updated`, {
      description: `ID: ${updated.id}`,
    });

    setIsDetailsDialogOpen(false);
    setIsEditMode(false);
    setSelectedFile(null);
    setSelectedDocument(null);
    setEditFormData({
      documentName: "",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      issuingAuthority: "",
      notes: "",
      verifiedBy: "",
      verifiedAt: "",
      renewalCost: 0,
      currency: "LKR",
      vendor: "",
      contactNumber: "",
      priority: "Low",
    });
  }, [editFormData, selectedDocument, selectedFile]);

  const handleVerify = (document: DriverDocument) => {
    const updated = {
      ...document,
      status: "Valid" as const,
      verifiedBy: "Admin User",
      verifiedAt: new Date().toISOString(),
    };
    setDriverDocuments((prev) =>
      prev.map((d) => (d.id === document.id ? updated : d))
    );
    toast.success("Document verified");
  };

  const handleDelete = (document: DriverDocument) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDriverDocuments((prev) => prev.filter((d) => d.id !== document.id));
    toast.success("Document deleted");
  };

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const driverName = fd.get("driverName") as string;
    const documentTypeKey = fd.get("documentType") as string;
    const documentName = fd.get("documentName") as string;
    const documentNumber = fd.get("documentNumber") as string;
    const issueDate = fd.get("issueDate") as string;
    const expiryDate = fd.get("expiryDate") as string;
    const issuingAuthority = fd.get("issuingAuthority") as string;
    const notes = fd.get("notes") as string;

    const missing = [
      driverName,
      documentTypeKey,
      documentName,
      documentNumber,
      issueDate,
      issuingAuthority,
    ].some((v) => !v);

    if (missing || !selectedFile) {
      toast.error("Please fill all required fields and select a PDF");
      return;
    }

    if (!(documentTypeKey in documentTypeMap)) {
      toast.error("Invalid document type");
      return;
    }

    const mappedDocType = documentTypeMap[documentTypeKey as DocumentTypeKey];
    const category = categoryMap[mappedDocType] || "Compliance";

    const newDoc: DriverDocument = {
      id: `doc-${Date.now()}`,
      driverName,
      driverEmployeeId: "EMP-" + Math.floor(Math.random() * 1000),
      driverId: "DRV-" + Math.floor(Math.random() * 1000),
      licenseNumber: "LIC-" + Math.floor(Math.random() * 10000),
      documentName,
      documentNumber: documentNumber || undefined,
      documentType: mappedDocType,
      category,
      priority: "Medium",
      status: "Pending_Verification",
      issueDate: new Date(issueDate).toISOString(),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      daysToExpiry: expiryDate ? calculateDaysToExpiry(expiryDate) : undefined,
      validityPeriod: expiryDate
        ? Math.round(
            (new Date(expiryDate).getTime() - new Date(issueDate).getTime()) /
              (1000 * 60 * 60 * 24 * 365)
          )
        : undefined,
      issuingAuthority,
      complianceScore: 0,
      riskLevel: "Low",
      score: undefined,
      remindersSent: 0,
      lastReminderDate: undefined,
      fileName: selectedFile.name,
      fileSize: `${(selectedFile.size / 1024).toFixed(2)} KB`,
      fileType: "PDF",
      fileUrl: URL.createObjectURL(selectedFile),
      uploadedBy: "Current User",
      uploadedAt: new Date().toISOString(),
      verifiedBy: undefined,
      verifiedAt: undefined,
      verificationComments: undefined,
      renewalCost: undefined,
      currency: undefined,
      vendor: undefined,
      contactNumber: undefined,
      notes,
      certificationLevel: undefined,
      medicalCenter: undefined,
      trainingInstitute: undefined,
      attachments: [],
      auditTrail: [
        {
          action: "Document Uploaded",
          performedBy: "Current User",
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDriverDocuments((prev) => [...prev, newDoc]);
    setIsUploadDialogOpen(false);
    setSelectedFile(null);
    toast.success("Document uploaded successfully");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setSelectedFile(file);
    toast.success("File selected", { description: `${file.name}` });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "renewalCost") {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* -------------------------- BADGES & HELPERS -------------------------- */
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
      }
    > = {
      Valid: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      Expired: {
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" />,
      },
      Expiring_Soon: {
        variant: "secondary",
        icon: <Clock className="h-3 w-3" />,
      },
      Under_Renewal: {
        variant: "outline",
        icon: <RefreshCw className="h-3 w-3" />,
      },
      Rejected: {
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" />,
      },
      Pending_Verification: {
        variant: "secondary",
        icon: <Clock className="h-3 w-3" />,
      },
      Archived: { variant: "outline", icon: <Archive className="h-3 w-3" /> },
    };
    const cfg = variants[status] ?? variants["Valid"];
    return (
      <Badge variant={cfg.variant} className="flex items-center gap-1">
        {cfg.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
        color: string;
      }
    > = {
      Low: {
        variant: "outline",
        icon: <Shield className="h-3 w-3" />,
        color: "text-green-600",
      },
      Medium: {
        variant: "secondary",
        icon: <AlertTriangle className="h-3 w-3" />,
        color: "text-yellow-600",
      },
      High: {
        variant: "destructive",
        icon: <AlertTriangle className="h-3 w-3" />,
        color: "text-orange-600",
      },
      Critical: {
        variant: "destructive",
        icon: <AlertTriangle className="h-3 w-3" />,
        color: "text-red-600",
      },
    };
    const cfg = variants[riskLevel] ?? variants["Low"];
    return (
      <Badge
        variant={cfg.variant}
        className={`flex items-center gap-1 ${cfg.color}`}
      >
        {cfg.icon}
        {riskLevel}
      </Badge>
    );
  };

  const formatDate = useCallback(
    (s?: string) =>
      s
        ? new Date(s).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A",
    []
  );

  const getDaysToExpiryColor = (days: number | undefined) => {
    if (days === undefined) return "text-gray-600";
    if (days < 0) return "text-red-600";
    if (days <= 30) return "text-orange-600";
    if (days <= 90) return "text-yellow-600";
    return "text-green-600";
  };

  /* ────────────────────── ADD THIS HANDLER ────────────────────── */
  const handleExportToExcel = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Driver Documents");

    // Define columns
    worksheet.columns = [
      { header: "Driver", key: "driverName", width: 25 },
      { header: "Document", key: "document", width: 30 },
      { header: "Number", key: "number", width: 18 },
      { header: "Type", key: "type", width: 22 },
      { header: "Category", key: "category", width: 15 },
      { header: "Status", key: "status", width: 16 },
      { header: "Issued", key: "issued", width: 14 },
      { header: "Expires", key: "expires", width: 14 },
      { header: "Days Left", key: "daysLeft", width: 12 },
      { header: "Compliance %", key: "compliance", width: 14 },
      { header: "Risk", key: "risk", width: 10 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Authority", key: "authority", width: 25 },
      { header: "Renewal Cost", key: "cost", width: 16 },
      { header: "Vendor", key: "vendor", width: 20 },
      { header: "Contact", key: "contact", width: 18 },
      { header: "Reminders Sent", key: "reminders", width: 15 },
    ];

    // Add rows
    filteredDocuments.forEach((doc) => {
      worksheet.addRow({
        driverName: `${doc.driverName} (${doc.driverId} ${doc.driverEmployeeId})`,
        document: doc.documentName,
        number: doc.documentNumber,
        type: doc.documentType.replace(/_/g, " "),
        category: doc.category,
        status: doc.status.replace(/_/g, " "),
        issued: formatDate(doc.issueDate),
        expires: doc.expiryDate ? formatDate(doc.expiryDate) : "N/A",
        daysLeft:
          doc.daysToExpiry !== undefined
            ? doc.daysToExpiry < 0
              ? `-${Math.abs(doc.daysToExpiry)}`
              : doc.daysToExpiry
            : "N/A",
        compliance: doc.complianceScore,
        risk: doc.riskLevel,
        priority: doc.priority,
        authority: doc.issuingAuthority,
        cost: doc.renewalCost ? `${doc.renewalCost} ${doc.currency || ""}` : "",
        vendor: doc.vendor || "",
        contact: doc.contactNumber || "",
        reminders: doc.remindersSent,
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6E6" },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Trigger download
    const fileName = `Driver_Documents_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);

    toast.success("Exported to Excel", {
      description: `${filteredDocuments.length} document(s)`,
    });
  }, [filteredDocuments, formatDate]);

  /* -------------------------- RENDER -------------------------- */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">DRIVER DOCUMENTS</h1>
          <p className="text-muted-foreground text-xs">
            Manage driver licenses, medical certificates, training records, and
            compliance documents
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            icon: FileText,
            label: "Total",
            value: stats.totalDocuments,
            color: "text-blue-500",
          },
          {
            icon: CheckCircle,
            label: "Valid",
            value: stats.validDocuments,
            color: "text-green-500",
          },
          {
            icon: XCircle,
            label: "Expired",
            value: stats.expiredDocuments,
            color: "text-red-500",
          },
          {
            icon: AlertTriangle,
            label: "Critical Risk",
            value: stats.criticalRisk,
            color: "text-red-600",
          },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-2">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Document Management</CardTitle>
          <CardDescription>
            Licenses, medical certificates, training records, and verification
            documents for all drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {uniqueDrivers.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="under-renewal">Under Renewal</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="pending-verification">
                  Pending Verification
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="identity">Identity</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="driving-license">Driving License</SelectItem>
                <SelectItem value="medical-certificate">
                  Medical Certificate
                </SelectItem>
                <SelectItem value="police-verification">
                  Police Verification
                </SelectItem>
                <SelectItem value="training-certificate">
                  Training Certificate
                </SelectItem>
                <SelectItem value="insurance-policy">
                  Insurance Policy
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver & Document</TableHead>
                  <TableHead>Document Details</TableHead>
                  <TableHead>Validity & Status</TableHead>
                  <TableHead>Compliance & Risk</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {doc.driverName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {doc.driverEmployeeId}
                        </div>
                        <div className="text-sm font-medium">
                          {doc.documentName}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {doc.documentNumber || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.issuingAuthority}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Type: {doc.documentType.replace("_", " ")}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(doc.status)}
                        <div className="text-sm">
                          Issued: {formatDate(doc.issueDate)}
                        </div>
                        {doc.expiryDate && (
                          <div className="text-sm">
                            Expires: {formatDate(doc.expiryDate)}
                          </div>
                        )}
                        {doc.daysToExpiry !== undefined && (
                          <div
                            className={`text-sm ${getDaysToExpiryColor(
                              doc.daysToExpiry
                            )}`}
                          >
                            {doc.daysToExpiry < 0
                              ? `Overdue by ${Math.abs(doc.daysToExpiry)} days`
                              : `${doc.daysToExpiry} days left`}
                          </div>
                        )}
                        {doc.validityPeriod && (
                          <div className="text-xs text-muted-foreground">
                            Validity: {doc.validityPeriod} year(s)
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={doc.complianceScore}
                            className="w-16 h-2"
                          />
                          <span className="text-sm">
                            {doc.complianceScore}%
                          </span>
                        </div>
                        {getRiskBadge(doc.riskLevel)}
                        <div className="text-xs text-muted-foreground">
                          Reminders: {doc.remindersSent}
                        </div>
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
                            onClick={() => handleViewDetails(doc)}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(doc)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Document
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRenew(doc)}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Renew
                            Document
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerify(doc)}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Verify
                            Document
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(doc)}
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

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {paginatedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{doc.driverName}</h3>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      Employee ID:
                    </span>{" "}
                    {doc.driverEmployeeId}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      Document:
                    </span>{" "}
                    {doc.documentName} <br />
                    Number: {doc.documentNumber || "N/A"} <br />
                    Authority: {doc.issuingAuthority} <br />
                    Type: {doc.documentType.replace("_", " ")}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Dates:</span>{" "}
                    <br />
                    Issued: {formatDate(doc.issueDate)} <br />
                    {doc.expiryDate && (
                      <>
                        Expires: {formatDate(doc.expiryDate)} <br />
                      </>
                    )}
                    {doc.daysToExpiry !== undefined && (
                      <span
                        className={`${getDaysToExpiryColor(doc.daysToExpiry)}`}
                      >
                        {doc.daysToExpiry < 0
                          ? `Overdue by ${Math.abs(doc.daysToExpiry)} days`
                          : `${doc.daysToExpiry} days left`}
                      </span>
                    )}
                    {doc.validityPeriod && (
                      <div>Validity: {doc.validityPeriod} year(s)</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={doc.complianceScore}
                      className="w-16 h-2"
                    />
                    <span className="text-sm">{doc.complianceScore}%</span>
                  </div>
                  {getRiskBadge(doc.riskLevel)}
                  <div className="text-xs text-muted-foreground">
                    Reminders: {doc.remindersSent}
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
                      <DropdownMenuItem onClick={() => handleViewDetails(doc)}>
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(doc)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRenew(doc)}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Renew
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleVerify(doc)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Verify
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(doc)}
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
                of {filteredDocuments.length} documents
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

      {/* Details + Edit Dialog */}
      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) {
            setIsEditMode(false);
            setSelectedFile(null);
            setSelectedDocument(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {selectedDocument?.documentName}
              {isEditMode && (
                <span className="ml-2 text-sm text-blue-600">(Edit Mode)</span>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edit all document details below."
                : "View complete document information."}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6 py-4">
              {!isEditMode ? (
                /* View Mode */
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedDocument.complianceScore}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Compliance Score
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div
                          className={`text-2xl font-bold ${getDaysToExpiryColor(
                            selectedDocument.daysToExpiry
                          )}`}
                        >
                          {selectedDocument.daysToExpiry !== undefined
                            ? selectedDocument.daysToExpiry < 0
                              ? `${Math.abs(
                                  selectedDocument.daysToExpiry
                                )} days overdue`
                              : `${selectedDocument.daysToExpiry} days left`
                            : "No Expiry"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expiry Status
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedDocument.renewalCost
                            ? `${selectedDocument.renewalCost} ${
                                selectedDocument.currency || ""
                              }`
                            : "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Renewal Cost
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Vehicle Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Vehicle Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Driver Name: {selectedDocument.driverName}</div>
                      <div>Driver ID: {selectedDocument.driverId}</div>
                      <div>
                        Employee ID: {selectedDocument.driverEmployeeId}
                      </div>
                      <div>
                        License Number: {selectedDocument.licenseNumber}
                      </div>
                    </div>
                  </div>

                  {/* Document Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Document Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        Document Type:{" "}
                        {selectedDocument.documentType.replace(/_/g, " ")}
                      </div>
                      <div>
                        Document Number: {selectedDocument.documentNumber}
                      </div>
                      <div>Document Name: {selectedDocument.documentName}</div>
                      <div>Category: {selectedDocument.category}</div>
                      <div>Priority: {selectedDocument.priority}</div>
                      <div>
                        Status: {selectedDocument.status.replace(/_/g, " ")}
                      </div>
                      <div>Risk Level: {selectedDocument.riskLevel}</div>
                      <div>
                        Issuing Authority: {selectedDocument.issuingAuthority}
                      </div>
                    </div>
                  </div>

                  {/* Validity Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Validity Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        Issue Date: {formatDate(selectedDocument.issueDate)}
                      </div>
                      <div>
                        Expiry Date:{" "}
                        {formatDate(selectedDocument.expiryDate ?? "")}
                      </div>
                      <div>
                        Days to Expiry:{" "}
                        {selectedDocument.daysToExpiry !== undefined
                          ? selectedDocument.daysToExpiry < 0
                            ? `Overdue by ${Math.abs(
                                selectedDocument.daysToExpiry
                              )} days`
                            : `${selectedDocument.daysToExpiry} days`
                          : "No Expiry"}
                      </div>
                      <div>
                        Compliance Score: {selectedDocument.complianceScore}%
                      </div>
                    </div>
                  </div>

                  {/* File Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium">File Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>File Name: {selectedDocument.fileName}</div>
                      <div>File Size: {selectedDocument.fileSize}</div>
                      <div>File Type: {selectedDocument.fileType}</div>
                      <div>
                        File URL:{" "}
                        <a
                          href={selectedDocument.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Upload & Verification */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Upload & Verification</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Uploaded By: {selectedDocument.uploadedBy}</div>
                      <div>
                        Uploaded At: {formatDate(selectedDocument.uploadedAt)}
                      </div>
                      <div>
                        Verified By:{" "}
                        {selectedDocument.verifiedBy || "Not Verified"}
                      </div>
                      <div>
                        Verified At:{" "}
                        {formatDate(selectedDocument.verifiedAt ?? "")}
                      </div>
                    </div>
                    {selectedDocument.verificationComments && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">
                          Verification Comments:
                        </span>{" "}
                        {selectedDocument.verificationComments}
                      </div>
                    )}
                  </div>

                  {/* Renewal Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Renewal Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        Renewal Cost:{" "}
                        {selectedDocument.renewalCost != null &&
                        selectedDocument.renewalCost > 0
                          ? `${selectedDocument.renewalCost} ${
                              selectedDocument.currency || ""
                            }`
                          : "N/A"}
                      </div>
                      <div>Currency: {selectedDocument.currency || "N/A"}</div>
                      <div>Vendor: {selectedDocument.vendor || "N/A"}</div>
                      <div>
                        Contact Number:{" "}
                        {selectedDocument.contactNumber || "N/A"}
                      </div>
                      <div>
                        Reminders Sent: {selectedDocument.remindersSent}
                      </div>
                      <div>
                        Last Reminder:{" "}
                        {formatDate(selectedDocument.lastReminderDate ?? "")}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedDocument.notes && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Notes</h4>
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {selectedDocument.notes}
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedDocument.attachments?.length ? (
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        Attachments ({selectedDocument.attachments.length})
                      </h4>
                      <div className="space-y-1">
                        {selectedDocument.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="flex items-center text-sm text-blue-600"
                          >
                            <FileText className="h-3 w-3 mr-2" />
                            {att}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Audit Trail */}
                  {selectedDocument.auditTrail?.length ? (
                    <div className="space-y-2">
                      <h4 className="font-medium">Audit Trail</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {selectedDocument.auditTrail.map((entry, i) => (
                          <div
                            key={i}
                            className="border rounded-lg p-3 text-xs bg-muted"
                          >
                            <div className="flex justify-between">
                              <div>
                                <div className="font-medium">
                                  {entry.action}
                                </div>
                                <div className="text-muted-foreground">
                                  By: {entry.performedBy}
                                </div>
                              </div>
                              <div className="text-muted-foreground">
                                {formatDate(entry.timestamp)}
                              </div>
                            </div>
                            {entry.comments && (
                              <div className="mt-1 text-muted-foreground">
                                {entry.comments}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* System Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium">System Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Document ID: {selectedDocument.id}</div>
                      <div>
                        Created: {formatDate(selectedDocument.createdAt)}
                      </div>
                      <div>
                        Last Updated: {formatDate(selectedDocument.updatedAt)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Edit Mode */
                <form className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Document Name *</Label>
                      <Input
                        name="documentName"
                        value={editFormData.documentName}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Document Number *</Label>
                      <Input
                        name="documentNumber"
                        value={editFormData.documentNumber}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Issue Date *</Label>
                      <Input
                        type="date"
                        name="issueDate"
                        value={editFormData.issueDate}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        name="expiryDate"
                        value={editFormData.expiryDate}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Issuing Authority *</Label>
                    <Input
                      name="issuingAuthority"
                      value={editFormData.issuingAuthority}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Renewal Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Renewal Cost</Label>
                        <Input
                          type="number"
                          name="renewalCost"
                          value={editFormData.renewalCost}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Currency</Label>
                        <Input
                          name="currency"
                          value={editFormData.currency}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Vendor</Label>
                        <Input
                          name="vendor"
                          value={editFormData.vendor}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Contact Number</Label>
                        <Input
                          name="contactNumber"
                          value={editFormData.contactNumber}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Select
                      value={editFormData.priority}
                      onValueChange={(
                        v: "Low" | "Medium" | "High" | "Critical"
                      ) => setEditFormData((p) => ({ ...p, priority: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>File (optional)</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />
                    {selectedFile && (
                      <p className="text-sm text-green-600">
                        {selectedFile.name} (
                        {(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      value={editFormData.notes}
                      onChange={handleFormChange}
                      rows={4}
                    />
                  </div>
                </form>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {!isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                <Button onClick={() => setIsEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit Document
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Driver Document</DialogTitle>
            <DialogDescription>
              Upload a new document for driver compliance and record keeping
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Driver *</Label>
                <Select name="driverName" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueDrivers.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Select name="documentType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeMap).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input name="documentName" placeholder="Enter name" required />
            </div>

            <div className="space-y-2">
              <Label>Document Number *</Label>
              <Input
                name="documentNumber"
                placeholder="Enter number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input name="issueDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input name="expiryDate" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Issuing Authority *</Label>
              <Input
                name="issuingAuthority"
                placeholder="Enter authority"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>File Upload *</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Input
                  id="uploadFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="uploadFile"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-6 w-6 mb-2 text-blue-500" />
                  <span className="text-sm">Click or drag file to upload</span>
                  <span className="text-xs text-gray-400 mt-1">
                    Only PDF files are allowed
                  </span>
                </label>
                {selectedFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea name="notes" placeholder="Add notes..." rows={3} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Upload Document</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
