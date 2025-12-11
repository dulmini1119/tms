'use client';
import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Car,
  Calendar,
  Play,
  Square,
  CheckCircle,
  AlertTriangle,
  Route,
  Navigation,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Interfaces
interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}

interface Stats {
  todayTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalDistance: number;
}

interface Trip {
  id: string;
  employee: string;
  department: string;
  destination: string;
  fromLocation: string;
  scheduledTime: string;
  estimatedDuration: string;
  status: 'scheduled' | 'active' | 'completed';
  actualStartTime: string | null;
  actualEndTime: string | null;
  distance: string;
}

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  fuelLevel: number;
  mileage: number;
  lastService: string;
  nextService: string;
}

interface DriverDashboardProps {
  user?: UserRole;
}

// Mock Data
const mockStats: Stats = {
  todayTrips: 3,
  activeTrips: 1,
  completedTrips: 2,
  totalDistance: 45,
};

const mockTodayAssignments: Trip[] = [
  {
    id: 'TR001',
    employee: 'John Smith',
    department: 'Marketing',
    destination: 'Downtown Office',
    fromLocation: 'Home - Koramangala',
    scheduledTime: '09:00 AM',
    estimatedDuration: '2 hours',
    status: 'completed',
    actualStartTime: '09:05 AM',
    actualEndTime: '11:15 AM',
    distance: '15 km',
  },
  {
    id: 'TR002',
    employee: 'Sarah Wilson',
    department: 'Sales',
    destination: 'Airport',
    fromLocation: 'Office - MG Road',
    scheduledTime: '02:30 PM',
    estimatedDuration: '3 hours',
    status: 'active',
    actualStartTime: '02:35 PM',
    actualEndTime: null,
    distance: '25 km',
  },
  {
    id: 'TR003',
    employee: 'David Brown',
    department: 'IT',
    destination: 'Client Office - Whitefield',
    fromLocation: 'Office - Brigade Road',
    scheduledTime: '04:00 PM',
    estimatedDuration: '2.5 hours',
    status: 'scheduled',
    actualStartTime: null,
    actualEndTime: null,
    distance: '30 km',
  },
];

const mockVehicleInfo: VehicleInfo = {
  make: 'Honda',
  model: 'City',
  year: '2022',
  licensePlate: 'KA01AB1234',
  fuelLevel: 75,
  mileage: 45000,
  lastService: '2024-01-01',
  nextService: '2024-04-01',
};

