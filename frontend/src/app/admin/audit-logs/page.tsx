"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Search, User, Bot, Eye, XCircle, CheckCircle2, Clock3 } from "lucide-react";
import { AuditLog } from "@/types/system-interfaces";
import { fetchAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type ActorFilter = "all" | "user" | "system";

const formatUtcDate = (value: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${p(date.getUTCMonth() + 1)}-${p(date.getUTCDate())} ${p(date.getUTCHours())}:${p(date.getUTCMinutes())}:${p(date.getUTCSeconds())} UTC`;
};

const actorTypeFor = (log: AuditLog): "user" | "system" => (log.userId ? "user" : "system");

const targetLabelFor = (log: AuditLog) => {
  if (log.entityName) return `${log.entityType || "entity"}: ${log.entityName}`;
  if (log.entityId) return `${log.entityType || "entity"}: ${log.entityId}`;
  return log.module || "system";
};

const statusBadge = (status: AuditLog["status"]) => {
  if (status === "Success") {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }

  if (status === "Failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Clock3 className="h-3 w-3" />
      Pending
    </Badge>
  );
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [actorFilter, setActorFilter] = useState<ActorFilter>("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchDebounced(searchTerm.trim());
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });

      if (searchDebounced) params.set("search", searchDebounced);
      if (actorFilter !== "all") params.set("actor", actorFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (moduleFilter !== "all") params.set("module", moduleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetchAPI(`/audit-logs?${params.toString()}`);
      const payload = response?.data;

      setLogs(payload?.logs ?? []);
      setTotalPages(payload?.meta?.totalPages ?? 1);
      setTotalLogs(payload?.meta?.total ?? 0);
    } catch (error) {
      console.error("Failed to load audit logs", error);
      setLogs([]);
      setTotalPages(1);
      setTotalLogs(0);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchDebounced, actorFilter, actionFilter, moduleFilter, statusFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const actionOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.actionType).filter(Boolean))).sort();
  }, [logs]);

  const moduleOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.module).filter(Boolean))).sort();
  }, [logs]);

  const stats = useMemo(() => {
    const userActions = logs.filter((log) => actorTypeFor(log) === "user").length;
    const systemActions = logs.filter((log) => actorTypeFor(log) === "system").length;
    const failed = logs.filter((log) => log.status === "Failed").length;
    return { userActions, systemActions, failed };
  }, [logs]);

  const openDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const exportCurrentPage = () => {
    if (logs.length === 0) {
      toast.error("No logs available to export");
      return;
    }

    const rows = logs.map((log) => ({
      timestamp: formatUtcDate(log.timestamp),
      actor: log.userName || "System",
      actorType: actorTypeFor(log),
      action: log.actionType,
      module: log.module,
      target: targetLabelFor(log),
      status: log.status,
      requestId: log.metadata?.requestId || "",
    }));

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((row) =>
        Object.values(row)
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_logs_page_${currentPage}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">AUDIT LOGS</h1>
          <p className="text-sm text-muted-foreground">Track user actions and system events in one clear timeline.</p>
        </div>
        <Button onClick={exportCurrentPage} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Page
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Logs</div>
            <div className="text-2xl font-semibold">{totalLogs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">User Actions</div>
            <div className="text-2xl font-semibold">{stats.userActions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">System Events</div>
            <div className="text-2xl font-semibold">{stats.systemActions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Failed</div>
            <div className="text-2xl font-semibold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Filter by actor, action, module, and result.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-60 flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-2.5" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search actor, action, module, URL..."
                className="pl-8"
              />
            </div>

            <Select value={actorFilter} onValueChange={(value) => { setActorFilter(value as ActorFilter); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Actor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actors</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={(value) => { setActionFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionOptions.map((action) => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={moduleFilter} onValueChange={(value) => { setModuleFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Module" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {moduleOptions.map((module) => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Success">Success</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading audit logs...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">{formatUtcDate(log.timestamp)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          {actorTypeFor(log) === "system" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          <span>{log.userName || "System"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{log.userRole || "SYSTEM"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.actionType}</div>
                        <div className="text-xs text-muted-foreground">{log.module}</div>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate" title={targetLabelFor(log)}>{targetLabelFor(log)}</TableCell>
                      <TableCell>{statusBadge(log.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        No audit logs found for current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground">Actor</div>
                  <div className="font-medium">{selectedLog.userName || "System"}</div>
                  <div className="text-xs text-muted-foreground">{selectedLog.userRole || "SYSTEM"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Time</div>
                  <div className="font-medium">{formatUtcDate(selectedLog.timestamp)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Action</div>
                  <div className="font-medium">{selectedLog.actionType} / {selectedLog.module}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div>{statusBadge(selectedLog.status)}</div>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Target</div>
                <div className="font-medium">{targetLabelFor(selectedLog)}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Description</div>
                <div>{selectedLog.description || selectedLog.action}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground">Request Method</div>
                  <div>{selectedLog.metadata?.requestMethod || "N/A"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Request URL</div>
                  <div className="break-all">{selectedLog.metadata?.requestUrl || "N/A"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">IP Address</div>
                  <div>{selectedLog.metadata?.ipAddress || "N/A"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Request ID</div>
                  <div className="break-all">{selectedLog.metadata?.requestId || "N/A"}</div>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1">Change Payload</div>
                <pre className="bg-muted rounded-md p-3 overflow-x-auto text-xs">{JSON.stringify(selectedLog.changes, null, 2) || "No change payload recorded."}</pre>
              </div>

              {selectedLog.errorMessage && (
                <div>
                  <div className="text-muted-foreground">Error</div>
                  <div className="text-red-600">{selectedLog.errorMessage}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
