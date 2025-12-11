// Base interface for detail views
export interface BaseDetailView {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// User Detail View Interface
export interface UserDetailView extends BaseDetailView {
  // Basic Information
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    employeeId: string;
    profilePicture?: string;
    dateOfBirth?: string;
    gender?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };

  // Employment Information
  employmentInfo: {
    department: {
      id: string;
      name: string;
      code: string;
    };
    businessUnit: {
      id: string;
      name: string;
    };
    position: string;
    manager: {
      id: string;
      name: string;
      email: string;
    };
    hireDate: string;
    employmentType: "Full-time" | "Part-time" | "Contract" | "Intern";
    workLocation: string;
    salary?: {
      amount: number;
      currency: string;
      frequency: "Monthly" | "Annual";
    };
  };

  // Account Information
  accountInfo: {
    status: "Active" | "Inactive" | "Suspended" | "Pending";
    roles: Array<{
      id: string;
      name: string;
      assignedDate: string;
      assignedBy: string;
    }>;
    permissions: string[];
    lastLogin: string;
    loginCount: number;
    accountCreated: string;
    passwordLastChanged: string;
    twoFactorEnabled: boolean;
  };

  // Activity & Statistics
  activityInfo: {
    tripRequests: {
      total: number;
      approved: number;
      rejected: number;
      pending: number;
      lastRequestDate?: string;
    };
    loginHistory: Array<{
      date: string;
      ipAddress: string;
      device: string;
      location: string;
      success: boolean;
    }>;
    recentActions: Array<{
      action: string;
      timestamp: string;
      details: string;
    }>;
  };

  // Emergency Contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };

  // Documents
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    uploadDate: string;
    size: number;
    status: "Verified" | "Pending" | "Rejected";
  }>;
}

// Role Detail View Interface
export interface RoleDetailView extends BaseDetailView {
  // Basic Information
  basicInfo: {
    name: string;
    description: string;
    code: string;
    category: string;
    level: number;
    status: "Active" | "Inactive";
    scope: "Global" | "Department" | "BusinessUnit";
  };

  // Permissions
  permissions: {
    assigned: Array<{
      id: string;
      name: string;
      module: string;
      action: string;
      resource: string;
      assignedDate: string;
      assignedBy: string;
    }>;
    inherited: Array<{
      id: string;
      name: string;
      module: string;
      inheritedFrom: string;
    }>;
    total: number;
  };

  // Assigned Users/Employees
  assignedUsers: Array<{
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department: {
      id: string;
      name: string;
    };
    position: string;
    assignedDate: string;
    assignedBy: string;
    status: "Active" | "Inactive";
    profilePicture?: string;
  }>;

  // Role Hierarchy
  hierarchy: {
    parentRoles: Array<{
      id: string;
      name: string;
      level: number;
    }>;
    childRoles: Array<{
      id: string;
      name: string;
      level: number;
      userCount: number;
    }>;
  };

  // Usage Statistics
  statistics: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newAssignmentsThisMonth: number;
    departmentDistribution: Array<{
      departmentName: string;
      userCount: number;
      percentage: number;
    }>;
  };

  // Access Patterns
  accessPatterns: {
    mostUsedPermissions: Array<{
      permission: string;
      usageCount: number;
      lastUsed: string;
    }>;
    recentActivity: Array<{
      userId: string;
      userName: string;
      action: string;
      timestamp: string;
      resource: string;
    }>;
  };
}

// Department Detail View Interface
export interface DepartmentDetailView extends BaseDetailView {
  // Basic Information
  basicInfo: {
    name: string;
    code: string;
    description: string;
    type: string;
    status: "Active" | "Inactive";
    location: {
      building: string;
      floor: string;
      address: string;
    };
  };

  // Management Structure
  management: {
    head: {
      id: string;
      name: string;
      email: string;
      phone: string;
      appointedDate: string;
    };
    managers: Array<{
      id: string;
      name: string;
      email: string;
      position: string;
      teamSize: number;
      appointedDate: string;
    }>;
  };

