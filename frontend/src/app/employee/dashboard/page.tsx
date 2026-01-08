'use client';

import React, { useEffect, useState } from 'react';
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
  first_name?: string;
  last_name?: string;
  email?: string;
  department_id?: string;
  business_unit_id?: string;
}

interface Trip {
  id: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  status: 'Pending' | 'Approved' | 'Completed';
  driver?: string;
  vehicle?: string;
  trip_approvals?: unknown[];
}

interface DashboardResponse {
  user: UserRole;
  stats: {
    totalTrips: number;
    pendingRequests: number;
    approvedTrips: number;
    completedTrips: number;
  };
  recentTrips: Trip[];
  upcomingTrips: Trip[];
}

export default function EmployeeDashboard() {
  const [user, setUser] = useState<UserRole | null>(null);
  const [stats, setStats] = useState<DashboardResponse['stats']>({
    totalTrips: 0,
    pendingRequests: 0,
    approvedTrips: 0,
    completedTrips: 0,
  });
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/employee/dashboard', {
          credentials: 'include', // send cookies
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard');

        const data: DashboardResponse = await res.json();

        setUser(data.user);
        setStats(data.stats);
        setRecentTrips(data.recentTrips);
        setUpcomingTrips(data.upcomingTrips);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getStatusColor = (status: Trip['status']): 'secondary' | 'default' | 'outline' | 'destructive' => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Completed':
        return 'secondary';
      case 'Pending':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: Trip['status']) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
      case 'Pending':
        return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
      default:
        return <Clock className="h-4 w-4" aria-hidden="true" />;
    }
  };

  if (loading) return <div className="p-4 text-center">Loading dashboard...</div>;

  const actualUser = user ?? {
    id: '0',
    first_name: 'Employee',
    last_name: '',
  };

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {actualUser.first_name} {actualUser.last_name}!
          </h1>
          <p className="text-muted-foreground">
            {actualUser.department_id || 'Department'} • {actualUser.business_unit_id || 'Business Unit'}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
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
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrips}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Trips</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedTrips}</div>
            <p className="text-xs text-muted-foreground">Ready to go</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTrips}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Trip Requests</CardTitle>
            <CardDescription>Your latest trip requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrips.map(trip => (
                <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{trip.destination}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trip.departure_date} at {trip.departure_time}
                    </div>
                    {trip.driver && (
                      <div className="text-sm text-muted-foreground">
                        Driver: {trip.driver} • {trip.vehicle}
                      </div>
                    )}
                  </div>
                  <Badge variant={getStatusColor(trip.status)} className="gap-1">
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
              {upcomingTrips.length > 0 ? (
                upcomingTrips.map(trip => (
                  <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{trip.destination}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trip.departure_date} at {trip.departure_time}
                      </div>
                      {trip.driver && (
                        <div className="text-sm text-muted-foreground">
                          Driver: {trip.driver} • {trip.vehicle}
                        </div>
                      )}
                    </div>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Confirmed
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming trips scheduled</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-4 gap-2">
                        <Plus className="h-4 w-4" />
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
