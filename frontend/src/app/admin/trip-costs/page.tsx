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
  Car,
  User,
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

interface BackendInvoice {
  id: string;
  invoice_number: string | null;
  cab_service_id: string;
  billing_month: string;
  total_amount: string;
  status: "Draft" | "Pending" | "Paid" | "Overdue";
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
  cab_service?: {
    name: string;
  };
  trips?: TripCost[];
  trip_count?: number;
}
interface BackendInvoiceDetails {
  id: string;
  trip_costs?: Array<{
    id: string;
    total_cost: string;
    created_at: string;
    trip_assignments: {
      drivers?: {
        users_drivers_user_idTousers: {
          first_name: string;
          last_name: string;
        };
      };
      // Note: Your Prisma schema uses 'id' for vehicles, but frontend expects it here.
      vehicles: {
        id: string;
        registration_number: string;
        make: string;
        model: string;
      };
    };
  }>;
}

interface TripCost {
  id: string;
  totalCost: number;
  created_at: string;
  driverName?: string;
  trip_assignments?: {
    trip_requests?: {
      users_trip_requests_requested_by_user_idTousers?: {
        first_name: string;
        last_name: string;
      };
    };
    vehicles?: {
      registration_number: string;
      make: string;
      model: string;
    };
  };
}

interface VehicleGroup {
  vehicleId: string;
  registrationNumber: string;
  make: string;
  model: string;
  trips: TripCost[];
  totalCost: number;
  tripCount: number;
}

interface CabServiceInvoice {
  id: string;
  cabServiceId: string;
  cabServiceName: string;
  billingMonth: string;
  displayMonth: string;
  tripCount: number;
  totalAmount: number;
  status: "Draft" | "Pending" | "Paid" | "Overdue" | "NoCharges";
  dueDate: string;
  paidDate?: string;
  invoiceNumber?: string;
  trips: TripCost[];
  breakdownByVehicle?: VehicleGroup[];
}

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
    return request<BackendInvoice[]>(`/invoices${query ? `?${query}` : ""}`);
  },

