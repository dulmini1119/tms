// GPS Tracking and Location Interfaces
export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  timestamp: string;
  address?: string;
  speed?: number; // km/h
  heading?: number; // degrees
}

export interface GPSLog {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  tripId?: string;
  requestNumber?: string;
  location: GPSLocation;
  status: "Active" | "Idle" | "Offline" | "Emergency" | "Maintenance";
  ignitionStatus: "On" | "Off";
  fuelLevel: number;
  mileage: number;
  batteryLevel: number;
  signalStrength: number;
  lastPing: string;
  geofenceStatus: "Inside" | "Outside" | "Violation";
  speedAlerts: {
    currentSpeed: number;
    speedLimit: number;
    isViolation: boolean;
    violationCount: number;
  };
  panicButton: boolean;
  engineTemperature?: number;
  ac: boolean;
  doors: {
    frontLeft: boolean;
    frontRight: boolean;
    rearLeft: boolean;
    rearRight: boolean;
  };
  deviceInfo: {
    deviceId: string;
    imei: string;
    firmwareVersion: string;
    networkProvider: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Expiry Alerts and Document Management
export interface ExpiryAlert {
  id: string;
  alertType:
    | "Vehicle_Registration"
    | "Vehicle_Insurance"
    | "Driver_License"
    | "Pollution_Certificate"
    | "Fitness_Certificate"
    | "Route_Permit"
    | "Commercial_License"
    | "Medical_Certificate"
    | "Background_Verification"
    | "Training_Certificate";
  entityType: "Vehicle" | "Driver" | "Document";
  entityId: string;
  entityName: string;
  documentName: string;
  documentNumber?: string;
  issueDate: string;
  expiryDate: string;
  daysToExpiry: number;
  status: "Active" | "Expiring_Soon" | "Expired" | "Renewed" | "Under_Process";
  priority: "Low" | "Medium" | "High" | "Critical";
  department?: string;
  assignedTo?: string;
  remindersSent: number;
  lastReminderDate?: string;
  renewalCost?: number;
  currency?: string;
  vendor?: string;
  renewalProcess: {
    processStarted: boolean;
    documentsSubmitted: boolean;
    paymentMade: boolean;
    newExpiryDate?: string;
    renewalReference?: string;
  };
  notes?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Notifications System
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "Info" | "Success" | "Warning" | "Error" | "Alert";
  category:
    | "Trip"
    | "Vehicle"
    | "Driver"
    | "Document"
    | "System"
    | "Finance"
    | "Emergency"
    | "Maintenance";
  severity: "Low" | "Medium" | "High" | "Critical";
  priority: "Normal" | "High" | "Urgent";
  status: "Unread" | "Read" | "Acknowledged" | "Resolved" | "Dismissed";
  recipientType: "User" | "Role" | "Department" | "Broadcast";
  recipients: {
    userId?: string;
    userName?: string;
    roleId?: string;
    roleName?: string;
    departmentId?: string;
    departmentName?: string;
  }[];
  sender: {
    userId?: string;
    userName?: string;
    system: boolean;
  };
  relatedEntity?: {
    type: "Trip" | "Vehicle" | "Driver" | "Document" | "User";
    id: string;
    name: string;
  };
  actionable: boolean;
  actions?: {
    id: string;
    label: string;
    action: string;
    parameters?: Record<string, unknown>;
  }[];
  scheduledFor?: string;
  expiresAt?: string;
  tags: string[];
  readBy: {
    userId: string;
    userName: string;
    readAt: string;
  }[];
  acknowledgedBy?: {
    userId: string;
    userName: string;
    acknowledgedAt: string;
    comments?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Audit Logs and System Activity
export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  actionType:
    | "Create"
    | "Read"
    | "Update"
    | "Delete"
    | "Login"
    | "Logout"
    | "Export"
    | "Import"
    | "Approve"
    | "Reject";
  module:
    | "Dashboard"
    | "Users"
    | "Roles"
    | "Vehicles"
    | "Trips"
    | "Documents"
    | "Settings"
    | "Reports"
    | "Authentication";
  entityType?: "User" | "Vehicle" | "Trip" | "Document" | "Setting" | "Report";
  entityId?: string;
  entityName?: string;
  description: string;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  metadata: {
    ipAddress: string;
    userAgent: string;
    browser?: string;
    operatingSystem?: string;
    device?: string;
    location?: {
      country: string;
      city: string;
      coordinates?: GPSLocation;
    };
    sessionId: string;
    requestId?: string;
  };
  severity: "Info" | "Warning" | "Error" | "Critical";
  status: "Success" | "Failed" | "Pending";
  duration?: number; // milliseconds
  errorMessage?: string;
  tags: string[];
  archived: boolean;
  retentionDate: string;
  createdAt: string;
}

// System Settings and Configuration
export interface SystemSetting {
  id: string;
  category:
    | "General"
    | "Security"
    | "Notifications"
    | "GPS"
    | "Fleet"
    | "Billing"
    | "Integration"
    | "Backup";
  key: string;
  name: string;
  description: string;
  value: unknown;
  dataType: "String" | "Number" | "Boolean" | "JSON" | "Array" | "Date";
  defaultValue: unknown;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    enum?: string[];
  };
  scope: "Global" | "Department" | "User";
  visibility: "Public" | "Admin" | "System";
  editable: boolean;
  encrypted: boolean;
  lastModifiedBy: string;
  lastModifiedAt: string;
  version: number;
  environment: "Development" | "Staging" | "Production";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfiguration {
  id: string;
  configName: string;
  settings: SystemSetting[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  activatedAt?: string;
  activatedBy?: string;
}

// Geofence Management
export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: "Circular" | "Polygon" | "Route_Corridor";
  coordinates: GPSLocation[];
  radius?: number; // for circular geofences
  isActive: boolean;
  alertTypes: ("Entry" | "Exit" | "Dwell" | "Speed_Violation")[];
  vehicleIds: string[];
  driverIds: string[];
  schedules: {
    dayOfWeek: number; // 0 = Sunday
    startTime: string;
    endTime: string;
  }[];
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    dashboard: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Device and Sensor Data
export interface DeviceSensor {
  id: string;
  deviceId: string;
  vehicleId: string;
  sensorType:
    | "Temperature"
    | "Humidity"
    | "Fuel"
    | "Door"
    | "Panic"
    | "Speed"
    | "Acceleration"
    | "RFID";
  value: number | boolean | string;
  unit?: string;
  threshold?: {
    min?: number;
    max?: number;
    critical?: number;
  };
  status: "Normal" | "Warning" | "Critical" | "Offline";
  lastCalibrated?: string;
  calibratedBy?: string;
  batteryLevel?: number;
  signalStrength?: number;
  timestamp: string;
  createdAt: string;
}

// Fleet Analytics and KPIs
export interface FleetKPI {
  id: string;
  kpiName: string;
  category:
    | "Efficiency"
    | "Safety"
    | "Cost"
    | "Utilization"
    | "Maintenance"
    | "Driver_Performance";
  value: number;
  unit: string;
  target?: number;
  previousValue?: number;
  changePercentage?: number;
  trend: "Improving" | "Declining" | "Stable";
  period: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  periodStart: string;
  periodEnd: string;
  calculatedAt: string;
  metadata: Record<string, unknown>;
}

// System Health and Monitoring
export interface SystemHealth {
  id: string;
  component:
    | "Database"
    | "GPS_Service"
    | "Notification_Service"
    | "File_Storage"
    | "Authentication"
    | "Payment_Gateway";
  status: "Healthy" | "Warning" | "Critical" | "Down";
  uptime: number; // percentage
  responseTime: number; // milliseconds
  errorRate: number; // percentage
  lastCheck: string;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  alerts: {
    count: number;
    lastAlert: string;
  };
  version: string;
  environment: string;
  dependencies: string[];
}

// Vehicle and Driver Document Interfaces
export interface VehicleDocument {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  documentType:
    | "Registration_Certificate"
    | "Insurance_Policy"
    | "Pollution_Certificate"
    | "Fitness_Certificate"
    | "Route_Permit"
    | "Tax_Receipt"
    | "Service_Record"
    | "Inspection_Report"
    | "Ownership_Transfer"
    | "Hypothecation"
    | "No_Objection_Certificate";
  documentName: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  status:
    | "Valid"
    | "Expired"
    | "Expiring_Soon"
    | "Under_Renewal"
    | "Rejected"
    | "Pending_Verification";
  priority: "Low" | "Medium" | "High" | "Critical";
  category: "Legal" | "Insurance" | "Maintenance" | "Compliance" | "Financial";
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationComments?: string;
  renewalCost?: number;
  currency?: string;
  vendor?: string;
  contactNumber?: string;
  notes?: string;
  remindersSent: number;
  lastReminderDate?: string;
  daysToExpiry?: number;
  complianceScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  attachments: string[];
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    comments?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface DriverDocument {
  id: string;
  driverId: string;
  driverName: string;
  driverEmployeeId: string;
  licenseNumber: string;
  documentType:
    | "Driving_License"
    | "Medical_Certificate"
    | "Police_Verification"
    | "Training_Certificate"
    | "Insurance_Policy"
    | "Address_Proof"
    | "Identity_Proof"
    | "Employment_Letter"
    | "Experience_Certificate"
    | "Photo"
    | "Signature_Specimen"
    | "Background_Check"
    | "Drug_Test_Report";
  documentName: string;
  documentNumber?: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  status:
    | "Valid"
    | "Expired"
    | "Expiring_Soon"
    | "Under_Renewal"
    | "Rejected"
    | "Pending_Verification";
  priority: "Low" | "Medium" | "High" | "Critical";
  category:
    | "Legal"
    | "Medical"
    | "Training"
    | "Verification"
    | "Insurance"
    | "Identity";
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationComments?: string;
  renewalCost?: number;
  currency?: string;
  vendor?: string;
  contactNumber?: string;
  medicalCenter?: string;
  trainingInstitute?: string;
  certificationLevel?: string;
  score?: number;
  validityPeriod?: number;
  notes?: string;
  remindersSent: number;
  lastReminderDate?: string;
  daysToExpiry?: number;
  complianceScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  attachments: string[];
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    comments?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Utility types for filtering and searching
export type AlertPriority = "Low" | "Medium" | "High" | "Critical";
export type NotificationType =
  | "Info"
  | "Success"
  | "Warning"
  | "Error"
  | "Alert";
export type AuditActionType =
  | "Create"
  | "Read"
  | "Update"
  | "Delete"
  | "Login"
  | "Logout"
  | "Export"
  | "Import"
  | "Approve"
  | "Reject";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SystemFilters {
  dateRange?: DateRange;
  entityType?: string[];
  status?: string[];
  priority?: AlertPriority[];
  severity?: string[];
  department?: string[];
  assignedTo?: string;
}

// Summary interfaces for dashboard/reporting
export interface TrackingStats {
  totalVehicles: number;
  activeVehicles: number;
  offlineVehicles: number;
  emergencyAlerts: number;
  speedViolations: number;
  geofenceViolations: number;
  averageSpeed: number;
  totalDistance: number;
  fuelConsumption: number;
}

export interface AlertStats {
  totalAlerts: number;
  criticalAlerts: number;
  expiringSoon: number;
  overdueRenewals: number;
  processedToday: number;
  averageResolutionTime: number;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  acknowledgedCount: number;
  criticalCount: number;
  emergencyCount: number;
  averageResponseTime: number;
}
