'use client';
import React, { useState } from 'react';
import { Calendar, Play, Square, Eye, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Interfaces
interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}

export interface Trip {
  id: string;
  employee: string;
  employeePhone: string;
  fromLocation: string;
  destination: string;
  scheduledTime: string;
  returnTime: string;
  specialInstructions?: string;
  department: string;
  businessUnit: string;
  date: string;
  estimatedDuration: string;
  purpose: string;
  status: 'scheduled' | 'active' | 'completed';
  distance: string;
  priority: 'high' | 'medium' | 'low';
  actualStartTime: string | null;
  actualEndTime: string | null;
  startOdometer: number | null;
  endOdometer: number | null;
  startLocation: string | null;
  endLocation: string | null;
}

interface DriverTripAssignmentsProps {
  user?: UserRole; // Made optional to align with DriverDashboard
  viewMode: 'assignments' | 'active';
}

// Mock Data
const mockAssignments: Trip[] = [
  {
    id: 'TR001',
    employee: 'John Smith',
    employeePhone: '+91 9876543210',
    department: 'Marketing',
    businessUnit: 'Sales & Marketing',
    destination: 'Downtown Office',
    fromLocation: 'Home - Koramangala',
    date: '2024-01-15',
    scheduledTime: '09:00 AM',
    returnTime: '06:00 PM',
    estimatedDuration: '9 hours',
    purpose: 'Client Meeting',
    status: 'scheduled',
    distance: '15 km',
    priority: 'medium',
    specialInstructions: 'Please wait at the main gate',
    actualStartTime: null,
    actualEndTime: null,
    startOdometer: null,
    endOdometer: null,
    startLocation: null,
    endLocation: null,
  },
  {
    id: 'TR002',
    employee: 'Sarah Wilson',
    employeePhone: '+91 9876543211',
    department: 'Sales',
    businessUnit: 'Sales & Marketing',
    destination: 'Airport',
    fromLocation: 'Office - MG Road',
    date: '2024-01-15',
    scheduledTime: '02:30 PM',
    returnTime: '08:00 PM',
    estimatedDuration: '5.5 hours',
    purpose: 'Business Travel',
    status: 'active',
    distance: '25 km',
    priority: 'high',
    specialInstructions: 'Terminal 1, Departure gate',
    actualStartTime: '02:35 PM',
    actualEndTime: null,
    startOdometer: 45000,
    endOdometer: null,
    startLocation: 'Office - MG Road',
    endLocation: null,
  },
  {
    id: 'TR003',
    employee: 'David Brown',
    employeePhone: '+91 9876543212',
    department: 'IT',
    businessUnit: 'Technology',
    destination: 'Client Office - Whitefield',
    fromLocation: 'Office - Brigade Road',
    date: '2024-01-15',
    scheduledTime: '04:00 PM',
    returnTime: '07:00 PM',
    estimatedDuration: '3 hours',
    purpose: 'Project Discussion',
    status: 'completed',
    distance: '30 km',
    priority: 'medium',
    specialInstructions: 'Call employee 15 minutes before arrival',
    actualStartTime: '04:05 PM',
    actualEndTime: '07:15 PM',
    startOdometer: 45025,
    endOdometer: 45055,
    startLocation: 'Office - Brigade Road',
    endLocation: 'Client Office - Whitefield',
  },
];

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

