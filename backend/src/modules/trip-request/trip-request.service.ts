import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getFullName = (user: any) => {
  if (!user) return "Unknown";
  const first = user.first_name || "";
  const last = user.last_name || "";
  return `${first} ${last}`.trim() || user.employee_id || "Unknown";
};

// Helper to map DB result to Frontend Interface
const mapDbToFrontend = (request: any) => {
  // 1. Determine Approver info from trip_approvals
  const approvals = request.trip_approvals || [];
  let latestApproval = approvals.find((a: any) => a.status !== "Pending");
  if (!latestApproval && approvals.length > 0) {
    latestApproval = approvals[0]; // Fallback to first step
  }

  // 2. Construct the 'approval' object required by Frontend
  const approvalData = latestApproval ? {
    id: latestApproval.id,
    tripRequestId: request.id,
    requestNumber: request.request_number,
    
    // Workflow mapping
    approvalWorkflow: approvals.map((a: any) => ({
      level: a.approval_level,
      approverName: a.users ? getFullName(a.users) : "Pending",
      approverRole: a.approver_role || "Approver",
    })),
    
    currentApprovalLevel: latestApproval.approval_level,
    
    approvalHistory: approvals.map((a: any) => ({
      level: a.approval_level,
      approver: {
        id: a.users?.id,
        name: a.users ? getFullName(a.users) : "System",
        email: a.users?.email || "N/A",
        role: a.approver_role || "Approver",
      },
      action: a.status, // "Pending", "Approved", "Rejected"
      comments: a.comments,
      timestamp: a.approved_at || a.created_at,
      ipAddress: "192.168.1.1", // Or from DB if available
    })),
    
    finalStatus: (latestApproval.status === "Approved" || latestApproval.status === "Rejected") 
      ? latestApproval.status 
      : "Pending",
    
    autoApproval: false,
    approvalRules: {
      costThreshold: 50000,
      departmentApprovalRequired: true,
      managerApprovalRequired: true,
      financeApprovalRequired: false,
    },
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  } : null;

  return {
    id: request.id,
    requestNumber: request.request_number,
    requestedBy: {
      id: request.users_trip_requests_requested_by_user_idTousers?.id,
      name: getFullName(request.users_trip_requests_requested_by_user_idTousers),
      email: request.users_trip_requests_requested_by_user_idTousers?.email,
      department: request.users_trip_requests_requested_by_user_idTousers?.departments_users_department_idTodepartments?.name,
      employeeId: request.users_trip_requests_requested_by_user_idTousers?.employee_id,
      phoneNumber: request.users_trip_requests_requested_by_user_idTousers?.phone || "N/A",
      designation: "N/A", // Map if available in user schema
      managerName: "N/A", // Map if available in user schema
      costCenter: request.cost_center,
    },
    tripDetails: {
      fromLocation: {
        address: request.from_location_address,
        coordinates: request.from_location_latitude 
          ? { lat: Number(request.from_location_latitude), lng: Number(request.from_location_longitude) }
          : undefined,
        landmark: request.from_location_landmark,
      },
      toLocation: {
        address: request.to_location_address,
        coordinates: request.to_location_latitude 
          ? { lat: Number(request.to_location_latitude), lng: Number(request.to_location_longitude) }
          : undefined,
        landmark: request.to_location_landmark,
      },
      departureDate: request.departure_date,
      departureTime: request.departure_time ? request.departure_time.toTimeString().substring(0,5) : "",
      returnDate: request.return_date,
      returnTime: request.return_time ? request.return_time.toTimeString().substring(0,5) : "",
      isRoundTrip: request.is_round_trip || false,
      estimatedDistance: Number(request.estimated_distance) || 0,
      estimatedDuration: request.estimated_duration || 0,
    },
    purpose: {
      category: request.purpose_category || "General",
      description: request.purpose_description,
      projectCode: request.project_code,
      costCenter: request.cost_center,
      businessJustification: request.business_justification,
    },
    requirements: {
      vehicleType: request.vehicle_type_required || "Any",
      passengerCount: request.passenger_count || 1,
      specialRequirements: request.luggage_requirements,
      acRequired: request.ac_required !== undefined ? request.ac_required : true,
      luggage: request.luggage_type || "Small bag",
    },
    priority: request.priority || "Medium",
    status: request.status || "Pending",
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    approvalRequired: request.approval_required !== undefined ? request.approval_required : true,
    estimatedCost: Number(request.estimated_cost) || 0,
    currency: request.currency || "INR",
    
    // Passengers (Simplified for frontend - mapping from trip_passengers if needed)
    passengers: [], 

    // Approval Object (Populated from relation)
    approval: approvalData,

    // Mocking other fields expected by interface if not in DB
    costBreakdown: {
      baseFare: 0,
      distanceCharges: 0,
      timeCharges: 0,
      additionalCharges: 0,
      taxAmount: 0
    },
    billing: {
      billingType: "Corporate",
      costCenter: "CC001",
      projectCode: "PRJ001",
      budgetCode: "BC001",
      billToDepartment: "Sales",
      approverName: "Manager"
    },
    attachments: [],
    auditTrail: []
  };
};

