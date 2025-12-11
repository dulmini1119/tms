// Core Trip Interfaces for Fleet Management Application

export interface TripRequest {
  id: string;
  requestNumber: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
    department: string;
    employeeId: string;
    phoneNumber: string;
    designation: string;
    managerName: string;
    costCenter: string;
  };
  tripDetails: {
    fromLocation: {
      address: string;
      coordinates?: { lat: number; lng: number };
      landmark?: string;
    };
    toLocation: {
      address: string;
      coordinates?: { lat: number; lng: number };
      landmark?: string;
    };
    departureDate: string;
    departureTime: string;
    returnDate?: string | undefined;
    returnTime?: string | undefined;
    isRoundTrip: boolean;
    estimatedDistance: number; // in km
    estimatedDuration: number; // in minutes
  };
  purpose: {
    category: string;
    description: string;
    projectCode: string;
    costCenter: string;
    businessJustification: string;
  };
  requirements: {
    vehicleType: string;
    passengerCount: number;
    specialRequirements?: string;
    acRequired: boolean;
    luggage: string;
  };
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  approvalRequired: boolean;
  estimatedCost: number;
  currency: string;
  passengers: {
    name: string;
    employeeId: string;
    department: string;
    phoneNumber: string;
  }[];
  approvalWorkflow: {
    level: number;
    approverRole: string;
    approverName: string;
    approverDepartment: string;
    status: string;
    approvedAt: string;
    comments: string;
  }[];
  costBreakdown: {
    baseFare: number;
    distanceCharges: number;
    timeCharges: number;
    additionalCharges: number;
    taxAmount: number;
  };
  billing: {
    billingType: string;
    costCenter: string;
    projectCode: string;
    budgetCode: string;
    billToDepartment: string;
    approverName: string;
  };
  attachments: {
    fileName: string;
    fileSize: string;
  }[];
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    comments: string;
  }[];
}
export interface TripApproval {
  id: string;
  tripRequestId: string;
  requestNumber: string;
  approvalWorkflow: {
    level: number;
    approverRole: string;
    approverName: string;
    approverId: string;
    approverEmail: string;
    department: string;
  }[];
  currentApprovalLevel: number;
  approvalHistory: {
    level: number;
    approver: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    action: "Approved" | "Rejected" | "Pending";
    comments?: string;
    timestamp: string;
    ipAddress?: string;
  }[];
  finalStatus: "Pending" | "Approved" | "Rejected";
  autoApproval: boolean;
  approvalRules: {
    costThreshold: number;
    departmentApprovalRequired: boolean;
    managerApprovalRequired: boolean;
    financeApprovalRequired: boolean;
  };
  createdAt: string;
  updatedAt: string;
  escalationDate?: string;
  escalated: boolean;
}