  // Employees
  employees: Array<{
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    hireDate: string;
    status: "Active" | "Inactive" | "On Leave";
    manager: {
      id: string;
      name: string;
    };
    profilePicture?: string;
  }>;

  // Business Unit Association
  businessUnit: {
    id: string;
    name: string;
    code: string;
  };

  // Budget & Resources
  budget: {
    allocated: number;
    utilized: number;
    remaining: number;
    currency: string;
    fiscalYear: string;
    lastUpdated: string;
  };

  // Statistics
  statistics: {
    totalEmployees: number;
    activeEmployees: number;
    newHiresThisMonth: number;
    avgTenure: number;
    turnoverRate: number;
    openPositions: number;
  };

  // Recent Activities
  recentActivities: Array<{
    type:
      | "Employee Added"
      | "Employee Left"
      | "Role Changed"
      | "Budget Updated";
    description: string;
    timestamp: string;
    performedBy: string;
  }>;

  // Fleet Usage (if applicable)
  fleetUsage?: {
    assignedVehicles: number;
    activeTrips: number;
    monthlyTripRequests: number;
    totalTripCost: number;
  };
}

// Cab Service Detail View Interface
export interface CabServiceDetailView extends BaseDetailView {
  // Basic Information
  basicInfo: {
    name: string;
    code: string;
    type: "In-house" | "Vendor" | "Third-party";
    status: "Active" | "Inactive" | "Suspended";
    description: string;
    registrationNumber: string;
    taxId: string;
  };

  // Contact Information
  contactInfo: {
    primaryContact: {
      name: string;
      position: string;
      email: string;
      phone: string;
    };
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    website?: string;
    socialMedia?: {
      linkedin?: string;
      twitter?: string;
    };
  };

  // Service Details
  serviceDetails: {
    serviceAreas: string[];
    vehicleTypes: Array<{
      type: string;
      count: number;
      capacity: string;
    }>;
    operatingHours: {
      weekdays: string;
      weekends: string;
      holidays: string;
      is24x7: boolean;
    };
    specialServices: string[];
  };

  // Performance Metrics
  performance: {
    rating: {
      overall: number;
      punctuality: number;
      vehicleCondition: number;
      driverBehavior: number;
      customerService: number;
      totalReviews: number;
    };
    statistics: {
      totalTrips: number;
      completedTrips: number;
      cancelledTrips: number;
      averageResponseTime: number; // in minutes
      onTimePerformance: number; // percentage
    };
  };

  // Financial Information
  financial: {
    rateStructure: Array<{
      vehicleType: string;
      baseRate: number;
      perKmRate: number;
      perHourRate: number;
      nightCharges: number;
      holidayCharges: number;
    }>;
    paymentTerms: string;
    totalRevenue: number;
    outstandingAmount: number;
    currency: string;
  };

  // Fleet Information
  fleet: {
    totalVehicles: number;
    activeVehicles: number;
    maintenanceVehicles: number;
    drivers: Array<{
      id: string;
      name: string;
      licenseNumber: string;
      phone: string;
      rating: number;
      status: "Available" | "On Trip" | "Off Duty";
      assignedVehicle?: string;
    }>;
  };

  // Recent Activities
  recentActivities: Array<{
    type: string;
    description: string;
    timestamp: string;
    tripId?: string;
    amount?: number;
  }>;

  // Documents
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    uploadDate: string;
    expiryDate?: string;
    status: "Valid" | "Expired" | "Expiring Soon";
  }>;
}

// Cab Agreement Detail View Interface
export interface CabAgreementDetailView extends BaseDetailView {
  // Basic Information
  basicInfo: {
    agreementNumber: string;
    title: string;
    type: "Service Agreement" | "Vendor Contract" | "Partnership";
    status: "Active" | "Expired" | "Terminated" | "Draft" | "Under Review";
    priority: "High" | "Medium" | "Low";
  };

  // Parties Involved
  parties: {
    client: {
      companyName: string;
      contactPerson: string;
      email: string;
      phone: string;
      address: string;
    };
    vendor: {
      id: string;
      companyName: string;
      contactPerson: string;
      email: string;
      phone: string;
      address: string;
      rating: number;
    };
  };