getInvoiceDetails: async (invoiceId: string) => {
  return request<CabServiceInvoice>(`/invoices/${invoiceId}`);
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
      },
    );
  },

  payInvoice: async (
    invoiceId: string,
    data: { paid_at: string; transaction_id?: string; notes?: string },
  ) => {
    return request<{ success: boolean }>(`/invoices/${invoiceId}/pay`, {
      method: "POST",
      body: JSON.stringify(data),
    });
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

  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(
    new Set(),
  );

  const [invoices, setInvoices] = useState<CabServiceInvoice[]>([]);

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentNotes, setPaymentNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  // --- FETCH INVOICES ---
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (monthFilter !== "all") params.month = monthFilter;
      if (cabServiceFilter !== "all") params.cab_service_id = cabServiceFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await api.getAllInvoices(params);

      console.log("Fetched Invoices:", response);

      const mappedInvoices: CabServiceInvoice[] = response.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number ?? undefined,

        cabServiceId: inv.cab_service_id,
        cabServiceName: inv.cab_service?.name ?? "Unknown Vendor",

        billingMonth: inv.billing_month,
        displayMonth: inv.billing_month,

        tripCount: inv.trip_count || 0,
        totalAmount: Number(inv.total_amount),

        status: inv.status,
        dueDate: inv.due_date ?? "",
        paidDate: inv.paid_date ?? undefined,

        trips: [],
        breakdownByVehicle: [],
      }));
      setInvoices(mappedInvoices);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, monthFilter, cabServiceFilter, searchTerm]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const fetchInvoiceDetails = async (invoice: CabServiceInvoice) => {
    try {
      // 1. Fetch data typed as BackendInvoiceDetails
      const detailedInvoiceRaw = await api.getInvoiceDetails(invoice.id);
      console.log("Fetched Invoice Details:", detailedInvoiceRaw);

      // 2. Map Raw Data to Frontend Format
      // We cast raw data to BackendInvoiceDetails to ensure type safety during mapping
      const raw = detailedInvoiceRaw as BackendInvoiceDetails;
      
      const mappedTrips: TripCost[] = (raw.trip_costs || []).map((cost) => {
        
        const driverUser = cost.trip_assignments?.drivers?.users_drivers_user_idTousers;
        const driverName = driverUser 
          ? `${driverUser.first_name} ${driverUser.last_name}` 
          : "Unassigned";

        const vehicle = cost.trip_assignments?.vehicles;

        // Reconstruct the nested structure expected by the UI Table
        // We create a dummy object for trip_requests as backend doesn't send it
        const reconstructedRequest = {
          trip_requests: {
            users_trip_requests_requested_by_user_idTousers: {
              first_name: "Unknown",
              last_name: "Requester",
            }
          },
          vehicles: vehicle // Pass the raw vehicle object directly
        };

        return {
          id: cost.id,
          totalCost: Number(cost.total_cost),
          created_at: cost.created_at,
          driverName: driverName,
          trip_assignments: reconstructedRequest
        };
      });

      // 3. Group by Vehicle
      const vehicleMap = new Map<string, VehicleGroup>();

      mappedTrips.forEach((trip) => {
        // Safe check: if assignment is missing, we can't group by vehicle
        if (!trip.trip_assignments) return;

        const vehicle = trip.trip_assignments.vehicles;
        
        // IMPROVEMENT: Handle missing vehicle gracefully
        // We use ID as key, or 'unknown' if ID is missing
        const vId =  vehicle?.registration_number || "unknown";
        
        if (!vehicleMap.has(vId)) {
          vehicleMap.set(vId, {
            vehicleId: vId,
            registrationNumber: vehicle?.registration_number || "Unknown Vehicle",
            make: vehicle?.make || "N/A",
            model: vehicle?.model || "N/A",
            trips: [],
            totalCost: 0,
            tripCount: 0,
          });
        }

        const group = vehicleMap.get(vId);
        if (group) { // Safe check to avoid undefined
          group.totalCost += trip.totalCost;
          group.tripCount += 1;
          group.trips.push(trip);
        }
      });

      const breakdownByVehicle = Array.from(vehicleMap.values());

      // 4. Merge updated data
      const detailedInvoice: Partial<CabServiceInvoice> = {
        ...raw,
        trips: mappedTrips,
        breakdownByVehicle: breakdownByVehicle,
        tripCount: mappedTrips.length
      };

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id ? { ...inv, ...detailedInvoice } : inv,
        ),
      );

      if (selectedInvoice?.id === invoice.id) {
        setSelectedInvoice({ ...selectedInvoice, ...detailedInvoice } as CabServiceInvoice);
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to load invoice details");
    }
  };

  // --- FILTERING & STATS ---
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.cabServiceName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
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
    totalOutstanding: invoices
      .filter((inv) => inv.status !== "Paid")
      .reduce((sum, inv) => sum + inv.totalAmount, 0),
    paidThisMonth: invoices
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
    pendingInvoices: invoices.filter((inv) => inv.status === "Pending").length,
    overdueInvoices: invoices.filter((inv) => inv.status === "Overdue").length,
    totalVendors: new Set(invoices.map((inv) => inv.cabServiceId)).size,
  };

  // --- HANDLERS ---
  const handleGenerateInvoices = async () => {
    // Logic remains similar
    const drafts = filteredInvoices.filter((inv) => inv.status === "Draft");
    if (drafts.length === 0) {
      toast.info("No draft invoices to generate.");
      return;
    }
    // ... (keep existing logic)
    const promise = Promise.all(
      drafts.map((inv) =>
        api.generateInvoice({
          cabServiceId: inv.cabServiceId,
          month: inv.billingMonth,
          dueDate: inv.dueDate || new Date().toISOString().split("T")[0],
          notes: "Generated monthly batch",
        }),
      ),
    );
    toast.promise(promise, {
      loading: "Generating invoices...",
      success: "Invoices generated!",
      error: "Failed to generate.",
    });
    promise.then(() => fetchInvoices());
  };

  const handleConfirmGenerateInvoice = async (
    invoiceNumber: string,
    dueDate: string,
    notes: string,
  ) => {
    if (!selectedInvoice) return;
    const promise = api.generateInvoice({
      cabServiceId: selectedInvoice.cabServiceId,
      month: selectedInvoice.billingMonth,
      dueDate,
      notes,
    });
    toast.promise(promise, {
      loading: "Generating...",
      success: "Generated!",
      error: "Failed.",
    });
    promise.then(() => {
      setIsGenerateInvoiceOpen(false);
      fetchInvoices();
    });
  };

  const handleExportReport = () => {
    // ... (keep existing logic)
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
      `invoice_report_${new Date().toISOString().split("T")[0]}.csv`,
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
    notes: string,
  ) => {
    if (!selectedInvoice) return;
    const promise = api.payInvoice(selectedInvoice.id, {
      paid_at: paymentDate,
      transaction_id: transactionId,
      notes,
    });
    toast.promise(promise, {
      loading: "Recording payment...",
      success: "Paid!",
      error: "Failed.",
    });
    promise.then(() => {
      setIsPaymentDialogOpen(false);
      fetchInvoices();
    });
  };

  const handleViewDetails = async (invoice: CabServiceInvoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDetailsOpen(true);
    // Fetch the detailed breakdown from backend
    await fetchInvoiceDetails(invoice);
  };

  // --- HELPERS ---
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "Rs. 0.00";
    return `Rs. ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
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
      string,
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
      NoCharges: {
        variant: "secondary",
        icon: <CheckCircle className="h-3 w-3" />,
      },
    };
    const config = variants[status] || variants.Draft;
    return (
      <Badge
        variant={config.variant}
        className={`flex items-center gap-1 ${config.className || ""}`}
      >
        {config.icon} {status}
      </Badge>
    );
  };

  const getUniqueMonths = () => {
    return Array.from(new Set(invoices.map((inv) => inv.billingMonth)))
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
        invoices
          .map((inv) => ({ id: inv.cabServiceId, name: inv.cabServiceName }))
          .map((cs) => JSON.stringify(cs)),
      ),
    )
      .map((str) => JSON.parse(str))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const toggleVehicleExpansion = (vehicleId: string) => {
    setExpandedVehicles((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId);
      else next.add(vehicleId);
      return next;
    });
  };

  if (loading && invoices.length === 0)
    return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* HEADER & STATS */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">TRIP COSTS</h1>
          <p className="text-muted-foreground text-xs">
            Manage monthly invoices and payments per cab service vendor
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportReport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={handleGenerateInvoices}>
            <FileText className="h-4 w-4 mr-2" /> Generate
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

      {/* INVOICE LIST */}
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
          {/* FILTERS */}
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

          {/* LIST ITEMS */}
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="overflow-hidden">
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
                            <Truck className="h-3 w-3 mr-1" />{" "}
                            {invoice.tripCount} trips
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" /> Due:{" "}
                            {formatDate(invoice.dueDate)}
                          </div>
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
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {invoice.status === "Draft" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setIsGenerateInvoiceOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" /> Generate
                                Invoice
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
                                <CheckCircle className="h-4 w-4 mr-2" /> Mark as
                                Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {}}>
                              <Download className="h-4 w-4 mr-2" /> Download
                              Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DETAILS DIALOG */}
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
              {/* Summary Stats */}
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
                  <p className="text-sm text-muted-foreground">Total Trips</p>
                  <p className="text-2xl font-bold">
                    {selectedInvoice.tripCount}
                  </p>
                </div>
              </div>

              {/* BREAKDOWN BY VEHICLE */}
              {selectedInvoice.breakdownByVehicle &&
              selectedInvoice.breakdownByVehicle.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Cost Breakdown by Vehicle
                  </h3>

                  {selectedInvoice.breakdownByVehicle.map((vehicleGroup) => {
                    const isExpanded = expandedVehicles.has(
                      vehicleGroup.vehicleId,
                    );
                    return (
                      <Card key={vehicleGroup.vehicleId}>
                        <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            toggleVehicleExpansion(vehicleGroup.vehicleId)
                          }
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <Car className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {vehicleGroup.registrationNumber}
                                <Badge variant="outline">
                                  {vehicleGroup.tripCount} Trips
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {vehicleGroup.make} {vehicleGroup.model}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-bold">
                                {formatCurrency(vehicleGroup.totalCost)}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* EXPANDED TRIPS TABLE FOR THIS VEHICLE */}
                        {isExpanded && (
                          <div className="border-t px-4 py-2 bg-slate-50">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Requester</TableHead>
                                  <TableHead>Driver</TableHead>
                                  <TableHead className="text-right">
                                    Cost
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {vehicleGroup.trips.map((trip) => {
                                  // Extract data from the nested structure (Prisma returns this way)
                                  const requester =
                                    trip.trip_assignments?.trip_requests
                                      ?.users_trip_requests_requested_by_user_idTousers;
                                  const requesterName = requester
                                    ? `${requester.first_name} ${requester.last_name}`
                                    : "Unknown";

                                  return (
                                    <TableRow key={trip.id}>
                                      <TableCell>
                                        {formatDate(trip.created_at)}
                                      </TableCell>
                                      <TableCell>{requesterName}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <User className="h-3 w-3 text-muted-foreground" />
                                          {trip.driverName || "Unassigned"}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatCurrency(Number(trip.totalCost))}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No breakdown data available.
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

      {/* GENERATE DIALOG */}
      <Dialog
        open={isGenerateInvoiceOpen}
        onOpenChange={setIsGenerateInvoiceOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
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
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={generateNotes}
                onChange={(e) => setGenerateNotes(e.target.value)}
                placeholder="Notes..."
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
                    generateNotes,
                  );
                } else {
                  toast.error("Select date");
                }
              }}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PAYMENT DIALOG */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
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
              <label className="text-sm font-medium">Transaction ID</label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Bank Ref"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
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
                    paymentNotes,
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
