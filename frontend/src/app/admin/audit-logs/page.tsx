"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FileSearch,
  Download,
  Clock,
  Search,
  MoreHorizontal,
  Eye,
  User,
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
  Loader2,
  Link2, // Icon for related events
} from "lucide-react";
import { AuditLog } from "@/types/system-interfaces";
import { fetchAPI } from "@/lib/api";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming you have Tabs
import { toast } from "sonner";

export default function AuditLogs() {
  // --- STATE ---
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog State
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [relatedLogs, setRelatedLogs] = useState<AuditLog[]>([]); // For related events tab

  // --- API FETCHING ---
  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (searchTerm) params.set("search", searchTerm);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (moduleFilter !== "all") params.set("module", moduleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetchAPI(`/audit-logs?${params.toString()}`);

      if (response && response.data && response.data.logs) {
        setAuditLogs(response.data.logs);
        setTotalPages(response.data.meta.totalPages);
        setTotalLogs(response.data.meta.total);
      } else {
        setAuditLogs([]);
        setTotalPages(1);
        setTotalLogs(0);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
      toast.error("Failed to load audit logs");
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchTerm,
    actionFilter,
    moduleFilter,
    statusFilter,
  ]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const filteredLogs = auditLogs.filter((log) => {
    if (
      severityFilter !== "all" &&
      log.severity.toLowerCase() !== severityFilter
    ) {
      return false;
    }
    return true;
  });

  // --- STATS CALCULATION ---
  const stats = {
    totalLogs: totalLogs,
    successfulActions: auditLogs.filter((log) => log.status === "Success")
      .length,
    failedActions: auditLogs.filter((log) => log.status === "Failed").length,
    criticalEvents: auditLogs.filter((log) => log.severity === "Critical")
      .length,
    warningEvents: auditLogs.filter((log) => log.severity === "Warning").length,
    uniqueUsers: new Set(auditLogs.map((log) => log.userId).filter(Boolean))
      .size,
  };

  // --- HANDLERS ---

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    // Find related logs immediately for the dialog
    const related = auditLogs.filter(
      (l) =>
        l.id !== log.id &&
        (l.userId === log.userId || l.entityId === log.entityId)
    );
    setRelatedLogs(related);
    setIsDetailsDialogOpen(true);
  };

  const handleExportEvent = (log: AuditLog) => {
    const dataToExport = {
      id: log.id,
      timestamp: log.timestamp,
      user: log.userName,
      action: log.action,
      module: log.module,
      status: log.status,
      description: log.description,
      metadata: JSON.stringify(log.metadata, null, 2),
    };

    // Create JSON download
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${log.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Log exported successfully");
  };

  const handleViewUserProfile = (userId: string | null | undefined) => {
    if (!userId) {
      toast.error("No user ID associated with this log.");
      return;
    }
    // Since this is a Client Component, we can't use router.push directly easily 
    // without importing useRouter, but for now we can just log or open a toast.
    // Ideally: router.push(`/users/${userId}`);
    toast.info(`Feature coming soon: View User Profile (${userId})`);
    console.log(`Navigate to user profile: ${userId}`);
  };

  const handleRelatedEvents = (log: AuditLog) => {
    // This function is now integrated into the View Details Dialog
    // But we can also trigger it directly to open the dialog on the "Related" tab
    handleViewDetails(log);
  };

  const handleDeleteLog = async (logId: string) => {
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this log? This action cannot be undone.")) {
      return;
    }

    try {
      // Assuming you have a DELETE endpoint
      // await fetchAPI(`/audit-logs/${logId}`, { method: 'DELETE' });
      
      // Optimistic update: Remove from local state
      setAuditLogs((prev) => prev.filter((l) => l.id !== logId));
      toast.success("Log deleted successfully (Simulated)");
      
      // Note: You should implement the backend endpoint for actual deletion
    } catch (error) {
      toast.error("Failed to delete log");
    }
  };

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Triggers loadAuditLogs via dependency array changes if we reset page
      if (currentPage !== 1) setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // --- HELPER FUNCTIONS ---

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, React.ReactNode> = {
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
    return icons[actionType] || <Eye className="h-3 w-3" />;
  };

  const getActionBadge = (actionType: string) => {
    let variant: VariantProps<typeof badgeVariants>["variant"] = "default";
    if (["Delete", "Reject", "Failed"].includes(actionType))
      variant = "destructive";
    if (["Read", "Logout"].includes(actionType)) variant = "outline";
    if (["Update"].includes(actionType)) variant = "secondary";

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getActionIcon(actionType)}
        {actionType}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ReactNode }
    > = {
      Success: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      Failed: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      Pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    };
    const cfg = config[status] || config["Success"];
    return (
      <Badge variant={cfg.variant} className="flex items-center gap-1">
        {cfg.icon}
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const config: Record<
      string,
      { variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ReactNode }
    > = {
      Info: { variant: "outline", icon: <Eye className="h-3 w-3" /> },
      Warning: { variant: "secondary", icon: <AlertTriangle className="h-3 w-3" /> },
      Error: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      Critical: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
    };
    const cfg = config[severity] || config["Info"];
    return (
      <Badge variant={cfg.variant} className="flex items-center gap-1">
        {cfg.icon}
        {severity}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const handleExportLogs = () => {
    const dataToExport = filteredLogs.map((log) => ({
      id: log.id,
      timestamp: formatDate(log.timestamp),
      userName: log.userName || "System",
      action: log.action,
      module: log.module,
      status: log.status,
      severity: log.severity,
      description: log.description,
    }));

    const csvContent = [
      Object.keys(dataToExport[0] || {}).join(","),
      ...dataToExport.map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER ---
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl font-bold">AUDIT LOGS</h1>
          <p className="text-muted-foreground text-xs">
            System activity tracking and audit trail
          </p>
        </div>
        <Button onClick={handleExportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><FileSearch className="h-5 w-5 text-blue-500" /><div><div className="text-2xl font-bold">{stats.totalLogs}</div><p className="text-sm text-muted-foreground">Total Logs</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-500" /><div><div className="text-2xl font-bold">{stats.successfulActions}</div><p className="text-sm text-muted-foreground">Successful</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><XCircle className="h-5 w-5 text-red-500" /><div><div className="text-2xl font-bold">{stats.failedActions}</div><p className="text-sm text-muted-foreground">Failed</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><AlertTriangle className="h-5 w-5 text-red-600" /><div><div className="text-2xl font-bold">{stats.criticalEvents}</div><p className="text-sm text-muted-foreground">Critical</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /><div><div className="text-2xl font-bold">{stats.warningEvents}</div><p className="text-sm text-muted-foreground">Warnings</p></div></div></CardContent></Card>
      </div>

      {/* System Audit Trail Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Audit Trail</CardTitle>
          <CardDescription>User actions, data changes, and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="Create">Create</SelectItem>
                <SelectItem value="Update">Update</SelectItem>
                <SelectItem value="Delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Module" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="vehicles">Vehicles</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Success">Success</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading...
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp & User</TableHead>
                      <TableHead>Action & Module</TableHead>
                      <TableHead>Entity & Changes</TableHead>
                      <TableHead>Status & Performance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm flex items-center"><Clock className="h-3 w-3 mr-1" />{formatDate(log.timestamp)}</div>
                            {log.userName ? (
                              <div className="text-sm flex items-center"><User className="h-3 w-3 mr-1" />{log.userName}</div>
                            ) : (
                              <div className="text-sm text-muted-foreground">System</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getActionBadge(log.actionType)}
                            {/* <div className="text-sm font-medium">{log.displayAction || log.action}</div> */}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {log.entityType && (
                              <div className="text-sm">
                                <span className="font-medium">{log.entityType}:</span> {log.entityName || log.entityId}
                              </div>
                            )}
                            {log.changes && log.changes.length > 0 && (
                              <div className="text-xs text-muted-foreground">{log.changes.length} field(s) changed</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(log.status)}
                            {getSeverityBadge(log.severity)}
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
                              <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportEvent(log)}>
                                <Download className="h-4 w-4 mr-2" /> Export Event
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewUserProfile(log.userId)}>
                                <User className="h-4 w-4 mr-2" /> View User Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRelatedEvents(log)}>
                                <Link2 className="h-4 w-4 mr-2" /> Related Events
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteLog(log.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Log
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No audit logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="changes">Changes</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="related">Related ({relatedLogs.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Action:</strong><br/>{selectedLog.action}</div>
                  <div><strong>Module:</strong><br/>{selectedLog.module}</div>
                  <div><strong>User:</strong><br/>{selectedLog.userName || "System"}</div>
                  <div><strong>Status:</strong><br/>{getStatusBadge(selectedLog.status)}</div>
                  <div><strong>Timestamp:</strong><br/>{formatDate(selectedLog.timestamp)}</div>
                  <div><strong>IP Address:</strong><br/>{selectedLog.metadata?.ipAddress || "N/A"}</div>
                </div>
                <div className="mt-4">
                  <strong>Description:</strong>
                  <p className="text-sm text-muted-foreground mt-1">{selectedLog.description}</p>
                </div>
              </TabsContent>

              <TabsContent value="changes" className="mt-4">
                {selectedLog.changes && selectedLog.changes.length > 0 ? (
                  <div className="bg-muted p-4 rounded-md font-mono text-sm">
                    <pre>{JSON.stringify(selectedLog.changes, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No changes recorded.</div>
                )}
              </TabsContent>

              <TabsContent value="metadata" className="mt-4">
                 <div className="bg-muted p-4 rounded-md font-mono text-sm ">
                    <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
              </TabsContent>

              <TabsContent value="related" className="mt-4">
                 {relatedLogs.length > 0 ? (
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Action</TableHead>
                         <TableHead>Date</TableHead>
                         <TableHead>Status</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {relatedLogs.map(log => (
                         <TableRow key={log.id}>
                           <TableCell>{log.actionType}</TableCell>
                           <TableCell>{formatDate(log.timestamp)}</TableCell>
                           <TableCell>{log.status}</TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 ) : (
                   <div className="text-center text-muted-foreground py-8">No related events found.</div>
                 )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}