import React from 'react';

import { User, Shield, Phone, Mail, MapPin, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}

interface VehicleAdminProfileProps {
  user: UserRole;
}

// Mock vehicle admin profile data
const mockAdminProfile = {
  personalInfo: {
    name: 'Robert Kumar',
    employeeId: 'VA001',
    phone: '+91 9876543213',
    email: 'robert.kumar@company.com',
    address: '456 Admin Street, Bangalore, Karnataka 560002',
    dateOfJoining: '2021-08-20',
    department: 'Transport',
    businessUnit: 'Operations'
  },
  permissions: [
    'Vehicle Assignment',
    'Driver Management',
    'Fleet Overview',
    'Trip Assignment',
    'Vehicle Maintenance Scheduling'
  ],
  stats: {
    totalAssignments: 156,
    successfulAssignments: 142,
    pendingAssignments: 8,
    activeVehicles: 12
  }
};

export default function VehicleAdminProfile({ user }: VehicleAdminProfileProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Vehicle Admin Profile</h1>
          <p className="text-muted-foreground">
            Your profile information and permissions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
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
                <p className="font-medium">{mockAdminProfile.personalInfo.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                <p className="font-medium">{mockAdminProfile.personalInfo.employeeId}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{mockAdminProfile.personalInfo.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{mockAdminProfile.personalInfo.email}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p>{mockAdminProfile.personalInfo.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <p>{mockAdminProfile.personalInfo.department}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Business Unit</label>
                <p className="font-medium">{mockAdminProfile.personalInfo.businessUnit}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Joining</label>
              <p>{new Date(mockAdminProfile.personalInfo.dateOfJoining).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Role & Stats */}
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
                  <Badge variant="outline" className="block w-fit mt-1">
                    Vehicle Administrator
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="default" className="block w-fit mt-1">
                    Active
                  </Badge>
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
                  <span className="font-medium">{mockAdminProfile.stats.totalAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Successful</span>
                  <span className="font-medium text-green-600">{mockAdminProfile.stats.successfulAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium text-orange-600">{mockAdminProfile.stats.pendingAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Vehicles</span>
                  <span className="font-medium">{mockAdminProfile.stats.activeVehicles}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>System Permissions</CardTitle>
          <CardDescription>
            Your access permissions within the fleet management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mockAdminProfile.permissions.map((permission, index) => (
              <Badge key={index} variant="secondary" className="justify-center py-2">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}