  // Agreement Terms
  terms: {
    startDate: string;
    endDate: string;
    duration: string;
    autoRenewal: boolean;
    renewalPeriod?: string;
    terminationClause: string;
    noticePeriod: number; // in days
  };

  // Financial Terms
  financial: {
    contractValue: number;
    currency: string;
    paymentTerms: string;
    paymentSchedule: "Monthly" | "Quarterly" | "Per Trip" | "Annual";
    penaltyClause: string;
    securityDeposit?: number;
    insurance: {
      required: boolean;
      amount?: number;
      provider?: string;
      policyNumber?: string;
      expiryDate?: string;
    };
  };

  // Service Level Agreements
  sla: {
    responseTime: number; // in minutes
    availabilityPercentage: number;
    onTimePerformance: number;
    qualityMetrics: Array<{
      metric: string;
      target: number;
      unit: string;
    }>;
    penalties: Array<{
      condition: string;
      penalty: string;
    }>;
  };

  // Performance Tracking
  performance: {
    currentPeriod: {
      startDate: string;
      endDate: string;
      metricsAchieved: Array<{
        metric: string;
        target: number;
        achieved: number;
        status: "Met" | "Not Met" | "Exceeded";
      }>;
    };
    historicalPerformance: Array<{
      period: string;
      overallScore: number;
      keyMetrics: Record<string, number>;
    }>;
  };

  // Documents & Attachments
  documents: Array<{
    id: string;
    type: "Contract" | "Amendment" | "Insurance" | "License" | "Other";
    fileName: string;
    uploadDate: string;
    version: string;
    status: "Current" | "Superseded" | "Draft";
    size: number;
  }>;

  // Amendment History
  amendments: Array<{
    id: string;
    amendmentNumber: string;
    date: string;
    description: string;
    changedBy: string;
    approvedBy: string;
    effectiveDate: string;
    impact: "Financial" | "Service" | "Terms" | "Other";
  }>;

  // Renewal & Termination
  renewal: {
    isEligibleForRenewal: boolean;
    renewalDate?: string;
    renewalStatus?: "Pending" | "Approved" | "Rejected";
    renewalTerms?: string;
    terminationReason?: string;
    terminationDate?: string;
  };
}

// Vehicle Detail View Interface
export interface VehicleDetailView extends BaseDetailView {
  // Basic Information
  basicInfo: {
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    color: string;
    chassisNumber: string;
    engineNumber: string;
    fuelType: "Petrol" | "Diesel" | "Electric" | "Hybrid" | "CNG";
    transmission: "Manual" | "Automatic";
    seatingCapacity: number;
    category: "Sedan" | "SUV" | "Hatchback" | "Minivan" | "Bus" | "Truck";
  };

  // Current Status
  status: {
    operational: "Active" | "Inactive" | "Maintenance" | "Retired";
    location: {
      current: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      lastUpdated: string;
    };
    availability: "Available" | "On Trip" | "Maintenance" | "Reserved";
    condition: "Excellent" | "Good" | "Fair" | "Poor";
  };

  // Assignment Information
  assignment: {
    currentDriver?: {
      id: string;
      name: string;
      licenseNumber: string;
      phone: string;
      assignedDate: string;
    };
    department?: {
      id: string;
      name: string;
      assignedDate: string;
    };
    homeBase: string;
  };

  // Technical Specifications
  specifications: {
    engine: {
      displacement: string;
      power: string;
      torque: string;
    };
    dimensions: {
      length: number;
      width: number;
      height: number;
      wheelbase: number;
    };
    weight: {
      kerb: number;
      gross: number;
    };
    fuelCapacity: number;
    mileage: {
      city: number;
      highway: number;
      combined: number;
    };
  };

