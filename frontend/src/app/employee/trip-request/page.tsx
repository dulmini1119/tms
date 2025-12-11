"use client";
import React, { useState } from "react";
import { Calendar, Plus, Clock, Eye, Edit, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}

interface TripRequest {
  id: string;
  requestNumber: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
    department: string;
    employeeId: string;
    phoneNumber: string;
    designation: string;
    managerName: string;
    costCenter: string;
  };
  tripDetails: {
    fromLocation: {
      address: string;
      coordinates?: { lat: number; lng: number };
      landmark?: string;
    };
    toLocation: {
      address: string;
      coordinates?: { lat: number; lng: number };
      landmark?: string;
    };
    departureDate: string;
    departureTime: string;
    returnDate?: string | undefined;
    returnTime?: string | undefined;
    isRoundTrip: boolean;
    estimatedDistance: number;
    estimatedDuration: number;
  };
  purpose: {
    category: string;
    description: string;
    projectCode: string;
    costCenter: string;
    businessJustification: string;
  };
  requirements: {
    vehicleType: string;
    passengerCount: number;
    specialRequirements?: string;
    acRequired: boolean;
    luggage: string;
  };
  priority: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  createdAt: string;
  updatedAt: string;
  approvalRequired: boolean;
  estimatedCost: number;
  currency: string;
  passengers: {
    name: string;
    employeeId: string;
    department: string;
    phoneNumber: string;
  }[];
  approvalWorkflow: {
    level: number;
    approverRole: string;
    approverName: string;
    approverDepartment: string;
    status: string;
    approvedAt: string;
    comments: string;
  }[];
  costBreakdown: {
    baseFare: number;
    distanceCharges: number;
    timeCharges: number;
    additionalCharges: number;
    taxAmount: number;
  };
  billing: {
    billingType: string;
    costCenter: string;
    projectCode: string;
    budgetCode: string;
    billToDepartment: string;
    approverName: string;
  };
  attachments: {
    fileName: string;
    fileSize: string;
  }[];
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    comments: string;
  }[];
}

interface TripApproval {
  id: string;
  tripRequestId: string;
  requestNumber: string;
  approvalWorkflow: {
    level: number;
    approverRole: string;
    approverName: string;
    approverId: string;
    approverEmail: string;
    department: string;
  }[];
  currentApprovalLevel: number;
  approvalHistory: {
    level: number;
    approver: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    action: "Approved" | "Rejected" | "Pending";
    comments?: string;
    timestamp: string;
    ipAddress?: string;
  }[];
  finalStatus: "Pending" | "Approved" | "Rejected";
  autoApproval: boolean;
  approvalRules: {
    costThreshold: number;
    departmentApprovalRequired: boolean;
    managerApprovalRequired: boolean;
    financeApprovalRequired: boolean;
  };
  createdAt: string;
  updatedAt: string;
  escalationDate?: string;
  escalated: boolean;
}

interface EmployeeTripRequestsProps {
  user?: UserRole;
  viewMode?: "request" | "my-trips";
}

