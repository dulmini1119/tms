import prisma from "../../config/database.js";

// Helper to calculate minutes difference between two dates
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
    // Mapping frontend strings (e.g. "not-started") to DB values if necessary
    // Assuming DB stores "Not Started", "Completed", etc.
    where.trip_status = status;
  }

  // 2. Date Range Filter
  if (startDate || endDate) {
    where.trip_date = {};
    if (startDate) where.trip_date.gte = new Date(startDate);
    if (endDate) where.trip_date.lte = new Date(endDate);
  }

  // 3. Search Term (Search across multiple fields)
  if (searchTerm) {
    where.OR = [
      { trip_number: { contains: searchTerm, mode: "insensitive" } },
      { passenger_name: { contains: searchTerm, mode: "insensitive" } },
      { driver_name: { contains: searchTerm, mode: "insensitive" } },
      { vehicle_registration: { contains: searchTerm, mode: "insensitive" } },
      { from_location: { contains: searchTerm, mode: "insensitive" } },
      { to_location: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.trip_logs.findMany({
      where,
      skip,
      take,
      orderBy: { trip_date: "desc" },
      include: {
        // Including relations helps the frontend display richer data
        trip_assignments: true, 
        trip_requests: true,
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
      trip_requests: true,
      trip_assignments: true,
    },
  });
};

export const createTripLog = async (data: any) => {
  return await prisma.trip_logs.create({
    data: {
      trip_request_id: data.tripRequestId,
      trip_assignment_id: data.tripAssignmentId,
      trip_number: data.tripNumber,
      trip_date: data.tripDate || new Date(),
      trip_status: data.tripStatus || "Not Started",
      from_location: data.fromLocation,
      to_location: data.toLocation,
      passenger_name: data.passengerName,
      passenger_department: data.passengerDepartment,
      driver_name: data.driverName,
      vehicle_registration: data.vehicleRegistration,
      planned_distance: data.plannedDistance,
      actual_distance: data.actualDistance,
      planned_departure: data.plannedDeparture,
      planned_arrival: data.plannedArrival,
      // You might calculate total_duration on update or here if times are known upfront
    },
  });
};

export const updateTripLog = async (id: string, data: any) => {
  // Business Logic: Auto-calculate duration if actual times are provided
  if (data.actual_departure && data.actual_arrival) {
    data.total_duration = calculateDuration(data.actual_departure, data.actual_arrival);
    
    // Auto-set status if times are present and status wasn't explicitly set
    if (!data.trip_status) {
        data.trip_status = "Completed";
    }
  }

  return await prisma.trip_logs.update({
    where: { id },
    data: {
      actual_distance: data.actualDistance,
      actual_departure: data.actualDeparture,
      actual_arrival: data.actualArrival,
      trip_status: data.tripStatus,
      total_duration: data.total_duration,
      total_cost: data.totalCost,
      fuel_cost: data.fuelCost,
      toll_charges: data.tollCharges,
      on_time: data.onTime,
      overall_rating: data.overallRating,
      comments: data.comments,
    },
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
    pageSize: 100000, // Large number to get all for export
  });

  // Manual CSV construction (or use a library like json2csv)
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
    "Cost"
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
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row: any[]) => row.map((item) => `"${item || ''}"`).join(",")),
  ].join("\n");

  return csvContent;
};