export interface TripAssignment {
  id: string;
  tripRequestId: string;
  requestNumber: string;
  assignedVehicle: Vehicle;
  assignedDriver: Driver;
  assignedBy: {
    id: string;
    name: string;
    role: string;
    timestamp: string;
  };
  assignmentStatus:
    | "Assigned"
    | "Accepted"
    | "Rejected"
    | "Started"
    | "Completed"
    | "Cancelled";
  scheduledDeparture: string;
  scheduledReturn?: string;
  actualDeparture?: string;
  actualReturn?: string;
  assignmentNotes?: string;
  driverAcceptance: {
    accepted: boolean;
    timestamp?: string;
    comments?: string;
  };
  preTrip?: {
    checklist: {
      fuelLevel: number;
      vehicleCondition: "Good" | "Fair" | "Poor";
      documentsVerified: boolean;
      emergencyKitPresent: boolean;
      gpsWorking: boolean;
    };
    completedBy?: string;
    completedAt?: string;
    photos?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface TripLog {
  id: string;
  tripRequestId: string;
  tripAssignmentId: string;
  requestNumber: string;
  vehicleId: string;
  driverId: string;
  tripStatus:
    | "Not Started"
    | "Started"
    | "In Transit"
    | "Arrived"
    | "Waiting"
    | "Return Journey"
    | "Completed"
    | "Cancelled";
  actualRoute: {
    startLocation: {
      lat: number;
      lng: number;
      address: string;
      timestamp: string;
    };
    endLocation: {
      lat: number;
      lng: number;
      address: string;
      timestamp: string;
    };
    waypoints: { lat: number; lng: number; timestamp: string }[];
    totalDistance: number; // in km
    totalDuration: number; // in minutes
  };
  timing: {
    scheduledStart: string;
    actualStart?: string;
    scheduledEnd: string;
    actualEnd?: string;
    delays: {
      reason: string;
      duration: number; // in minutes
      timestamp: string;
    }[];
    waitingTime: number; // in minutes
  };
  gpsTracking: {
    trackingId: string;
    enabled: boolean;
    lastPing: string;
    currentLocation?: { lat: number; lng: number };
    speedAlerts: number;
    geoFenceViolations: number;
  };
  fuelConsumption: {
    startReading: number;
    endReading?: number;
    fuelUsed?: number;
    fuelCostPerLiter: number;
    fuelStations?: {
      location: string;
      amount: number;
      cost: number;
      timestamp: string;
    }[];
  };
  incidents: {
    id: string;
    type: "Accident" | "Breakdown" | "Traffic" | "Weather" | "Other";
    description: string;
    location: { lat: number; lng: number; address: string };
    timestamp: string;
    severity: "Low" | "Medium" | "High";
    resolved: boolean;
    reportedBy: string;
  }[];
  passengerFeedback?: {
    rating: number; // 1-5
    comments: string;
    timestamp: string;
    categories: {
      driverBehavior: number;
      vehicleCondition: number;
      punctuality: number;
      routeOptimization: number;
    };
  };
  postTrip: {
    vehicleCondition: "Good" | "Fair" | "Poor";
    damageReport?: string;
    maintenanceRequired: boolean;
    cleaningRequired: boolean;
    fuelLevel: number;
    mileageEnd: number;
    photos?: string[];
    completedBy: string;
    completedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TripCost {
  id: string;
  tripRequestId: string;
  tripLogId: string;
  requestNumber: string;
  costBreakdown: {
    driverCharges: {
      baseFare: number;
      timeCharges: number;
      overtimeCharges: number;
      nightCharges: number;
      holidayCharges: number;
      waitingCharges: number;
      total: number;
    };
    vehicleCosts: {
      fuelCost: number;
      maintenanceCost: number;
      depreciationCost: number;
      insuranceCost: number;
      total: number;
    };
    additionalCosts: {
      tolls: {
        amount: number;
        location: string;
        timestamp: string;
      }[];
      parking: {
        amount: number;
        location: string;
        duration: number;
        timestamp: string;
      }[];
      permits: number;
      other: {
        description: string;
        amount: number;
      }[];
    };
    totalAdditionalCosts: number;
  };
  totalCost: number;
  estimatedCost: number;
  variance: number; // difference between estimated and actual
  variancePercentage: number;
  currency: string;
  billing: {
    billToUser: string;
    billToDepartment: string;
    costCenter: string;
    projectCode?: string;
    budgetCode?: string;
    taxAmount: number;
    taxPercentage: number;
    netAmount: number;
    grossAmount: number;
  };
  payment: {
    status: "Pending" | "Paid" | "Invoiced" | "Cancelled";
    method?: "Company Account" | "Cash" | "Card" | "Online";
    transactionId?: string;
    paidDate?: string;
    paidBy?: string;
  };
  receipts: {
    id: string;
    type: "Fuel" | "Toll" | "Parking" | "Other";
    amount: number;
    vendor: string;
    receiptNumber: string;
    imageUrl?: string;
    timestamp: string;
  }[];
  approvals: {
    financeApproval: {
      required: boolean;
      approved?: boolean;
      approvedBy?: string;
      approvedAt?: string;
      comments?: string;
    };
    managerApproval: {
      required: boolean;
      approved?: boolean;
      approvedBy?: string;
      approvedAt?: string;
      comments?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    oldValue?: unknown;
    newValue?: unknown;
  }[];
}

// Utility types for filtering and searching
export type TripStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Assigned"
  | "In Progress"
  | "Completed";
export type VehicleType = "Sedan" | "SUV" | "Hatchback" | "Van" | "Any";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type TripCategory =
  | "Business Meeting"
  | "Client Visit"
  | "Conference"
  | "Training"
  | "Airport Transfer"
  | "Other";

// Summary interfaces for dashboard/reporting
export interface TripSummary {
  totalTrips: number;
  completedTrips: number;
  pendingTrips: number;
  cancelledTrips: number;
  totalDistance: number;
  totalCost: number;
  averageCostPerKm: number;
  averageRating: number;
  fuelConsumption: number;
  co2Emissions: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface TripFilters {
  status?: TripStatus[];
  priority?: Priority[];
  vehicleType?: VehicleType[];
  department?: string[];
  dateRange?: DateRange;
  costRange?: { min: number; max: number };
  requester?: string;
  assignedDriver?: string;
  assignedVehicle?: string;
}

export interface Vehicle {
  id: number; // Changed from string to number to match vehicle page
  registrationNo: string; // Changed from vehicleNumber
  make: string;
  model: string;
  year: number;
  type: string;
  source: string;
  fuelType: string;
  seatingCapacity: number;
  status: string;
  currentDriver: string; // String for now, to be mapped to Driver later
  lastService: string; // Changed from lastServiceDate
  nextService: string;
  mileage: number; // Changed from currentMileage
  insuranceExpiry: string; // Changed from insuranceExpiryDate
  registrationExpiry?: string; // Optional, as not present in vehicle page
}
export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  licenseExpiryDate: string;
  experience: number;
  rating: number;
  currentLocation: { lat: number; lng: number };
  isAvailable: boolean;
}