export const getAllTripRequests = async (filters: any) => {
  const { searchTerm, status, department, priority, page, pageSize } = filters;
  
  // FIX: Explicitly initialize variables to avoid TS2321/TS18004
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  const where: any = {};

  if (searchTerm) {
    where.OR = [
      { request_number: { contains: searchTerm, mode: "insensitive" } },
      { from_location_address: { contains: searchTerm, mode: "insensitive" } },
      { to_location_address: { contains: searchTerm, mode: "insensitive" } },
      { users_trip_requests_requested_by_user_idTousers: { 
        OR: [
          { first_name: { contains: searchTerm, mode: "insensitive" } }, 
          { last_name: { contains: searchTerm, mode: "insensitive" } }
        ] 
      }}
    ];
  }

  if (status && status !== "all-status") where.status = status;
  if (priority && priority !== "all-priorities") where.priority = priority;
  if (department && department !== "all-departments") {
    where.users_trip_requests_requested_by_user_idTousers = { 
      departments_users_department_idTodepartments: { name: department } 
    };
  }

  const [requests, totalCount] = await Promise.all([
    prisma.trip_requests.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        users_trip_requests_requested_by_user_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true, employee_id: true, departments_users_department_idTodepartments: { select: { name: true } }, phone: true },
        },
        // FIX: Corrected relation name to 'trip_approvals'
        trip_approvals: {
          include: { users: { select: { first_name: true, last_name: true } } },
          orderBy: { approval_level: 'asc' }
        }
      },
    }),
    prisma.trip_requests.count({ where }),
  ]);

  return {
    data: requests.map(mapDbToFrontend),
    meta: { total: totalCount, page: parseInt(page), pageSize: parseInt(pageSize), totalPages: Math.ceil(totalCount / parseInt(pageSize)) },
  };
};

export const getTripRequestById = async (id: string) => {
  const request = await prisma.trip_requests.findUnique({
    where: { id },
    include: {
      users_trip_requests_requested_by_user_idTousers: { 
        select: { id: true, first_name: true, last_name: true, email: true, employee_id: true, departments_users_department_idTodepartments: { select: { name: true } }, phone: true },
      },
      // FIX: Corrected relation name
      trip_approvals: {
        include: { users: { select: { first_name: true, last_name: true } } },
        orderBy: { approval_level: 'asc' }
      }
    },
  });

  if (!request) throw new Error("Trip Request not found");
  return mapDbToFrontend(request);
};

export const createTripRequest = async (data: any) => {
  const { requestedByUserId, ...rest } = data; // requestedByUserId injected by controller
  
  const newRequest = await prisma.trip_requests.create({
    data: {
      ...rest,
      requested_by_user_id: requestedByUserId,
      status: "Pending",
      created_at: new Date(),
    },
    include: {
      users_trip_requests_requested_by_user_idTousers: { select: { first_name: true, last_name: true, email: true } },
      trip_approvals: { include: { users: { select: { first_name: true, last_name: true } } } }
    },
  });

  return mapDbToFrontend(newRequest);
};

export const updateTripRequest = async (id: string, data: any) => {
  const updatedRequest = await prisma.trip_requests.update({
    where: { id },
    data,
    include: {
      users_trip_requests_requested_by_user_idTousers: { select: { first_name: true, last_name: true, email: true } },
      // FIX: Corrected relation name
      trip_approvals: { include: 
        { users: 
          { select: 
            { first_name: true, last_name: true } 
          } 
        }
      },
  },
  });
  return mapDbToFrontend(updatedRequest);
};

export const deleteTripRequest = async (id: string) => {
  await prisma.trip_requests.delete({ where: { id } });
  return { success: true };
};