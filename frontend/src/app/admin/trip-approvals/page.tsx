"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  MoreHorizontal,
  Eye,
  User,
  Building2,
  Calendar,
  MapPin,
  AlertCircle,
  History,
  Shield,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";

import { TripRequest, TripApproval } from "@/types/trip-interfaces";
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
import { Badge, badgeVariants } from "@/components/ui/badge";
import { VariantProps } from "class-variance-authority";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── TYPES ────────────────────────────────────────────────────────────────

// The API returns a merged object containing Approval fields + Request fields
interface TripRequestExtended extends TripApproval {
  requestedBy: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string;
  };
  tripDetails: {
    fromLocation: { address: string };
    toLocation: { address: string };
    departureDate: string;
    departureTime: string;
  };
  purpose: {
    description: string;
    category: string;
  };
  estimatedCost: number;
  currency: string;
}


// ── MAIN COMPONENT ───────────────────────────────────────────────────────

export default function TripApprovals() {
  // ── STATE ────────────────────────────────────────────────────────────────

  const [approvals, setApprovals] = useState<TripRequestExtended[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApprovals, setTotalApprovals] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals & Selection
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [selectedApproval, setSelectedApproval] =
    useState<TripRequestExtended | null>(null);

  // Action Form State
  const [approvalAction, setApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [comments, setComments] = useState("");

  // ── EFFECTS ──────────────────────────────────────────────────────────────

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  // Fetch Approvals
  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (debouncedSearch) query.set("search", debouncedSearch);
      if (statusFilter !== "all") query.set("status", statusFilter);

      const res = await fetch(`/trip-approvals?${query}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch approvals");

      const data = await res.json();
      setApprovals(data.data || []);
      setTotalApprovals(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load approvals");
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, getAuthHeaders]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // ── HELPERS ──────────────────────────────────────────────────────────────

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCost = (amount: number, currency: string): string => {
    const symbol = currency === "LKR" ? "Rs." : currency;
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    const variants: Record<
      string,
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
      }
    > = {
      Pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      Approved: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Rejected: {
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" />,
      },
    };
    const config = variants[status] || variants["Pending"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  // ── HANDLERS ─────────────────────────────────────────────────────────────

  const handleViewHistory = (approval: TripRequestExtended) => {
    setSelectedApproval(approval);
    setIsHistoryDialogOpen(true);
  };

  const handleViewRequest = (approval: TripRequestExtended) => {
    setSelectedApproval(approval);
    setIsViewDialogOpen(true);
  };

  const submitApproval = async () => {
    if (!selectedApproval) return;

    // We need to find the specific approval step ID from the history to send to backend
    const currentStep = selectedApproval.approvalHistory.find(
      (h) =>
        h.action === "Pending" &&
        h.level === selectedApproval.currentApprovalLevel
    );

    if (!currentStep) {
      toast.error("Could not determine the approval step ID.");
      return;
    }

    // In a real app, your backend API for approving takes the `trip_approvals` ID (step ID)
    // However, the frontend usually only knows the Request ID.
    // Assuming your backend endpoint is /trip-approvals/:id (where id is the step ID)
    // We will assume the `id` in the History object is the step ID.
    // If your API expects the Request ID, adjust accordingly.

    // For this demo, we'll assume we are sending a payload that identifies the request and action
    // and the backend handles finding the correct step.

    try {
      const res = await fetch(`/trip-approvals/${selectedApproval.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: approvalAction === "approve" ? "Approved" : "Rejected",
          comments: comments,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Action failed");
      }

      toast.success(
        `Request ${approvalAction === "approve" ? "Approved" : "Rejected"}`
      );
      setIsActionDialogOpen(false);
      setComments("");
      fetchApprovals();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to process approval";
      console.error(error);
      toast.error(message);
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">TRIP APPROVALS</h1>
          <p className="text-muted-foreground text-xs">
            Review and manage pending trip requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {approvals.filter((a) => a.finalStatus === "Pending").length}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
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
                  {approvals.filter((a) => a.finalStatus === "Approved").length}
                </div>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {approvals.filter((a) => a.finalStatus === "Rejected").length}
                </div>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {approvals.filter((a) => a.escalated).length}
                </div>
                <p className="text-sm text-muted-foreground">Escalated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>
            Review pending requests and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ID, requester, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading approvals...
            </div>
          ) : approvals.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No approvals found
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Details & Progress</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Trip Info</TableHead>
                      <TableHead>Current Approver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((approval) => (
                      <TableRow key={approval.id}>
                        {/* Request Details + Progress Timeline */}
                        <TableCell>
                          <div className="space-y-2">
                            <div className="font-medium">
                              {approval.requestNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {approval.purpose?.description?.substring(
                                0,
                                60
                              ) || "No description"}
                              ...
                            </div>

                            {/* Mini Approval Progress Timeline */}
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              {approval.approvalWorkflow.map((step, idx) => (
                                <React.Fragment key={step.level}>
                                  <div className="flex flex-col items-center text-xs">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center font-medium border-2 ${
                                        step.level <
                                        approval.currentApprovalLevel
                                          ? "bg-green-100 border-green-500 text-green-800"
                                          : step.level ===
                                            approval.currentApprovalLevel
                                          ? "bg-yellow-100 border-yellow-500 text-yellow-800 ring-2 ring-yellow-400"
                                          : "bg-gray-100 border-gray-300 text-gray-600"
                                      }`}
                                    >
                                      {step.level}
                                    </div>
                                    <span className="mt-1 text-muted-foreground whitespace-nowrap">
                                      {step.approverRole}
                                    </span>
                                  </div>
                                  {idx <
                                    approval.approvalWorkflow.length - 1 && (
                                    <div className="h-px w-8 bg-muted" />
                                  )}
                                </React.Fragment>
                              ))}
                              {approval.escalated && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 text-xs"
                                >
                                  Escalated
                                </Badge>
                              )}
                            </div>

                            {/* Category & Created */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <Badge variant="outline">
                                {approval.purpose?.category || "General"}
                              </Badge>
                              <span>
                                Created: {formatDate(approval.createdAt)}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Requester */}
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <div className="font-medium">
                                {approval.requestedBy?.name || "Unknown"}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {approval.requestedBy?.department ||
                                  "Unassigned"}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Trip Info */}
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-start gap-1">
                              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                              <span className="truncate max-w-[180px]">
                                {approval.tripDetails?.fromLocation?.address ||
                                  "—"}
                              </span>
                            </div>
                            <div className="flex items-start gap-1">
                              <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                              <span className="truncate max-w-[180px]">
                                {approval.tripDetails?.toLocation?.address ||
                                  "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {approval.tripDetails?.departureDate || "—"}{" "}
                              {approval.tripDetails?.departureTime || ""}
                            </div>
                          </div>
                        </TableCell>

                        {/* Current Approver */}
                        <TableCell>
                          {approval.finalStatus === "Pending" ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-yellow-700">
                                Pending at Level {approval.currentApprovalLevel}
                              </span>
                              <span className="text-sm">
                                {approval.approvalWorkflow.find(
                                  (w) =>
                                    w.level === approval.currentApprovalLevel
                                )?.approverName || "Pending Assignment"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {approval.approvalWorkflow.find(
                                  (w) =>
                                    w.level === approval.currentApprovalLevel
                                )?.approverRole || ""}
                              </span>
                            </div>
                          ) : approval.finalStatus === "Approved" ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Approved</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>Rejected</span>
                            </div>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {getStatusBadge(approval.finalStatus)}
                        </TableCell>

                        {/* Cost */}
                        <TableCell>
                          <div className="font-medium">
                            {formatCost(
                              approval.estimatedCost,
                              approval.currency
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
                                onClick={() => handleViewHistory(approval)}
                              >
                                <History className="h-4 w-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleViewRequest(approval)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
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
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="border rounded-lg p-4 shadow-sm bg-card"
                  >
                    {/* Header: Request Number + Status + Escalation */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-base">
                          {approval.requestNumber}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {approval.purpose?.category || "General"} • Created:{" "}
                          {formatDate(approval.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {approval.escalated && (
                          <Badge variant="destructive" className="text-xs">
                            Escalated
                          </Badge>
                        )}
                        {getStatusBadge(approval.finalStatus)}
                      </div>
                    </div>

                    {/* Requester */}
                    <div className="flex items-start gap-2 mb-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">
                          {approval.requestedBy?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {approval.requestedBy?.department || "Unassigned"}
                        </div>
                      </div>
                    </div>

                    {/* Trip Info */}
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="truncate">
                          {approval.tripDetails?.fromLocation?.address || "—"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                        <span className="truncate">
                          {approval.tripDetails?.toLocation?.address || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {approval.tripDetails?.departureDate || "—"}{" "}
                        {approval.tripDetails?.departureTime || ""}
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="mb-3 text-sm font-medium">
                      Cost:{" "}
                      {formatCost(approval.estimatedCost, approval.currency)}
                    </div>

                    {/* Approval Progress Timeline (horizontal on mobile) */}
                    <div className="mb-4">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Approval Progress
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {approval.approvalWorkflow.map((step, idx) => (
                          <React.Fragment key={step.level}>
                            <div className="flex flex-col items-center min-w-[60px]">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                                  step.level < approval.currentApprovalLevel
                                    ? "bg-green-100 border-green-500 text-green-800"
                                    : step.level ===
                                      approval.currentApprovalLevel
                                    ? "bg-yellow-100 border-yellow-500 text-yellow-800 ring-2 ring-yellow-400"
                                    : "bg-gray-100 border-gray-300 text-gray-600"
                                }`}
                              >
                                {step.level}
                              </div>
                              <span className="mt-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                {step.approverRole}
                              </span>
                            </div>
                            {idx < approval.approvalWorkflow.length - 1 && (
                              <div className="h-px w-10 bg-muted shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Current Approver (if pending) */}
                    {approval.finalStatus === "Pending" && (
                      <div className="mb-4 p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
                        <div className="font-medium text-yellow-800">
                          Pending at Level {approval.currentApprovalLevel}
                        </div>
                        <div className="text-yellow-700">
                          {approval.approvalWorkflow.find(
                            (w) => w.level === approval.currentApprovalLevel
                          )?.approverName || "Pending Assignment"}
                        </div>
                        <div className="text-xs text-yellow-600 mt-1">
                          {approval.approvalWorkflow.find(
                            (w) => w.level === approval.currentApprovalLevel
                          )?.approverRole || ""}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4 mr-2" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewHistory(approval)}
                          >
                            <History className="h-4 w-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewRequest(approval)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

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
                  {[10, 25, 50].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                of {totalApprovals} documents
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
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="icon" disabled>
                  {currentPage}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>          {/* Pagination Controls */}

        </CardContent>
      </Card>

      {/* ── HISTORY DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-background shadow-lg p-6">
          {/* Header */}
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <History className="h-5 w-5 text-primary" />
              Approval History
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Tracking the workflow for {selectedApproval?.requestNumber || "—"}
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="space-y-6">
            {selectedApproval && (
              <>
                {/* Approval Rules Section */}
                <section className="bg-muted/20 p-4 rounded-lg border border-muted">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <Shield className="h-4 w-4" /> Approval Rules
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground">
                    <div>
                      <span className="text-muted-foreground font-medium">
                        Cost Threshold:
                      </span>{" "}
                      LKR{" "}
                      {selectedApproval.approvalRules.costThreshold.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">
                        Department:
                      </span>{" "}
                      {selectedApproval.approvalRules.departmentApprovalRequired
                        ? "Required"
                        : "Skipped"}
                    </div>
                  </div>
                </section>

                {/* Timeline Section */}
                <section className="bg-muted/20 p-4 rounded-lg border border-muted">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <ListChecks className="h-4 w-4" /> Timeline
                  </h3>

                  <div className="relative pl-6 border-l-2 border-muted space-y-4">
                    {selectedApproval.approvalHistory.map((step, idx) => (
                      <div key={idx} className="relative">
                        {/* Dot */}
                        <div
                          className={`absolute -left-3.5 top-2 h-3 w-3 rounded-full border-2 border-background 
                    ${
                      step.action === "Approved"
                        ? "bg-green-500"
                        : step.action === "Rejected"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                        />

                        {/* Step Card */}
                        <div className="bg-card p-3 rounded-lg shadow-sm border text-sm space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-foreground">
                              Level {step.level}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(step.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="font-semibold text-foreground">
                            {step.approver.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {step.approver.role}
                          </div>

                          <div
                            className={`font-medium ${
                              step.action === "Approved"
                                ? "text-green-600"
                                : step.action === "Rejected"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {step.action}
                          </div>

                          {step.comments && (
                            <div className="mt-2 italic text-muted-foreground border-t pt-1">
                              &ldquo;{step.comments}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── VIEW DETAILS DIALOG ───────────────────────────────────────────── */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-background shadow-lg p-6">
          {/* Header */}
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">
              Trip Request Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Full information for request #
              {selectedApproval?.requestNumber || "—"}. View requester, route,
              purpose, and other details below.
            </DialogDescription>
          </DialogHeader>

          {/* Content Sections */}
          <div className="space-y-6">
            {selectedApproval && (
              <>
                {/* General Info */}
                <section className="p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-sm mb-3 text-foreground">
                    General Info
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground">
                    <div>
                      <span className="text-muted-foreground font-medium">
                        ID:
                      </span>{" "}
                      {selectedApproval.requestNumber}
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">
                        Status:
                      </span>{" "}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          selectedApproval.finalStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedApproval.finalStatus === "Approved"
                            ? "bg-green-100 text-green-800"
                            : selectedApproval.finalStatus === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedApproval.finalStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">
                        Cost:
                      </span>{" "}
                      {formatCost(
                        selectedApproval.estimatedCost,
                        selectedApproval.currency
                      )}
                    </div>
                  </div>
                </section>

                {/* Requester */}
                <section className="p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-sm mb-2 text-foreground">
                    Requester
                  </h4>
                  <div className="text-sm text-foreground">
                    {selectedApproval.requestedBy.name} -{" "}
                    {selectedApproval.requestedBy.department}
                  </div>
                </section>

                {/* Route & Dates */}
                <section className="p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-sm mb-2 text-foreground">
                    Route & Dates
                  </h4>
                  <div className="text-sm text-foreground space-y-1">
                    <div>
                      <span className="font-medium">From:</span>{" "}
                      {selectedApproval.tripDetails.fromLocation.address}
                    </div>
                    <div>
                      <span className="font-medium">To:</span>{" "}
                      {selectedApproval.tripDetails.toLocation.address}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(selectedApproval.tripDetails.departureDate)}{" "}
                      at {selectedApproval.tripDetails.departureTime}
                    </div>
                  </div>
                </section>

                {/* Purpose */}
                <section className="p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-sm mb-2 text-foreground">
                    Purpose
                  </h4>
                  <p className="text-sm text-foreground">
                    {selectedApproval.purpose.description}
                  </p>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
