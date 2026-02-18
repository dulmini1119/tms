"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type DriverProfileData = {
  personalInfo: {
    name: string;
    employeeId: string;
    phone: string;
    email: string;
    address: string;
    dateOfJoining: string;
    licenseNumber: string;
    licenseExpiry: string;
  };
  currentVehicle: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    fuelType: string;
    seatingCapacity: number;
    assignedDate: string;
  } | null;
  documents: Array<{
    id: string;
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
    status: string;
  }>;
  performance: {
    totalTrips: number;
    averageRating: number;
    onTimePercentage: number;
    incidents: number;
    compliments: number;
  };
};

export default function DriverProfilePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DriverProfileData | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/portal/driver/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const payload: DriverProfileData = await res.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (!data) return <div className="p-6">Profile unavailable.</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>Name:</strong> {data.personalInfo.name}</div>
          <div><strong>Employee ID:</strong> {data.personalInfo.employeeId}</div>
          <div><strong>Phone:</strong> {data.personalInfo.phone}</div>
          <div><strong>Email:</strong> {data.personalInfo.email}</div>
          <div><strong>License:</strong> {data.personalInfo.licenseNumber}</div>
          <div><strong>License Expiry:</strong> {data.personalInfo.licenseExpiry || "N/A"}</div>
          <div className="md:col-span-2"><strong>Address:</strong> {data.personalInfo.address || "N/A"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div><p className="text-2xl font-bold">{data.performance.totalTrips}</p><p className="text-xs">Trips</p></div>
          <div><p className="text-2xl font-bold">{data.performance.averageRating}</p><p className="text-xs">Avg Rating</p></div>
          <div><p className="text-2xl font-bold">{data.performance.onTimePercentage}%</p><p className="text-xs">On Time</p></div>
          <div><p className="text-2xl font-bold">{data.performance.incidents}</p><p className="text-xs">Incidents</p></div>
          <div><p className="text-2xl font-bold">{data.performance.compliments}</p><p className="text-xs">Compliments</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          {data.currentVehicle ? (
            <div className="text-sm">
              {data.currentVehicle.make} {data.currentVehicle.model} ({data.currentVehicle.year}) -{" "}
              {data.currentVehicle.licensePlate}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No vehicle assigned.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{doc.number || "N/A"}</TableCell>
                  <TableCell>{doc.issueDate || "N/A"}</TableCell>
                  <TableCell>{doc.expiryDate || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={/valid/i.test(doc.status) ? "default" : "outline"}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

