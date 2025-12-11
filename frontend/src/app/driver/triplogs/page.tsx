'use client';
import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Search, Download, Eye, Route, Fuel } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

// Comprehensive Trip interface to align with both DriverTripAssignments and DriverTripLogs
export interface Trip {
  id: string;
  employee: string;
  employeePhone?: string; // Optional, used in DriverTripAssignments
  fromLocation: string;
  destination: string;
  scheduledTime: string;
  returnTime: string;
  specialInstructions?: string;
  department: string;
  businessUnit?: string; // Optional, used in DriverTripAssignments
  date: string;
  estimatedDuration?: string; // Optional, used in DriverTripAssignments
  purpose: string;
  status: 'scheduled' | 'active' | 'completed';
  distance: string;
  priority?: 'high' | 'medium' | 'low'; // Optional, used in DriverTripAssignments
  actualStartTime: string | null;
  actualEndTime: string | null;
  startOdometer: number | null;
  endOdometer: number | null;
  startLocation: string | null;
  endLocation: string | null;
  actualDistance?: number; // Used in DriverTripLogs
  fuelConsumed?: number; // Used in DriverTripLogs
  driverRemarks?: string; // Used in DriverTripLogs
  employeeFeedback?: string; // Used in DriverTripLogs
  rating?: number; // Used in DriverTripLogs
}

interface DriverTripLogsProps {
  user?: UserRole; // Made optional for consistency
}

// Mock historical trip data for driver
const mockTripLogs: Trip[] = [
  {
    id: 'TR001',
    employee: 'John Smith',
    department: 'Marketing',
    destination: 'Downtown Office',
    fromLocation: 'Home - Koramangala',
    date: '2024-01-15',
    scheduledTime: '09:00 AM',
    returnTime: '06:00 PM',
    actualStartTime: '09:05 AM',
    actualEndTime: '06:15 PM',
    purpose: 'Client Meeting',
    distance: '15 km',
    startOdometer: 44985,
    endOdometer: 45000,
    actualDistance: 15,
    fuelConsumed: 1.2,
    status: 'completed',
    startLocation: 'Home - Koramangala',
    endLocation: 'Downtown Office',
    driverRemarks: 'Smooth trip, no issues',
    employeeFeedback: 'Excellent service',
    rating: 5,
  },
  {
    id: 'TR002',
    employee: 'Sarah Wilson',
    department: 'Sales',
    destination: 'Airport',
    fromLocation: 'Office - MG Road',
    date: '2024-01-14',
    scheduledTime: '02:30 PM',
    returnTime: '08:00 PM',
    actualStartTime: '02:35 PM',
    actualEndTime: '07:45 PM',
    purpose: 'Business Travel',
    distance: '25 km',
    startOdometer: 44955,
    endOdometer: 44985,
    actualDistance: 30,
    fuelConsumed: 2.1,
    status: 'completed',
    startLocation: 'Office - MG Road',
    endLocation: 'Airport',
    driverRemarks: 'Heavy traffic on return journey',
    employeeFeedback: 'Good service despite traffic',
    rating: 4,
  },
  {
    id: 'TR003',
    employee: 'David Brown',
    department: 'IT',
    destination: 'Client Office - Whitefield',
    fromLocation: 'Office - Brigade Road',
    date: '2024-01-13',
    scheduledTime: '11:00 AM',
    returnTime: '03:00 PM',
    actualStartTime: '11:10 AM',
    actualEndTime: '02:45 PM',
    purpose: 'Project Discussion',
    distance: '30 km',
    startOdometer: 44920,
    endOdometer: 44955,
    actualDistance: 35,
    fuelConsumed: 2.5,
    status: 'completed',
    startLocation: 'Office - Brigade Road',
    endLocation: 'Client Office - Whitefield',
    driverRemarks: 'Employee was late for pickup',
    employeeFeedback: 'Professional driver',
    rating: 4,
  },
  {
    id: 'TR004',
    employee: 'Lisa Chen',
    department: 'HR',
    destination: 'Training Center',
    fromLocation: 'Home - JP Nagar',
    date: '2024-01-12',
    scheduledTime: '08:30 AM',
    returnTime: '05:30 PM',
    actualStartTime: '08:25 AM',
    actualEndTime: '05:40 PM',
    purpose: 'Training',
    distance: '20 km',
    startOdometer: 44895,
    endOdometer: 44920,
    actualDistance: 25,
    fuelConsumed: 1.8,
    status: 'completed',
    startLocation: 'Home - JP Nagar',
    endLocation: 'Training Center',
    driverRemarks: 'Early pickup as requested',
    employeeFeedback: 'Very punctual and courteous',
    rating: 5,
  },
];

// Utility function (could be shared with DriverTripAssignments)
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

