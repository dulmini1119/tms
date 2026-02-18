'use client';

import React, { useEffect, useState } from 'react';
import { Clock, MapPin, Car, Calendar, AlertTriangle, Route, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type DashboardData = {
  user: {
    id: string;
    name: string;
    role: string;
    department: string;
    businessUnit: string;
  };
  stats: {
    availableVehicles: number;
    assignedVehicles: number;
    approvedTripsWaiting: number;
    activeTrips: number;
  };
  pendingTrips: Array<{
    id: string;
    requestNumber: string;
    employee: string;
    department: string;
    destination: string;
    date: string;
    time: string;
    priority: string;
    vehicleType: string;
    passengers: number;
    approvedBy: string;
  }>;
  fleet: Array<{
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    status: string;
    location: string;
    fuelLevel: number;
    driver: string;
  }>;
};

async function fetchPortal(path: string) {
  const primary = await fetch(path, { credentials: 'include' });
  const contentType = primary.headers.get('content-type') || '';
  if (primary.ok && contentType.includes('application/json')) {
    return primary;
  }
  return fetch(`http://localhost:3001${path}`, { credentials: 'include' });
}

export default function VehicleAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetchPortal('/portal/vehicle-admin/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard');
        const payload = await res.json();
        setData(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch dashboard');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'assigned':
      case 'on-trip':
        return 'secondary';
      case 'maintenance':
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
      default:
        return 'secondary';
    }
  };

  if (loading) return <div className="p-4">Loading dashboard...</div>;
  if (error || !data) return <div className="p-4 text-red-600">{error || 'No data found'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">DASHBOARD</h1>
          <p className="text-sm text-muted-foreground">{data.user.department} | {data.user.businessUnit}</p>
        </div>
        <Button className="gap-2" asChild>
          <a href="/vehicleadmin/vehicle-assignments">
            <Car className="h-4 w-4" />
            Assign Vehicles
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.availableVehicles}</div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Vehicles</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.assignedVehicles}</div>
            <p className="text-xs text-muted-foreground">Currently engaged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Assignment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.stats.approvedTripsWaiting}</div>
            <p className="text-xs text-muted-foreground">Approved trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeTrips}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              {data.pendingTrips.length === 0 && (
                <div className="text-sm text-muted-foreground">No approved trips waiting for assignment.</div>
              )}
              {data.pendingTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium">{trip.employee}</span>
                      <Badge variant={getPriorityColor(trip.priority)} className="text-xs">
                        {trip.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{trip.department} | {trip.vehicleType} required</div>
                    <div className="text-sm text-muted-foreground">
                      <MapPin className="mr-1 inline h-3 w-3" />
                      {trip.destination}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      {trip.date} at {trip.time}
                    </div>
                    <div className="text-xs text-muted-foreground">Approved by: {trip.approvedBy} | Passengers: {trip.passengers}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Status Overview</CardTitle>
            <CardDescription>Current status of vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.fleet.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                      <div className="text-sm text-muted-foreground">{vehicle.licensePlate} | {vehicle.driver}</div>
                      <div className="text-sm text-muted-foreground">Location: {vehicle.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(vehicle.status)} className="mb-2">{vehicle.status}</Badge>
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
