import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- HELPER: Transform DB Flat -> Frontend Nested ---
const mapDbToFrontend = (dbRecord: any) => {
  const user = dbRecord.users_trip_requests_requested_by_user_idTousers;
  const departmentRelation = user?.departments_users_department_idTodepartments;

  return {
    id: dbRecord.id,
    requestNumber: dbRecord.request_number,
    status: dbRecord.status,
    priority: dbRecord.priority,
    estimatedCost: Number(dbRecord.estimated_cost),
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
    approvalRequired: dbRecord.approval_required,

    requestedBy: {
      id: dbRecord.requested_by_user_id,
      name: user ? `${user.first_name} ${user.last_name}` : "Unknown", 
      email: user?.email || "",
      department: departmentRelation?.name || "Unassigned", 
      employeeId: user?.employee_id || "",
    },

    tripDetails: {
      fromLocation: {
        address: dbRecord.from_location_address,
        coordinates: dbRecord.from_location_latitude ? {
          lat: Number(dbRecord.from_location_latitude),
          lng: Number(dbRecord.from_location_longitude)
        } : undefined,
      },
      toLocation: {
        address: dbRecord.to_location_address,
        coordinates: dbRecord.to_location_latitude ? {
          lat: Number(dbRecord.to_location_latitude),
          lng: Number(dbRecord.to_location_longitude)
        } : undefined,
      },
      departureDate: dbRecord.departure_date.toISOString().split('T')[0],
      departureTime: dbRecord.departure_time.toTimeString().substring(0, 5),
      returnDate: dbRecord.return_date ? dbRecord.return_date.toISOString().split('T')[0] : null,
      returnTime: dbRecord.return_time ? dbRecord.return_time.toTimeString().substring(0, 5) : null,
      isRoundTrip: dbRecord.is_round_trip,
      estimatedDistance: dbRecord.estimated_distance ? Number(dbRecord.estimated_distance) : 0,
      estimatedDuration: dbRecord.estimated_duration || 0,
    },

    purpose: {
      category: dbRecord.purpose_category,
      description: dbRecord.purpose_description,
      projectCode: dbRecord.project_code,
      costCenter: dbRecord.cost_center,
      businessJustification: dbRecord.business_justification,
    },

    requirements: {
      vehicleType: dbRecord.vehicle_type_required,
      passengerCount: dbRecord.passenger_count || 1,
      luggage: dbRecord.luggage_type,
      acRequired: dbRecord.ac_required,
      specialRequirements: dbRecord.special_instructions,
    },

    passengers: [], 
    approvalWorkflow: [],
    attachments: [],
  };
};

// --- HELPER: Transform Frontend Nested -> DB Flat ---
// This matches the structure sent by Frontend's 'mapFormToPayload'
const mapInputToDb = (input: any) => {
  return {
    request_number: input.requestNumber, 
    requested_by_user_id: input.requestedBy.id,
    
    // Locations
    // Frontend uses input.tripDetails.fromLocation.coordinates.lat
    from_location_address: input.tripDetails.fromLocation.address,
    from_location_latitude: input.tripDetails.fromLocation.coordinates?.lat || null,
    from_location_longitude: input.tripDetails.fromLocation.coordinates?.lng || null,
    
    to_location_address: input.tripDetails.toLocation.address,
    to_location_latitude: input.tripDetails.toLocation.coordinates?.lat || null,
    to_location_longitude: input.tripDetails.toLocation.coordinates?.lng || null,
    
    // Dates & Times
    departure_date: new Date(input.tripDetails.departureDate),
    departure_time: new Date(`1970-01-01T${input.tripDetails.departureTime}:00Z`),
    
    return_date: input.tripDetails.returnDate ? new Date(input.tripDetails.returnDate) : null,
    return_time: input.tripDetails.returnTime ? new Date(`1970-01-01T${input.tripDetails.returnTime}:00Z`) : null,
    
    is_round_trip: input.tripDetails.isRoundTrip,
    estimated_distance: input.tripDetails.estimatedDistance || 0,
    estimated_duration: input.tripDetails.estimatedDuration || 0,

    // Purpose
    purpose_category: input.purpose.category,
    purpose_description: input.purpose.description,
    project_code: input.purpose.projectCode,
    cost_center: input.purpose.costCenter,
    business_justification: input.purpose.businessJustification,

    // Requirements
    vehicle_type_required: input.requirements.vehicleType,
    passenger_count: input.requirements.passengerCount,
    luggage_type: input.requirements.luggage,
    ac_required: input.requirements.acRequired,
    special_instructions: input.requirements.specialRequirements,

    // Meta
    priority: input.priority,
    status: input.status,
    estimated_cost: input.estimatedCost,
    approval_required: input.approvalRequired,
  };
};

export const getAllTripRequests = async (filters: any) => {
  const { searchTerm, status, department, priority, page, pageSize } = filters;
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
        } 
      }
    ];
  }

  if (status && status !== "all-status") where.status = status;
  if (priority && priority !== "all-priorities") where.priority = priority;
  
  if (department && department !== "all-departments") {
    where.users_trip_requests_requested_by_user_idTousers = {
      departments_users_department_idTodepartments: {
        name: department
      }
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
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            employee_id: true,
            departments_users_department_idTodepartments: {
              select: { name: true }
            }
          }
        }
      }
    }),
    prisma.trip_requests.count({ where })
  ]);

  return {
    data: requests.map(mapDbToFrontend),
    meta: {
      total: totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(totalCount / parseInt(pageSize))
    }
  };
};

export const getTripRequestById = async (id: string) => {
  const request = await prisma.trip_requests.findUnique({
    where: { id },
    include: {
      users_trip_requests_requested_by_user_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          employee_id: true,
          departments_users_department_idTodepartments: {
            select: { name: true }
          }
        }
      },
      trip_passengers: true,
      trip_approvals: true
    }
  });

  if (!request) throw new Error("Trip Request not found");
  return mapDbToFrontend(request);
};

export const createTripRequest = async (input: any) => {
  if (!input.requestNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    input.requestNumber = `REQ-${timestamp}-${random}`;
  }

  const data = mapInputToDb(input);
  
  const newRequest = await prisma.trip_requests.create({
    data,
    include: {
      users_trip_requests_requested_by_user_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          employee_id: true,
          departments_users_department_idTodepartments: {
            select: { name: true }
          }
        }
      }
    }
  });

  return mapDbToFrontend(newRequest);
};

export const updateTripRequest = async (id: string, input: any) => {
  const data = mapInputToDb(input);

  const updatedRequest = await prisma.trip_requests.update({
    where: { id },
    data,
    include: {
      users_trip_requests_requested_by_user_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          employee_id: true,
          departments_users_department_idTodepartments: {
            select: { name: true }
          }
        }
      }
    }
  });

  return mapDbToFrontend(updatedRequest);
};

export const deleteTripRequest = async (id: string) => {
  await prisma.trip_requests.delete({
    where: { id }
  });
  return { success: true };
};