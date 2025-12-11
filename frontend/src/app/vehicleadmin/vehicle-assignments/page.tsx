'use client'
import React, { useState } from 'react';

import { Calendar, Clock, Search, Eye, Car,  CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Trip } from '@/app/driver/triplogs/page';

interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}

interface VehicleAssignmentsProps {
  user: UserRole;
  viewMode: 'assignments' | 'approved-trips' | 'fleet-overview';
}

// Mock data for vehicle assignments
const mockApprovedTrips = [
  {
    id: 'TR001',
    employee: 'John Smith',
    employeePhone: '+91 9876543210',
    department: 'Marketing',
    destination: 'Downtown Office',
    fromLocation: 'Home - Koramangala',
    date: '2024-01-16',
    time: '09:00 AM',
    returnTime: '06:00 PM',
    purpose: 'Client Meeting',
    approvedBy: 'Sarah Wilson',
    approvedAt: '2024-01-15 16:30',
    status: 'awaiting-vehicle',
    priority: 'high',
    vehicleType: 'Sedan',
    passengers: 1,
    estimatedDistance: '25 km',
    assignedVehicle: null,
    assignedDriver: null
  },
  {
    id: 'TR002',
    employee: 'Lisa Chen',
    employeePhone: '+91 9876543211',
    department: 'Sales',
    destination: 'Airport',
    fromLocation: 'Office - MG Road',
    date: '2024-01-17',
    time: '02:30 PM',
    returnTime: '08:00 PM',
    purpose: 'Business Travel',
    approvedBy: 'David Brown',
    approvedAt: '2024-01-16 09:15',
    status: 'vehicle-assigned',
    priority: 'high',
    vehicleType: 'SUV',
    passengers: 1,
    estimatedDistance: '45 km',
    assignedVehicle: 'Toyota Innova - KA02CD5678',
    assignedDriver: 'Suresh Babu'
  },
  {
    id: 'TR003',
    employee: 'Mike Johnson',
    employeePhone: '+91 9876543212',
    department: 'IT',
    destination: 'Client Office - Whitefield',
    fromLocation: 'Office - Brigade Road',
    date: '2024-01-17',
    time: '11:00 AM',
    returnTime: '03:00 PM',
    purpose: 'Technical Support',
    approvedBy: 'Sarah Wilson',
    approvedAt: '2024-01-16 11:45',
    status: 'awaiting-vehicle',
    priority: 'medium',
    vehicleType: 'Sedan',
    passengers: 2,
    estimatedDistance: '35 km',
    assignedVehicle: null,
    assignedDriver: null
  }
];

const mockVehicles = [
  {
    id: 'V001',
    make: 'Honda',
    model: 'City',
    licensePlate: 'KA01AB1234',
    type: 'Sedan',
    seating: 5,
    driver: 'Raj Kumar',
    driverPhone: '+91 8765432101',
    status: 'available',
    location: 'Head Office',
    fuelLevel: 85
  },
  {
    id: 'V002',
    make: 'Toyota',
    model: 'Innova',
    licensePlate: 'KA02CD5678',
    type: 'SUV',
    seating: 7,
    driver: 'Suresh Babu',
    driverPhone: '+91 8765432102',
    status: 'assigned',
    location: 'MG Road',
    fuelLevel: 90
  },
  {
    id: 'V003',
    make: 'Maruti',
    model: 'Swift',
    licensePlate: 'KA03EF9012',
    type: 'Sedan',
    seating: 5,
    driver: 'Anil Sharma',
    driverPhone: '+91 8765432103',
    status: 'available',
    location: 'Branch Office',
    fuelLevel: 70
  }
];