// Mock data
const mockTrips: (TripRequest & { approval?: TripApproval })[] = [
  {
    id: "TR001",
    requestNumber: "REQ001",
    requestedBy: {
      id: "EMP001",
      name: "John Doe",
      email: "john.doe@company.com",
      department: "Sales",
      employeeId: "E001",
      phoneNumber: "+91 9876543210",
      designation: "Sales Manager",
      managerName: "Sarah Wilson",
      costCenter: "CC001",
    },
    tripDetails: {
      fromLocation: { address: "Home, Bangalore", landmark: "Near Park" },
      toLocation: {
        address: "Downtown Office, Bangalore",
        landmark: "Office Tower",
      },
      departureDate: "2024-01-15",
      departureTime: "09:00 AM",
      returnDate: "2024-01-15",
      returnTime: "06:00 PM",
      isRoundTrip: true,
      estimatedDistance: 20,
      estimatedDuration: 45,
    },
    purpose: {
      category: "Client Meeting",
      description: "Meeting with key client",
      projectCode: "PRJ001",
      costCenter: "CC001",
      businessJustification: "To finalize Q1 deal",
    },
    requirements: {
      vehicleType: "Sedan",
      passengerCount: 2,
      specialRequirements: "None",
      acRequired: true,
      luggage: "Small bag",
    },
    priority: "High",
    status: "Approved",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T12:00:00Z",
    approvalRequired: true,
    estimatedCost: 1500,
    currency: "INR",
    passengers: [
      {
        name: "John Doe",
        employeeId: "E001",
        department: "Sales",
        phoneNumber: "+91 9876543210",
      },
    ],
    approvalWorkflow: [
      {
        level: 1,
        approverRole: "Manager",
        approverName: "Sarah Wilson",
        approverDepartment: "Sales",
        status: "Approved",
        approvedAt: "2024-01-10T12:00:00Z",
        comments: "Approved for client meeting",
      },
    ],
    costBreakdown: {
      baseFare: 500,
      distanceCharges: 800,
      timeCharges: 100,
      additionalCharges: 0,
      taxAmount: 100,
    },
    billing: {
      billingType: "Corporate",
      costCenter: "CC001",
      projectCode: "PRJ001",
      budgetCode: "BC001",
      billToDepartment: "Sales",
      approverName: "Sarah Wilson",
    },
    attachments: [],
    auditTrail: [
      {
        action: "Created",
        performedBy: "John Doe",
        timestamp: "2024-01-10T10:00:00Z",
        comments: "Trip request created",
      },
    ],
    approval: {
      id: "AP001",
      tripRequestId: "TR001",
      requestNumber: "REQ001",
      approvalWorkflow: [
        {
          level: 1,
          approverRole: "Manager",
          approverName: "Sarah Wilson",
          approverId: "MGR001",
          approverEmail: "sarah.wilson@company.com",
          department: "Sales",
        },
      ],
      currentApprovalLevel: 1,
      approvalHistory: [
        {
          level: 1,
          approver: {
            id: "MGR001",
            name: "Sarah Wilson",
            email: "sarah.wilson@company.com",
            role: "Manager",
          },
          action: "Approved",
          comments: "Approved for client meeting",
          timestamp: "2024-01-10T12:00:00Z",
        },
      ],
      finalStatus: "Approved",
      autoApproval: false,
      approvalRules: {
        costThreshold: 5000,
        departmentApprovalRequired: true,
        managerApprovalRequired: true,
        financeApprovalRequired: false,
      },
      createdAt: "2024-01-10T10:00:00Z",
      updatedAt: "2024-01-10T12:00:00Z",
      escalated: false,
    },
  },
  {
    id: "TR002",
    requestNumber: "REQ002",
    requestedBy: {
      id: "EMP001",
      name: "John Doe",
      email: "john.doe@company.com",
      department: "Sales",
      employeeId: "E001",
      phoneNumber: "+91 9876543210",
      designation: "Sales Manager",
      managerName: "Sarah Wilson",
      costCenter: "CC001",
    },
    tripDetails: {
      fromLocation: { address: "Office, Bangalore", landmark: "Tech Park" },
      toLocation: { address: "Airport, Bangalore", landmark: "Terminal 1" },
      departureDate: "2024-01-14",
      departureTime: "02:30 PM",
      returnDate: "2024-01-14",
      returnTime: "08:00 PM",
      isRoundTrip: true,
      estimatedDistance: 40,
      estimatedDuration: 60,
    },
    purpose: {
      category: "Business Travel",
      description: "Travel for conference",
      projectCode: "PRJ002",
      costCenter: "CC001",
      businessJustification: "Attend industry conference",
    },
    requirements: {
      vehicleType: "SUV",
      passengerCount: 1,
      specialRequirements: "Extra luggage space",
      acRequired: true,
      luggage: "Large suitcase",
    },
    priority: "Medium",
    status: "Completed",
    createdAt: "2024-01-09T09:00:00Z",
    updatedAt: "2024-01-14T20:00:00Z",
    approvalRequired: true,
    estimatedCost: 2500,
    currency: "INR",
    passengers: [
      {
        name: "John Doe",
        employeeId: "E001",
        department: "Sales",
        phoneNumber: "+91 9876543210",
      },
    ],
    approvalWorkflow: [
      {
        level: 1,
        approverRole: "Manager",
        approverName: "Sarah Wilson",
        approverDepartment: "Sales",
        status: "Approved",
        approvedAt: "2024-01-09T11:00:00Z",
        comments: "Approved for conference",
      },
    ],
    costBreakdown: {
      baseFare: 700,
      distanceCharges: 1200,
      timeCharges: 300,
      additionalCharges: 100,
      taxAmount: 200,
    },
    billing: {
      billingType: "Corporate",
      costCenter: "CC001",
      projectCode: "PRJ002",
      budgetCode: "BC002",
      billToDepartment: "Sales",
      approverName: "Sarah Wilson",
    },
    attachments: [],
    auditTrail: [
      {
        action: "Created",
        performedBy: "John Doe",
        timestamp: "2024-01-09T09:00:00Z",
        comments: "Trip request created",
      },
    ],
    approval: {
      id: "AP002",
      tripRequestId: "TR002",
      requestNumber: "REQ002",
      approvalWorkflow: [
        {
          level: 1,
          approverRole: "Manager",
          approverName: "Sarah Wilson",
          approverId: "MGR001",
          approverEmail: "sarah.wilson@company.com",
          department: "Sales",
        },
      ],
      currentApprovalLevel: 1,
      approvalHistory: [
        {
          level: 1,
          approver: {
            id: "MGR001",
            name: "Sarah Wilson",
            email: "sarah.wilson@company.com",
            role: "Manager",
          },
          action: "Approved",
          comments: "Approved for conference",
          timestamp: "2024-01-09T11:00:00Z",
        },
      ],
      finalStatus: "Approved",
      autoApproval: false,
      approvalRules: {
        costThreshold: 5000,
        departmentApprovalRequired: true,
        managerApprovalRequired: true,
        financeApprovalRequired: false,
      },
      createdAt: "2024-01-09T09:00:00Z",
      updatedAt: "2024-01-09T11:00:00Z",
      escalated: false,
    },
  },
  {
    id: "TR003",
    requestNumber: "REQ003",
    requestedBy: {
      id: "EMP001",
      name: "John Doe",
      email: "john.doe@company.com",
      department: "Sales",
      employeeId: "E001",
      phoneNumber: "+91 9876543210",
      designation: "Sales Manager",
      managerName: "Sarah Wilson",
      costCenter: "CC001",
    },
    tripDetails: {
      fromLocation: { address: "Office, Bangalore", landmark: "Tech Park" },
      toLocation: {
        address: "Client Office, Koramangala",
        landmark: "Business Center",
      },
      departureDate: "2024-01-16",
      departureTime: "11:00 AM",
      returnDate: "2024-01-16",
      returnTime: "03:00 PM",
      isRoundTrip: true,
      estimatedDistance: 15,
      estimatedDuration: 30,
    },
    purpose: {
      category: "Project Discussion",
      description: "Discuss project milestones",
      projectCode: "PRJ003",
      costCenter: "CC001",
      businessJustification: "To align on Q2 deliverables",
    },
    requirements: {
      vehicleType: "Sedan",
      passengerCount: 3,
      specialRequirements: "None",
      acRequired: true,
      luggage: "None",
    },
    priority: "High",
    status: "Pending",
    createdAt: "2024-01-12T08:00:00Z",
    updatedAt: "2024-01-12T08:00:00Z",
    approvalRequired: true,
    estimatedCost: 1000,
    currency: "INR",
    passengers: [
      {
        name: "John Doe",
        employeeId: "E001",
        department: "Sales",
        phoneNumber: "+91 9876543210",
      },
      {
        name: "Jane Smith",
        employeeId: "E002",
        department: "Sales",
        phoneNumber: "+91 9876543211",
      },
    ],
    approvalWorkflow: [
      {
        level: 1,
        approverRole: "Manager",
        approverName: "Sarah Wilson",
        approverDepartment: "Sales",
        status: "Pending",
        approvedAt: "",
        comments: "",
      },
    ],
    costBreakdown: {
      baseFare: 300,
      distanceCharges: 500,
      timeCharges: 100,
      additionalCharges: 0,
      taxAmount: 100,
    },
    billing: {
      billingType: "Corporate",
      costCenter: "CC001",
      projectCode: "PRJ003",
      budgetCode: "BC003",
      billToDepartment: "Sales",
      approverName: "Sarah Wilson",
    },
    attachments: [],
    auditTrail: [
      {
        action: "Created",
        performedBy: "John Doe",
        timestamp: "2024-01-12T08:00:00Z",
        comments: "Trip request created",
      },
    ],
    approval: {
      id: "AP003",
      tripRequestId: "TR003",
      requestNumber: "REQ003",
      approvalWorkflow: [
        {
          level: 1,
          approverRole: "Manager",
          approverName: "Sarah Wilson",
          approverId: "MGR001",
          approverEmail: "sarah.wilson@company.com",
          department: "Sales",
        },
      ],
      currentApprovalLevel: 1,
      approvalHistory: [
        {
          level: 1,
          approver: {
            id: "MGR001",
            name: "Sarah Wilson",
            email: "sarah.wilson@company.com",
            role: "Manager",
          },
          action: "Pending",
          comments: "",
          timestamp: "2024-01-12T08:00:00Z",
        },
      ],
      finalStatus: "Pending",
      autoApproval: false,
      approvalRules: {
        costThreshold: 5000,
        departmentApprovalRequired: true,
        managerApprovalRequired: true,
        financeApprovalRequired: false,
      },
      createdAt: "2024-01-12T08:00:00Z",
      updatedAt: "2024-01-12T08:00:00Z",
      escalated: false,
    },
  },
];

