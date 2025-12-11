"use client";
import React from "react";
import {
  User,
  Car,
  FileText,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
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

// Interfaces
interface PersonalInfo {
  name: string;
  employeeId: string;
  phone: string;
  email: string;
  address: string;
  dateOfJoining: string;
  licenseNumber: string;
  licenseExpiry: string;
}

interface CurrentVehicle {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  fuelType: string;
  seatingCapacity: number;
  assignedDate: string;
}

interface Document {
  id: string;
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  status: "valid" | "expiring" | "expired";
}

interface Performance {
  totalTrips: number;
  averageRating: number;
  onTimePercentage: number;
  fuelEfficiency: number; // km/l
  incidents: number;
  compliments: number;
}

interface DriverProfileData {
  personalInfo: PersonalInfo;
  currentVehicle: CurrentVehicle;
  documents: Document[];
  performance: Performance;
}

// Mock driver profile data
const mockDriverProfile: DriverProfileData = {
  personalInfo: {
    name: "Mike Johnson",
    employeeId: "DRV001",
    phone: "+91 9876543210",
    email: "mike.johnson@company.com",
    address: "123 Driver Street, Bangalore, Karnataka 560001",
    dateOfJoining: "2022-03-15",
    licenseNumber: "KA0220220001234",
    licenseExpiry: "2025-03-14",
  },
  currentVehicle: {
    make: "Honda",
    model: "City",
    year: "2022",
    licensePlate: "KA01AB1234",
    fuelType: "Petrol",
    seatingCapacity: 5,
    assignedDate: "2024-01-01",
  },
  documents: [
    {
      id: "DOC001",
      type: "Driving License",
      number: "KA0220220001234",
      issueDate: "2020-03-15",
      expiryDate: "2025-03-14",
      status: "valid",
    },
    {
      id: "DOC002",
      type: "Medical Certificate",
      number: "MED2024001",
      issueDate: "2024-01-01",
      expiryDate: "2025-01-01",
      status: "valid",
    },
    {
      id: "DOC003",
      type: "Background Verification",
      number: "BG2022001",
      issueDate: "2022-03-01",
      expiryDate: "2025-03-01",
      status: "valid",
    },
    {
      id: "DOC004",
      type: "Training Certificate",
      number: "TRN2024001",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-15",
      status: "valid",
    },
  ],
  performance: {
    totalTrips: 245,
    averageRating: 4.7,
    onTimePercentage: 92,
    fuelEfficiency: 15.2, // km/l
    incidents: 0,
    compliments: 23,
  },
};

// Utility functions
const getDocumentStatusColor = (
  status: Document["status"]
): "secondary" | "default" | "outline" | "destructive" => {
  switch (status) {
    case "valid":
      return "default";
    case "expiring":
      return "destructive";
    case "expired":
      return "outline";
    default:
      return "secondary";
  }
};

const getDocumentStatusIcon = (status: Document["status"]) => {
  switch (status) {
    case "valid":
      return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
    case "expiring":
      return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
    case "expired":
      return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Clock className="h-4 w-4" aria-hidden="true" />;
  }
};

const isDocumentExpiringSoon = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
};

const getDocumentStatus = (expiryDate: string): Document["status"] => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring";
  return "valid";
};

