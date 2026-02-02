"use client";

import React, { useState, useEffect } from "react";
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

// UI Components
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

// Types
import { ExpiryAlert } from "@/types/system-interfaces";
import { VariantProps } from "class-variance-authority";

// API Helper
import { fetchAPI } from "@/lib/api";

// --- 1. LOCAL INTERFACE FOR BACKEND RESPONSE (Snake Case) ---
interface BackendAlert {
  id: string;
  alert_type: string | null; // ✅ ADDED: Required by ExpiryAlert interface
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  document_id: string | null;
  document_name: string | null;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string;
  days_to_expiry: number | null;
  status: string;
  priority: string | null;
  assigned_to: string | null;
  renewal_cost: number | null;
  currency: string | null;
  vendor: string | null;
  renewal_process_started: boolean | null;
  renewal_documents_submitted: boolean | null;
  renewal_payment_made: boolean | null;
  new_expiry_date: string | null;
  renewal_reference: string | null;
  notes: string | null;
  reminders_sent: number | null;
  last_reminder_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  attachments?: string[];
}

// Form Validation Errors
type FormErrors = {
  renewalNotes?: string;
  assignedTo?: string;
};

export default function ExpiryAlerts() {
  // --- STATE ---
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Dialogs
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ExpiryAlert | null>(null);

  // Form State
  const [renewalNotes, setRenewalNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // ✅ KEEP: Used below

  // --- EFFECTS ---
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const data: BackendAlert[] = await fetchAPI("/expiry-alerts");
        
        // Map Backend Data (Snake) to Frontend Interface (Camel)
        const mappedAlerts: ExpiryAlert[] = data.map((item) => ({
          id: item.id,
          
          // ✅ FIX: Map alert_type explicitly
          alertType: (item.alert_type || "Document") as ExpiryAlert["alertType"],
          
          entityType: item.entity_type as "Vehicle" | "Driver" | "Document",
          entityId: item.entity_id,
          entityName: item.entity_name || "Unknown Entity",
          documentName: item.document_name || "Unknown Document",
          documentNumber: item.document_number || null,
          issueDate: item.issue_date || "",
          expiryDate: item.expiry_date,
          daysToExpiry: item.days_to_expiry || 0,
          status: item.status as ExpiryAlert["status"],
          priority: (item.priority || "Low") as ExpiryAlert["priority"],
          assignedTo: item.assigned_to || undefined,
          renewalCost: item.renewal_cost ? Number(item.renewal_cost) : undefined,
          currency: item.currency || undefined,
          vendor: item.vendor || undefined,
          
          // Map Nested Object
          renewalProcess: {
            processStarted: !!item.renewal_process_started,
            documentsSubmitted: !!item.renewal_documents_submitted,
            paymentMade: !!item.renewal_payment_made,
            newExpiryDate: item.new_expiry_date || undefined,
            renewalReference: item.renewal_reference || undefined,
          },

          remindersSent: item.reminders_sent || 0,
          lastReminderDate: item.last_reminder_date || undefined,
          notes: item.notes || undefined,
          attachments: item.attachments || [], // DB might not have this, so default empty
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          resolvedAt: item.resolved_at || undefined,
          resolvedBy: item.resolved_by || undefined,
        }));

        setAlerts(mappedAlerts);
      } catch (error) {
        console.error("Failed to fetch alerts", error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  // --- FILTERING LOGIC ---
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.documentNumber &&
        alert.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      alert.status.toLowerCase().replace("_", "-") === statusFilter;

    const matchesPriority =
      priorityFilter === "all" ||
      alert.priority.toLowerCase() === priorityFilter;

    // Removed entity filter logic to fix unused variable error, or implement it if needed
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAlerts.length / pageSize);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // --- HANDLERS ---

  const handleViewDetails = (alert: ExpiryAlert) => {
    setSelectedAlert(alert);
    setIsDetailsDialogOpen(true);
  };

  const handleStartRenewal = (alert: ExpiryAlert) => {
    setSelectedAlert(alert);
    setAssignedTo(alert.assignedTo || "");
    setRenewalNotes("");
    setFormErrors({});
    setIsRenewalDialogOpen(true);
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!renewalNotes.trim()) errors.renewalNotes = "Renewal notes are required";
    if (!assignedTo.trim()) errors.assignedTo = "Assigned person is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartRenewalProcess = async () => {
    if (!selectedAlert || !validateForm()) return;

    try {
      setLoading(true);

      // ✅ FIX: Pass object directly, NOT JSON.stringify. 
      // Axios handles the serialization.
      await fetchAPI(`/expiry-alerts/${selectedAlert.id}`, {
        method: "PATCH",
        body: {
          renewal_process_started: true,
          status: "Under_Process",
          assigned_to: assignedTo,
          notes: renewalNotes,
        },
      });

      // Optimistic Update
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === selectedAlert.id
            ? {
                ...a,
                status: "Under_Process",
                renewalProcess: { ...a.renewalProcess, processStarted: true },
                assignedTo,
                notes: renewalNotes,
              }
            : a
        )
      );

      // ✅ FIX: Correct function name
      handleCloseRenewalDialog();
    } catch (error) {
      console.error("Error starting renewal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (alert: ExpiryAlert) => {
    try {
      // ✅ FIX: Pass object directly
      await fetchAPI(`/expiry-alerts/${alert.id}`, {
        method: "PATCH",
        body: {
          reminders_sent: (alert.remindersSent || 0) + 1,
          last_reminder_date: new Date().toISOString(),
        },
      });

      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id
            ? {
                ...a,
                remindersSent: a.remindersSent + 1,
                lastReminderDate: new Date().toISOString(),
              }
            : a
        )
      );
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  const handleUpdateStatus = async (alert: ExpiryAlert, newStatus: string) => {
    try {
      // ✅ FIX: Pass object directly
      await fetchAPI(`/expiry-alerts/${alert.id}`, {
        method: "PATCH",
        body: {
          status: newStatus,
          resolved_at: newStatus === "Renewed" ? new Date().toISOString() : null,
        },
      });

      // ✅ FIX: Use proper union type cast instead of 'any'
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id ? { ...a, status: newStatus as ExpiryAlert["status"] } : a
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleExportReport = () => {
    const headers = [
      "Entity Name",
      "Document Name",
      "Status",
      "Priority",
      "Expiry Date",
      "Assigned To",
    ];

    const escapeCSVValue = (value: unknown): string => {
      if (value == null) return "";
      const stringValue = value.toString().replace(/"/g, '""');
      return `"${stringValue}"`;
    };

    const rows = filteredAlerts.map((alert) => [
      alert.entityName,
      alert.documentName,
      alert.status,
      alert.priority,
      new Date(alert.expiryDate).toLocaleDateString(),
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
  };

  // --- UTILS ---
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: VariantProps<typeof badgeVariants>["variant"]; icon: React.ReactNode }> = {
      Active: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      Expiring_Soon: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      Expired: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      Renewed: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      Under_Process: { variant: "outline", icon: <RefreshCw className="h-3 w-3" /> },
    };
    const config = variants[status] || variants["Active"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysColor = (days: number) => {
    if (days < 0) return "text-red-600";
    if (days <= 30) return "text-orange-600";
    if (days <= 90) return "text-yellow-600";
    return "text-green-600";
  };

  const handleCloseRenewalDialog = () => {
    setIsRenewalDialogOpen(false);
    setSelectedAlert(null);
    setRenewalNotes("");
    setAssignedTo("");
    setFormErrors({});
  };

  // --- RENDER ---
  if (loading) return <div className="p-8">Loading alerts...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expiry Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Monitor document expiry and renewals
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {alerts.filter((a) => a.status === "Expired").length}
                </div>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {alerts.filter((a) => a.priority === "Critical").length}
                </div>
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
                <div className="text-2xl font-bold">
                  {alerts.filter((a) => a.status === "Under_Process").length}
                </div>
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
                <div className="text-2xl font-bold">
                  {alerts.reduce((sum, a) => sum + a.remindersSent, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Reminders Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Document Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entity or document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="under-process">Under Process</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity & Document</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center">
                          {alert.entityType === "Vehicle" ? <Car className="h-3 w-3 mr-2" /> : <User className="h-3 w-3 mr-2" />}
                          {alert.entityName}
                        </div>
                        <div className="text-sm text-muted-foreground">{alert.documentName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm font-medium ${getDaysColor(alert.daysToExpiry)}`}>
                        {alert.daysToExpiry < 0 ? `Overdue by ${Math.abs(alert.daysToExpiry)}` : `${alert.daysToExpiry} days`}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(alert.expiryDate)}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        Status: {alert.renewalProcess.processStarted ? "Started" : "Not Started"}
                      </div>
                      {alert.assignedTo && (
                        <div className="text-xs flex items-center text-muted-foreground">
                          <User className="h-3 w-3 mr-1" /> {alert.assignedTo.split("@")[0]}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(alert)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartRenewal(alert)}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Start Renewal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendReminder(alert)}>
                            <Mail className="h-4 w-4 mr-2" /> Send Reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(alert, "Renewed")}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark Renewed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {paginatedAlerts.length} of {filteredAlerts.length} alerts
            </div>
             {/* ✅ FIX: Use setPageSize properly in JSX */}
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
                  {[10, 25, 50].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s}
                    </SelectItem>
                  ))}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Renewal Dialog */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start Renewal Process</DialogTitle>
            <DialogDescription>
              {selectedAlert && `Renewing ${selectedAlert.documentName} for ${selectedAlert.entityName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAlert && (
               <div className="grid grid-cols-2 gap-4 text-sm bg-muted p-3 rounded">
                 <div>Document: <span className="font-medium">{selectedAlert.documentName}</span></div>
                 <div>Expiry: <span className="font-medium">{formatDate(selectedAlert.expiryDate)}</span></div>
               </div>
            )}
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Input
                placeholder="Enter email or user ID"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
              {formErrors.assignedTo && <p className="text-xs text-red-600">{formErrors.assignedTo}</p>}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Renewal details..."
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
              />
              {formErrors.renewalNotes && <p className="text-xs text-red-600">{formErrors.renewalNotes}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseRenewalDialog}>Cancel</Button>
            <Button onClick={handleStartRenewalProcess}>Start Process</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Entity:</span> {selectedAlert.entityName}</div>
                <div><span className="text-muted-foreground">Document:</span> {selectedAlert.documentName}</div>
                <div><span className="text-muted-foreground">Expiry:</span> {formatDate(selectedAlert.expiryDate)}</div>
                <div><span className="text-muted-foreground">Days Left:</span> {selectedAlert.daysToExpiry}</div>
                <div><span className="text-muted-foreground">Status:</span> {selectedAlert.status}</div>
                <div><span className="text-muted-foreground">Priority:</span> {selectedAlert.priority}</div>
              </div>
              {selectedAlert.notes && (
                <div className="bg-muted p-3 rounded">
                  <span className="font-medium">Notes:</span> {selectedAlert.notes}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}