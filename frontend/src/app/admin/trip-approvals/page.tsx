"use client";
import React, { useEffect, useState } from "react";

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
  Users as UsersIcon,
  History,
  Info,
  Target,
  Shield,
  ListChecks,
} from "lucide-react";
import { mockTripData } from "@/data/mock-trip-data";
import { TripApproval, TripRequest } from "@/types/trip-interfaces";
import { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function TripApprovals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<TripApproval | null>(
    null
  );
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(
    null
  );
  const [approvalAction, setApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [comments, setComments] = useState("");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewRequest, setViewRequest] = useState<TripRequest | null>(null);
  const [viewApproval, setViewApproval] = useState<TripApproval | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Get trip approvals and related requests
  const tripApprovals = mockTripData.approvals;
  const tripRequests = mockTripData.requests;

  // Create a map for quick request lookup
  const requestMap = new Map(tripRequests.map((req) => [req.id, req]));

  const filteredApprovals = tripApprovals.filter((approval) => {
    const request = requestMap.get(approval.tripRequestId);
    if (!request) return false;

    return (
      (approval.requestNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        request.requestedBy.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.purpose.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" ||
        approval.finalStatus.toLowerCase() === statusFilter)
    );
  });

  const formatCost = (amount: number, currency: string): string => {
    const symbol = currency === "LKR" ? "Rs." : currency;
    return `${symbol} ${amount.toLocaleString()}`;
  };

  // Calculate stats
  const stats = {
    pending: tripApprovals.filter((a) => a.finalStatus === "Pending").length,
    approved: tripApprovals.filter((a) => a.finalStatus === "Approved").length,
    rejected: tripApprovals.filter((a) => a.finalStatus === "Rejected").length,
    escalated: tripApprovals.filter((a) => a.escalated).length,
  };

  const handleApprovalAction = (
    approval: TripApproval,
    action: "approve" | "reject"
  ) => {
    const request = requestMap.get(approval.tripRequestId);
    if (!request) return;

    setSelectedApproval(approval);
    setSelectedRequest(request);
    setApprovalAction(action);
    setComments("");
    setIsApprovalDialogOpen(true);
  };

  const handleViewRequest = (approval: TripApproval) => {
    const request = requestMap.get(approval.tripRequestId);
    if (!request) return;

    setViewApproval(approval);
    setViewRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleViewHistory = (approval: TripApproval) => {
    const request = requestMap.get(approval.tripRequestId);
    if (!request) return;

    setSelectedApproval(approval);
    setSelectedRequest(request);
    setIsHistoryDialogOpen(true);
  };

  const submitApproval = () => {
    // In a real app, this would make an API call
    console.log("Submitting approval:", {
      approvalId: selectedApproval?.id,
      action: approvalAction,
      comments,
    });
    setIsApprovalDialogOpen(false);
    setComments("");
  };

  // Pagination
  const totalPages =
    pageSize > 0 ? Math.ceil(filteredApprovals.length / pageSize) : 1;
  const paginatedDocuments = filteredApprovals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
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

  const getCurrentApprovalStep = (approval: TripApproval) => {
    if (approval.finalStatus !== "Pending") return null;

    const currentStep =
      approval.approvalWorkflow[approval.currentApprovalLevel - 1];
    return currentStep;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">TRIP APPROVALS</h1>
          <p className="text-muted-foreground text-xs">
            Review and approve pending trip requests
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
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">
                  Pending Approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.approved}</div>
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
                <div className="text-2xl font-bold">{stats.rejected}</div>
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
                <div className="text-2xl font-bold">{stats.escalated}</div>
                <p className="text-sm text-muted-foreground">Escalated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>Trip requests requiring approval</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search approvals..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Approvals Table */}
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Details</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Trip Info</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((approval) => {
                  const request = requestMap.get(approval.tripRequestId);
                  if (!request) return null;

                  return (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {approval.requestNumber}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {request.purpose.description}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Created: {formatDate(approval.createdAt)}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {request.purpose.category}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {request.requestedBy.name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              {request.requestedBy.department}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {request.requestedBy.employeeId}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {request.tripDetails.departureDate}
                          </div>
                          <div className="text-sm flex items-start">
                            <MapPin className="h-3 w-3 mr-1 mt-0.5 text-green-500" />
                            <span className="text-xs">
                              {request.tripDetails.fromLocation.address}
                            </span>
                          </div>
                          <div className="text-sm flex items-start">
                            <MapPin className="h-3 w-3 mr-1 mt-0.5 text-red-500" />
                            <span className="text-xs">
                              {request.tripDetails.toLocation.address}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <UsersIcon className="h-3 w-3 mr-1" />
                            {request.requirements.passengerCount} passenger(s)
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(approval.finalStatus)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-sm">
                            {formatCost(
                              request.estimatedCost,
                              request.currency
                            )}
                          </span>
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
                              onClick={() => handleViewHistory(approval)}
                            >
                              <History className="h-4 w-4 mr-2" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewRequest(approval)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Request
                            </DropdownMenuItem>
                            {approval.finalStatus === "Pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleApprovalAction(approval, "approve")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />{" "}
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleApprovalAction(approval, "reject")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {paginatedDocuments.map((approval) => {
              const request = requestMap.get(approval.tripRequestId);
              if (!request) return null;

              return (
                <div
                  key={approval.id}
                  className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">
                      {approval.requestNumber}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {request.purpose.category}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>{request.purpose.description}</div>
                    <div>
                      <span className="font-medium">Requester:</span>{" "}
                      {request.requestedBy.name} (
                      {request.requestedBy.department})
                    </div>
                    <div>
                      <span className="font-medium">ID:</span>{" "}
                      {request.requestedBy.employeeId}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-green-500" />
                      {request.tripDetails.fromLocation.address}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-red-500" />
                      {request.tripDetails.toLocation.address}
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      {request.requirements.passengerCount} passenger(s)
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {request.tripDetails.departureDate}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {approval.finalStatus}
                    </div>
                    <div>
                      <span className="font-medium">Cost:</span>{" "}
                      {formatCost(request.estimatedCost, request.currency)}
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
                        <DropdownMenuItem
                          onClick={() => handleViewHistory(approval)}
                        >
                          <History className="h-4 w-4 mr-2" /> View History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewRequest(approval)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View Request
                        </DropdownMenuItem>
                        {approval.finalStatus === "Pending" && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleApprovalAction(approval, "approve")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleApprovalAction(approval, "reject")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
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
                of {filteredApprovals.length} documents
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

      {/* Approval Action Dialog */}
      <Dialog
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve"
                ? "Approve Trip Request"
                : "Reject Trip Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Request: {selectedApproval?.requestNumber} by{" "}
                  {selectedRequest.requestedBy.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Trip Date:</span>{" "}
                    {selectedRequest.tripDetails.departureDate}
                  </div>
                  <div>
                    <span className="font-medium">Estimated Cost:</span>{" "}
                    {selectedRequest.estimatedCost} {selectedRequest.currency}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Purpose:</span>{" "}
                  {selectedRequest.purpose.description}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Route:</span>{" "}
                  {selectedRequest.tripDetails.fromLocation.address} →{" "}
                  {selectedRequest.tripDetails.toLocation.address}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <Textarea
                placeholder={`Add your ${
                  approvalAction === "approve" ? "approval" : "rejection"
                } comments...`}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              variant={approvalAction === "approve" ? "default" : "destructive"}
            >
              {approvalAction === "approve"
                ? "Approve Request"
                : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="w-[90vw] max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border bg-background shadow-lg">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Approval History
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedRequest && (
                <>
                  Request{" "}
                  <span className="font-medium">
                    {selectedApproval?.requestNumber}
                  </span>{" "}
                  by{" "}
                  <span className="font-medium">
                    {selectedRequest.requestedBy.name}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedApproval && (
              <div className="space-y-6">
                {/* ── 1. Approval Rules ── */}
                <section className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" /> Approval Rules
                  </h3>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex justify-between border-b border-muted/30 pb-1">
                      <span className="text-muted-foreground">
                        Cost Threshold
                      </span>
                      <span className="font-medium">
                        {selectedApproval.approvalRules.costThreshold}{" "}
                        {selectedRequest?.currency}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-muted/30 pb-1">
                      <span className="text-muted-foreground">
                        Department Approval
                      </span>
                      <span className="font-medium">
                        {selectedApproval.approvalRules
                          .departmentApprovalRequired
                          ? "Required"
                          : "Not Required"}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-muted/30 pb-1">
                      <span className="text-muted-foreground">
                        Manager Approval
                      </span>
                      <span className="font-medium">
                        {selectedApproval.approvalRules.managerApprovalRequired
                          ? "Required"
                          : "Not Required"}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">
                        Finance Approval
                      </span>
                      <span className="font-medium">
                        {selectedApproval.approvalRules.financeApprovalRequired
                          ? "Required"
                          : "Not Required"}
                      </span>
                    </li>
                  </ul>
                </section>

                {/* ── 2. Approval Timeline ── */}
                <section className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                    <ListChecks className="h-4 w-4" /> Approval Timeline
                  </h3>

                  <div className="space-y-3">
                    {selectedApproval.approvalHistory.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {step.action === "Approved" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : step.action === "Rejected" ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">
                              Level {step.level}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(step.timestamp)}
                            </div>
                          </div>

                          <div className="text-sm">
                            <span className="font-medium">
                              {step.approver.name}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              ({step.approver.role})
                            </span>
                          </div>

                          <div className="text-sm">
                            Action:{" "}
                            <span
                              className={
                                step.action === "Approved"
                                  ? "text-green-600 font-medium"
                                  : step.action === "Rejected"
                                  ? "text-red-600 font-medium"
                                  : "text-yellow-600 font-medium"
                              }
                            >
                              {step.action}
                            </span>
                          </div>

                          {step.comments && (
                            <div className="text-sm text-muted-foreground italic">
                              “{step.comments}”
                            </div>
                          )}

                          {step.ipAddress && (
                            <div className="text-xs text-muted-foreground">
                              IP: {step.ipAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border bg-background shadow-lg overflow-x-hidden">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              Trip Request Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {viewApproval && viewRequest && (
                <>
                  Request #{viewApproval.requestNumber} –{" "}
                  <span className="font-medium">
                    {viewRequest.requestedBy.name}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {viewRequest && viewApproval && (
            <div className="space-y-6 py-4">
              {/* ── 1. Basic Info ── */}
              <section className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" /> Basic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {formatDate(viewApproval.createdAt)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span>{getStatusBadge(viewApproval.finalStatus)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Estimated Cost
                    </span>
                    <span className="font-medium">
                      {formatCost(
                        viewRequest.estimatedCost,
                        viewRequest.currency
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline">
                      {viewRequest.purpose.category}
                    </Badge>
                  </div>
                </div>
              </section>

              {/* ── 2. Requester ── */}
              <section className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> Requester Details
                </h3>
                <div className="pl-1 text-sm space-y-1">
                  <div>
                    {viewRequest.requestedBy.name}{" "}
                    <span className="text-muted-foreground">
                      ({viewRequest.requestedBy.employeeId})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {viewRequest.requestedBy.department}
                  </div>
                </div>
              </section>

              {/* ── 3. Purpose ── */}
              <section className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" /> Purpose
                </h3>
                <p className="text-sm text-foreground">
                  {viewRequest.purpose.description}
                </p>
              </section>

              {/* ── 4. Trip Details ── */}
              <section className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Trip Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Departure:</span>{" "}
                    {viewRequest.tripDetails.departureDate}
                  </div>
                  <div>
                    <span className="font-medium">Passengers:</span>{" "}
                    {viewRequest.requirements.passengerCount}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <span className="font-medium">Route:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span>{viewRequest.tripDetails.fromLocation.address}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>{viewRequest.tripDetails.toLocation.address}</span>
                  </div>
                </div>
              </section>

              {/* ── 5. Additional Requirements ── */}
              {viewRequest.requirements.specialRequirements && (
                <section className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                    Additional Requirements
                  </h3>
                  <p className="text-sm text-foreground">
                    {viewRequest.requirements.specialRequirements}
                  </p>
                </section>
              )}

              {/* ── 6. Current Approval Step ── */}
              {viewApproval.finalStatus === "Pending" && (
                <section className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                    Current Approval Step
                  </h3>
                  <div className="text-sm text-foreground">
                    {(() => {
                      const step = getCurrentApprovalStep(viewApproval);
                      return step
                        ? `${step.approverRole} – ${step.approverName}`
                        : "—";
                    })()}
                  </div>
                </section>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-3 mt-2">
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
