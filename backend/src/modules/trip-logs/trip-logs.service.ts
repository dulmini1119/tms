import prisma from "../../config/database.js";

// Helper: Calculate minutes difference between two dates
const calculateDuration = (start: Date | string, end: Date | string): number | null => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / 60000); // Convert ms to minutes
};

interface GetAllParams {
  searchTerm?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  user?: any;
}

export const getAllTripLogs = async ({
  searchTerm,
  status,
  page,
  pageSize,
  startDate,
  endDate,
}: GetAllParams) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where: any = {};

  // 1. Status Filter
  if (status && status !== "all") {
    where.trip_status = status;
  }

  // 2. Date Range Filter (Filter by trip_date column)
  if (startDate || endDate) {
    where.trip_date = {};
    if (startDate) where.trip_date.gte = new Date(startDate);
    if (endDate) where.trip_date.lte = new Date(endDate);
  }

  // 3. Search Term (Search across relevant fields from schema)
  if (searchTerm) {
    where.OR = [
      { trip_number: { contains: searchTerm, mode: "insensitive" } },
      { passenger_name: { contains: searchTerm, mode: "insensitive" } },
      { driver_name: { contains: searchTerm, mode: "insensitive" } },
      { vehicle_registration: { contains: searchTerm, mode: "insensitive" } },
      { from_location: { contains: searchTerm, mode: "insensitive" } },
      { to_location: { contains: searchTerm, mode: "insensitive" } },
      { trip_assignments: { 
            vehicles: { 
              registration_number: { contains: searchTerm, mode: "insensitive" } 
            } 
         } },
      { trip_assignments: { 
            drivers: { 
              first_name: { contains: searchTerm, mode: "insensitive" } 
            } 
         } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.trip_logs.findMany({
      where,
      skip,
      take,
      orderBy: { trip_date: "desc" },
      include: {
        trip_assignments: {
          include: {
            vehicles: true,
            drivers: true
          }
        }, 
        trip_requests: {
           include: {
             users_trip_requests_requested_by_user_idTousers: {
               select: { first_name: true, last_name: true, email: true }
             }
           }
        },
      },
    }),
    prisma.trip_logs.count({ where }),
  ]);

  return {
    data: logs,
    meta: {
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    },
  };
};

export const getTripLogById = async (id: string) => {
  return await prisma.trip_logs.findUnique({
    where: { id },
    include: {
      trip_assignments: {
        include: {
           vehicles: true,
           drivers: true
        }
      },
      trip_requests: true,
    },
  });
};

export const createTripLog = async (data: any) => {
  return await prisma.trip_logs.create({
    data: {
      trip_request_id: data.tripRequestId,
      trip_assignment_id: data.tripAssignmentId,
      trip_number: data.tripNumber,
      trip_date: data.tripDate, // Date object from validation
      trip_status: data.tripStatus || "Not Started",
      
      // Locations
      from_location: data.fromLocation,
      to_location: data.toLocation,

      // Details
      passenger_name: data.passengerName,
      passenger_department: data.passengerDepartment,
      driver_name: data.driverName,
      vehicle_registration: data.vehicleRegistration,

      // Metrics
      planned_distance: data.plannedDistance,
      actual_distance: data.actualDistance,
      
      // Times
      planned_departure: data.plannedDeparture,
      planned_arrival: data.plannedArrival,
      
      // Costs (Optional at creation, but mapped)
      total_cost: data.totalCost,
      fuel_cost: data.fuelCost,
    },
  });
};

export const updateTripLog = async (id: string, data: any) => {
  const updatePayload: any = {};

  // 1. Handle Status
  if (data.tripStatus) updatePayload.trip_status = data.tripStatus;

  // 2. Handle Metrics
  if (data.actualDistance !== undefined) updatePayload.actual_distance = data.actualDistance;
  
  // 3. Handle Times & Duration Calculation
  if (data.actualDeparture) updatePayload.actual_departure = new Date(data.actualDeparture);
  if (data.actualArrival) updatePayload.actual_arrival = new Date(data.actualArrival);
  
  if (data.actualDeparture && data.actualArrival) {
    updatePayload.total_duration = calculateDuration(data.actualDeparture, data.actualArrival);
  }

  // 4. Handle Financials (Matches Schema Columns)
  if (data.totalCost !== undefined) updatePayload.total_cost = data.totalCost;
  if (data.fuelCost !== undefined) updatePayload.fuel_cost = data.fuelCost;
  if (data.tollCharges !== undefined) updatePayload.toll_charges = data.tollCharges;
  if (data.parkingCharges !== undefined) updatePayload.parking_charges = data.parkingCharges;
  if (data.otherCharges !== undefined) updatePayload.other_charges = data.otherCharges;
  if (data.currency) updatePayload.currency = data.currency;

  // 5. Handle Ratings (Matches Schema Columns)
  if (data.overallRating !== undefined) updatePayload.overall_rating = data.overallRating;
  if (data.punctualityRating !== undefined) updatePayload.punctuality_rating = data.punctualityRating;
  if (data.driverBehaviorRating !== undefined) updatePayload.driver_behavior_rating = data.driverBehaviorRating;
  if (data.vehicleConditionRating !== undefined) updatePayload.vehicle_condition_rating = data.vehicleConditionRating;

  // 6. Other fields
  if (data.onTime !== undefined) updatePayload.on_time = data.onTime;
  if (data.comments !== undefined) updatePayload.comments = data.comments;

  return await prisma.trip_logs.update({
    where: { id },
    data: updatePayload,
  });
};

export const deleteTripLog = async (id: string) => {
  return await prisma.trip_logs.delete({
    where: { id },
  });
};

export const generateTripLogCsv = async (filters: any) => {
  // Fetch all data matching filters (no pagination)
  const { data } = await getAllTripLogs({
    ...filters,
    page: 1,
    pageSize: 100000, 
  });

  // Map to columns available in DB/Service
  const headers = [
    "Trip Number",
    "Date",
    "Status",
    "Passenger",
    "Driver",
    "Vehicle",
    "From",
    "To",
    "Actual Distance",
    "Total Cost",
    "On Time"
  ];

  const rows = data.map((log: any) => [
    log.trip_number,
    log.trip_date,
    log.trip_status,
    log.passenger_name,
    log.driver_name,
    log.vehicle_registration,
    log.from_location,
    log.to_location,
    log.actual_distance,
    log.total_cost,
    log.on_time ? "Yes" : "No",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row: any[]) => row.map((item) => `"${item || ''}"`).join(",")),
  ].join("\n");

  return csvContent;
};