export function DriverTripLogs({ user }: DriverTripLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filteredTrips = mockTripLogs.filter((trip) => {
    const matchesSearch =
      trip.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const tripDate = new Date(trip.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - tripDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'week':
          matchesDate = diffDays <= 7;
          break;
        case 'month':
          matchesDate = diffDays <= 30;
          break;
        case 'quarter':
          matchesDate = diffDays <= 90;
          break;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Calculate summary statistics
  const totalTrips = filteredTrips.length;
  const totalDistance = filteredTrips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
  const totalFuel = filteredTrips.reduce((sum, trip) => sum + (trip.fuelConsumed || 0), 0);
  const averageRating =
    filteredTrips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / filteredTrips.length || 0;

  const viewTripDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsDetailModalOpen(true);
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(`2024-01-01 ${start}`);
    const endTime = new Date(`2024-01-01 ${end}`);
    const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return `${diff.toFixed(1)} hrs`;
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trip Logs for {user?.name || 'Driver'}</h1>
          <p className="text-muted-foreground">Complete history of your completed trips</p>
        </div>
        <Button variant="outline" className="gap-2" aria-label="Export trip logs">
          <Download className="h-4 w-4" aria-hidden="true" />
          Export Logs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
            <p className="text-xs text-muted-foreground">Completed trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance Driven</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance} km</div>
            <p className="text-xs text-muted-foreground">Total distance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Consumed</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFuel.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">Total fuel used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">Employee satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search by employee, destination, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  aria-label="Search trip logs"
                />
              </div>
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trip Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trip History</CardTitle>
          <CardDescription>{filteredTrips.length} trips in selected period</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip Details</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Time & Duration</TableHead>
                <TableHead>Distance & Fuel</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.id}</div>
                      <div className="text-sm text-muted-foreground">{trip.purpose}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {trip.date}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.employee}</div>
                      <div className="text-sm text-muted-foreground">{trip.department}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        <strong>From:</strong> {trip.fromLocation}
                      </div>
                      <div className="text-sm">
                        <strong>To:</strong> {trip.destination}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {trip.actualStartTime} - {trip.actualEndTime}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Duration: {calculateDuration(trip.actualStartTime!, trip.actualEndTime!)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">Distance: {trip.actualDistance} km</div>
                      <div className="text-sm text-muted-foreground">Fuel: {trip.fuelConsumed}L</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-yellow-500 text-sm">{getRatingStars(trip.rating!)}</div>
                      <div className="text-sm text-muted-foreground">{trip.rating}/5</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`View details for trip ${trip.id}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>View Trip Details</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to view details for trip {trip.id}?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => viewTripDetails(trip)}>Confirm</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trip Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Trip Log Details - {selectedTrip?.id}</DialogTitle>
            <DialogDescription>Complete information about the completed trip</DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trip Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trip Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Employee:</strong> {selectedTrip.employee} ({selectedTrip.department})
                    </div>
                    <div>
                      <strong>Purpose:</strong> {selectedTrip.purpose}
                    </div>
                    <div>
                      <strong>Date:</strong> {selectedTrip.date}
                    </div>
                    <div>
                      <strong>Scheduled:</strong> {selectedTrip.scheduledTime} - {selectedTrip.returnTime}
                    </div>
                    <div>
                      <strong>Actual:</strong> {selectedTrip.actualStartTime} - {selectedTrip.actualEndTime}
                    </div>
                    <div>
                      <strong>Duration:</strong>{' '}
                      {calculateDuration(selectedTrip.actualStartTime!, selectedTrip.actualEndTime!)}
                    </div>
                  </CardContent>
                </Card>

                {/* Route & Vehicle Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Route & Vehicle Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Start Location:</strong> {selectedTrip.startLocation}
                    </div>
                    <div>
                      <strong>End Location:</strong> {selectedTrip.endLocation}
                    </div>
                    <div>
                      <strong>Planned Distance:</strong> {selectedTrip.distance}
                    </div>
                    <div>
                      <strong>Actual Distance:</strong> {selectedTrip.actualDistance} km
                    </div>
                    <div>
                      <strong>Start Odometer:</strong> {selectedTrip.startOdometer} km
                    </div>
                    <div>
                      <strong>End Odometer:</strong> {selectedTrip.endOdometer} km
                    </div>
                    <div>
                      <strong>Fuel Consumed:</strong> {selectedTrip.fuelConsumed}L
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback & Remarks */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Feedback & Remarks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Driver Remarks:</strong>{' '}
                      {selectedTrip.driverRemarks || 'No remarks provided'}
                    </div>
                    <div>
                      <strong>Employee Feedback:</strong>{' '}
                      {selectedTrip.employeeFeedback || 'No feedback provided'}
                    </div>
                    <div>
                      <strong>Rating:</strong> {getRatingStars(selectedTrip.rating!)} (
                      {selectedTrip.rating}/5)
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}