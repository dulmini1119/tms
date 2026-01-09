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
      ipAddress: "192.168.1.1", 
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

  // if(filters.users?.role === 'EMPLOYEE') {
  //   where.requested_by_user_id = filters.users.id;
  // }

  if (!["ADMIN", "SUPERADMIN"].includes(filters.user?.role)) {
  where.requested_by_user_id = filters.user.id;
}
console.log("Loggeed User", filters.user);

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
  const { requestedByUserId, tripDetails, purpose, requirements, ...rest } = data;

  // Convert time strings to Date objects (Prisma expects DateTime for @db.Time)
  const departureTime = tripDetails.departureTime
    ? new Date(`1970-01-01T${tripDetails.departureTime}:00`)
    : new Date("1970-01-01T00:00:00");

  const returnTime = tripDetails.returnTime
    ? new Date(`1970-01-01T${tripDetails.returnTime}:00`)
    : undefined;

  const newRequest = await prisma.trip_requests.create({
    data: {
      // Relation: connect existing user
      users_trip_requests_requested_by_user_idTousers: {
        connect: { id: requestedByUserId },
      },

      status: rest.status || "Pending",
      created_at: new Date(),

      // Trip details
      from_location_address: tripDetails.fromLocation.address,
      from_location_latitude: tripDetails.fromLocation.coordinates?.lat,
      from_location_longitude: tripDetails.fromLocation.coordinates?.lng,
      from_location_landmark: tripDetails.fromLocation.landmark,
      to_location_address: tripDetails.toLocation.address,
      to_location_latitude: tripDetails.toLocation.coordinates?.lat,
      to_location_longitude: tripDetails.toLocation.coordinates?.lng,
      to_location_landmark: tripDetails.toLocation.landmark,
      departure_date: tripDetails.departureDate ? new Date(tripDetails.departureDate) : new Date(),
      departure_time: departureTime,
      return_date: tripDetails.returnDate ? new Date(tripDetails.returnDate) : undefined,
      return_time: returnTime,
      is_round_trip: false, // removed round trip logic
      estimated_distance: tripDetails.estimatedDistance || 0,
      estimated_duration: tripDetails.estimatedDuration || 0,

      // Purpose
      purpose_category: purpose.category,
      purpose_description: purpose.description,
      project_code: purpose.projectCode || "",
      cost_center: purpose.costCenter || "",
      business_justification: purpose.businessJustification || "",

      // Requirements
      vehicle_type_required: requirements.vehicleType || "",
      passenger_count: requirements.passengerCount || 1,
      ac_required: requirements.acRequired !== undefined ? requirements.acRequired : true,
      luggage_type: requirements.luggage || "",
      luggage_requirements: requirements.specialRequirements || "",

      // Other fields
      priority: rest.priority || "Medium",
      estimated_cost: rest.estimatedCost || 0,
      approval_required: rest.approvalRequired !== undefined ? rest.approvalRequired : true,
      request_number: rest.requestNumber || `REQ-${Date.now()}`,
    },
    include: {
      users_trip_requests_requested_by_user_idTousers: {
        select: { first_name: true, last_name: true, email: true },
      },
      trip_approvals: {
        include: {
          users: {
            select: { first_name: true, last_name: true },
          },
        },
      },
    },
  });

  return newRequest;
};




export const updateTripRequest = async (id: string, data: any) => {
  const { tripDetails, purpose, requirements, ...rest } = data;

  // Convert time strings to Date objects
  const departureTime = tripDetails?.departureTime
    ? new Date(`1970-01-01T${tripDetails.departureTime}:00`)
    : new Date("1970-01-01T00:00:00");

  const returnTime = tripDetails?.returnTime
    ? new Date(`1970-01-01T${tripDetails.returnTime}:00`)
    : null;

  const returnDate = tripDetails?.returnDate
    ? new Date(tripDetails.returnDate)
    : null;

  const departureDate = tripDetails?.departureDate
    ? new Date(tripDetails.departureDate)
    : new Date();

  const updatedRequest = await prisma.trip_requests.update({
    where: { id },
    data: {
      from_location_address: tripDetails?.fromLocation?.address ?? undefined,
      from_location_latitude: tripDetails?.fromLocation?.coordinates?.lat ?? undefined,
      from_location_longitude: tripDetails?.fromLocation?.coordinates?.lng ?? undefined,
      from_location_landmark: tripDetails?.fromLocation?.landmark ?? undefined,
      to_location_address: tripDetails?.toLocation?.address ?? undefined,
      to_location_latitude: tripDetails?.toLocation?.coordinates?.lat ?? undefined,
      to_location_longitude: tripDetails?.toLocation?.coordinates?.lng ?? undefined,
      to_location_landmark: tripDetails?.toLocation?.landmark ?? undefined,
      departure_date: departureDate,
      departure_time: departureTime,
      return_date: returnDate,
      return_time: returnTime,
      is_round_trip: tripDetails?.isRoundTrip ?? false,
      estimated_distance: tripDetails?.estimatedDistance ?? undefined,
      estimated_duration: tripDetails?.estimatedDuration ?? undefined,

      purpose_category: purpose?.category ?? undefined,
      purpose_description: purpose?.description ?? undefined,
      project_code: purpose?.projectCode ?? undefined,
      cost_center: purpose?.costCenter ?? undefined,
      business_justification: purpose?.businessJustification ?? undefined,

      vehicle_type_required: requirements?.vehicleType ?? undefined,
      passenger_count: requirements?.passengerCount ?? undefined,
      ac_required: requirements?.acRequired ?? undefined,
      luggage_type: requirements?.luggage ?? undefined,
      luggage_requirements: requirements?.specialRequirements ?? undefined,

      priority: rest.priority ?? undefined,
      estimated_cost: rest.estimatedCost ?? undefined,
      approval_required: rest.approvalRequired ?? undefined,
    },
    include: {
      users_trip_requests_requested_by_user_idTousers: {
        select: { first_name: true, last_name: true, email: true },
      },
      trip_approvals: {
        include: { users: { select: { first_name: true, last_name: true } } },
      },
    },
  });

  return mapDbToFrontend(updatedRequest);
};


export const deleteTripRequest = async (id: string) => {
  await prisma.trip_requests.delete({ where: { id } });
  return { success: true };
};