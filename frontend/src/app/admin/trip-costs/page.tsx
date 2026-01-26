"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  FileSpreadsheet,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Truck,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { VariantProps } from "class-variance-authority";

// --- INTERFACES ---

// 1. Interface for an Individual Trip (From Old Backend)
interface TripCost {
  id: string;
  tripRequestId: string;
  requestNumber: string;
  cabServiceId: string;
  status: string;
  createdAt: string;
  totalCost: number;
  costBreakdown: {
    driverCharges: { total: number };
    vehicleCosts: { total: number };
    totalAdditionalCosts: number;
  };
  billing: {
    billToDepartment: string;
    taxAmount: number;
  };
  requestedBy: {
    name: string;
    email: string;
  };
}

// 2. Interface for a Monthly Invoice (From New Backend)
interface CabServiceInvoice {
  id: string;
  cabServiceId: string;
  cabServiceName: string;
  billingMonth: string;
  displayMonth: string;
  tripCount: number;
  totalAmount: number;
  status: "Draft" | "Pending" | "Paid" | "Overdue";
  dueDate: string;
  paidDate?: string;
  invoiceNumber?: string;
  trips: TripCost[];
}

// --- API HELPERS ---

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorData: { message?: string } = {};
    try {
      errorData = await response.json();
    } catch {}
    throw new Error(errorData.message || `Error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

const api = {
  getAllInvoices: async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ data: CabServiceInvoice[] }>(
      `/invoices${query ? `?${query}` : ""}`
    );
  },

  generateInvoice: async (data: {
    cabServiceId: string;
    month: string;
    dueDate: string;
    notes: string;
  }) => {
    return request<{ success: boolean; invoice: CabServiceInvoice }>(
      `/invoices/generate`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  payInvoice: async (
    invoiceId: string,
    data: { paid_at: string; transaction_id?: string; notes?: string }
  ) => {
    return request<{ success: boolean }>(`/invoices/${invoiceId}/pay`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getTripCosts: async (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ data: TripCost[] }>(`/trip-costs?${query}`);
  },
};

// --- COMPONENT LOGIC ---

export default function TripCosts() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [cabServiceFilter, setCabServiceFilter] = useState("all");

  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [isGenerateInvoiceOpen, setIsGenerateInvoiceOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [generateDueDate, setGenerateDueDate] = useState("");
  const [generateNotes, setGenerateNotes] = useState("");
  const [selectedInvoice, setSelectedInvoice] =
    useState<CabServiceInvoice | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(
    new Set()
  );

  const [invoices, setInvoices] = useState<CabServiceInvoice[]>([]);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentNotes, setPaymentNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  // --- 1. FETCH MONTHLY INVOICES (FIXED WITH USECALLBACK) ---
  const fetchInvoices = useCallback(async () => {
    console.log(">> [FETCH INVOICES] Started");
    try {
      setLoading(true);

      // Build query params
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (monthFilter !== "all") params.month = monthFilter;
      if (cabServiceFilter !== "all") params.cab_service_id = cabServiceFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      // Fetch invoices from backend
      console.log(">> [FETCH INVOICES] Requesting with params:", params);
      const response = await api.getAllInvoices(params);
      console.log(">> [FETCH INVOICES] Response received:", response);

      if (response?.data) {
        const mappedInvoices: CabServiceInvoice[] = response.data.map((inv) => {
          // Use billingMonth directly as displayMonth
          const displayMonth = inv.billingMonth;

          return {
            id: inv.id,
            cabServiceId: inv.cabServiceId,
            cabServiceName: inv.cabServiceName ?? "Unknown Vendor",
            billingMonth: inv.billingMonth,
            displayMonth,
            tripCount: inv.tripCount ?? 0,
            totalAmount: Number(inv.totalAmount), // Convert string to number
            status: inv.status as CabServiceInvoice["status"],
            dueDate: inv.dueDate,
            paidDate: inv.paidDate,
            invoiceNumber: inv.invoiceNumber,
            trips: inv.trips || [], // lazy load trips
          };
        });

        setInvoices(mappedInvoices);
      }
    } catch (error) {
      console.error(">> [FETCH INVOICES] Error:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, monthFilter, cabServiceFilter, searchTerm]);

  // Effect to trigger fetch
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // --- 2. FETCH DETAILS ON DEMAND ---
  const fetchTripDetails = async (invoice: CabServiceInvoice) => {
    console.log(">> [FETCH TRIPS] Fetching details for:", invoice.id);
    
    // Prevent re-fetching if we already have data
    if (invoice.trips.length > 0) {
      console.log(">> [FETCH TRIPS] Already loaded, skipping.");
      return;
    }

    try {
      toast.loading("Loading trip details...", { id: "load-trips" });

      // Logging the exact parameters being sent to backend
      console.log(">> [FETCH TRIPS] Calling API with:", {
        cab_service_id: invoice.cabServiceId,
        month: invoice.billingMonth,
      });

      const response = await api.getTripCosts({
        cab_service_id: invoice.cabServiceId,
        month: invoice.billingMonth,
      });
      
      console.log(">> [FETCH TRIPS] API Response:", response);

      if (response?.data) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoice.id ? { ...inv, trips: response.data } : inv
          )
        );

        if (selectedInvoice?.id === invoice.id) {
          setSelectedInvoice({ ...invoice, trips: response.data });
        }
        toast.success("Trip details loaded", { id: "load-trips" });
      }
    } catch (error) {
      console.error(">> [FETCH TRIPS] Error:", error);
      toast.error("Failed to load trip details");
      toast.dismiss("load-trips");
    }
  };

  // --- FILTERING LOGIC ---
  // We use the raw 'invoices' state for stats, and apply filters for the list
  const cabServiceInvoices = invoices;

  const filteredInvoices = cabServiceInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.cabServiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.displayMonth.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesStatus =
      statusFilter === "all" || invoice.status.toLowerCase() === statusFilter;
    const matchesMonth =
      monthFilter === "all" || invoice.billingMonth === monthFilter;
    const matchesCabService =
      cabServiceFilter === "all" || invoice.cabServiceId === cabServiceFilter;

    return matchesSearch && matchesStatus && matchesMonth && matchesCabService;
  });

  const stats = {
    totalOutstanding: cabServiceInvoices
      .filter((inv) => inv.status !== "Paid")
      .reduce((sum, inv) => sum + inv.totalAmount, 0),
    paidThisMonth: cabServiceInvoices
      .filter((inv) => {
        if (!inv.paidDate) return false;
        const paidDate = new Date(inv.paidDate);
        const now = new Date();
        return (
          paidDate.getMonth() === now.getMonth() &&
          paidDate.getFullYear() === now.getFullYear() &&
          inv.status === "Paid"
        );
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0),
    pendingInvoices: cabServiceInvoices.filter(
      (inv) => inv.status === "Pending"
    ).length,
    overdueInvoices: cabServiceInvoices.filter(
      (inv) => inv.status === "Overdue"
    ).length,
    totalVendors: new Set(cabServiceInvoices.map((inv) => inv.cabServiceId))
      .size,
  };

  // --- HANDLERS ---

  const handleGenerateInvoices = async () => {
    const drafts = filteredInvoices.filter((inv) => inv.status === "Draft");
    if (drafts.length === 0) {
      toast.info("No draft invoices to generate.");
      return;
    }

    const promise = Promise.all(
      drafts.map((inv) =>
        api.generateInvoice({
          cabServiceId: inv.cabServiceId,
          month: inv.billingMonth,
          dueDate: inv.dueDate || new Date().toISOString().split("T")[0],
          notes: "Generated monthly batch",
        })
      )
    );

    toast.promise(promise, {
      loading: "Generating invoices...",
      success: "Invoices generated successfully!",
      error: "Failed to generate invoices.",
    });

    promise.then(() => fetchInvoices());
  };

  const handleConfirmGenerateInvoice = async (
    invoiceNumber: string,
    dueDate: string,
    notes: string
  ) => {
    if (!selectedInvoice) return;

    console.log(">> [GENERATE] Generating invoice for:", selectedInvoice.id);

    const promise = api.generateInvoice({
      cabServiceId: selectedInvoice.cabServiceId,
      month: selectedInvoice.billingMonth,
      dueDate,
      notes,
    });

    toast.promise(promise, {
      loading: "Generating invoice...",
      success: "Invoice generated successfully!",
      error: "Failed to generate invoice.",
    });

    promise.then(() => {
      setIsGenerateInvoiceOpen(false);
      fetchInvoices();
    });
  };

  const handleExportReport = () => {
    const headers = [
      "Invoice Number",
      "Vendor",
      "Month",
      "Status",
      "Total Amount",
      "Due Date",
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber || "Draft",
      inv.cabServiceName,
      inv.displayMonth,
      inv.status,
      inv.totalAmount.toFixed(2),
      inv.dueDate || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `invoice_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmMarkAsPaid = async (
    amount: number,
    paymentDate: string,
    paymentMethod: string,
    transactionId: string,
    notes: string
  ) => {
    if (!selectedInvoice) return;

    console.log(">> [PAY] Marking invoice as paid:", selectedInvoice.id);

    const promise = api.payInvoice(selectedInvoice.id, {
      paid_at: paymentDate,
      transaction_id: transactionId,
      notes,
    });

    toast.promise(promise, {
      loading: "Recording payment...",
      success: "Invoice marked as paid successfully!",
      error: "Failed to record payment.",
    });

    promise.then(() => {
      setIsPaymentDialogOpen(false);
      fetchInvoices();
    });
  };

  const handleViewDetails = async (invoice: CabServiceInvoice) => {
    console.log(">> [VIEW] Opening details for:", invoice.id);
    setSelectedInvoice(invoice);
    setIsInvoiceDetailsOpen(true);
    await fetchTripDetails(invoice);
  };

  const toggleInvoiceExpansion = async (key: string) => {
    const newExpanded = new Set(expandedInvoices);
    const isExpanding = !newExpanded.has(key);

    if (isExpanding) newExpanded.add(key);
    else newExpanded.delete(key);

    setExpandedInvoices(newExpanded);

    if (isExpanding) {
      const invoice = invoices.find((inv) => inv.id === key);
      if (invoice) await fetchTripDetails(invoice);
    }
  };

  // --- HELPERS ---

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return "Rs. 0.00";
    }
    return `Rs. ${amount.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("si-LK", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: CabServiceInvoice["status"]) => {
    const variants: Record<
      CabServiceInvoice["status"],
      {
        variant: VariantProps<typeof badgeVariants>["variant"];
        icon: React.ReactNode;
        className?: string;
      }
    > = {
      Draft: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      Pending: {
        variant: "default",
        icon: <AlertCircle className="h-3 w-3" />,
        className: "bg-yellow-500",
      },
      Paid: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
        className: "bg-green-500",
      },
      Overdue: {
        variant: "destructive",
        icon: <AlertCircle className="h-3 w-3" />,
      },
    };
    const config = variants[status];
    return (
      <Badge
        variant={config.variant}
        className={`flex items-center gap-1 ${config.className || ""}`}
      >
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getUniqueMonths = () => {
    return Array.from(
      new Set(cabServiceInvoices.map((inv) => inv.billingMonth))
    )
      .sort((a, b) => b.localeCompare(a))
      .map((month) => {
        const [year, m] = month.split("-");
        const date = new Date(parseInt(year), parseInt(m) - 1, 1);
        return {
          value: month,
          label: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        };
      });
  };

  const getUniqueCabServices = () => {
    return Array.from(
      new Set(
        cabServiceInvoices
          .map((inv) => ({ id: inv.cabServiceId, name: inv.cabServiceName }))
          .map((cs) => JSON.stringify(cs))
      )
    )
      .map((str) => JSON.parse(str))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  if (loading && invoices.length === 0) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">TRIP COSTS</h1>
          <p className="text-muted-foreground text-xs">
            Manage monthly invoices and payments per cab service vendor
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportReport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleGenerateInvoices}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoices
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalVendors}</div>
                <p className="text-sm text-muted-foreground">Active Vendors</p>
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
                  {formatCurrency(stats.paidThisMonth)}
                </div>
                <p className="text-sm text-muted-foreground">Paid This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.pendingInvoices}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.overdueInvoices}
                </div>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Vendor Invoices</CardTitle>
              <CardDescription>
                Monthly billing organized by cab service vendor
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative flex-1 min-w-[150px] max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={cabServiceFilter}
              onValueChange={setCabServiceFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Cab Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {getUniqueCabServices().map((cs) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    {cs.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {getUniqueMonths().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const key = invoice.id;
              const isExpanded = expandedInvoices.has(key);

              return (
                <Card key={key} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">
                              {invoice.cabServiceName}
                            </h3>
                            <Badge variant="outline">
                              {invoice.displayMonth}
                            </Badge>
                            {invoice.invoiceNumber && (
                              <Badge variant="outline">
                                {invoice.invoiceNumber}
                              </Badge>
                            )}
                            {getStatusBadge(invoice.status)}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Truck className="h-3 w-3 mr-1" />
                              {invoice.tripCount} trips
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {formatDate(invoice.dueDate)}
                            </div>
                            {invoice.paidDate && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid: {formatDate(invoice.paidDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatCurrency(invoice.totalAmount)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total Amount
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleInvoiceExpansion(key)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(invoice)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {invoice.status === "Draft" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setIsGenerateInvoiceOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generate Invoice
                                </DropdownMenuItem>
                              )}
                              {(invoice.status === "Pending" ||
                                invoice.status === "Overdue") && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setIsPaymentDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {}}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {isExpanded && invoice.trips.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Trip Number</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Requester</TableHead>
                              <TableHead>Department</TableHead>
                              <TableHead className="text-right">
                                Amount
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoice.trips.map((trip) => (
                              <TableRow key={trip.id}>
                                <TableCell className="font-medium">
                                  {trip.requestNumber}
                                </TableCell>
                                <TableCell>
                                  {formatDate(trip.createdAt)}
                                </TableCell>
                                <TableCell>{trip.requestedBy?.name}</TableCell>
                                <TableCell>
                                  {trip.billing?.billToDepartment || "N/A"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(trip.totalCost)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isInvoiceDetailsOpen}
        onOpenChange={setIsInvoiceDetailsOpen}
      >
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.cabServiceName} —{" "}
              {selectedInvoice?.displayMonth}
              {selectedInvoice?.invoiceNumber &&
                ` • ${selectedInvoice.invoiceNumber}`}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Trips</p>
                  <p className="text-2xl font-bold">
                    {selectedInvoice.tripCount}
                  </p>
                </div>
              </div>

              {selectedInvoice.trips.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Trip Details</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.trips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-medium">
                            {trip.requestNumber}
                          </TableCell>
                          <TableCell>{formatDate(trip.createdAt)}</TableCell>
                          <TableCell>{trip.requestedBy?.name || "—"}</TableCell>
                          <TableCell>
                            {trip.billing?.billToDepartment || "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(trip.totalCost)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Loading trip details...
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInvoiceDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isGenerateInvoiceOpen}
        onOpenChange={setIsGenerateInvoiceOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Finalize invoice for {selectedInvoice?.cabServiceName} —{" "}
              {selectedInvoice?.displayMonth}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={generateDueDate}
                onChange={(e) => setGenerateDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                value={generateNotes}
                onChange={(e) => setGenerateNotes(e.target.value)}
                placeholder="Additional notes..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateInvoiceOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedInvoice && generateDueDate) {
                  handleConfirmGenerateInvoice(
                    "AUTO",
                    generateDueDate,
                    generateNotes
                  );
                } else {
                  toast.error("Please select a due date");
                }
              }}
            >
              Generate Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Mark invoice as paid for {selectedInvoice?.cabServiceName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Payment Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Transaction ID (optional)
              </label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. bank ref number"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedInvoice && paymentDate) {
                  handleConfirmMarkAsPaid(
                    selectedInvoice.totalAmount,
                    paymentDate,
                    "Bank Transfer",
                    transactionId,
                    paymentNotes
                  );
                }
              }}
            >
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}