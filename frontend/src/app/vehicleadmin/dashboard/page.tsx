'use client'
import React from 'react';

import { Clock, MapPin, Car, Calendar, AlertTriangle, Route, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}

interface VehicleAdminDashboardProps {
  user: UserRole;
}

// Mock data for vehicle admin dashboard
const mockStats = {
  availableVehicles: 8,
  assignedVehicles: 12,
  approvedTripsWaiting: 5,
  activeTrips: 7
};

const mockApprovedTrips = [
  {
    id: 'TR001',
    employee: 'John Smith',
    department: 'Marketing',
    destination: 'Downtown Office',
    date: '2024-01-16',
    time: '09:00 AM',
    approvedBy: 'Sarah Wilson',
    status: 'awaiting-vehicle',
    priority: 'high',
    vehicleType: 'Sedan',
    passengers: 1
  },
  {
    id: 'TR002',
    employee: 'Lisa Chen',
    department: 'Sales',
    destination: 'Airport',
    date: '2024-01-17',
    time: '02:30 PM',
    approvedBy: 'David Brown',
    status: 'awaiting-vehicle',
    priority: 'high',
    vehicleType: 'SUV',
    passengers: 1
  },
  {
    id: 'TR003',
    employee: 'Mike Johnson',
    department: 'IT',
    destination: 'Client Office',
    date: '2024-01-17',
    time: '11:00 AM',
    approvedBy: 'Sarah Wilson',
    status: 'awaiting-vehicle',
    priority: 'medium',
    vehicleType: 'Sedan',
    passengers: 2
  }
];

const mockVehicleStatus = [
  {
    id: 'V001',
    make: 'Honda',
    model: 'City',
    licensePlate: 'KA01AB1234',
    driver: 'Raj Kumar',
    status: 'available',
    location: 'Head Office',
    fuelLevel: 85
  },
  {
    id: 'V002',
    make: 'Toyota',
    model: 'Innova',
    licensePlate: 'KA02CD5678',
    driver: 'Suresh Babu',
    status: 'on-trip',
    location: 'Downtown',
    fuelLevel: 60,
    currentTrip: 'TR004'
  },
  {
    id: 'V003',
    make: 'Maruti',
    model: 'Swift',
    licensePlate: 'KA03EF9012',
    driver: 'Anil Sharma',
    status: 'available',
    location: 'Branch Office',
    fuelLevel: 70
  },
  {
    id: 'V004',
    make: 'Ford',
    model: 'EcoSport',
    licensePlate: 'KA04GH3456',
    driver: 'Ramesh Kumar',
    status: 'maintenance',
    location: 'Service Center',
    fuelLevel: 30
  }
];

export default function VehicleAdminDashboard({ user }: VehicleAdminDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'on-trip':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
      case 'awaiting-vehicle':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const assignVehicle = (tripId: string) => {
    console.log('Assigning vehicle to trip:', tripId);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className='p-3'>
        <h1 className='text-2xl'>DASHBOARD</h1>
      </div>
        <Button className="gap-2">
          <Car className="h-4 w-4" />
          Assign Vehicles
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockStats.availableVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Ready for assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Vehicles</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.assignedVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Currently on trips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Assignment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{mockStats.approvedTripsWaiting}</div>
            <p className="text-xs text-muted-foreground">
              Approved trips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeTrips}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Trips Awaiting Vehicle Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Trips Awaiting Vehicle Assignment
            </CardTitle>
            <CardDescription>Approved trips that need vehicle assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockApprovedTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{trip.employee}</span>
                      <Badge variant={getPriorityColor(trip.priority)} className="text-xs">
                        {trip.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trip.department} • {trip.vehicleType} required
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {trip.destination}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {trip.date} at {trip.time}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Approved by: {trip.approvedBy} • Passengers: {trip.passengers}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => assignVehicle(trip.id)}
                    className="gap-1"
                  >
                    <Car className="h-3 w-3" />
                    Assign
                  </Button>
                </div>
              ))}
              <div className="text-center pt-2">
                <Button variant="outline" className="w-full">
                  View All Pending Assignments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Status Overview</CardTitle>
            <CardDescription>Current status of all vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockVehicleStatus.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.licensePlate} • {vehicle.driver}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Location: {vehicle.location}
                      </div>
                      {vehicle.currentTrip && (
                        <div className="text-xs text-blue-600">
                          Trip: {vehicle.currentTrip}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(vehicle.status)} className="mb-2">
                      {vehicle.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Fuel className="h-3 w-3" />
                      {vehicle.fuelLevel}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}