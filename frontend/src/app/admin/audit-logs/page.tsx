"use client";
import React, { useState } from "react";
import {
  FileSearch,
  Download,
  Clock,
  Search,
  MoreHorizontal,
  Eye,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  FileDown,
  FileUp,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { AuditActionType, AuditLog } from "@/types/system-interfaces";
import { mockSystemData } from "@/data/mock-system-data";
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

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Get audit logs data
  const auditLogs = mockSystemData.auditLogs;

  const filteredLogs = auditLogs.filter((log) => {
    return (
      (log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (actionFilter === "all" ||
        log.actionType.toLowerCase() === actionFilter) &&
      (moduleFilter === "all" || log.module.toLowerCase() === moduleFilter) &&
      (severityFilter === "all" ||
        log.severity.toLowerCase() === severityFilter) &&
      (statusFilter === "all" || log.status.toLowerCase() === statusFilter)
    );
  });

  // Calculate stats
  const stats = {
    totalLogs: auditLogs.length,
    successfulActions: auditLogs.filter((log) => log.status === "Success")
      .length,
    failedActions: auditLogs.filter((log) => log.status === "Failed").length,
    criticalEvents: auditLogs.filter((log) => log.severity === "Critical")
      .length,
    warningEvents: auditLogs.filter((log) => log.severity === "Warning").length,
    uniqueUsers: new Set(auditLogs.map((log) => log.userId).filter(Boolean))
      .size,
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsDialogOpen(true);
  };

  const getActionIcon = (actionType: AuditActionType) => {
    const icons = {
      Create: <Plus className="h-3 w-3" />,
      Read: <Eye className="h-3 w-3" />,
      Update: <Edit className="h-3 w-3" />,
      Delete: <Trash2 className="h-3 w-3" />,
      Login: <LogIn className="h-3 w-3" />,
      Logout: <LogOut className="h-3 w-3" />,
      Export: <FileDown className="h-3 w-3" />,
      Import: <FileUp className="h-3 w-3" />,
      Approve: <ShieldCheck className="h-3 w-3" />,
      Reject: <ShieldX className="h-3 w-3" />,
    };
    return icons[actionType];
  };

  const getActionBadge = (actionType: AuditActionType) => {
    const variants: Record<
      AuditActionType,
      { variant: VariantProps<typeof badgeVariants>["variant"]; color: string }
    > = {
      Create: { variant: "default", color: "text-green-600" },
      Read: { variant: "outline", color: "text-blue-600" },
      Update: { variant: "secondary", color: "text-yellow-600" },
      Delete: { variant: "destructive", color: "text-red-600" },
      Login: { variant: "default", color: "text-green-600" },
      Logout: { variant: "outline", color: "text-gray-600" },
      Export: { variant: "outline", color: "text-purple-600" },
      Import: { variant: "outline", color: "text-indigo-600" },
      Approve: { variant: "default", color: "text-green-600" },
      Reject: { variant: "destructive", color: "text-red-600" },
    };
    const config = variants[actionType];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getActionIcon(actionType)}
        {actionType}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
      }
    > = {
      Success: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Failed: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      Pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    };
    const config = variants[status] || variants["Success"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
      }
    > = {
      Info: { variant: "outline", icon: <Eye className="h-3 w-3" /> },
      Warning: {
        variant: "secondary",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      Error: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      Critical: {
        variant: "destructive",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
    };
    const config = variants[severity] || variants["Info"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {severity}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const handleActionFilterChange = (value: string) => {
    setActionFilter(value);
  };
  const handleModuleFilterChange = (value: string) => {
    setModuleFilter(value);
  };
  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value);
  };
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };
  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedLog(null);
  };

  const handleExportLogs = () => {
    // Placeholder for export logic
    const dataToExport = filteredLogs.map((log) => ({
      id: log.id,
      timestamp: formatDate(log.timestamp),
      userName: log.userName || "System",
      action: log.action,
      actionType: log.actionType,
      module: log.module,
      status: log.status,
      severity: log.severity,
      description: log.description,
      entityType: log.entityType || "N/A",
      entityName: log.entityName || "N/A",
      duration: log.duration ? formatDuration(log.duration) : "N/A",
      errorMessage: log.errorMessage || "N/A",
    }));

    // Define headers and their corresponding keys in dataToExport
    const headerMap = [
      { label: "ID", key: "id" },
      { label: "Timestamp", key: "timestamp" },
      { label: "User", key: "userName" },
      { label: "Action", key: "action" },
      { label: "Action Type", key: "actionType" },
      { label: "Module", key: "module" },
      { label: "Status", key: "status" },
      { label: "Severity", key: "severity" },
      { label: "Description", key: "description" },
      { label: "Entity Type", key: "entityType" },
      { label: "Entity Name", key: "entityName" },
      { label: "Duration", key: "duration" },
      { label: "Error Message", key: "errorMessage" },
    ];

    // Create CSV content
    const csvContent = [
      headerMap.map((h) => `"${h.label}"`).join(","), // Header row
      ...dataToExport.map((row) =>
        headerMap
          .map((h) => {
            const value = row[h.key as keyof typeof row];
            return `"${String(value ?? "N/A").replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewUserProfile = (userId: string | undefined) => {
    if (!userId) {
      console.log("No user ID available");
      return;
    }
    // Placeholder for navigation or API call
    console.log(`Navigating to user profile for user ID: ${userId}`);
    // Example: Navigate to user profile page
    // router.push(`/users/${userId}`);
  };

  const handleRelatedEvents = (log: AuditLog) => {
    // Placeholder for related events logic
    const relatedLogs = auditLogs.filter(
      (relatedLog) =>
        relatedLog.id !== log.id &&
        (relatedLog.userId === log.userId ||
          relatedLog.entityId === log.entityId ||
          relatedLog.module === log.module)
    );
    console.log("Related events:", relatedLogs);
    // Example: Could set state to show related logs in a new view
    // setRelatedLogs(relatedLogs);
  };

  const handleExportEvent = (log: AuditLog) => {
    // Prepare data for export
    const dataToExport = {
      id: log.id,
      timestamp: formatDate(log.timestamp),
      userName: log.userName || "System",
      action: log.action,
      actionType: log.actionType,
      module: log.module,
      status: log.status,
      severity: log.severity,
      description: log.description,
      entityType: log.entityType || "N/A",
      entityName: log.entityName || "N/A",
      duration: log.duration ? formatDuration(log.duration) : "N/A",
      errorMessage: log.errorMessage || "N/A",
      metadata: JSON.stringify(log.metadata), // Stringify metadata for CSV
      tags: log.tags.join(", "), // Join tags with commas
    };

    // Define headers and their corresponding keys
    const headerMap = [
      { label: "ID", key: "id" },
      { label: "Timestamp", key: "timestamp" },
      { label: "User", key: "userName" },
      { label: "Action", key: "action" },
      { label: "Action Type", key: "actionType" },
      { label: "Module", key: "module" },
      { label: "Status", key: "status" },
      { label: "Severity", key: "severity" },
      { label: "Description", key: "description" },
      { label: "Entity Type", key: "entityType" },
      { label: "Entity Name", key: "entityName" },
      { label: "Duration", key: "duration" },
      { label: "Error Message", key: "errorMessage" },
      { label: "Metadata", key: "metadata" },
      { label: "Tags", key: "tags" },
    ];

    // Create CSV content
    const csvContent = [
      headerMap.map((h) => `"${h.label}"`).join(","), // Header row
      headerMap
        .map((h) => {
          const value = dataToExport[h.key as keyof typeof dataToExport];
          return `"${String(value ?? "N/A").replace(/"/g, '""')}"`;
        })
        .join(","), // Data row
    ].join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `audit_log_${log.id}_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredLogs.length / pageSize) : 1;
  const paginatedDocuments = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">AUDIT LOGS</h1>
          <p className="text-muted-foreground text-xs">
            System activity tracking and audit trail
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={handleExportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileSearch className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalLogs}</div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.successfulActions}
                </div>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.failedActions}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.criticalEvents}</div>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.warningEvents}</div>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Audit Trail Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Audit Trail</CardTitle>
          <CardDescription>
            User actions, data changes, and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={handleActionFilterChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={moduleFilter}
              onValueChange={handleModuleFilterChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="roles">Roles</SelectItem>
                <SelectItem value="vehicles">Vehicles</SelectItem>
                <SelectItem value="trips">Trips</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={severityFilter}
              onValueChange={handleSeverityFilterChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Logs Table */}
          {/* Desktop / Tablet View */}
          <div className="hidden md:block overflow-x-hidden">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Timestamp & User</TableHead>
                  <TableHead className="w-[20%]">Action & Module</TableHead>
                  <TableHead className="w-[25%]">Entity & Changes</TableHead>
                  <TableHead className="w-[25%]">
                    Status & Performance
                  </TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="break-words whitespace-normal">
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(log.timestamp)}
                        </div>
                        {log.userName ? (
                          <div className="text-sm flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {log.userName}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            System
                          </div>
                        )}
                        {log.userRole && (
                          <div className="text-xs text-muted-foreground">
                            Role: {log.userRole}
                          </div>
                        )}
                        {log.userId && (
                          <div className="text-xs text-muted-foreground">
                            ID: {log.userId}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="break-words whitespace-normal">
                      <div className="space-y-1">
                        {getActionBadge(log.actionType)}
                        <div className="text-sm font-medium">{log.action}</div>
                      </div>
                    </TableCell>

                    <TableCell className="break-words whitespace-normal">
                      <div className="space-y-1">
                        {log.entityType && (
                          <div className="text-sm">
                            <span className="font-medium">
                              {log.entityType}:
                            </span>{" "}
                            {log.entityName || log.entityId}
                          </div>
                        )}
                        {log.changes && log.changes.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {log.changes.length} field(s) changed
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="break-words whitespace-normal">
                      <div className="space-y-1">
                        {getStatusBadge(log.status)}
                        {getSeverityBadge(log.severity)}
                        {log.duration && (
                          <div className="text-xs text-muted-foreground">
                            Duration: {formatDuration(log.duration)}
                          </div>
                        )}
                        {log.errorMessage && (
                          <div
                            className="text-xs text-red-600 truncate max-w-[130px]"
                            title={log.errorMessage}
                          >
                            Error: {log.errorMessage}
                          </div>
                        )}
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
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewUserProfile(log.userId)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            View User Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRelatedEvents(log)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Related Events
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportEvent(log)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View (Card Layout) */}
          <div className="md:hidden space-y-4">
            {paginatedDocuments.map((log) => (
              <div
                key={log.id}
                className="border border-border rounded-xl p-4 shadow-sm bg-background space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="text-sm flex items-center font-medium">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(log.timestamp)}
                  </div>
                  {getSeverityBadge(log.severity)}
                </div>

                <div className="text-sm font-semibold flex items-center">
                  {getActionBadge(log.actionType)}{" "}
                  <span className="ml-1">{log.action}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Module: {log.module}
                </div>

                {log.entityType && (
                  <div className="text-xs">
                    <span className="font-medium">{log.entityType}:</span>{" "}
                    {log.entityName || log.entityId}
                  </div>
                )}

                {log.changes && log.changes.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {log.changes.length} field(s) changed
                  </div>
                )}

                {log.duration && (
                  <div className="text-xs text-muted-foreground">
                    Duration: {formatDuration(log.duration)}
                  </div>
                )}

                {log.errorMessage && (
                  <div
                    className="text-xs text-red-600 truncate"
                    title={log.errorMessage}
                  >
                    Error: {log.errorMessage}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(log.status)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleViewUserProfile(log.userId)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View User Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRelatedEvents(log)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Related Events
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportEvent(log)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Event
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
                of {filteredLogs.length} documents
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

      {/* Audit Log Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[825px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-lg">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Audit Log Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedLog && (
                <>
                  Complete audit information for{" "}
                  <span className="font-medium">{selectedLog.action}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 px-2 sm:px-4">
            {selectedLog && (
              <>
                {/* Basic Information */}
                <section className="space-y-2">
                  <h4 className="font-medium text-sm border-b pb-1">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>Timestamp: {formatDate(selectedLog.timestamp)}</div>
                    <div>Action Type: {selectedLog.actionType}</div>
                    <div>Module: {selectedLog.module}</div>
                    <div>Severity: {selectedLog.severity}</div>
                    <div>Status: {selectedLog.status}</div>
                    {selectedLog.duration && (
                      <div>
                        Duration: {formatDuration(selectedLog.duration)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Action:</span>{" "}
                    {selectedLog.action}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Description:</span>{" "}
                    {selectedLog.description}
                  </div>
                </section>

                {/* User Information */}
                <section className="space-y-2">
                  <h4 className="font-medium text-sm border-b pb-1">
                    User Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>User ID: {selectedLog.userId || "System"}</div>
                    <div>User Name: {selectedLog.userName || "System"}</div>
                    <div>User Role: {selectedLog.userRole || "N/A"}</div>
                  </div>
                </section>

                {/* Entity Information */}
                {selectedLog.entityType && (
                  <section className="space-y-2">
                    <h4 className="font-medium text-sm border-b pb-1">
                      Entity Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>Entity Type: {selectedLog.entityType}</div>
                      <div>Entity ID: {selectedLog.entityId || "N/A"}</div>
                      <div>Entity Name: {selectedLog.entityName || "N/A"}</div>
                    </div>
                  </section>
                )}

                {/* Changes */}
                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="font-medium text-sm border-b pb-1">
                      Changes ({selectedLog.changes.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedLog.changes.map((change, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-3 text-sm bg-background/50"
                        >
                          <div className="font-medium">
                            Field: {change.field}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                            <div>
                              <span className="text-muted-foreground">
                                Old Value:
                              </span>
                              <div className="mt-1 p-2 bg-red-50 rounded text-red-800">
                                {change.oldValue !== null
                                  ? String(change.oldValue)
                                  : "null"}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                New Value:
                              </span>
                              <div className="mt-1 p-2 bg-green-50 rounded text-green-800">
                                {change.newValue !== null
                                  ? String(change.newValue)
                                  : "null"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* System Metadata */}
                <section className="space-y-2">
                  <h4 className="font-medium text-sm border-b pb-1">
                    System Metadata
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>IP Address: {selectedLog.metadata.ipAddress}</div>
                    <div>Session ID: {selectedLog.metadata.sessionId}</div>
                    <div>
                      Request ID: {selectedLog.metadata.requestId || "N/A"}
                    </div>
                    <div>Browser: {selectedLog.metadata.browser || "N/A"}</div>
                    <div>
                      OS: {selectedLog.metadata.operatingSystem || "N/A"}
                    </div>
                    <div>Device: {selectedLog.metadata.device || "N/A"}</div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">User Agent:</span>
                    <div className="mt-1 p-2 bg-muted rounded text-xs break-all">
                      {selectedLog.metadata.userAgent}
                    </div>
                  </div>
                </section>

                {/* Location Information */}
                {selectedLog.metadata.location && (
                  <section className="space-y-2">
                    <h4 className="font-medium text-sm border-b pb-1">
                      Location Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        Country: {selectedLog.metadata.location.country}
                      </div>
                      <div>City: {selectedLog.metadata.location.city}</div>
                      {selectedLog.metadata.location.coordinates && (
                        <>
                          <div>
                            Latitude:{" "}
                            {selectedLog.metadata.location.coordinates.latitude}
                          </div>
                          <div>
                            Longitude:{" "}
                            {
                              selectedLog.metadata.location.coordinates
                                .longitude
                            }
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                )}

                {/* Error Information */}
                {selectedLog.errorMessage && (
                  <section className="space-y-2">
                    <h4 className="font-medium text-sm border-b pb-1">
                      Error Information
                    </h4>
                    <div className="text-sm p-3 bg-red-50 border border-red-200 rounded-lg text-red-400">
                      {selectedLog.errorMessage}
                    </div>
                  </section>
                )}

                {/* Tags */}
                {selectedLog.tags.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="font-medium text-sm border-b pb-1">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedLog.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* Retention Information */}
                <section className="space-y-2">
                  <h4 className="font-medium text-sm border-b pb-1">
                    Retention Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>Archived: {selectedLog.archived ? "Yes" : "No"}</div>
                    <div>
                      Retention Date: {formatDate(selectedLog.retentionDate)}
                    </div>
                    <div>Created: {formatDate(selectedLog.createdAt)}</div>
                  </div>
                </section>
              </>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={handleCloseDetailsDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
