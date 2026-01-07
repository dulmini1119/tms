import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: Get Full Name
const getFullName = (user: any) => {
  if (!user) return "Unknown";
  const first = user.first_name || "";
  const last = user.last_name || "";
  return `${first} ${last}`.trim() || user.employee_id || "Unknown";
};

// Helper: Map DB to Frontend Structure
const mapAssignmentToFrontend = (assignment: any) => {
  // NOTE: Frontend expects 'preTrip', 'insuranceExpiry', etc.
  // Since these columns don't exist in the provided schema, we map to available data or null.

  return {
    id: assignment.id,
    requestNumber: assignment.trip_requests?.request_number,
    tripRequestId: assignment.trip_request_id,
    assignmentStatus: assignment.assignment_status,
    assignmentNotes: assignment.assignment_notes,
    
    // Mapping actual columns from schema
    scheduledDeparture: assignment.actual_departure_time || assignment.trip_requests?.departure_date,
    scheduledReturn: assignment.actual_arrival_time,
    createdAt: assignment.created_at,
    updatedAt: assignment.updated_at,

    // Relations
    assignedVehicle: {
      id: assignment.vehicles?.id,
      registrationNo: assignment.vehicles?.registration_number,
      make: assignment.vehicles?.make,
      model: assignment.vehicles?.model,
      type: assignment.vehicles?.vehicle_type, // Mapped from 'vehicle_type'
      fuelType: assignment.vehicles?.fuel_type,
      
      // FIX: Use 'total_kilometers' from schema instead of 'mileage'
      mileage: Number(assignment.vehicles?.total_kilometers) || 0,
      
      seatingCapacity: assignment.vehicles?.seating_capacity,
      operational_status: assignment.vehicles?.operational_status, // Renamed to be precise
      availability_status: assignment.vehicles?.availability_status,
      
      // FIX: Return null for missing columns to prevent frontend crashes
      insuranceExpiry: null, 
      lastService: null, 
      nextService: null,
      
      status: assignment.vehicles?.operational_status || "Active",
      currentDriver: assignment.drivers ? getFullName(assignment.drivers) : "Unassigned",
    },
    
    assignedDriver: {
      id: assignment.drivers?.id,
      name: getFullName(assignment.drivers),
      phoneNumber: assignment.drivers?.phone,
      licenseNumber: assignment.drivers?.license_number,
      licenseExpiryDate: assignment.drivers?.license_expiry_date?.toISOString().split('T')[0],
      isAvailable: assignment.drivers?.is_available,
    },

    requestedBy: {
      name: getFullName(assignment.trip_requests?.users_trip_requests_requested_by_user_idTousers),
    },

    // Mock Data to match Frontend Interface (PreTrip, etc.)
    preTrip: null, 
    
    driverAcceptance: null, 
  };
};

export const getAllAssignments = async (filters: any) => {
  const { searchTerm, status, page, pageSize } = filters;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: any = {};

  if (status && status !== "all") {
    where.assignment_status = status;
  }

  if (searchTerm) {
    where.OR = [
      { trip_requests: { request_number: { contains: searchTerm, mode: "insensitive" } } },
      { vehicles: { registration_number: { contains: searchTerm, mode: "insensitive" } } },
      { drivers: { 
        OR: [
          { first_name: { contains: searchTerm, mode: "insensitive" } },
          { last_name: { contains: searchTerm, mode: "insensitive" } }
        ]
      }}
    ];
  }

  const [assignments, totalCount] = await Promise.all([
    prisma.trip_assignments.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        trip_requests: {
          include: {
            users_trip_requests_requested_by_user_idTousers: { select: { first_name: true, last_name: true } }
          }
        },
        vehicles: true,
        drivers: true,
        // FIX: Removed 'pre_trip_checklist' include
      },
    }),
    prisma.trip_assignments.count({ where }),
  ]);

  return {
    data: assignments.map(mapAssignmentToFrontend),
    meta: { total: totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
  };
};

export const getAssignmentById = async (id: string) => {
  const assignment = await prisma.trip_assignments.findUnique({
    where: { id },
    include: {
      trip_requests: {
        include: {
          users_trip_requests_requested_by_user_idTousers: { select: { first_name: true, last_name: true } }
        }
      },
      vehicles: true,
      drivers: true,
    },
  });

  if (!assignment) throw new Error("Assignment not found");
  return mapAssignmentToFrontend(assignment);
};

export const createAssignment = async (data: any) => {
  const newAssignment = await prisma.trip_assignments.create({
    data: {
      trip_request_id: data.tripRequestId,
      vehicle_id: data.vehicleId,
      driver_id: data.driverId,
      assignment_status: data.assignmentStatus,
      assigned_at: new Date(),
      // FIX: Removed 'scheduled_departure' as it doesn't exist in schema
    },
    include: {
      trip_requests: true,
      vehicles: true,
      drivers: true,
    },
  });

  return mapAssignmentToFrontend(newAssignment);
};

export const updateAssignment = async (id: string, data: any) => {
  const { vehicleId, driverId, assignmentStatus, scheduledDeparture, scheduledReturn, assignmentNotes, vehicleDetails, driverDetails } = data;

  // 1. Update Assignment
  const assignmentUpdate: any = {
    assignment_status: assignmentStatus,
    assignment_notes: assignmentNotes,
    updated_at: new Date(),
  };

  if (vehicleId) assignmentUpdate.vehicle_id = vehicleId;
  if (driverId) assignmentUpdate.driver_id = driverId;

  const updatedAssignment = await prisma.trip_assignments.update({
    where: { id },
    data: assignmentUpdate,
    include: { trip_requests: true, vehicles: true, drivers: true },
  });

  // 2. Update Vehicle Details if provided (Side effect)
  if (vehicleDetails && updatedAssignment.vehicle_id) {
    await prisma.vehicles.update({
      where: { id: updatedAssignment.vehicle_id },
      data: {
        // FIX: Map to 'total_kilometers' instead of 'mileage'
        total_kilometers: vehicleDetails.mileage ? parseFloat(vehicleDetails.mileage) : undefined,
        
        // FIX: Seating capacity exists, keep it
        seating_capacity: vehicleDetails.seatingCapacity,
        
        // FIX: Removed updates for non-existent columns:
        // insurance_expiry, last_service_date, next_service_date are NOT in the schema provided.
        // The frontend expects them, so we just ignore saving them to DB to avoid errors.
      },
    });
  }

  // 3. Update Driver Details if provided (Side effect)
  if (driverDetails && updatedAssignment.driver_id) {
    await prisma.drivers.update({
      where: { id: updatedAssignment.driver_id },
      data: {
        license_expiry_date: driverDetails.licenseExpiryDate ? new Date(driverDetails.licenseExpiryDate) : undefined,
      },
    });
  }

  // Return full updated object
  return await getAssignmentById(id);
};