// Utility Functions
const getStatusColor = (status: Trip['status']): 'secondary' | 'default' | 'outline' | 'destructive' => {
  switch (status) {
    case 'completed':
      return 'secondary';
    case 'active':
      return 'default';
    case 'scheduled':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: Trip['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
    case 'active':
      return <Navigation className="h-4 w-4" aria-hidden="true" />;
    case 'scheduled':
      return <Clock className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Clock className="h-4 w-4" aria-hidden="true" />;
  }
};

// Reusable Components
interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface TripCardProps {
  trip: Trip;
  onStartTrip: (trip: Trip) => void;
}

function TripCard({ trip, onStartTrip }: TripCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{trip.destination}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Employee: {trip.employee} ({trip.department})
        </div>
        <div className="text-sm text-muted-foreground">From: {trip.fromLocation}</div>
        <div className="text-sm text-muted-foreground">
          Scheduled: {trip.scheduledTime} • {trip.distance}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor(trip.status)} className="gap-1">
          {getStatusIcon(trip.status)}
          {trip.status}
        </Badge>
        {trip.status === 'scheduled' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" aria-label={`Start trip ${trip.id}`}>
                <Play className="h-3 w-3" aria-hidden="true" />
                Start
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Trip</DialogTitle>
                <DialogDescription>
                  Are you sure you want to start trip {trip.id} to {trip.destination}?
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => console.log('Cancelled')}>
                  Cancel
                </Button>
                <Button onClick={() => onStartTrip(trip)}>Confirm</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

interface LabelProps {
  className?: string;
  children: React.ReactNode;
}

function Label({ className, children }: LabelProps) {
  return <label className={className}>{children}</label>;
}

// Main Component
export default function DriverDashboard({ user }: DriverDashboardProps) {
    const currentUser: UserRole = user ?? {
    id: '0',
    name: 'Nimal Shreak',
    role: 'driver',
    department: 'Operations',
    businessUnit: 'Fleet'
  };
  const [currentTrip, setCurrentTrip] = useState<Trip | undefined>(
    mockTodayAssignments.find((trip) => trip.status === 'active')
  );

  const startTrip = (trip: Trip) => {
    console.log('Starting trip:', trip.id);
    setCurrentTrip(trip);
  };

  const endTrip = (trip: Trip) => {
    console.log('Ending trip:', trip.id);
    setCurrentTrip(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl font-bold">
            Welcome, {currentUser.name}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Your dashboard for today’s trips and vehicle status
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Car className="h-3 w-3" aria-hidden="true" />
            {mockVehicleInfo.licensePlate}
          </Badge>
        </div>
      </div>

      {/* Current Trip Status */}
      {currentTrip ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Navigation className="h-5 w-5" aria-hidden="true" />
              Active Trip in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-green-900">
              <div>
                <h4 className="font-medium">Trip Details</h4>
                <p className="text-sm">Trip ID: {currentTrip.id}</p>
                <p className="text-sm">Employee: {currentTrip.employee}</p>
                <p className="text-sm">Department: {currentTrip.department}</p>
              </div>
              <div>
                <h4 className="font-medium">Route</h4>
                <p className="text-sm">From: {currentTrip.fromLocation}</p>
                <p className="text-sm">To: {currentTrip.destination}</p>
                <p className="text-sm">Distance: {currentTrip.distance}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Time</h4>
                  <p className="text-sm">Started: {currentTrip.actualStartTime}</p>
                  <p className="text-sm">Expected: {currentTrip.estimatedDuration}</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-red-600 hover:bg-red-700 gap-2"
                      aria-label={`End trip ${currentTrip.id}`}
                    >
                      <Square className="h-4 w-4" aria-hidden="true" />
                      End Trip
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>End Trip</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to end trip {currentTrip.id}? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => console.log('Cancelled')}>
                        Cancel
                      </Button>
                      <Button onClick={() => endTrip(currentTrip)}>Confirm</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Trip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No trip is currently active. Start a scheduled trip to begin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Trips"
          value={mockStats.todayTrips}
          description="Total assignments"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        />
        <StatsCard
          title="Active Trips"
          value={mockStats.activeTrips}
          description="In progress"
          icon={<Navigation className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        />
        <StatsCard
          title="Completed"
          value={mockStats.completedTrips}
          description="Today"
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        />
        <StatsCard
          title="Distance"
          value={`${mockStats.totalDistance} km`}
          description="Today's total"
          icon={<Route className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Today’s Trip Assignments</CardTitle>
            <CardDescription>Your scheduled trips for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTodayAssignments.map((trip) => (
                <TripCard key={trip.id} trip={trip} onStartTrip={startTrip} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Current vehicle assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Car className="h-8 w-8 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {mockVehicleInfo.make} {mockVehicleInfo.model} ({mockVehicleInfo.year})
                  </h3>
                  <p className="text-sm text-muted-foreground">License: {mockVehicleInfo.licensePlate}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Fuel Level</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${mockVehicleInfo.fuelLevel}%` }}
                            />
                          </div>
                          <span className="text-sm">{mockVehicleInfo.fuelLevel}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{mockVehicleInfo.fuelLevel}% Fuel</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div>
                  <Label className="text-sm font-medium">Mileage</Label>
                  <p className="text-sm mt-1">{mockVehicleInfo.mileage.toLocaleString()} km</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Last Service</Label>
                  <p className="text-sm mt-1">{mockVehicleInfo.lastService}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Next Service</Label>
                  <p className="text-sm mt-1">{mockVehicleInfo.nextService}</p>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" className="w-full gap-2" aria-label="Report vehicle issue">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Report Vehicle Issue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}