  // Ownership & Insurance
  ownership: {
    ownershipType: "Owned" | "Leased" | "Rented";
    purchaseDate?: string;
    purchasePrice?: number;
    leaseDetails?: {
      lessor: string;
      leaseStartDate: string;
      leaseEndDate: string;
      monthlyPayment: number;
    };
    insurance: {
      provider: string;
      policyNumber: string;
      coverage: string;
      premium: number;
      startDate: string;
      expiryDate: string;
      status: "Active" | "Expired" | "Expiring Soon";
    };
  };

  // Documents
  documents: Array<{
    id: string;
    type:
      | "Registration"
      | "Insurance"
      | "PUC"
      | "Fitness"
      | "Permit"
      | "Tax"
      | "Other";
    fileName: string;
    issueDate: string;
    expiryDate?: string;
    issuingAuthority: string;
    status: "Valid" | "Expired" | "Expiring Soon";
    documentNumber: string;
  }>;

  // Usage Statistics
  usage: {
    totalKilometers: number;
    monthlyAverage: number;
    totalTrips: number;
    averageTripDistance: number;
    fuelConsumption: {
      total: number;
      average: number;
      lastMonth: number;
    };
    utilizationRate: number; // percentage
  };

  // Financial Information
  financial: {
    currentValue: number;
    depreciationRate: number;
    totalMaintenanceCost: number;
    monthlyRunningCost: number;
    fuelCostPerKm: number;
    totalCostOfOwnership: number;
  };

  // Recent Activities
  recentActivities: Array<{
    type:
      | "Trip"
      | "Maintenance"
      | "Fuel"
      | "Document Update"
      | "Assignment Change";
    description: string;
    timestamp: string;
    cost?: number;
    performedBy?: string;
    reference?: string;
  }>;
}

// Vehicle Maintenance Log Interface
export interface VehicleMaintenanceLog {
  id: string;
  vehicleId: string;
  vehicleRegistration: string;

  // Maintenance Details
  maintenanceInfo: {
    type:
      | "Scheduled"
      | "Unscheduled"
      | "Emergency"
      | "Preventive"
      | "Corrective";
    category:
      | "Engine"
      | "Transmission"
      | "Brakes"
      | "Electrical"
      | "Body"
      | "Tires"
      | "AC"
      | "General";
    priority: "Low" | "Medium" | "High" | "Critical";
    description: string;
    symptoms?: string;
    rootCause?: string;
  };

  // Scheduling
  scheduling: {
    scheduledDate: string;
    actualDate: string;
    duration: number; // in hours
    basedOn: "Mileage" | "Time" | "Condition" | "Breakdown";
    mileageAtMaintenance: number;
    nextScheduledMaintenance?: {
      date: string;
      mileage: number;
      type: string;
    };
  };

  // Service Provider
  serviceProvider: {
    type: "In-house" | "Authorized Dealer" | "Third-party" | "Roadside";
    name: string;
    location: string;
    contactPerson?: string;
    phone?: string;
    serviceAdvisor?: string;
  };

  // Work Performed
  workPerformed: Array<{
    id: string;
    description: string;
    category: string;
    laborHours: number;
    laborCost: number;
    status: "Completed" | "Pending" | "Skipped";
    technician?: string;
    notes?: string;
  }>;

  // Parts & Materials
  partsUsed: Array<{
    id: string;
    partNumber: string;
    partName: string;
    brand: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    warranty: {
      duration: number;
      unit: "Days" | "Months" | "Kilometers";
      expiryDate: string;
    };
    supplier?: string;
  }>;

  // Cost Breakdown
  costs: {
    laborCost: number;
    partsCost: number;
    otherCharges: number;
    tax: number;
    discount: number;
    totalCost: number;
    currency: string;
    paymentStatus: "Paid" | "Pending" | "Partially Paid";
    paymentMethod?: string;
    invoiceNumber?: string;
  };

  // Quality & Inspection
  inspection: {
    preInspection: {
      performedBy: string;
      findings: string[];
      overallCondition: "Excellent" | "Good" | "Fair" | "Poor";
      photos?: string[];
    };
    postInspection: {
      performedBy: string;
      findings: string[];
      overallCondition: "Excellent" | "Good" | "Fair" | "Poor";
      photos?: string[];
      qualityRating: number; // 1-5
    };
    testDriveResults?: {
      performedBy: string;
      distance: number;
      issues: string[];
      approved: boolean;
    };
  };