export default function DriverProfile() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">MY PROFILE</h1>
          <p className="text-muted-foreground text-xs">
            View your personal information and documents (read-only)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card className="lg:col-span-2 shadow-md border border-border/50 rounded-2xl bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <User className="h-5 w-5 text-primary" aria-hidden="true" />
              Personal Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Name & Employee ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="font-semibold text-foreground mt-1">
                  {mockDriverProfile.personalInfo.name}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
                <label className="text-sm font-medium text-muted-foreground">
                  Employee ID
                </label>
                <p className="font-semibold text-foreground mt-1">
                  {mockDriverProfile.personalInfo.employeeId}
                </p>
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <p className="flex items-center gap-2 font-medium text-foreground mt-1">
                  <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  {mockDriverProfile.personalInfo.phone}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="flex items-center gap-2 font-medium text-foreground mt-1">
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  {mockDriverProfile.personalInfo.email}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
              <label className="text-sm font-medium text-muted-foreground">
                Address
              </label>
              <p className="flex items-start gap-2 font-medium text-foreground mt-1">
                <MapPin
                  className="h-4 w-4 mt-1 text-primary"
                  aria-hidden="true"
                />
                {mockDriverProfile.personalInfo.address}
              </p>
            </div>

            {/* Date of Joining & License */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
                <label className="text-sm font-medium text-muted-foreground">
                  Date of Joining
                </label>
                <p className="font-medium text-foreground mt-1">
                  {mockDriverProfile.personalInfo.dateOfJoining}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
                <label className="text-sm font-medium text-muted-foreground">
                  License Number
                </label>
                <p className="font-medium text-foreground mt-1">
                  {mockDriverProfile.personalInfo.licenseNumber}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card className="shadow-md border border-border/50 rounded-2xl bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              Performance Stats
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Your driving performance metrics
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {/* Total Trips */}
            <div className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
              <label className="text-sm font-medium text-muted-foreground">
                Total Trips
              </label>
              <p className="text-3xl font-bold text-foreground mt-1">
                {mockDriverProfile.performance.totalTrips}
              </p>
            </div>

           
            {/* On-Time % */}
            <div className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
              <label className="text-sm font-medium text-muted-foreground">
                On-Time %
              </label>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {mockDriverProfile.performance.onTimePercentage}%
              </p>
            </div>

          

            {/* Incidents */}
            <div className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
              <label className="text-sm font-medium text-muted-foreground">
                Incidents
              </label>
              <p
                className={`text-3xl font-bold mt-1 ${
                  mockDriverProfile.performance.incidents === 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {mockDriverProfile.performance.incidents}
              </p>
            </div>

            {/* Compliments */}
            <div className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
              <label className="text-sm font-medium text-muted-foreground">
                Compliments
              </label>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {mockDriverProfile.performance.compliments}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Vehicle */}
      <Card className="shadow-md border border-border/50 rounded-2xl bg-card">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Car className="h-5 w-5 text-primary" aria-hidden="true" />
            Current Vehicle Assignment
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Details of your assigned vehicle
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4">
          <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
            <label className="text-sm font-medium text-muted-foreground">
              Vehicle
            </label>
            <p className="font-semibold text-foreground mt-1">
              {mockDriverProfile.currentVehicle.make}{" "}
              {mockDriverProfile.currentVehicle.model} (
              {mockDriverProfile.currentVehicle.year})
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
            <label className="text-sm font-medium text-muted-foreground">
              License Plate
            </label>
            <p className="font-semibold text-foreground mt-1">
              {mockDriverProfile.currentVehicle.licensePlate}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
            <label className="text-sm font-medium text-muted-foreground">
              Fuel Type
            </label>
            <p className="font-semibold text-foreground mt-1">
              {mockDriverProfile.currentVehicle.fuelType}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
            <label className="text-sm font-medium text-muted-foreground">
              Assigned Date
            </label>
            <p className="font-semibold text-foreground mt-1">
              {mockDriverProfile.currentVehicle.assignedDate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documents & Certifications */}
      <Card className="shadow-md border border-border/50 rounded-2xl bg-card mt-6">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            Documents & Certifications
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Keep your documents up to date to ensure compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-4">
          <Table className="min-w-full border-collapse">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Document Type</TableHead>
                <TableHead>Document Number</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDriverProfile.documents.map((doc) => {
                const status = getDocumentStatus(doc.expiryDate);
                return (
                  <TableRow
                    key={doc.id}
                    className="hover:bg-muted/20 transition"
                  >
                    <TableCell className="font-medium">{doc.type}</TableCell>
                    <TableCell>{doc.number}</TableCell>
                    <TableCell>{doc.issueDate}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          className={
                            isDocumentExpiringSoon(doc.expiryDate)
                              ? "text-orange-600 font-semibold"
                              : ""
                          }
                        >
                          {doc.expiryDate}
                        </span>
                        {isDocumentExpiringSoon(doc.expiryDate) && (
                          <span className="text-xs text-orange-600">
                            Expires soon!
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getDocumentStatusColor(status)}
                        className="gap-1"
                        aria-label={`Document status: ${status}`}
                      >
                        {getDocumentStatusIcon(status)}
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
