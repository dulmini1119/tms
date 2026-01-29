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
  return {
    id: assignment.id,
    requestNumber: assignment.trip_requests?.request_number,
    tripRequestId: assignment.trip_request_id,
    assignmentStatus: assignment.assignment_status,
    assignmentNotes: assignment.assignment_notes,
    
    scheduledDeparture: assignment.actual_departure_time || assignment.trip_requests?.departure_date,
    scheduledReturn: assignment.actual_arrival_time,
    createdAt: assignment.created_at,
    updatedAt: assignment.updated_at,

    assignedVehicle: {
      id: assignment.vehicles?.id,
      registrationNo: assignment.vehicles?.registration_number,
      make: assignment.vehicles?.make,
      model: assignment.vehicles?.model,
      type: assignment.vehicles?.vehicle_type,
      fuelType: assignment.vehicles?.fuel_type,
      mileage: Number(assignment.vehicles?.total_kilometers) || 0,
      seatingCapacity: assignment.vehicles?.seating_capacity,
      operational_status: assignment.vehicles?.operational_status,
      availability_status: assignment.vehicles?.availability_status,
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

    preTrip: null,
    driverAcceptance: null,
  };
};

// Helper: Sync trip_assignment → trip_logs automatically
const syncAssignmentToTripLog = async (assignment: any) => {
  // Skip if no assignment id
  if (!assignment?.id) return;

  // FIX 1: Determine the correct Trip Date
  // Use the Request's departure date, fallback to assignment creation time, or today.
  const scheduledDate = assignment.trip_requests?.departure_date
    ? new Date(assignment.trip_requests.departure_date)
    : (assignment.assigned_at ? new Date(assignment.assigned_at) : new Date());

  // FIX 2: Map Assignment Status to Log Status
  // "Assigned" usually maps to "Not Started" in logs for clarity
  let logStatus = assignment.assignment_status || "Not Started";
  if (logStatus === "Assigned") logStatus = "Not Started";

  const logData = {
    trip_assignment_id: assignment.id,
    trip_request_id: assignment.trip_request_id,
    
    // Use Request Number if available, else generate one
    trip_number: assignment.trip_requests?.request_number || `TRIP-${assignment.id.slice(0, 8)}`,
    
    // Corrected Date Logic
    trip_date: scheduledDate,
    
    // Mapped Status
    trip_status: logStatus,
    
    // Driver Name (Your logic here is correct)
    driver_name: assignment.drivers?.users_drivers_user_idTousers
      ? `${assignment.drivers.users_drivers_user_idTousers.first_name || ''} ${assignment.drivers.users_drivers_user_idTousers.last_name || ''}`.trim() || null
      : null,
    
    vehicle_registration: assignment.vehicles?.registration_number || null,
    
    from_location: assignment.trip_requests?.from_location_address || null,
    to_location: assignment.trip_requests?.to_location_address || null,
    
    // Metrics
    actual_distance: assignment.actual_distance ? Number(assignment.actual_distance) : null,
    actual_departure: assignment.actual_departure_time || null,
    actual_arrival: assignment.actual_arrival_time || null,
    total_duration: assignment.actual_duration || null,
    total_cost: null, 
  };

  try {
    await prisma.trip_logs.upsert({
      where: { trip_assignment_id: assignment.id },
      create: logData,
      update: logData,
    });
    console.log(`Synced trip_log for assignment ${assignment.id}`);
  } catch (err) {
    console.error("Sync to trip_log failed:", err);
  }
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
          { users_drivers_user_idTousers: { first_name: { contains: searchTerm, mode: "insensitive" } } },
          { users_drivers_user_idTousers: { last_name: { contains: searchTerm, mode: "insensitive" } } }
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
        drivers: {
          include: { users_drivers_user_idTousers: { select: { first_name: true, last_name: true } } }
        },
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
      drivers: {
        include: { users_drivers_user_idTousers: { select: { first_name: true, last_name: true } } }
      },
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
      assignment_status: data.assignmentStatus || "Assigned",
      assigned_at: new Date(),
      assigned_by: data.assignedBy, // from controller
    },
    include: {
      trip_requests: true,
      vehicles: true,
      drivers: {
        include: { users_drivers_user_idTousers: {
          select: { first_name: true, last_name: true}
        } },
      },
    },
  });

  // Auto-create trip_log
  await syncAssignmentToTripLog(newAssignment);

  return mapAssignmentToFrontend(newAssignment);
};

export const updateAssignment = async (id: string, data: any) => {
  const { vehicleId, driverId, assignmentStatus, assignmentNotes, vehicleDetails, driverDetails } = data;

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
    include: {
      trip_requests: true,
      vehicles: true,
      drivers: {
        include: { users_drivers_user_idTousers: true },
      },
    },
  });

  // Auto-update trip_log
  await syncAssignmentToTripLog(updatedAssignment);

  // Optional: Update vehicle/driver extra fields if provided
  if (vehicleDetails && updatedAssignment.vehicle_id) {
    await prisma.vehicles.update({
      where: { id: updatedAssignment.vehicle_id },
      data: {
        total_kilometers: vehicleDetails.mileage ? parseFloat(vehicleDetails.mileage) : undefined,
        seating_capacity: vehicleDetails.seatingCapacity,
      },
    });
  }

  if (driverDetails && updatedAssignment.driver_id) {
    await prisma.drivers.update({
      where: { id: updatedAssignment.driver_id },
      data: {
        license_expiry_date: driverDetails.licenseExpiryDate ? new Date(driverDetails.licenseExpiryDate) : undefined,
      },
    });
  }

  return await getAssignmentById(id);
};