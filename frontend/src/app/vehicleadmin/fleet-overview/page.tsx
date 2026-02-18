'use client';

import React, { useEffect, useState } from 'react';
import { User, Shield, Phone, Mail, MapPin, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ProfileData = {
  personalInfo: {
    name: string;
    employeeId: string;
    phone: string;
    email: string;
    address: string;
    dateOfJoining: string;
    department: string;
    businessUnit: string;
  };
  permissions: string[];
  stats: {
    totalAssignments: number;
    successfulAssignments: number;
    pendingAssignments: number;
    activeVehicles: number;
  };
};

async function fetchPortal(path: string) {
  const primary = await fetch(path, { credentials: 'include' });
  const contentType = primary.headers.get('content-type') || '';
  if (primary.ok && contentType.includes('application/json')) {
    return primary;
  }
  return fetch(`http://localhost:3001${path}`, { credentials: 'include' });
}

export default function VehicleAdminProfile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetchPortal('/portal/vehicle-admin/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const payload = await res.json();
        setData(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (error || !data) return <div className="p-4 text-red-600">{error || 'No data found'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Vehicle Admin Profile</h1>
          <p className="text-muted-foreground">Your profile information and permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="font-medium">{data.personalInfo.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                <p className="font-medium">{data.personalInfo.employeeId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{data.personalInfo.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{data.personalInfo.email}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p>{data.personalInfo.address || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <p>{data.personalInfo.department}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Business Unit</label>
                <p className="font-medium">{data.personalInfo.businessUnit}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Joining</label>
              <p>{data.personalInfo.dateOfJoining || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <Badge variant="outline" className="mt-1 block w-fit">Vehicle Administrator</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="default" className="mt-1 block w-fit">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Assignments</span>
                  <span className="font-medium">{data.stats.totalAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Successful</span>
                  <span className="font-medium text-green-600">{data.stats.successfulAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium text-orange-600">{data.stats.pendingAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Vehicles</span>
                  <span className="font-medium">{data.stats.activeVehicles}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Permissions</CardTitle>
          <CardDescription>Your access permissions within the fleet management system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {data.permissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="justify-center py-2">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
