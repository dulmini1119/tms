"use client";
import React, { useState } from "react";
import {
  AlertTriangle,
  Mail,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Car,
  User,
  Send,
  RefreshCw,
  Download,
} from "lucide-react";
import { mockSystemData } from "@/data/mock-system-data";
import { ExpiryAlert } from "@/types/system-interfaces";
import { VariantProps } from "class-variance-authority";
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

// Form validation errors type
type FormErrors = {
  renewalNotes?: string;
  targetCompletionDate?: string;
  assignedTo?: string;
};

export default function ExpiryAlerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ExpiryAlert | null>(null);
  const [renewalNotes, setRenewalNotes] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get expiry alerts data
  const expiryAlerts = mockSystemData.expiryAlerts;

  const filteredAlerts = expiryAlerts.filter((alert) => {
    return (
      (alert.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.documentNumber &&
          alert.documentNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (alert.assignedTo &&
          alert.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (statusFilter === "all" ||
        alert.status.toLowerCase().replace("_", "-") === statusFilter) &&
      (priorityFilter === "all" ||
        alert.priority.toLowerCase() === priorityFilter) &&
      (entityFilter === "all" ||
        alert.entityType.toLowerCase() === entityFilter)
    );
  });

  // Calculate stats
  const stats = {
    expired: expiryAlerts.filter((alert) => alert.status === "Expired").length,
    expiringSoon: expiryAlerts.filter(
      (alert) => alert.status === "Expiring_Soon"
    ).length,
    critical: expiryAlerts.filter((alert) => alert.priority === "Critical")
      .length,
    underProcess: expiryAlerts.filter(
      (alert) => alert.status === "Under_Process"
    ).length,
    totalRenewalCost: expiryAlerts.reduce(
      (sum, alert) => sum + (alert.renewalCost || 0),
      0
    ),
    remindersSent: expiryAlerts.reduce(
      (sum, alert) => sum + alert.remindersSent,
      0
    ),
  };

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
  };

  const handleEntityFilterChange = (value: string) => {
    setEntityFilter(value);
  };

  const handleViewDetails = (alert: ExpiryAlert) => {
    setSelectedAlert(alert);
    setIsDetailsDialogOpen(true);
  };

  const handleStartRenewal = (alert: ExpiryAlert) => {
    setSelectedAlert(alert);
    setAssignedTo(alert.assignedTo || "");
    setRenewalNotes("");
    setTargetCompletionDate("");
    setFormErrors({});
    setIsRenewalDialogOpen(true);
  };

  const handleSendReminder = async (alert: ExpiryAlert) => {
    try {
      console.log(`Sending reminder for alert: ${alert.id}`);
      const updatedAlert = {
        ...alert,
        remindersSent: alert.remindersSent + 1,
        lastReminderDate: new Date().toISOString(),
      };
      console.log("Updated alert:", updatedAlert);
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  const handleViewDocuments = (alert: ExpiryAlert) => {
    if (alert.attachments.length === 0) {
      console.log("No attachments available");
      return;
    }
    alert.attachments.forEach((attachment) => {
      console.log(`Opening attachment: ${attachment}`);
      window.open(attachment, "_blank");
    });
  };

  const handleUpdateStatus = async (alert: ExpiryAlert, newStatus: string) => {
    try {
      console.log(`Updating status for alert: ${alert.id} to ${newStatus}`);
      const updatedAlert = {
        ...alert,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === "Renewed" && {
          resolvedAt: new Date().toISOString(),
          resolvedBy: "current_user@example.com",
        }),
      };
      console.log("Updated alert:", updatedAlert);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleExportReport = () => {
    try {
      const headers = [
        "Entity Name",
        "Document Name",
        "Document Number",
        "Status",
        "Priority",
        "Days to Expiry",
        "Expiry Date",
        "Renewal Cost",
        "Assigned To",
      ];

      // Helper to safely wrap each value
      const escapeCSVValue = (value: unknown): string => {
        if (value == null) return "";
        const stringValue = value.toString().replace(/"/g, '""'); // escape quotes
        return `"${stringValue}"`; // wrap in quotes
      };

      const rows = filteredAlerts.map((alert) => [
        alert.entityName,
        alert.documentName,
        alert.documentNumber || "N/A",
        alert.status.replace("_", " "),
        alert.priority,
        alert.daysToExpiry.toString(),
        formatDate(alert.expiryDate),
        alert.renewalCost ? formatCurrency(alert.renewalCost) : "N/A",
        alert.assignedTo || "N/A",
      ]);

      const csvContent = [
        headers.map(escapeCSVValue).join(","),
        ...rows.map((row) => row.map(escapeCSVValue).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "expiry_alerts_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("Report exported successfully");
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const handleSendAlerts = async () => {
    try {
      const alertsToNotify = filteredAlerts.filter(
        (alert) =>
          alert.status === "Expiring_Soon" || alert.status === "Expired"
      );
      console.log(`Sending ${alertsToNotify.length} alerts`);
      for (const alert of alertsToNotify) {
        console.log(`Sending alert for: ${alert.id}`);
        const updatedAlert = {
          ...alert,
          remindersSent: alert.remindersSent + 1,
          lastReminderDate: new Date().toISOString(),
        };
        console.log("Updated alert:", updatedAlert);
      }
    } catch (error) {
      console.error("Error sending alerts:", error);
    }
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedAlert(null);
  };

  const handleCancelRenewalDialog = () => {
    setIsRenewalDialogOpen(false);
    setSelectedAlert(null);
    setRenewalNotes("");
    setTargetCompletionDate("");
    setAssignedTo("");
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!renewalNotes.trim()) {
      errors.renewalNotes = "Renewal notes are required";
    }
    if (!targetCompletionDate) {
      errors.targetCompletionDate = "Target completion date is required";
    }
    if (!assignedTo.trim()) {
      errors.assignedTo = "Assigned person is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignedTo)) {
      errors.assignedTo = "Invalid email address";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartRenewalProcess = async () => {
    if (!selectedAlert || !validateForm()) return;
    try {
      console.log(`Starting renewal for alert: ${selectedAlert.id}`);
      const updatedAlert = {
        ...selectedAlert,
        renewalProcess: {
          ...selectedAlert.renewalProcess,
          processStarted: true,
          notes: renewalNotes,
          targetCompletionDate,
        },
        assignedTo: assignedTo || selectedAlert.assignedTo,
        updatedAt: new Date().toISOString(),
      };
      console.log("Updated alert:", updatedAlert);
      handleCancelRenewalDialog();
    } catch (error) {
      console.error("Error starting renewal process:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
      }
    > = {
      Active: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      Expiring_Soon: {
        variant: "secondary",
        icon: <Clock className="h-3 w-3" />,
      },
      Expired: {
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" />,
      },
      Renewed: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Under_Process: {
        variant: "outline",
        icon: <RefreshCw className="h-3 w-3" />,
      },
    };
    const config = variants[status] || variants["Active"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getDaysToExpiryColor = (days: number) => {
    if (days < 0) return "text-red-600";
    if (days <= 30) return "text-orange-600";
    if (days <= 90) return "text-yellow-600";
    return "text-green-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${new Intl.NumberFormat("en-LK", {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredAlerts.length / pageSize) : 1;
  const paginatedDocuments = filteredAlerts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">EXPIRY ALERTS</h1>
          <p className="text-muted-foreground text-xs">
            Monitor document expiry dates and send notifications
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleSendAlerts}>
            <Mail className="h-4 w-4 mr-2" />
            Send Alerts
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.expired}</div>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.critical}</div>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.underProcess}</div>
                <p className="text-sm text-muted-foreground">Under Process</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.remindersSent}</div>
                <p className="text-sm text-muted-foreground">Reminders Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Expiry Tracking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Expiry Tracking</CardTitle>
          <CardDescription>
            Vehicle documents, driver licenses, and agreement expiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="renewed">Renewed</SelectItem>
                <SelectItem value="under-process">Under Process</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={handlePriorityFilterChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={entityFilter}
              onValueChange={handleEntityFilterChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Alerts Section */}
          <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-md">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%] min-w-[220px]">
                      Entity & Document
                    </TableHead>
                    <TableHead className="w-[20%] min-w-[180px]">
                      Document Details
                    </TableHead>
                    <TableHead className="w-[15%] min-w-[140px]">
                      Expiry Information
                    </TableHead>
                    <TableHead className="w-[15%] min-w-[140px]">
                      Renewal Status
                    </TableHead>
                    <TableHead className="w-[15%] min-w-[140px]">
                      Assignment & Cost
                    </TableHead>
                    <TableHead className="w-[10%] min-w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedDocuments.map((alert) => (
                    <TableRow key={alert.id}>
                      {/* Entity & Document */}
                      <TableCell className="whitespace-normal break-words max-w-[250px]">
                        <div className="space-y-1">
                          <div className="font-medium flex items-center">
                            {alert.entityType === "Vehicle" ? (
                              <Car className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {alert.entityName}
                          </div>
                          <div className="text-sm text-muted-foreground break-words">
                            {alert.documentName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {alert.entityId}
                          </div>
                        </div>
                      </TableCell>

                      {/* Document Details */}
                      <TableCell className="whitespace-normal break-words max-w-[220px]">
                        <div className="space-y-1">
                          {alert.documentNumber && (
                            <div className="text-sm flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              <span className="break-all">
                                {alert.documentNumber}
                              </span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Issued: {formatDate(alert.issueDate)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Expires: {formatDate(alert.expiryDate)}
                          </div>
                        </div>
                      </TableCell>

                      {/* Expiry Info */}
                      <TableCell className="whitespace-normal break-words max-w-[180px]">
                        <div className="space-y-1">
                          <div
                            className={`text-sm font-medium ${getDaysToExpiryColor(
                              alert.daysToExpiry
                            )}`}
                          >
                            {alert.daysToExpiry < 0
                              ? `Overdue by ${Math.abs(
                                  alert.daysToExpiry
                                )} days`
                              : `${alert.daysToExpiry} days left`}
                          </div>
                          {getStatusBadge(alert.status)}
                          <div className="text-xs text-muted-foreground">
                            Created: {formatDate(alert.createdAt)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Updated: {formatDate(alert.updatedAt)}
                          </div>
                          {alert.resolvedAt && (
                            <div className="text-xs text-green-600">
                              Resolved: {formatDate(alert.resolvedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Renewal Status */}
                      <TableCell className="whitespace-normal break-words max-w-[180px]">
                        <div className="space-y-1">
                          <div className="text-sm">
                            Process:{" "}
                            {alert.renewalProcess.processStarted
                              ? "Started"
                              : "Not Started"}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">Docs:</span>
                              {alert.renewalProcess.documentsSubmitted ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">Payment:</span>
                              {alert.renewalProcess.paymentMade ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          </div>
                          {alert.renewalProcess.newExpiryDate && (
                            <div className="text-xs text-green-600">
                              New Expiry:{" "}
                              {formatDate(alert.renewalProcess.newExpiryDate)}
                            </div>
                          )}
                          {alert.renewalProcess.renewalReference && (
                            <div className="text-xs text-muted-foreground break-words">
                              Ref: {alert.renewalProcess.renewalReference}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Assignment & Cost */}
                      <TableCell className="whitespace-normal break-words max-w-[200px]">
                        <div className="space-y-1">
                          {alert.assignedTo && (
                            <div className="text-sm flex items-center break-all">
                              <User className="h-3 w-3 mr-1" />
                              {alert.assignedTo.split("@")[0]}
                            </div>
                          )}
                          {alert.renewalCost && (
                            <div className="text-sm flex items-center">
                              {formatCurrency(alert.renewalCost)}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Reminders: {alert.remindersSent}
                          </div>
                          {alert.lastReminderDate && (
                            <div className="text-xs text-muted-foreground">
                              Last: {formatDate(alert.lastReminderDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(alert)}
                            >
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStartRenewal(alert)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" /> Start
                              Renewal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendReminder(alert)}
                            >
                              <Mail className="h-4 w-4 mr-2" /> Send Reminder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewDocuments(alert)}
                            >
                              <FileText className="h-4 w-4 mr-2" /> View
                              Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(alert, "Renewed")
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" /> Update Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 📱 Mobile Card Layout */}
            <div className="md:hidden space-y-4 mt-4">
              {paginatedDocuments.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-border rounded-xl p-4 shadow-sm bg-background space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-semibold flex items-center">
                      {alert.entityType === "Vehicle" ? (
                        <Car className="h-4 w-4 mr-1" />
                      ) : (
                        <User className="h-4 w-4 mr-1" />
                      )}
                      {alert.entityName}
                    </div>
                    {getStatusBadge(alert.status)}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {alert.documentName} ({alert.documentNumber})
                  </div>

                  <div className="text-xs">
                    <strong>Expiry:</strong> {formatDate(alert.expiryDate)} (
                    {alert.daysToExpiry < 0
                      ? `Overdue by ${Math.abs(alert.daysToExpiry)} days`
                      : `${alert.daysToExpiry} days left`}
                    )
                  </div>

                  <div className="text-xs">
                    <strong>Renewal:</strong>{" "}
                    {alert.renewalProcess.processStarted
                      ? "Started"
                      : "Not Started"}
                  </div>

                  {alert.assignedTo && (
                    <div className="text-xs flex items-center">
                      <User className="h-3 w-3 mr-1" />{" "}
                      {alert.assignedTo.split("@")[0]}
                    </div>
                  )}

                  {alert.renewalCost && (
                    <div className="text-xs">
                      <strong>Cost:</strong> {formatCurrency(alert.renewalCost)}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-muted-foreground">
                      {alert.remindersSent} reminders
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(alert)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStartRenewal(alert)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" /> Start Renewal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendReminder(alert)}
                        >
                          <Mail className="h-4 w-4 mr-2" /> Send Reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>

            {/* Shared Pagination */}
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
                  of {filteredAlerts.length} documents
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
          </div>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[825px] max-h-[80vh] overflow-y-auto max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Expiry Alert Details</DialogTitle>
            <DialogDescription>
              {selectedAlert && (
                <>
                  Complete information for {selectedAlert.entityName} -{" "}
                  {selectedAlert.documentName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {selectedAlert && (
              <>
                {/* Entity Information */}
                <div className="space-y-2">
                  <h4 className="font-medium">Entity Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Entity Type: {selectedAlert.entityType}</div>
                    <div>Entity Name: {selectedAlert.entityName}</div>
                    <div>Entity ID: {selectedAlert.entityId}</div>
                    <div>
                      Alert Type: {selectedAlert.alertType.replace("_", " ")}
                    </div>
                    {selectedAlert.department && (
                      <div>Department: {selectedAlert.department}</div>
                    )}
                    {selectedAlert.assignedTo && (
                      <div>Assigned To: {selectedAlert.assignedTo}</div>
                    )}
                  </div>
                </div>

                {/* Document Details */}
                <div className="space-y-2">
                  <h4 className="font-medium">Document Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Document Name: {selectedAlert.documentName}</div>
                    <div>
                      Document Number: {selectedAlert.documentNumber || "N/A"}
                    </div>
                    <div>Issue Date: {formatDate(selectedAlert.issueDate)}</div>
                    <div>
                      Expiry Date: {formatDate(selectedAlert.expiryDate)}
                    </div>
                    <div
                      className={getDaysToExpiryColor(
                        selectedAlert.daysToExpiry
                      )}
                    >
                      Days to Expiry:{" "}
                      {selectedAlert.daysToExpiry < 0
                        ? `Overdue by ${Math.abs(
                            selectedAlert.daysToExpiry
                          )} days`
                        : `${selectedAlert.daysToExpiry} days`}
                    </div>
                    <div>Status: {selectedAlert.status.replace("_", " ")}</div>
                    <div>Priority: {selectedAlert.priority}</div>
                    {selectedAlert.vendor && (
                      <div>Vendor: {selectedAlert.vendor}</div>
                    )}
                  </div>
                </div>

                {/* Renewal Information */}
                <div className="space-y-2">
                  <h4 className="font-medium">Renewal Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedAlert.renewalCost && (
                      <>
                        <div>
                          Renewal Cost:{" "}
                          {formatCurrency(selectedAlert.renewalCost)}
                        </div>
                        <div>Currency: {selectedAlert.currency || "INR"}</div>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Renewal Process Status
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        Process Started:{" "}
                        {selectedAlert.renewalProcess.processStarted
                          ? "✓ Yes"
                          : "✗ No"}
                      </div>
                      <div>
                        Documents Submitted:{" "}
                        {selectedAlert.renewalProcess.documentsSubmitted
                          ? "✓ Yes"
                          : "✗ No"}
                      </div>
                      <div>
                        Payment Made:{" "}
                        {selectedAlert.renewalProcess.paymentMade
                          ? "✓ Yes"
                          : "✗ No"}
                      </div>
                      {selectedAlert.renewalProcess.newExpiryDate && (
                        <div>
                          New Expiry Date:{" "}
                          {formatDate(
                            selectedAlert.renewalProcess.newExpiryDate
                          )}
                        </div>
                      )}
                      {selectedAlert.renewalProcess.renewalReference && (
                        <div>
                          Renewal Reference:{" "}
                          {selectedAlert.renewalProcess.renewalReference}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reminder Information */}
                <div className="space-y-2">
                  <h4 className="font-medium">Reminder Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Reminders Sent: {selectedAlert.remindersSent}</div>
                    <div>
                      Last Reminder:{" "}
                      {selectedAlert.lastReminderDate
                        ? formatDate(selectedAlert.lastReminderDate)
                        : "None"}
                    </div>
                  </div>
                </div>

                {/* Notes and Attachments */}
                {selectedAlert.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Notes</h4>
                    <div className="text-sm p-3 bg-muted rounded-lg">
                      {selectedAlert.notes}
                    </div>
                  </div>
                )}

                {selectedAlert.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      Attachments ({selectedAlert.attachments.length})
                    </h4>
                    <div className="space-y-1">
                      {selectedAlert.attachments.map((attachment, index) => (
                        <div key={index} className="text-sm flex items-center">
                          <FileText className="h-3 w-3 mr-2" />
                          {attachment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Information */}
                {selectedAlert.resolvedAt && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Resolution Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        Resolved At: {formatDate(selectedAlert.resolvedAt)}
                      </div>
                      <div>
                        Resolved By: {selectedAlert.resolvedBy || "N/A"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="space-y-2">
                  <h4 className="font-medium">Timestamps</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Created: {formatDate(selectedAlert.createdAt)}</div>
                    <div>
                      Last Updated: {formatDate(selectedAlert.updatedAt)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDetailsDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renewal Process Dialog */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Start Renewal Process</DialogTitle>
            <DialogDescription>
              {selectedAlert && (
                <>
                  Initiate renewal for {selectedAlert.documentName} -{" "}
                  {selectedAlert.entityName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAlert && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Document: {selectedAlert.documentName}</div>
                  <div>Expiry Date: {formatDate(selectedAlert.expiryDate)}</div>
                  <div>Days Left: {selectedAlert.daysToExpiry}</div>
                  <div>
                    Estimated Cost:{" "}
                    {selectedAlert.renewalCost
                      ? formatCurrency(selectedAlert.renewalCost)
                      : "LKR"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Renewal Notes</Label>
                  <Textarea
                    placeholder="Add notes about the renewal process..."
                    rows={3}
                    value={renewalNotes}
                    onChange={(e) => setRenewalNotes(e.target.value)}
                  />
                  {formErrors.renewalNotes && (
                    <p className="text-xs text-red-600">
                      {formErrors.renewalNotes}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Target Completion Date</Label>
                  <Input
                    type="date"
                    value={targetCompletionDate}
                    onChange={(e) => setTargetCompletionDate(e.target.value)}
                  />
                  {formErrors.targetCompletionDate && (
                    <p className="text-xs text-red-600">
                      {formErrors.targetCompletionDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Input
                    placeholder="Email address of person responsible"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  />
                  {formErrors.assignedTo && (
                    <p className="text-xs text-red-600">
                      {formErrors.assignedTo}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelRenewalDialog}>
              Cancel
            </Button>
            <Button onClick={handleStartRenewalProcess}>
              Start Renewal Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
