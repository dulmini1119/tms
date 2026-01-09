"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  FileSpreadsheet,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
  User,
  FileText,
  Building2,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Assuming this matches the backend response structure
interface TripCost {
  id: string;
  tripRequestId: string;
  requestNumber: string;
  cabServiceName: string;
  cabServiceId: string;
  status: "Draft" | "Pending" | "Paid" | "Overdue";
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
  payment: {
    status: string;
    method: string;
    paidDate: string;
    invoiceNumber: string;
  };
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface CabServiceInvoice {
  cabServiceId: string;
  cabServiceName: string;
  month: string;
  displayMonth: string;
  tripCount: number;
  totalAmount: number;
  status: "Draft" | "Pending" | "Paid" | "Overdue";
  dueDate: string;
  paidDate?: string;
  invoiceNumber?: string;
  trips: TripCost[];
  generatedDate?: string;
  generatedBy?: string;
}

interface MonthlyInvoice {
  id: string;
  month: string;
  displayMonth: string;
  totalTripCount: number;
  totalAmount: number;
  cabServices: CabServiceInvoice[];
}

type ViewMode = "by-vendor" | "by-month";
const validViewModes = ["by-vendor", "by-month"] as const;

// --- API HELPERS (Included in this file) ---

const API_BASE = "/trip-costs";

// Generic request handler
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorData : {message? : string} = {};
    try{
      errorData = await response.json();
    }catch{}
    throw new Error(errorData.message || `Error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;;
}

const api = {
  getAll: async (params: Record<string, string | undefined>): Promise<{ data: TripCost[] }> => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      ) as Record<string, string>
    ).toString();

    return request<{ data: TripCost[] }>(`${API_BASE}?${query}`);
  },
generateInvoice: async (id: string, data: { due_date: string; notes?: string; invoice_number?: string }) => {
    return request<{ success: boolean; invoice?: {
      id: string;
      invoiceNumber: string;
      generatedDate: string;
      dueDate: string;
      status: "Pending" | "Paid" | "Overdue" | "Draft";
      // add other fields you actually return/need
      totalAmount?: number;
      cabServiceId?: string;
      month?: string;
    } }>( // ← adjust return type if backend known
      `${API_BASE}/${id}/generate-invoice`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
recordPayment: async (
    id: string,
    data: {
      amount: number;
      paid_at: string;
      payment_method: string;
      transaction_id?: string;
      notes?: string;
    }
  ) => {
    return request<{ success: boolean }>(
      `${API_BASE}/${id}/record-payment`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
};

// --- COMPONENT LOGIC ---

export default function TripCosts() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [cabServiceFilter, setCabServiceFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("by-vendor");
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [isGenerateInvoiceOpen, setIsGenerateInvoiceOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<CabServiceInvoice | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(
    new Set()
  );

  // State for data
  const [invoices, setInvoices] = useState<CabServiceInvoice[]>([]);

  // Fetch Data Function
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.getAll({
        page: "1",
        pageSize: "100", // Load enough to group locally
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      if (response?.data) {
        const processed = processCostData(response.data);
        setInvoices(processed);
      }
    } catch (error) {
      console.error("Error fetching invoices", error);
      toast.error( "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Process raw API data into Invoice Groups
  const processCostData = (apiData: TripCost[]): CabServiceInvoice[] => {
    const grouped = new Map<string, TripCost[]>();

    apiData.forEach((trip) => {
      const date = new Date(trip.createdAt);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const key = `${trip.cabServiceId}-${monthKey}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(trip);
    });

    const processedInvoices: CabServiceInvoice[] = [];
    grouped.forEach((trips, key) => {
      const [cabServiceId, monthKey] = key.split("-");
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const displayMonth = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const totalAmount = trips.reduce((sum, t) => sum + t.totalCost, 0);
      const dueDate = new Date(parseInt(year), parseInt(month), 30);

      let status: CabServiceInvoice["status"] = "Draft";
      const allPaid = trips.every((t) => t.payment.status === "Paid");
      const anyPaid = trips.some((t) => t.payment.status === "Paid");
      if (allPaid) status = "Paid";
      else if (new Date() > dueDate && !allPaid) status = "Overdue";
      else if (anyPaid || trips.some((t) => t.payment.status === "Invoiced"))
        status = "Pending";

      const paidDate = trips
        .filter((t) => t.payment.paidDate)
        .map((t) => t.payment.paidDate)
        .sort()
        .reverse()[0];

      processedInvoices.push({
        cabServiceId,
        cabServiceName: trips[0].cabServiceName,
        month: monthKey,
        displayMonth,
        tripCount: trips.length,
        totalAmount,
        status,
        dueDate: dueDate.toISOString(),
        paidDate,
        invoiceNumber:
          status !== "Draft"
            ? `INV-${cabServiceId.split("-")[1] || "GEN"}-${monthKey.replace(
                "-",
                ""
              )}`
            : undefined,
        trips,
        generatedDate: status !== "Draft" ? trips[0]?.createdAt : undefined,
        generatedBy: status !== "Draft" ? "System" : undefined,
      });
    });

    return processedInvoices.sort((a, b) => {
      const dateCompare = b.month.localeCompare(a.month);
      if (dateCompare !== 0) return dateCompare;
      return a.cabServiceName.localeCompare(b.cabServiceName);
    });
  };

  // Filtering logic
  const cabServiceInvoices = invoices;
  const monthlyInvoices = groupByMonth();

  const filteredCabServiceInvoices = cabServiceInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.cabServiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.displayMonth.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesStatus =
      statusFilter === "all" || invoice.status.toLowerCase() === statusFilter;
    const matchesMonth = monthFilter === "all" || invoice.month === monthFilter;
    const matchesCabService =
      cabServiceFilter === "all" || invoice.cabServiceId === cabServiceFilter;

    return matchesSearch && matchesStatus && matchesMonth && matchesCabService;
  });

  const filteredMonthlyInvoices = monthlyInvoices.filter((invoice) => {
    const matchesSearch = invoice.displayMonth
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesMonth = monthFilter === "all" || invoice.month === monthFilter;

    let cabServices = invoice.cabServices;
    if (cabServiceFilter !== "all") {
      cabServices = cabServices.filter(
        (cs) => cs.cabServiceId === cabServiceFilter
      );
    }
    if (statusFilter !== "all") {
      cabServices = cabServices.filter(
        (cs) => cs.status.toLowerCase() === statusFilter
      );
    }

    return matchesSearch && matchesMonth && cabServices.length > 0;
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

  // Handlers
  const handleExportReport = () => {
    const exportPromise = new Promise<void>((resolve, reject) => {
      try {
        let csvContent: string;

        const escapeCSV = (
          value: string | number | boolean | null | undefined
        ): string => {
          if (value == null) return '""';
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        };

        if (viewMode === "by-vendor") {
          const header = [
            "Vendor",
            "Month",
            "Invoice Number",
            "Trip Count",
            "Total Amount",
            "Status",
            "Due Date",
            "Paid Date",
          ];

          const rows = filteredCabServiceInvoices.map((invoice) => [
            invoice.cabServiceName,
            invoice.displayMonth,
            invoice.invoiceNumber || "N/A",
            invoice.tripCount,
            formatCurrency(invoice.totalAmount),
            invoice.status,
            formatDate(invoice.dueDate),
            invoice.paidDate ? formatDate(invoice.paidDate) : "N/A",
          ]);

          csvContent = [header, ...rows]
            .map((row) => row.map(escapeCSV).join(","))
            .join("\n");
        } else {
          const header = [
            "Month",
            "Vendor Count",
            "Total Trips",
            "Total Amount",
          ];

          const rows = filteredMonthlyInvoices.map((invoice) => [
            invoice.displayMonth,
            invoice.cabServices.length,
            invoice.totalTripCount,
            formatCurrency(invoice.totalAmount),
          ]);

          csvContent = [header, ...rows]
            .map((row) => row.map(escapeCSV).join(","))
            .join("\n");
        }

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoices_${viewMode}_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(exportPromise, {
      loading: "Exporting report...",
      success: "Report exported successfully!",
      error: "Failed to export report.",
    });
  };

  const handleGenerateInvoices = async () => {
    const exportPromise = new Promise<void>(async (resolve, reject) => {
      try {
        const drafts = invoices.filter((inv) => inv.status === "Draft");
        
        // Generate for all drafts sequentially
        for (const inv of drafts) {
           if(inv.trips.length > 0) {
             // Assuming we use the first trip's ID to trigger generation for the group
             await api.generateInvoice(inv.trips[0].id, {
               due_date: inv.dueDate,
             });
           }
        }

        // Refresh Data
        await fetchInvoices();
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(exportPromise, {
      loading: "Generating invoices...",
      success: "Invoices generated successfully!",
      error: "Failed to generate invoices.",
    });
  };

  const handleConfirmGenerateInvoice = async (
    invoiceNumber: string,
    dueDate: string,
    notes: string
  ) => {
    if (!selectedInvoice || selectedInvoice.trips.length === 0) return;

    const exportPromise = new Promise<void>(async (resolve, reject) => {
      try {
        await api.generateInvoice(selectedInvoice.trips[0].id, {
          due_date: dueDate,
          notes: notes,
          invoice_number: invoiceNumber,
        });

        setIsGenerateInvoiceOpen(false);
        setSelectedInvoice(null);
        
        // Refresh Data
        await fetchInvoices();
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(exportPromise, {
      loading: "Generating invoice...",
      success: "Invoice generated successfully!",
      error: "Failed to generate invoice.",
    });
  };

  const handleDownloadInvoice = (invoice: CabServiceInvoice) => {
    const exportPromise = new Promise<void>((resolve, reject) => {
      try {
        if (invoice.status === "Draft") {
          toast.error("Cannot download draft invoice. Generate it first.");
          return reject("Draft invoice");
        }

        const escapeCSV = (
          value: string | number | boolean | null | undefined
        ): string => {
          if (value == null) return '""';
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        };

        const csvContent = [
          [
            "Invoice Number",
            "Vendor",
            "Month",
            "Trip Count",
            "Total Amount",
            "Status",
            "Due Date",
            "Paid Date",
          ],
          [
            invoice.invoiceNumber || "N/A",
            invoice.cabServiceName,
            invoice.displayMonth,
            invoice.tripCount,
            formatCurrency(invoice.totalAmount),
            invoice.status,
            formatDate(invoice.dueDate),
            invoice.paidDate ? formatDate(invoice.paidDate) : "N/A",
          ],
          ["", "Trip Details"],
          ["Trip Number", "Date", "Requester", "Department", "Amount"],
          ...invoice.trips.map((trip) => {
            return [
              trip.requestNumber,
              formatDate(trip.createdAt),
              trip.requestedBy?.name || "N/A",
              trip.billing?.billToDepartment || "N/A",
              formatCurrency(trip.totalCost),
            ];
          }),
        ]
          .map((row) => row.map(escapeCSV).join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice_${
          invoice.invoiceNumber || invoice.cabServiceId
        }_${invoice.month}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(exportPromise, {
      loading: `Downloading invoice ${invoice.invoiceNumber || ""}...`,
      success: "Invoice downloaded successfully!",
      error: "Failed to download invoice.",
    });
  };

  const handleExportDetails = (invoice: CabServiceInvoice) => {
    const exportPromise = new Promise<void>((resolve, reject) => {
      try {
        const escapeCSV = (
          value: string | number | boolean | null | undefined
        ): string => {
          if (value == null) return '""';
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        };

        const csvContent = [
          [
            "Trip Number",
            "Date",
            "Requester",
            "Department",
            "Driver Charges",
            "Vehicle Costs",
            "Additional Costs",
            "Tax",
            "Total Amount",
          ],
          ...invoice.trips.map((trip) => {
            return [
              trip.requestNumber,
              formatDate(trip.createdAt),
              trip.requestedBy?.name || "N/A",
              trip.billing?.billToDepartment || "N/A",
              formatCurrency(trip.costBreakdown.driverCharges.total),
              formatCurrency(trip.costBreakdown.vehicleCosts.total),
              formatCurrency(trip.costBreakdown.totalAdditionalCosts),
              formatCurrency(trip.billing.taxAmount),
              formatCurrency(trip.totalCost),
            ];
          }),
        ]
          .map((row) => row.map(escapeCSV).join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice_details_${invoice.cabServiceId}_${invoice.month}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(exportPromise, {
      loading: "Exporting invoice details...",
      success: "Invoice details exported successfully!",
      error: "Failed to export invoice details.",
    });
  };

  const handleViewDetails = (invoice: CabServiceInvoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDetailsOpen(true);
  };

  const handleGenerateInvoice = (invoice: CabServiceInvoice) => {
    setSelectedInvoice(invoice);
    setIsGenerateInvoiceOpen(true);
  };

  const handleMarkAsPaid = (invoice: CabServiceInvoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmMarkAsPaid = async (
    amount: number,
    paymentDate: string,
    paymentMethod: string,
    transactionId: string,
    notes: string
  ) => {
    if (!selectedInvoice || selectedInvoice.trips.length === 0) return;

    const exportPromise = new Promise<void>(async (resolve, reject) => {
      try {
        await api.recordPayment(selectedInvoice.trips[0].id, {
          amount,
          paid_at: paymentDate,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          notes,
        });

        setIsPaymentDialogOpen(false);
        setSelectedInvoice(null);

        // Refresh Data
        await fetchInvoices();
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(exportPromise, {
      loading: "Marking invoice as paid...",
      success: "Invoice marked as paid successfully!",
      error: "Failed to mark invoice as paid.",
    });
  };

  const toggleInvoiceExpansion = (key: string) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedInvoices(newExpanded);
  };

  const getStatusBadge = (status: CabServiceInvoice["status"]) => {
    const variants: Record<
      CabServiceInvoice["status"],
      {
        variant: VariantProps<typeof badgeVariants>["variant"]; // VariantProps<typeof badgeVariants>["variant"];
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

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUniqueMonths = () => {
    return Array.from(new Set(cabServiceInvoices.map((inv) => inv.month)))
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

  // Group by month
  function groupByMonth(): MonthlyInvoice[] {
    const monthlyMap = new Map<string, CabServiceInvoice[]>();
    cabServiceInvoices.forEach((invoice) => {
      if (!monthlyMap.has(invoice.month)) monthlyMap.set(invoice.month, []);
      monthlyMap.get(invoice.month)!.push(invoice);
    });

    const monthlyInvoicesList: MonthlyInvoice[] = [];
    monthlyMap.forEach((cabServices, monthKey) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const displayMonth = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      monthlyInvoicesList.push({
        id: monthKey,
        month: monthKey,
        displayMonth,
        totalTripCount: cabServices.reduce((sum, cs) => sum + cs.tripCount, 0),
        totalAmount: cabServices.reduce((sum, cs) => sum + cs.totalAmount, 0),
        cabServices,
      });
    });

    return monthlyInvoicesList.sort((a, b) => b.month.localeCompare(a.month));
  }

  // --- RENDER ---

  if (loading) return <div className="p-8 text-center">Loading...</div>;

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

      {/* Stats Cards */}
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

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Vendor Invoices</CardTitle>
              <CardDescription>
                Monthly billing organized by cab service vendor
              </CardDescription>
            </div>
            <Tabs
              value={viewMode}
              onValueChange={(v: string) => {
                if (validViewModes.includes(v as ViewMode)) {
                  setViewMode(v as ViewMode);
                } else {
                  toast.error(`Invalid view mode: ${v}`);
                }
              }}
            >
              <TabsList>
                <TabsTrigger value="by-vendor">By Vendor</TabsTrigger>
                <TabsTrigger value="by-month">By Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
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

          {/* View by Vendor */}
          {viewMode === "by-vendor" && (
            <div className="space-y-4">
              {filteredCabServiceInvoices.map((invoice) => {
                const key = `${invoice.cabServiceId}-${invoice.month}`;
                const isExpanded = expandedInvoices.has(key);

                return (
                  <Card key={key} className="overflow-hidden">
                    <div className="p-4">
                      {/* Table for larger screens */}
                      <div className="hidden sm:block">
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
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
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
                                      onClick={() =>
                                        handleGenerateInvoice(invoice)
                                      }
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Generate Invoice
                                    </DropdownMenuItem>
                                  )}
                                  {(invoice.status === "Pending" ||
                                    invoice.status === "Overdue") && (
                                    <DropdownMenuItem
                                      onClick={() => handleMarkAsPaid(invoice)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDownloadInvoice(invoice)
                                    }
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleExportDetails(invoice)}
                                  >
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Export Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
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
                                {invoice.trips.map((trip) => {
                                  // Using requestedBy directly from trip object
                                  return (
                                    <TableRow key={trip.id}>
                                      <TableCell className="font-medium">
                                        {trip.requestNumber}
                                      </TableCell>
                                      <TableCell>
                                        {formatDate(trip.createdAt)}
                                      </TableCell>
                                      <TableCell>
                                        {trip.requestedBy?.name || "N/A"}
                                      </TableCell>
                                      <TableCell>
                                        {trip.billing?.billToDepartment || "N/A"}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(trip.totalCost)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>

                      {/* Card for small screens */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex flex-col gap-2 border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">
                                  {invoice.cabServiceName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{invoice.displayMonth}</span>
                                {invoice.invoiceNumber && (
                                  <span>#{invoice.invoiceNumber}</span>
                                )}
                                {getStatusBadge(invoice.status)}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{invoice.tripCount} trips</span>
                                <span>Due: {formatDate(invoice.dueDate)}</span>
                                {invoice.paidDate && (
                                  <span className="text-green-600">
                                    Paid: {formatDate(invoice.paidDate)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions for mobile */}
                            <div className="flex flex-col items-end gap-1">
                              <div className="font-bold">
                                {formatCurrency(invoice.totalAmount)}
                              </div>
                              <div className="flex items-center space-x-2">
                                {/* Expand / collapse */}
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

                                {/* Dropdown menu for mobile */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleViewDetails(invoice)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" /> View
                                      Details
                                    </DropdownMenuItem>
                                    {invoice.status === "Draft" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleGenerateInvoice(invoice)
                                        }
                                      >
                                        <FileText className="h-4 w-4 mr-2" />{" "}
                                        Generate Invoice
                                      </DropdownMenuItem>
                                    )}
                                    {(invoice.status === "Pending" ||
                                      invoice.status === "Overdue") && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleMarkAsPaid(invoice)
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />{" "}
                                        Mark as Paid
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDownloadInvoice(invoice)
                                      }
                                    >
                                      <Download className="h-4 w-4 mr-2" />{" "}
                                      Download Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleExportDetails(invoice)}
                                    >
                                      <FileSpreadsheet className="h-4 w-4 mr-2" />{" "}
                                      Export Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-2 space-y-1">
                              {invoice.trips.map((trip) => {
                                return (
                                  <div
                                    key={trip.id}
                                    className="p-2 border rounded-md text-xs space-y-1"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        Trip #:
                                      </span>{" "}
                                      {trip.requestNumber}
                                    </div>
                                    <div>
                                      <span className="font-medium">Date:</span>{" "}
                                      {formatDate(trip.createdAt)}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Requester:
                                      </span>{" "}
                                      {trip.requestedBy?.name || "N/A"}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Department:
                                      </span>{" "}
                                      {trip.billing?.billToDepartment || "N/A"}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Amount:
                                      </span>{" "}
                                      {formatCurrency(trip.totalCost)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog
        open={isInvoiceDetailsOpen}
        onOpenChange={setIsInvoiceDetailsOpen}
      >
        <DialogContent className="sm:max-w-[900px] max-w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice &&
                `${selectedInvoice.cabServiceName} - ${selectedInvoice.displayMonth}`}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedInvoice.tripCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Trips
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Amount
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex justify-center">
                    {getStatusBadge(selectedInvoice.status)}
                  </CardContent>
                </Card>
              </div>

              {/* Invoice Information */}
              <div className="space-y-2">
                <h4 className="font-medium">Invoice Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border rounded-lg p-4">
                  <div>Vendor: {selectedInvoice.cabServiceName}</div>
                  <div>
                    Invoice Number:{" "}
                    {selectedInvoice.invoiceNumber || "Not Generated"}
                  </div>
                  <div>Billing Period: {selectedInvoice.displayMonth}</div>
                  <div>Due Date: {formatDate(selectedInvoice.dueDate)}</div>
                  <div>
                    Paid Date:{" "}
                    {selectedInvoice.paidDate
                      ? formatDate(selectedInvoice.paidDate)
                      : "Not Paid"}
                  </div>
                  <div>Number of Trips: {selectedInvoice.tripCount}</div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2">
                <h4 className="font-medium">Cost Breakdown</h4>
                <div className="border rounded-lg p-4 space-y-3 text-sm">
                  {(() => {
                    const driverTotal = selectedInvoice.trips.reduce(
                      (sum, t) => sum + t.costBreakdown.driverCharges.total,
                      0
                    );
                    const vehicleTotal = selectedInvoice.trips.reduce(
                      (sum, t) => sum + t.costBreakdown.vehicleCosts.total,
                      0
                    );
                    const additionalTotal = selectedInvoice.trips.reduce(
                      (sum, t) => sum + t.costBreakdown.totalAdditionalCosts,
                      0
                    );
                    const taxTotal = selectedInvoice.trips.reduce(
                      (sum, t) => sum + t.billing.taxAmount,
                      0
                    );
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Driver Charges:</span>
                          <span className="font-medium">
                            {formatCurrency(driverTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vehicle Costs:</span>
                          <span className="font-medium">
                            {formatCurrency(vehicleTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Additional Costs (Tolls, Parking, etc.):</span>
                          <span className="font-medium">
                            {formatCurrency(additionalTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span className="font-medium">
                            {formatCurrency(taxTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold pt-3 border-t">
                          <span>Total Amount Payable:</span>
                          <span>
                            {formatCurrency(selectedInvoice.totalAmount)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* All Trips */}
              <div className="space-y-2">
                <h4 className="font-medium">
                  All Trips ({selectedInvoice.tripCount})
                </h4>

                {/* Desktop Table */}
                <div className="hidden sm:block border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.trips.map((trip) => {
                        return (
                          <TableRow key={trip.id}>
                            <TableCell className="font-medium">
                              {trip.requestNumber}
                            </TableCell>
                            <TableCell>{formatDate(trip.createdAt)}</TableCell>
                            <TableCell>
                              {trip.requestedBy?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {trip.billing?.billToDepartment || "N/A"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(trip.totalCost)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-2">
                  {selectedInvoice.trips.map((trip) => {
                    return (
                      <div
                        key={trip.id}
                        className="border p-3 rounded-lg space-y-1"
                      >
                        <div>
                          <span className="font-medium">Trip #:</span>{" "}
                          {trip.requestNumber}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>{" "}
                          {formatDate(trip.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">Requester:</span>{" "}
                          {trip.requestedBy?.name || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span>{" "}
                          {trip.billing?.billToDepartment || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span>{" "}
                          {formatCurrency(trip.totalCost)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setIsInvoiceDetailsOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() =>
                selectedInvoice && handleDownloadInvoice(selectedInvoice)
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog
        open={isGenerateInvoiceOpen}
        onOpenChange={setIsGenerateInvoiceOpen}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              {selectedInvoice &&
                `Create an invoice for ${selectedInvoice.cabServiceName} - ${selectedInvoice.displayMonth}`}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Number</label>
                <Input
                  id="invoiceNumber"
                  defaultValue={`INV-${
                    selectedInvoice.cabServiceId.split("-")[1]
                  }-${selectedInvoice.month.replace("-", "")}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Name</label>
                <Input value={selectedInvoice.cabServiceName} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Billing Period</label>
                <Input value={selectedInvoice.displayMonth} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount</label>
                <Input
                  value={formatCurrency(selectedInvoice.totalAmount)}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Trips</label>
                <Input value={selectedInvoice.tripCount} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  id="dueDate"
                  type="date"
                  defaultValue={selectedInvoice.dueDate.split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input id="notes" placeholder="Add any additional notes..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateInvoiceOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedInvoice) return;
                const invoiceNumber =
                  (document.getElementById("invoiceNumber") as HTMLInputElement)
                    ?.value || "";
                const dueDate =
                  (document.getElementById("dueDate") as HTMLInputElement)
                    ?.value || selectedInvoice.dueDate;
                const notes =
                  (document.getElementById("notes") as HTMLInputElement)
                    ?.value || "";
                handleConfirmGenerateInvoice(invoiceNumber, dueDate, notes);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedInvoice &&
                `Mark invoice for ${selectedInvoice.cabServiceName} - ${selectedInvoice.displayMonth} as paid`}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Name</label>
                <Input value={selectedInvoice.cabServiceName} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Number</label>
                <Input
                  value={selectedInvoice.invoiceNumber || "N/A"}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Paid</label>
                <Input
                  id="amountPaid"
                  type="number"
                  defaultValue={selectedInvoice.totalAmount}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Date</label>
                <Input
                  id="paymentDate"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select
                  defaultValue="bank_transfer"
                  onValueChange={(value) => {
                    const input = document.getElementById(
                      "paymentMethod"
                    ) as HTMLInputElement;
                    if (input) input.value = value;
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="neft">NEFT</SelectItem>
                    <SelectItem value="rtgs">RTGS</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  id="paymentMethod"
                  defaultValue="bank_transfer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Transaction ID / Reference Number
                </label>
                <Input
                  id="transactionId"
                  placeholder="Enter transaction reference number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Notes</label>
                <Input id="paymentNotes" placeholder="Add payment notes..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedInvoice) return;
                const amount = parseFloat(
                  (document.getElementById("amountPaid") as HTMLInputElement)
                    ?.value || "0"
                );
                const paymentDate =
                  (document.getElementById("paymentDate") as HTMLInputElement)
                    ?.value || new Date().toISOString();
                const paymentMethod =
                  (document.getElementById("paymentMethod") as HTMLInputElement)
                    ?.value || "bank_transfer";
                const transactionId =
                  (document.getElementById("transactionId") as HTMLInputElement)
                    ?.value || "";
                const notes =
                  (document.getElementById("paymentNotes") as HTMLInputElement)
                    ?.value || "";
                handleConfirmMarkAsPaid(
                  amount,
                  paymentDate,
                  paymentMethod,
                  transactionId,
                  notes
                );
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}