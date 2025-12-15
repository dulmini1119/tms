"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Download,
  Upload,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------- TYPES ----------------
interface RateCard {
  id: string;
  rate_per_km: number;
  minimum_fare: number;
  waiting_charges: number;
  night_charges: number;
}

interface CabService {
  id: string;
  name: string;
}

interface CabAgreement {
  id: string;
  agreement_number: string;
  title?: string;
  cab_services: CabService;
  status?: string;
  start_date: string;
  end_date: string;
  auto_renewal?: boolean;
  renewal_period?: string;
  client_company_name?: string;
  client_contact_person?: string;
  client_email?: string;
  client_phone?: string;
  contract_value?: number;
  currency?: string;
  payment_terms?: string;
  payment_schedule?: string;
  document_url?: string;
  agreement_rate_cards: RateCard[];
  created_at?: string;
  updated_at?: string;
}

// ---------------- COMPONENT ----------------
export default function CabAgreements() {
  const [agreements, setAgreements] = useState<CabAgreement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAgreement, setSelectedAgreement] = useState<CabAgreement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CabAgreement | null>(null);
  // ---------------- FETCH DATA ----------------
  const fetchAgreements = async () => {
    try {
      const res = await fetch(`/cab-agreements`);
      const data = await res.json();
      setAgreements(data);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (err) {
      console.error("Error fetching cab agreements:", err);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  // ---------------- FILTER & PAGINATION ----------------
  const filteredAgreements = agreements.filter((agreement) => {
    const number = agreement.agreement_number?.toLowerCase() || "";
    const cabName = agreement.cab_services?.name?.toLowerCase() || "";
    const status = agreement.status || "";

    return (
      (number.includes(searchTerm.toLowerCase()) ||
        cabName.includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all-status" || status === statusFilter)
    );
  });

  const paginatedAgreements = filteredAgreements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredAgreements.length / pageSize) || 1);
  }, [filteredAgreements.length, pageSize]);

  // ---------------- UTILS ----------------
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge>Unknown</Badge>;
    const variant =
      status === "Active" ? "default" : status === "Expired" ? "destructive" : "secondary";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const isRenewalDue = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  // ---------------- ACTIONS ----------------
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this agreement?")) {
      setAgreements((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleDownload = (url?: string) => {
    if (!url) return alert("No document available");
    window.open(url, "_blank");
  };

const handleEdit = (agreement: CabAgreement) => {
  setSelectedAgreement(agreement);
  setFormData(agreement); // copy to editable state
  setIsDialogOpen(true);
};

const handleCreate = () => {
  setSelectedAgreement(null);
  setFormData(null); // empty form
  setIsDialogOpen(true);
};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">CAB AGREEMENTS</h1>
          <p className="text-muted-foreground text-xs">Manage agreements with cab service providers</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" /> Add Agreement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Agreements</CardTitle>
          <CardDescription>Active and expired agreements</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agreements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Cab Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Rate/Km</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAgreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{agreement.agreement_number}</span>
                        <span className="text-sm text-muted-foreground">{agreement.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{agreement.cab_services?.name || "-"}</TableCell>
                    <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {agreement.start_date} to {agreement.end_date}
                        {isRenewalDue(agreement.end_date) && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      {agreement.agreement_rate_cards?.length ? (
                        <>
                          Rs.{agreement.agreement_rate_cards[0].rate_per_km}/km <br />
                          Min: Rs.{agreement.agreement_rate_cards[0].minimum_fare}
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(agreement.document_url)}>
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(agreement)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(agreement.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
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
          <div className="flex justify-between items-center mt-4">
            <div>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                First
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Prev
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for create/edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{selectedAgreement ? "Edit Agreement" : "Create Agreement"}</DialogTitle>
            <DialogDescription>
              {selectedAgreement ? "Update details" : "Fill in agreement details"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Label>Agreement Number</Label>
            <Input value={selectedAgreement?.agreement_number || ""} readOnly className="w-full" />
            <Label>Title</Label>
            <Input value={selectedAgreement?.title || ""} className="w-full" />
            <Label>Cab Service</Label>
            <Input value={selectedAgreement?.cab_services?.name || ""} readOnly className="w-full" />
            <Label>Status</Label>
            <Input value={selectedAgreement?.status || ""} className="w-full" />
            <Label>Start Date</Label>
            <Input type="date" value={selectedAgreement?.start_date?.split("T")[0] || ""} className="w-full" />
            <Label>End Date</Label>
            <Input type="date" value={selectedAgreement?.end_date?.split("T")[0] || ""} className="w-full" />
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