export default function VehicleAssignments({ user, viewMode }: VehicleAssignmentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [assignmentRemarks, setAssignmentRemarks] = useState('');

  const filteredTrips = mockApprovedTrips.filter(trip => {
    const matchesSearch = trip.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

    if (viewMode === 'approved-trips') {
      return matchesSearch && matchesStatus;
    } else if (viewMode === 'assignments') {
      return matchesSearch && (trip.status === 'awaiting-vehicle' || trip.status === 'vehicle-assigned');
    }

    return matchesSearch && matchesStatus;
  });

  const availableVehicles = mockVehicles.filter(vehicle => vehicle.status === 'available');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting-vehicle':
        return 'destructive';
      case 'vehicle-assigned':
        return 'default';
      case 'completed':
        return 'secondary';
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

  const handleVehicleAssignment = (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedVehicle('');
    setAssignmentRemarks('');
    setIsAssignModalOpen(true);
  };

  const submitVehicleAssignment = () => {
    console.log('Assigning vehicle:', selectedVehicle, 'to trip:', selectedTrip?.id, 'remarks:', assignmentRemarks);
    setIsAssignModalOpen(false);
    setSelectedTrip(null);
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'approved-trips':
        return 'Approved Trips';
      case 'assignments':
        return 'Vehicle Assignments';
      case 'fleet-overview':
        return 'Fleet Overview';
      default:
        return 'Vehicle Management';
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case 'approved-trips':
        return 'All trips approved by managers and HODs';
      case 'assignments':
        return 'Assign vehicles to approved trips';
      case 'fleet-overview':
        return 'Complete overview of fleet utilization';
      default:
        return 'Manage vehicle assignments';
    }
  };

  if (viewMode === 'fleet-overview') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>{getTitle()}</h1>
            <p className="text-muted-foreground">{getDescription()}</p>
          </div>
        </div>

        {/* Fleet Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {mockVehicles.filter(v => v.status === 'available').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assigned Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockVehicles.filter(v => v.status === 'assigned').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>In Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mockVehicles.filter(v => v.status === 'maintenance').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Vehicles</CardTitle>
            <CardDescription>Complete fleet overview</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Fuel Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.licensePlate} • {vehicle.type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vehicle.driver}</div>
                        <div className="text-sm text-muted-foreground">{vehicle.driverPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{vehicle.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${vehicle.fuelLevel}%` }}
                          />
                        </div>
                        <span className="text-sm">{vehicle.fuelLevel}%</span>
                      </div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{getTitle()}</h1>
          <p className="text-muted-foreground">{getDescription()}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="awaiting-vehicle">Awaiting Vehicle</SelectItem>
                <SelectItem value="vehicle-assigned">Vehicle Assigned</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Assignments</CardTitle>
          <CardDescription>
            {filteredTrips.length} trips found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Trip Details</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Vehicle Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.employee}</div>
                      <div className="text-sm text-muted-foreground">{trip.department}</div>
                      <div className="text-xs text-muted-foreground">{trip.employeePhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.destination}</div>
                      <div className="text-sm text-muted-foreground">From: {trip.fromLocation}</div>
                      <div className="text-sm text-muted-foreground">{trip.purpose}</div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant={getPriorityColor(trip.priority)} className="text-xs">
                          {trip.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {trip.vehicleType}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {trip.date}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {trip.time} - {trip.returnTime}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Distance: {trip.estimatedDistance}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {trip.assignedVehicle ? (
                      <div>
                        <div className="font-medium text-sm">{trip.assignedVehicle}</div>
                        <div className="text-sm text-muted-foreground">Driver: {trip.assignedDriver}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No vehicle assigned
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(trip.status)}>
                      {trip.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {trip.status === 'awaiting-vehicle' && (
                        <Button 
                          size="sm" 
                          // onClick={() => handleVehicleAssignment(trip)}
                          className="gap-1"
                        >
                          <Car className="h-3 w-3" />
                          Assign
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vehicle Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assign Vehicle - {selectedTrip?.id}</DialogTitle>
            <DialogDescription>
              Select an available vehicle and driver for this trip
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-6">
              {/* Trip Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trip Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Employee:</strong> {selectedTrip.employee} ({selectedTrip.employeePhone})</div>
                  <div><strong>Route:</strong> {selectedTrip.fromLocation} → {selectedTrip.destination}</div>
                  <div><strong>Date & Time:</strong> {selectedTrip.date} at {selectedTrip.scheduledTime}</div>
                  <div><strong>Purpose:</strong> {selectedTrip.purpose}</div>
                  {/* <div><strong>Vehicle Type Required:</strong> {selectedTrip.vehicleType}</div>
                  <div><strong>Passengers:</strong> {selectedTrip.passengers}</div>
                  <div><strong>Estimated Distance:</strong> {selectedTrip.estimatedDistance}</div> */}
                </CardContent>
              </Card>

              {/* Available Vehicles */}
              <div>
                <label className="text-sm font-medium">Select Vehicle</label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {availableVehicles.map((vehicle) => (
                    <div 
                      key={vehicle.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedVehicle === vehicle.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Car className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">
                              {vehicle.make} {vehicle.model} ({vehicle.type})
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {vehicle.licensePlate} • Driver: {vehicle.driver}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Location: {vehicle.location} • Seating: {vehicle.seating}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default">Available</Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            Fuel: {vehicle.fuelLevel}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment Remarks */}
              <div>
                <label className="text-sm font-medium">Assignment Remarks</label>
                <Textarea
                  value={assignmentRemarks}
                  onChange={(e) => setAssignmentRemarks(e.target.value)}
                  placeholder="Any special instructions for the driver or additional notes..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitVehicleAssignment}
                  className="flex-1 gap-2"
                  disabled={!selectedVehicle}
                >
                  <CheckCircle className="h-4 w-4" />
                  Assign Vehicle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}