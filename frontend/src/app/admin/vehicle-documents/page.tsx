"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  FileText,
  Car,
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
  Bell,
} from "lucide-react";
import { VehicleDocument } from "@/types/system-interfaces";
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
import { mockSystemData } from "@/data/mock-system-data";
import { Progress } from "@/components/ui/progress";
import { VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function VehicleDocuments() {
  /* ────────────────────── STATE ────────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<VehicleDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editFormData, setEditFormData] = useState({
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
    priority: "",
  });

  const [vehicleDocuments, setVehicleDocuments] = useState(
    mockSystemData.vehicleDocuments
  );

  /* ────────────────────── HELPERS ────────────────────── */
  const requiredDocumentTypes = useMemo(
    () => [
      "Registration_Certificate",
      "Insurance_Policy",
      "Pollution_Certificate",
      "Fitness_Certificate",
    ],
    []
  );

  const calculateDaysToExpiry = useCallback(
    (expiryDate?: string): number | undefined => {
      if (!expiryDate) return undefined;
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diff = expiry.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },
    []
  );

  const calculateComplianceScore = useCallback(
    (doc: VehicleDocument): number => {
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
    },
    [calculateDaysToExpiry]
  );

  const calculateRiskLevel = useCallback(
    (doc: VehicleDocument): VehicleDocument["riskLevel"] => {
      const days = calculateDaysToExpiry(doc.expiryDate);
      if (doc.status === "Expired" || doc.status === "Rejected")
        return "Critical";
      if (days !== undefined && days <= 0) return "Critical";
      if (days !== undefined && days <= 30) return "High";
      if (days !== undefined && days <= 90) return "Medium";
      if (!doc.verifiedBy) return "Medium";
      if (doc.priority === "High" || doc.priority === "Critical")
        return "Medium";
      return "Low";
    },
    [calculateDaysToExpiry]
  );

  const sendReminders = useCallback(
    (document: VehicleDocument) => {
      const days = calculateDaysToExpiry(document.expiryDate);
      if (days !== undefined && days <= 30 && document.remindersSent < 3) {
        const updated = {
          ...document,
          remindersSent: document.remindersSent + 1,
          lastReminderDate: new Date().toISOString(),
          auditTrail: [
            ...document.auditTrail,
            {
              action: "Reminder Sent",
              performedBy: "system",
              timestamp: new Date().toISOString(),
              comments: `Reminder ${
                document.remindersSent + 1
              } sent for expiring document`,
            },
          ],
        };
        setVehicleDocuments((prev) =>
          prev.map((d) => (d.id === document.id ? updated : d))
        );
        toast.success(`Reminder sent for ${document.documentName}`, {
          description: `Count: ${updated.remindersSent}`,
        });
      } else {
        toast.error(`Cannot send reminder for ${document.documentName}`, {
          description:
            days && days > 30
              ? "Not expiring soon enough"
              : "Maximum reminders reached",
        });
      }
    },
    [calculateDaysToExpiry]
  );

  const checkVehicleCompliance = useCallback(() => {
    const vehicles = [...new Set(vehicleDocuments.map((d) => d.vehicleNumber))];
    let nonCompliant = 0;
    vehicles.forEach((v) => {
      const docs = vehicleDocuments.filter((d) => d.vehicleNumber === v);
      const ok = requiredDocumentTypes.every((type) =>
        docs.some((d) => d.documentType === type && d.status === "Valid")
      );
      if (!ok) nonCompliant++;
    });
    return nonCompliant;
  }, [requiredDocumentTypes, vehicleDocuments]);

  /* ────────────────────── FILTER / SORT / PAGE ────────────────────── */
  const filteredDocuments = useMemo(() => {
    const list = vehicleDocuments
      .map((doc) => ({
        ...doc,
        daysToExpiry: calculateDaysToExpiry(doc.expiryDate),
      }))
      .filter(
        (doc) =>
          (doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.vehicleNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            doc.documentNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            doc.issuingAuthority
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) &&
          (statusFilter === "all" ||
            doc.status.toLowerCase().replace("_", "-") === statusFilter) &&
          (typeFilter === "all" ||
            doc.documentType.toLowerCase().replace("_", "-") === typeFilter) &&
          (categoryFilter === "all" ||
            doc.category.toLowerCase() === categoryFilter) &&
          (vehicleFilter === "all" || doc.vehicleNumber === vehicleFilter)
      );

    // 🔥 remove sorting by complianceScore and riskLevel
    // you can keep other sort logic if needed, e.g., by expiry date
    return list;
  }, [
    searchTerm,
    statusFilter,
    typeFilter,
    categoryFilter,
    vehicleFilter,
    vehicleDocuments,
    calculateDaysToExpiry,
  ]);

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredDocuments.length / pageSize) : 1;
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, categoryFilter, vehicleFilter]);

  const uniqueVehicles = [
    ...new Set(vehicleDocuments.map((d) => d.vehicleNumber)),
  ];

  /* ────────────────────── STATS ────────────────────── */
  const stats = useMemo(
    () => ({
      totalDocuments: vehicleDocuments.length,
      validDocuments: vehicleDocuments.filter((d) => d.status === "Valid")
        .length,
      expiredDocuments: vehicleDocuments.filter((d) => d.status === "Expired")
        .length,
      expiringSoon: vehicleDocuments.filter((d) => d.status === "Expiring_Soon")
        .length,
      avgComplianceScore:
        Math.round(
          filteredDocuments.reduce(
            (s, d) => s + calculateComplianceScore(d),
            0
          ) / filteredDocuments.length
        ) || 0,
      criticalRisk: filteredDocuments.filter(
        (d) => calculateRiskLevel(d) === "Critical"
      ).length,
      nonCompliantVehicles: checkVehicleCompliance(),
    }),
    [
      filteredDocuments,
      calculateComplianceScore,
      calculateRiskLevel,
      checkVehicleCompliance,
      vehicleDocuments,
    ]
  );

  /* ────────────────────── HANDLERS ────────────────────── */
  const handleViewDetails = (doc: VehicleDocument) => {
    setSelectedDocument({
      ...doc,
      daysToExpiry: calculateDaysToExpiry(doc.expiryDate),
      complianceScore: calculateComplianceScore(doc),
      riskLevel: calculateRiskLevel(doc),
    });
    setIsEditMode(false);
    setIsDetailsDialogOpen(true);
  };

  const handleEditDocument = useCallback(
    (doc: VehicleDocument) => {
      setSelectedDocument({
        ...doc,
        daysToExpiry: calculateDaysToExpiry(doc.expiryDate),
        complianceScore: calculateComplianceScore(doc),
        riskLevel: calculateRiskLevel(doc),
      });
      setEditFormData({
        documentName: doc.documentName,
        documentNumber: doc.documentNumber,
        issueDate: doc.issueDate || "",
        expiryDate: doc.expiryDate || "",
        issuingAuthority: doc.issuingAuthority,
        notes: doc.notes || "",
        verifiedBy: doc.verifiedBy || "",
        verifiedAt: doc.verifiedAt || "",
        renewalCost: doc.renewalCost ?? 0, // number
        currency: doc.currency || "LKR",
        vendor: doc.vendor || "",
        contactNumber: doc.contactNumber || "",
        priority: doc.priority || "",
      });
      setIsEditMode(true);
      setSelectedFile(null);
      setIsDetailsDialogOpen(true);
    },
    [calculateDaysToExpiry, calculateComplianceScore, calculateRiskLevel]
  );

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // special handling for renewalCost – keep it numeric
    if (name === "renewalCost") {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = useCallback(() => {
    // ---- validation ----
    const required = {
      documentName: editFormData.documentName.trim(),
      documentNumber: editFormData.documentNumber.trim(),
      issueDate: editFormData.issueDate,
      expiryDate: editFormData.expiryDate,
      issuingAuthority: editFormData.issuingAuthority.trim(),
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
    if (!selectedDocument) {
      toast.error("No document selected");
      return;
    }

    // ---- build updated doc ----
    const updated: VehicleDocument = {
      ...selectedDocument,
      documentName: editFormData.documentName,
      documentNumber: editFormData.documentNumber,
      issueDate: editFormData.issueDate,
      expiryDate: editFormData.expiryDate || undefined,
      issuingAuthority: editFormData.issuingAuthority,
      notes: editFormData.notes || undefined,

      // ---- NEW / EDITABLE FIELDS ----
      verifiedBy: editFormData.verifiedBy || undefined,
      verifiedAt: editFormData.verifiedAt || undefined,
      renewalCost:
        editFormData.renewalCost > 0 ? editFormData.renewalCost : undefined,
      currency: editFormData.currency || undefined,
      vendor: editFormData.vendor || undefined,
      contactNumber: editFormData.contactNumber || undefined,
      priority:
        (editFormData.priority as VehicleDocument["priority"]) || "Medium",

      // ---- FILE ----
      fileName: selectedFile?.name || selectedDocument.fileName,
      fileType: selectedFile?.type || selectedDocument.fileType,
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
      // NOTE: complianceScore & riskLevel are **not** set here – they are recomputed by filteredDocuments
    };

    setVehicleDocuments((prev) =>
      prev.map((d) => (d.id === selectedDocument.id ? updated : d))
    );

    toast.success(`Document ${editFormData.documentName} updated`, {
      description: `ID: ${selectedDocument.id}`,
    });

    // ---- reset UI ----
    setIsDetailsDialogOpen(false);
    setIsEditMode(false);
    setSelectedDocument(null);
    setSelectedFile(null);
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
      priority: "",
    });
  }, [editFormData, selectedDocument, selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Invalid file type", {
        description: "Only PDF files are allowed.",
      });
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum size is 5 MB.",
      });
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    toast.success("File selected", {
      description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    });
  };

  const handleDelete = (doc: VehicleDocument) => {
    if (window.confirm(`Delete ${doc.documentName}?`)) {
      setVehicleDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Document deleted");
    }
  };

  const handleDownloadAgreement = (doc: VehicleDocument) => {
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

  const handleUploadDocument = () => setIsUploadDialogOpen(true);

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const vehicleNumber = fd.get("vehicle") as string;
    const documentType = fd.get(
      "documentType"
    ) as VehicleDocument["documentType"];
    const documentName = fd.get("documentName") as string;
    const documentNumber = fd.get("documentNumber") as string;
    const issueDate = fd.get("issueDate") as string;
    const expiryDate = fd.get("expiryDate") as string;
    const issuingAuthority = fd.get("issuingAuthority") as string;
    const notes = fd.get("notes") as string;

    const missing = [
      vehicleNumber,
      documentType,
      documentName,
      documentNumber,
      issueDate,
      issuingAuthority,
    ].some((v) => !v);
    if (missing || !selectedFile) {
      toast.error("Please fill all required fields and select a PDF");
      return;
    }

    const categoryMap: Record<string, VehicleDocument["category"]> = {
      Registration_Certificate: "Legal",
      Insurance_Policy: "Insurance",
      Pollution_Certificate: "Compliance",
      Fitness_Certificate: "Compliance",
      Route_Permit: "Legal",
      Tax_Receipt: "Financial",
      Service_Record: "Maintenance",
      Inspection_Report: "Compliance",
      Ownership_Transfer: "Legal",
      Hypothecation: "Financial",
      No_Objection_Certificate: "Legal",
    };
    const category = categoryMap[documentType] || "Compliance";

    const newDoc: VehicleDocument = {
      id: `doc-${Date.now()}`,
      vehicleId: `veh-${Date.now()}`,
      vehicleNumber,
      vehicleMake: "Unknown",
      vehicleModel: "Unknown",
      documentType,
      documentName,
      documentNumber,
      category,
      priority: "Medium",
      status: "Pending_Verification",
      issueDate,
      expiryDate: expiryDate || undefined,
      issuingAuthority,
      notes: notes || undefined,
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: `${(selectedFile.size / 1024).toFixed(2)} KB`,
      fileUrl: URL.createObjectURL(selectedFile),
      uploadedBy: "Admin",
      uploadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifiedBy: undefined,
      verifiedAt: undefined,
      renewalCost: undefined,
      currency: "LKR",
      vendor: "",
      contactNumber: "",
      remindersSent: 0,
      auditTrail: [
        {
          action: "Document Uploaded",
          performedBy: "Admin",
          timestamp: new Date().toISOString(),
          comments: "New document uploaded",
        },
      ],
      attachments: [],
      complianceScore: 0,
      riskLevel: "Medium",
    };

    setVehicleDocuments((prev) => [...prev, newDoc]);
    toast.success("Document uploaded");
    setIsUploadDialogOpen(false);
    setSelectedFile(null);
  };

  const handleRenewDocument = (doc: VehicleDocument) => {
    setVehicleDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? {
              ...d,
              status: "Under_Renewal",
              updatedAt: new Date().toISOString(),
              auditTrail: [
                ...d.auditTrail,
                {
                  action: "Renewal Initiated",
                  performedBy: "Admin",
                  timestamp: new Date().toISOString(),
                  comments: "Marked for renewal",
                },
              ],
            }
          : d
      )
    );
    toast.success("Renewal initiated");
  };

  const handleVerifyDocument = (doc: VehicleDocument) => {
    setVehicleDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? {
              ...d,
              status: "Valid",
              verifiedBy: "Admin",
              verifiedAt: new Date().toISOString(),
              verificationComments: "Verified by admin",
              auditTrail: [
                ...d.auditTrail,
                {
                  action: "Document Verified",
                  performedBy: "Admin",
                  timestamp: new Date().toISOString(),
                  comments: "Verification completed",
                },
              ],
            }
          : d
      )
    );
    toast.success("Document verified");
  };

  const handleSendReminders = () => {
    filteredDocuments.forEach(sendReminders);
    toast.success("All eligible reminders sent");
  };

  /* ────────────────────── UI HELPERS ─────────────────────' */
  const getStatusBadge = (status: string) => {
    const cfg: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
      }
    > = {
      Valid: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
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
    };
    const { variant, icon } = cfg[status] ?? cfg.Valid;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const cfg: Record<
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
    const { variant, icon, color } = cfg[risk] ?? cfg.Low;
    return (
      <Badge variant={variant} className={`flex items-center gap-1 ${color}`}>
        {icon}
        {risk}
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

  const getDaysToExpiryColor = (days?: number) => {
    if (days === undefined) return "text-gray-600";
    if (days < 0) return "text-red-600";
    if (days <= 30) return "text-orange-600";
    if (days <= 90) return "text-yellow-600";
    return "text-green-600";
  };

  /* ────────────────────── ADD THIS HANDLER ────────────────────── */
  const handleExportToExcel = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Vehicle Documents");

    // Define columns
    worksheet.columns = [
      { header: "Vehicle", key: "vehicle", width: 25 },
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
        vehicle: `${doc.vehicleNumber} (${doc.vehicleMake} ${doc.vehicleModel})`,
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
    const fileName = `Vehicle_Documents_${new Date()
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

  /* ────────────────────── RENDER ────────────────────── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">VEHICLE DOCUMENTS</h1>
          <p className="text-muted-foreground text-xs">
            Manage vehicle registration, insurance, and compliance documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleUploadDocument}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
          <Button onClick={handleSendReminders}>
            <Bell className="h-4 w-4 mr-2" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Stats */}
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
          <CardTitle>Vehicle Document Management</CardTitle>
          <CardDescription>
            Registration, insurance, compliance, and maintenance documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {uniqueVehicles.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
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
                {[
                  "valid",
                  "expired",
                  "expiring-soon",
                  "under-renewal",
                  "rejected",
                  "pending-verification",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Category</SelectItem>
                {[
                  "legal",
                  "insurance",
                  "maintenance",
                  "compliance",
                  "financial",
                ].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Type</SelectItem>
                {[
                  "registration-certificate",
                  "insurance-policy",
                  "pollution-certificate",
                  "fitness-certificate",
                  "service-record",
                ].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle & Document</TableHead>
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
                          <Car className="h-3 w-3 mr-1" />
                          {doc.vehicleNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {doc.vehicleMake} {doc.vehicleModel}
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
                          {doc.documentNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.issuingAuthority}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          File: {doc.fileName}
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
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
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
                          <DropdownMenuItem
                            onClick={() => handleDownloadAgreement(doc)}
                          >
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditDocument(doc)}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit Document
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => sendReminders(doc)}>
                            <Bell className="h-4 w-4 mr-2" /> Send Reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRenewDocument(doc)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" /> Renew
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleVerifyDocument(doc)}
                          >
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
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{doc.vehicleNumber}</h3>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      Vehicle:
                    </span>{" "}
                    {doc.vehicleMake} {doc.vehicleModel}
                  </div>

                  <div>
                    <span className="font-medium text-foreground">
                      Document:
                    </span>{" "}
                    {doc.documentName} <br />
                    Number: {doc.documentNumber} <br />
                    Authority: {doc.issuingAuthority} <br />
                    File: {doc.fileName}
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
                      <DropdownMenuItem
                        onClick={() => handleDownloadAgreement(doc)}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditDocument(doc)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => sendReminders(doc)}>
                        <Bell className="h-4 w-4 mr-2" /> Send Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRenewDocument(doc)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" /> Renew
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleVerifyDocument(doc)}
                      >
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

      {/* ────── DETAILS / EDIT DIALOG ────── */}
      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) {
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
              priority: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {selectedDocument?.documentName} -{" "}
              {selectedDocument?.vehicleNumber}
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
              {/* ────── VIEW MODE ────── */}
              {!isEditMode ? (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedDocument.complianceScore}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Compliance Score
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
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
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedDocument.renewalCost != null &&
                            selectedDocument.renewalCost > 0
                              ? `${selectedDocument.renewalCost} ${
                                  selectedDocument.currency || ""
                                }`
                              : "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Renewal Cost
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Vehicle Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        Vehicle Number: {selectedDocument.vehicleNumber}
                      </div>
                      <div>Vehicle ID: {selectedDocument.vehicleId}</div>
                      <div>Make: {selectedDocument.vehicleMake}</div>
                      <div>Model: {selectedDocument.vehicleModel}</div>
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
                /* ────── EDIT MODE ────── */
                <form className="space-y-6">
                  {/* Basic Document Fields */}
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
                      <Label>Expiry Date *</Label>
                      <Input
                        type="date"
                        name="expiryDate"
                        value={editFormData.expiryDate}
                        onChange={handleFormChange}
                        required
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

                  {/* Renewal Fields */}
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
                          placeholder="e.g. 2500"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Currency</Label>
                        <Input
                          name="currency"
                          value={editFormData.currency}
                          onChange={handleFormChange}
                          placeholder="e.g. USD"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Vendor</Label>
                        <Input
                          name="vendor"
                          value={editFormData.vendor}
                          onChange={handleFormChange}
                          placeholder="e.g. ABC Insurance"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Contact Number</Label>
                        <Input
                          name="contactNumber"
                          value={editFormData.contactNumber}
                          onChange={handleFormChange}
                          placeholder="e.g. +91 9876543210"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Select
                      value={editFormData.priority}
                      onValueChange={(v) =>
                        setEditFormData((p) => ({ ...p, priority: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* File Upload */}
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

                  {/* Notes */}
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      value={editFormData.notes}
                      onChange={handleFormChange}
                      rows={4}
                      placeholder="Any additional information..."
                    />
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ────── FOOTER ────── */}
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
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Document
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────── UPLOAD DIALOG ────── */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Upload Vehicle Document</DialogTitle>
            <DialogDescription>
              Upload a new document for vehicle compliance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Vehicle</Label>
                <Select name="vehicle">
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueVehicles.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Document Type</Label>
                <Select name="documentType">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Registration_Certificate",
                      "Insurance_Policy",
                      "Pollution_Certificate",
                      "Fitness_Certificate",
                      "Route_Permit",
                      "Tax_Receipt",
                      "Service_Record",
                      "Inspection_Report",
                      "Ownership_Transfer",
                      "Hypothecation",
                      "No_Objection_Certificate",
                    ].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Document Name</Label>
              <Input name="documentName" placeholder="Enter name" />
            </div>

            <div className="space-y-1">
              <Label>Document Number</Label>
              <Input name="documentNumber" placeholder="Enter number" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Issue Date</Label>
                <Input name="issueDate" type="date" />
              </div>
              <div className="space-y-1">
                <Label>Expiry Date</Label>
                <Input name="expiryDate" type="date" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Issuing Authority</Label>
              <Input name="issuingAuthority" placeholder="Enter authority" />
            </div>

            <div className="space-y-1">
              <Label>File Upload</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Input
                  id="uploadFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
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

            <div className="space-y-1">
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