export default function EmployeeTripRequests({
  user,
  viewMode = "request",
}: EmployeeTripRequestsProps) {
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTrip, setSelectedTrip] = useState<
    (TripRequest & { approval?: TripApproval }) | null
  >(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fromLocation: "",
    toLocation: "",
    departureDate: "",
    departureTime: "",
    returnDate: "",
    returnTime: "",
    purposeCategory: "",
    purposeDescription: "",
    vehicleType: "",
    passengerCount: 1,
    specialRequirements: "",
    acRequired: true,
    luggage: "",
  });

  const filteredTrips = mockTrips.filter((trip) => {
    const matchesSearch =
      trip.tripDetails.toLocation.address
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trip.purpose.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trip.requestNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || trip.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Trip request submitted:", formData);
    setIsNewRequestOpen(false);
    setFormData({
      fromLocation: "",
      toLocation: "",
      departureDate: "",
      departureTime: "",
      returnDate: "",
      returnTime: "",
      purposeCategory: "",
      purposeDescription: "",
      vehicleType: "",
      passengerCount: 1,
      specialRequirements: "",
      acRequired: true,
      luggage: "",
    });
  };

  const getStatusColor = (
    status: TripRequest["status"]
  ): "secondary" | "default" | "outline" | "destructive" => {
    switch (status) {
      case "Approved":
        return "default";
      case "Completed":
        return "secondary";
      case "Pending":
        return "destructive";
      case "Rejected":
        return "outline";
      default:
        return "secondary";
    }
  };

  const viewTrip = (trip: TripRequest & { approval?: TripApproval }) => {
    setSelectedTrip(trip);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {viewMode === "my-trips" ? "My Trips" : "Trip Requests"}
          </h1>
          <p className="text-muted-foreground">
            {viewMode === "my-trips"
              ? "View and manage your trip requests"
              : "Request new trips and track existing ones"}
          </p>
        </div>
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex items-center gap-2"
              aria-label="New trip request"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Trip Request
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl w-full sm:w-[600px] p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Request New Trip
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Fill in the details for your trip request. It will be sent to
                your manager for approval.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Location Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col ">
                  <Label htmlFor="fromLocation">From Location</Label>
                  <Input
                    id="fromLocation"
                    value={formData.fromLocation}
                    onChange={(e) =>
                      handleInputChange("fromLocation", e.target.value)
                    }
                    placeholder="Enter pickup location"
                    required
                    className="w-full max-w-[280px] break-words whitespace-normal"
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="toLocation">Destination</Label>
                  <Input
                    id="toLocation"
                    value={formData.toLocation}
                    onChange={(e) =>
                      handleInputChange("toLocation", e.target.value)
                    }
                    placeholder="Enter destination"
                    required
                    className="w-full max-w-[280px]"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="departureDate">Travel Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) =>
                      handleInputChange("departureDate", e.target.value)
                    }
                    required
                    className="w-full max-w-[280px]"
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) =>
                      handleInputChange("departureTime", e.target.value)
                    }
                    required
                    className="w-full max-w-[280px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="returnDate">Return Date</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) =>
                      handleInputChange("returnDate", e.target.value)
                    }
                    className="w-full max-w-[280px]"
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="returnTime">Return Time</Label>
                  <Input
                    id="returnTime"
                    type="time"
                    value={formData.returnTime}
                    onChange={(e) =>
                      handleInputChange("returnTime", e.target.value)
                    }
                    className="w-full max-w-[280px]"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="flex flex-col">
                <Label htmlFor="purposeCategory">Purpose</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("purposeCategory", value)
                  }
                  value={formData.purposeCategory}
                >
                  <SelectTrigger className="w-full max-w-[280px]">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client Meeting">
                      Client Meeting
                    </SelectItem>
                    <SelectItem value="Business Travel">
                      Business Travel
                    </SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Site Visit">Site Visit</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <Label htmlFor="purposeDescription">Purpose Description</Label>
                <Textarea
                  id="purposeDescription"
                  value={formData.purposeDescription}
                  onChange={(e) =>
                    handleInputChange("purposeDescription", e.target.value)
                  }
                  placeholder="Describe the purpose of the trip"
                  required
                  className="w-full max-w-[560px]"
                />
              </div>

              {/* Vehicle & Passengers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select
                    onValueChange={(value) =>
                      handleInputChange("vehicleType", value)
                    }
                    value={formData.vehicleType}
                  >
                    <SelectTrigger className="w-full max-w-[280px]">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                      <SelectItem value="Luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="passengerCount">Passenger Count</Label>
                  <Input
                    id="passengerCount"
                    type="number"
                    value={formData.passengerCount}
                    onChange={(e) =>
                      handleInputChange(
                        "passengerCount",
                        parseInt(e.target.value)
                      )
                    }
                    min="1"
                    required
                    className="w-full max-w-[280px]"
                  />
                </div>
              </div>

              {/* Special Requirements */}
              <div className="flex flex-col">
                <Label htmlFor="specialRequirements">
                  Special Requirements
                </Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) =>
                    handleInputChange("specialRequirements", e.target.value)
                  }
                  placeholder="Any special requirements (e.g., extra luggage space)"
                  className="w-full max-w-[560px]"
                />
              </div>

              {/* AC Checkbox */}
              <div className="flex items-center space-x-2">
                <Input
                  id="acRequired"
                  type="checkbox"
                  checked={formData.acRequired}
                  onChange={(e) =>
                    handleInputChange("acRequired", e.target.checked)
                  }
                />
                <Label htmlFor="acRequired">AC Required</Label>
              </div>

              {/* Luggage */}
              <div className="flex flex-col">
                <Label htmlFor="luggage">Luggage Details</Label>
                <Input
                  id="luggage"
                  value={formData.luggage}
                  onChange={(e) => handleInputChange("luggage", e.target.value)}
                  placeholder="Describe luggage (e.g., small bag, large suitcase)"
                  className="w-full max-w-[560px]"
                />
              </div>

              {/* Dialog Footer */}
              <DialogFooter className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewRequestOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  aria-label="Search trip requests"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trip Requests</CardTitle>
          <CardDescription>{filteredTrips.length} trips found</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Number</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => {
                const latestApproval =
                  trip.approval?.approvalHistory?.[
                    trip.approval.approvalHistory.length - 1
                  ];
                return (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">
                      {trip.requestNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {trip.tripDetails.toLocation.address}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          From: {trip.tripDetails.fromLocation.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {trip.tripDetails.departureDate}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {trip.tripDetails.departureTime}{" "}
                          {trip.tripDetails.returnTime &&
                            `- ${trip.tripDetails.returnTime}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{trip.purpose.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusColor(trip.status)}
                        aria-label={`Trip status: ${trip.status}`}
                      >
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {latestApproval && latestApproval.action !== "Pending"
                        ? `${latestApproval.approver.name} (${latestApproval.action})`
                        : "Pending"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewTrip(trip)}
                          aria-label={`View trip ${trip.requestNumber}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        {trip.status === "Pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Edit trip ${trip.requestNumber}`}
                            >
                              <Edit className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete trip ${trip.requestNumber}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Trip Details - {selectedTrip?.requestNumber}
            </DialogTitle>
            <DialogDescription>
              Complete information about your trip request
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>From Location</Label>
                  <p className="text-sm mt-1">
                    {selectedTrip.tripDetails.fromLocation.address}
                  </p>
                </div>
                <div>
                  <Label>Destination</Label>
                  <p className="text-sm mt-1">
                    {selectedTrip.tripDetails.toLocation.address}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Departure Date</Label>
                  <p className="text-sm mt-1">
                    {selectedTrip.tripDetails.departureDate}
                  </p>
                </div>
                <div>
                  <Label>Departure Time</Label>
                  <p className="text-sm mt-1">
                    {selectedTrip.tripDetails.departureTime}
                  </p>
                </div>
              </div>
              {selectedTrip.tripDetails.returnDate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Return Date</Label>
                    <p className="text-sm mt-1">
                      {selectedTrip.tripDetails.returnDate}
                    </p>
                  </div>
                  <div>
                    <Label>Return Time</Label>
                    <p className="text-sm mt-1">
                      {selectedTrip.tripDetails.returnTime}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <Label>Purpose</Label>
                <p className="text-sm mt-1">{selectedTrip.purpose.category}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTrip.purpose.description}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge
                    variant={getStatusColor(selectedTrip.status)}
                    aria-label={`Trip status: ${selectedTrip.status}`}
                  >
                    {selectedTrip.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Estimated Cost</Label>
                <p className="text-sm mt-1">
                  {selectedTrip.estimatedCost} {selectedTrip.currency}
                </p>
              </div>
              <div>
                <Label>Passengers</Label>
                <ul className="text-sm mt-1">
                  {selectedTrip.passengers.map((passenger, index) => (
                    <li key={index}>
                      {passenger.name} ({passenger.department})
                    </li>
                  ))}
                </ul>
              </div>
              {selectedTrip.approval &&
                selectedTrip.approval.approvalHistory.length > 0 && (
                  <div>
                    <Label>Approval History</Label>
                    <ul className="text-sm mt-1 space-y-2">
                      {selectedTrip.approval.approvalHistory.map(
                        (history, index) => (
                          <li key={index}>
                            <strong>{history.approver.name}</strong> (
                            {history.approver.role}) - {history.action} on{" "}
                            {new Date(history.timestamp).toLocaleString()}
                            {history.comments && (
                              <p className="text-muted-foreground">
                                {history.comments}
                              </p>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
