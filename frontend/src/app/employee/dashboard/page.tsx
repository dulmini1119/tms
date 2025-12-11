'use client';
import React from 'react';
import { Clock, MapPin, Car, Calendar, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}



interface Trip {
  id: string;
  destination: string;
  date: string;
  time: string;
  status: 'approved' | 'completed' | 'pending';
  driver: string;
  vehicle: string;
}

interface EmployeeDashboardProps {
  user?: UserRole; // Made optional to handle undefined case
}

const mockStats = {
  totalTrips: 12,
  pendingRequests: 2,
  approvedTrips: 8,
  completedTrips: 10,
};

const mockRecentTrips: Trip[] = [
  {
    id: 'TR001',
    destination: 'Downtown Office',
    date: '2024-01-15',
    time: '09:00 AM',
    status: 'approved',
    driver: 'Mike Johnson',
    vehicle: 'Honda City - KA01AB1234',
  },
  {
    id: 'TR002',
    destination: 'Airport',
    date: '2024-01-14',
    time: '02:30 PM',
    status: 'completed',
    driver: 'Sarah Wilson',
    vehicle: 'Toyota Innova - KA02CD5678',
  },
  {
    id: 'TR003',
    destination: 'Client Meeting - Koramangala',
    date: '2024-01-16',
    time: '11:00 AM',
    status: 'pending',
    driver: '-',
    vehicle: '-',
  },
];

const mockUpcomingTrips: Trip[] = [
  {
    id: 'TR004',
    destination: 'Head Office',
    date: '2024-01-17',
    time: '10:00 AM',
    status: 'approved',
    driver: 'Mike Johnson',
    vehicle: 'Honda City - KA01AB1234',
  },
];

const getStatusColor = (
  status: Trip['status']
): 'secondary' | 'default' | 'outline' | 'destructive' => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'pending':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: Trip['status']) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Clock className="h-4 w-4" aria-hidden="true" />;
  }
};

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
    const actualUser = user ?? {
    id: '0',
    name: 'Nimal Shreak',
    role: 'employee',
    department: 'IT',
    businessUnit: 'Technology'
  };
  return (
    <div className="space-y-6 p-4">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {actualUser.name}!</h1>
          <p className="text-muted-foreground">
            {actualUser.department || 'Department'} • {actualUser.businessUnit || 'Business Unit'}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2" aria-label="Request a new trip">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Request New Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a New Trip</DialogTitle>
              <DialogDescription>
                This feature is coming soon. Contact your admin to request a trip.
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline">Close</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTrips}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Trips</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.approvedTrips}</div>
            <p className="text-xs text-muted-foreground">Ready to go</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.completedTrips}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trip Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Trip Requests</CardTitle>
            <CardDescription>Your latest trip requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="font-medium">{trip.destination}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trip.date} at {trip.time}
                    </div>
                    {trip.driver !== '-' && (
                      <div className="text-sm text-muted-foreground">
                        Driver: {trip.driver} • {trip.vehicle}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={getStatusColor(trip.status)}
                    className="gap-1"
                    aria-label={`Trip status: ${trip.status}`}
                  >
                    {getStatusIcon(trip.status)}
                    {trip.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Trips */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Trips</CardTitle>
            <CardDescription>Your scheduled trips for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUpcomingTrips.length > 0 ? (
                mockUpcomingTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span className="font-medium">{trip.destination}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trip.date} at {trip.time}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Driver: {trip.driver} • {trip.vehicle}
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className="gap-1"
                      aria-label="Trip status: Confirmed"
                    >
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      Confirmed
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p>No upcoming trips scheduled</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-4 gap-2"
                        aria-label="Request a new trip"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Request a Trip
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request a New Trip</DialogTitle>
                        <DialogDescription>
                          This feature is coming soon. Contact your admin to request a trip.
                        </DialogDescription>
                      </DialogHeader>
                      <Button variant="outline">Close</Button>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}