  // Status & Approvals
  status: {
    current:
      | "Scheduled"
      | "In Progress"
      | "Completed"
      | "On Hold"
      | "Cancelled";
    approvals: Array<{
      stage:
        | "Work Authorization"
        | "Additional Work"
        | "Payment"
        | "Completion";
      approvedBy: string;
      approvedDate: string;
      notes?: string;
    }>;
    completionDate?: string;
    handoverDate?: string;
    handoverTo?: string;
  };

  // Follow-up
  followUp: {
    warrantyItems: Array<{
      item: string;
      warrantyPeriod: string;
      expiryDate: string;
      status: "Active" | "Expired" | "Claimed";
    }>;
    recommendedActions: Array<{
      action: string;
      priority: "Low" | "Medium" | "High";
      dueDate: string;
    }>;
    nextMaintenanceReminder: {
      date: string;
      mileage: number;
      type: string;
    };
  };

  // Documents & Media
  documents: Array<{
    id: string;
    type:
      | "Invoice"
      | "Work Order"
      | "Estimate"
      | "Warranty"
      | "Photo"
      | "Report";
    fileName: string;
    uploadDate: string;
    uploadedBy: string;
    size: number;
    url: string;
  }>;

  // Audit Trail
  auditTrail: Array<{
    timestamp: string;
    action: string;
    performedBy: string;
    oldValue?: unknown;
    newValue?: unknown;
    notes?: string;
  }>;

  // Creation & Modification
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Summary interfaces for list views
export interface MaintenanceLogSummary {
  id: string;
  vehicleRegistration: string;
  type: string;
  category: string;
  scheduledDate: string;
  actualDate: string;
  status: string;
  totalCost: number;
  serviceProvider: string;
  nextMaintenance?: string;
}

export interface DetailViewActions<
  UserProfileData = unknown,
  EmployeeData = unknown,
  BudgetData = unknown,
  MaintenanceData = unknown,
  PartData = unknown,
  ApprovalData = unknown
> {
  userActions: {
    resetPassword: (userId: string) => void;
    deactivateAccount: (userId: string, reason: string) => void;
    updateProfile: (userId: string, profileData: UserProfileData) => void;
    assignRole: (userId: string, roleId: string) => void;
    removeRole: (userId: string, roleId: string) => void;
    viewLoginHistory: (userId: string) => void;
    sendPasswordReset: (userId: string) => void;
    enableTwoFactor: (userId: string) => void;
    disableTwoFactor: (userId: string) => void;
  };

  roleActions: {
    assignUser: (roleId: string, userId: string) => void;
    removeUser: (roleId: string, userId: string) => void;
    cloneRole: (roleId: string) => void;
    exportUserList: (roleId: string) => void;
    bulkAssignUsers: (roleId: string, userIds: string[]) => void;
    viewPermissionMatrix: (roleId: string) => void;
  };

  departmentActions: {
    addEmployee: (departmentId: string, employeeData: EmployeeData) => void;
    transferEmployee: (
      departmentId: string,
      employeeId: string,
      targetDepartmentId: string
    ) => void;
    updateBudget: (departmentId: string, budgetData: BudgetData) => void;
    generateReport: (departmentId: string, reportType: string) => void;
    exportEmployeeList: (departmentId: string) => void;
    viewOrgChart: (departmentId: string) => void;
  };

  maintenanceActions: {
    scheduleNext: (vehicleId: string, maintenanceData: MaintenanceData) => void;
    addPart: (logId: string, partData: PartData) => void;
    updateStatus: (logId: string, status: string) => void;
    addInspectionNote: (logId: string, note: string) => void;
    attachDocument: (logId: string, document: File) => void;
    approveWork: (logId: string, approvalData: ApprovalData) => void;
    generateReport: (logId: string) => void;
    claimWarranty: (logId: string, partId: string) => void;
  };
}
