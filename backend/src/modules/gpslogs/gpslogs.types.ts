// src/modules/gpslogs/types.ts
export interface GPSLogFilters {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: 'all' | 'active' | 'idle' | 'offline' | 'emergency' | 'maintenance';
  vehicleId?: string;
  driverId?: string;
}

export interface FormattedGPSLog {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string | null;
  driverName: string;
  requestNumber: string | null;
  location: {
    latitude: number;
    longitude: number;
    address: string | null;
    speed: number;
    heading: number;
    accuracy: number;
    altitude: number;
    timestamp: Date;
  };
  status: 'Active' | 'Idle' | 'Offline' | 'Emergency' | 'Maintenance';
  ignitionStatus: string | null;
  fuelLevel: number;
  mileage: number;
  batteryLevel: number;
  signalStrength: number;
  panicButton: boolean;
  geofenceStatus: string | null;
  speedAlerts: {
    currentSpeed: number;
    speedLimit: number | null;
    isViolation: boolean;
    violationCount: number;
  };
  lastPing: Date;
  createdAt: Date;
  updatedAt: Date; // we'll use server_timestamp
  
}

export interface GPSLogsResponse {
  logs: FormattedGPSLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TripReplayData {
  tripId: string;
  requestNumber: string | null;
  vehicleNumber: string | null;
  startTime: Date;
  endTime: Date;
  distance: number; // km
  durationMinutes: number;
  avgSpeed: number;
  maxSpeed: number;
  routePoints: Array<{
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
  }>;
}