const getPriorityColor = (priority: Trip['priority']): 'secondary' | 'default' | 'outline' | 'destructive' => {
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

export default function DriverTripAssignments({ user, viewMode }: DriverTripAssignmentsProps) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'start' | 'end'>('start');
  const [formData, setFormData] = useState({
    odometer: '',
    location: '',
    remarks: '',
    fuelLevel: '',
    issues: '',
  });

  const filteredTrips = mockAssignments.filter((trip) => {
    if (viewMode === 'active') {
      return trip.status === 'active';
    }
    return trip.status === 'scheduled' || trip.status === 'active';
  });

  const handleStartTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setActionType('start');
    setIsActionModalOpen(true);
    setFormData({
      odometer: '',
      location: trip.fromLocation,
      remarks: '',
      fuelLevel: '',
      issues: '',
    });
  };

  const handleEndTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setActionType('end');
    setIsActionModalOpen(true);
    setFormData({
      odometer: '',
      location: trip.destination,
      remarks: '',
      fuelLevel: '',
      issues: '',
    });
  };

  const handleSubmitAction = () => {
    console.log(`${actionType} trip:`, selectedTrip?.id, formData);
    setIsActionModalOpen(false);
    setSelectedTrip(null);
  };

  const callEmployee = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">TRIP ASSIGNMENTS</h1>
          <p className="text-muted-foreground text-xs">
            {viewMode === 'active'
              ? 'Manage your currently active trips'
              : 'Your assigned trips and their status'}
          </p>
        </div>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>{viewMode === 'active' ? 'Active Trips' : "Today's Assignments"}</CardTitle>
          <CardDescription>
            {filteredTrips.length} trips {viewMode === 'active' ? 'in progress' : 'assigned for today'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip Details</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
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
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant={getPriorityColor(trip.priority)} className="text-xs">
                          {trip.priority}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.employee}</div>
                      <div className="text-sm text-muted-foreground">{trip.department}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 p-1 mt-1"
                        onClick={() => callEmployee(trip.employeePhone)}
                        aria-label={`Call ${trip.employee}`}
                      >
                        <Phone className="h-3 w-3 mr-1" aria-hidden="true" />
                        Call
                      </Button>
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
                      <div className="text-sm text-muted-foreground">Distance: {trip.distance}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {trip.date}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trip.scheduledTime} - {trip.returnTime}
                      </div>
                      {trip.status === 'active' && trip.actualStartTime && (
                        <div className="text-sm text-green-600">Started: {trip.actualStartTime}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(trip.status)}>{trip.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {trip.status === 'scheduled' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="gap-1"
                              aria-label={`Start trip ${trip.id}`}
                            >
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
                              <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleStartTrip(trip)}>Confirm</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {trip.status === 'active' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              aria-label={`End trip ${trip.id}`}
                            >
                              <Square className="h-3 w-3" aria-hidden="true" />
                              End
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>End Trip</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to end trip {trip.id}? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleEndTrip(trip)}>Confirm</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button variant="ghost" size="sm" aria-label={`View details for trip ${trip.id}`}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Start/End Trip Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'start' ? 'Start Trip' : 'End Trip'} - {selectedTrip?.id}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'start'
                ? 'Record trip start details and confirm pickup'
                : 'Record trip completion details and confirm drop-off'}
            </DialogDescription>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-4">
              {/* Trip Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Employee:</strong> {selectedTrip.employee}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedTrip.employeePhone}
                  </div>
                  <div>
                    <strong>Route:</strong> {selectedTrip.fromLocation} → {selectedTrip.destination}
                  </div>
                  <div>
                    <strong>Scheduled:</strong> {selectedTrip.scheduledTime} - {selectedTrip.returnTime}
                  </div>
                  {selectedTrip.specialInstructions && (
                    <div className="p-2 bg-yellow-50 rounded border">
                      <strong>Special Instructions:</strong> {selectedTrip.specialInstructions}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Odometer Reading</label>
                  <Input
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                    placeholder="Enter current odometer reading"
                    type="number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Current Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Confirm current location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fuel Level (%)</label>
                  <Select onValueChange={(value) => setFormData({ ...formData, fuelLevel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">Full (100%)</SelectItem>
                      <SelectItem value="75">3/4 (75%)</SelectItem>
                      <SelectItem value="50">Half (50%)</SelectItem>
                      <SelectItem value="25">1/4 (25%)</SelectItem>
                      <SelectItem value="10">Low (10%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Vehicle Issues</label>
                  <Select onValueChange={(value) => setFormData({ ...formData, issues: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any issues?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Issues</SelectItem>
                      <SelectItem value="minor">Minor Issues</SelectItem>
                      <SelectItem value="major">Major Issues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Remarks</label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder={
                    actionType === 'start'
                      ? 'Any notes about pickup (e.g., traffic conditions, passenger feedback)'
                      : 'Any notes about the trip completion'
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsActionModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitAction} className="flex-1 gap-2">
                  {actionType === 'start' ? (
                    <>
                      <Play className="h-4 w-4" aria-hidden="true" />
                      Start Trip
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" aria-hidden="true" />
                      End Trip
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}