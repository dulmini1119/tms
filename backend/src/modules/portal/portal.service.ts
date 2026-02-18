import prisma from "../../config/database.js";

const isDriverPosition = (position?: string | null) =>
  (position || "").toUpperCase().includes("DRIVER");
const isHodPosition = (position?: string | null) =>
  (position || "").toUpperCase().includes("HOD");

const formatTime = (date?: Date | null) =>
  date ? date.toISOString().slice(11, 16) : "";

const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const haversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const calculateAssignmentDistanceKm = async (
  assignmentId: string,
): Promise<number | null> => {
  const gps = await prisma.gps_logs.findMany({
    where: { trip_assignment_id: assignmentId },
    orderBy: { device_timestamp: "asc" },
    select: {
      latitude: true,
      longitude: true,
      mileage: true,
    },
  });

  if (gps.length < 2) return null;

  const firstMileage = toNumber(gps[0].mileage);
  const lastMileage = toNumber(gps[gps.length - 1].mileage);
  if (lastMileage >= firstMileage && (lastMileage > 0 || firstMileage > 0)) {
    return round2(lastMileage - firstMileage);
  }

  let total = 0;
  for (let i = 1; i < gps.length; i++) {
    total += haversineDistanceKm(
      toNumber(gps[i - 1].latitude),
      toNumber(gps[i - 1].longitude),
      toNumber(gps[i].latitude),
      toNumber(gps[i].longitude),
    );
  }
  return round2(total);
};

const mapDriverAssignment = (assignment: any) => {
  const statusRaw = (assignment.assignment_status || "Assigned").toString();
  const status = /completed/i.test(statusRaw)
    ? "completed"
    : /progress|started|active|transit|arrived/i.test(statusRaw)
      ? "active"
      : "scheduled";

  const tripDate = assignment.trip_requests?.departure_date
    ? new Date(assignment.trip_requests.departure_date)
    : new Date();

  return {
    id: assignment.id,
    requestNumber: assignment.trip_requests?.request_number || "N/A",
    employee:
      [
        assignment.trip_requests?.users_trip_requests_requested_by_user_idTousers
          ?.first_name,
        assignment.trip_requests?.users_trip_requests_requested_by_user_idTousers
          ?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown",
    employeePhone:
      assignment.trip_requests?.users_trip_requests_requested_by_user_idTousers
        ?.phone || "",
    department:
      assignment.trip_requests?.users_trip_requests_requested_by_user_idTousers
        ?.departments_users_department_idTodepartments?.name || "N/A",
    destination: assignment.trip_requests?.to_location_address || "N/A",
    fromLocation: assignment.trip_requests?.from_location_address || "N/A",
    date: tripDate.toISOString().split("T")[0],
    scheduledTime: formatTime(assignment.trip_requests?.departure_time),
    returnTime: formatTime(assignment.trip_requests?.return_time),
    estimatedDuration: assignment.trip_requests?.estimated_duration
      ? `${assignment.trip_requests.estimated_duration} mins`
      : "N/A",
    purpose: assignment.trip_requests?.purpose_category || "General",
    status,
    distance:
      assignment.actual_distance != null
        ? `${Number(assignment.actual_distance)} km`
        : assignment.trip_requests?.estimated_distance
          ? `${Number(assignment.trip_requests.estimated_distance)} km`
          : "N/A",
    actualStartTime: assignment.actual_departure_time
      ? new Date(assignment.actual_departure_time).toISOString()
      : null,
    actualEndTime: assignment.actual_arrival_time
      ? new Date(assignment.actual_arrival_time).toISOString()
      : null,
    startOdometer: null,
    endOdometer: null,
    startLocation: assignment.trip_requests?.from_location_address || null,
    endLocation: assignment.trip_requests?.to_location_address || null,
    vehicle: assignment.vehicles
      ? `${assignment.vehicles.make} ${assignment.vehicles.model}`
      : "N/A",
    registration: assignment.vehicles?.registration_number || "N/A",
  };
};

const getMonthRange = (month?: string) => {
  if (!month) return null;
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return null;
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 1);
  return { start, end };
};

const isManagerPosition = (position?: string | null) =>
  (position || "").toUpperCase().includes("MANAGER");

const mapApprovalQueueItem = (approval: any) => {
  const trip = approval.trip_requests;
  const requester = trip?.users_trip_requests_requested_by_user_idTousers;
  const department =
    requester?.departments_users_department_idTodepartments?.name || "N/A";

  return {
    approvalId: approval.id,
    tripRequestId: trip?.id,
    requestNumber: trip?.request_number || "N/A",
    approvalLevel: approval.approval_level,
    approverRole: approval.approver_role || "Approver",
    employee:
      [requester?.first_name, requester?.last_name].filter(Boolean).join(" ").trim() ||
      "Unknown",
    employeeId: requester?.employee_id || "",
    department,
    destination: trip?.to_location_address || "N/A",
    fromLocation: trip?.from_location_address || "N/A",
    date: trip?.departure_date
      ? new Date(trip.departure_date).toISOString().split("T")[0]
      : "",
    time: formatTime(trip?.departure_time),
    returnTime: formatTime(trip?.return_time),
    purpose: trip?.purpose_category || "General",
    priority: (trip?.priority || "Medium").toLowerCase(),
    estimatedCost: Number(trip?.estimated_cost || 0),
    currency: trip?.currency || "LKR",
    submittedAt: trip?.created_at || null,
  };
};

export class PortalService {
  static async getDriverContext(userId: string) {
    const [user, driver] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        include: {
          departments_users_department_idTodepartments: { select: { name: true } },
          business_units_users_business_unit_idTobusiness_units: {
            select: { name: true },
          },
        },
      }),
      prisma.drivers.findUnique({
        where: { user_id: userId },
        include: {
          users_drivers_user_idTousers: true,
          vehicles_drivers_current_vehicle_idTovehicles: true,
        },
      }),
    ]);

    if (!user) throw new Error("User not found");
    if (!driver && !isDriverPosition(user.position)) {
      throw new Error("User is not a driver");
    }

    return { user, driver };
  }

  static async getDriverDashboard(userId: string) {
    const { user, driver } = await this.getDriverContext(userId);
    const driverId = driver?.id;

    const assignments = driverId
      ? await prisma.trip_assignments.findMany({
          where: { driver_id: driverId },
          include: {
            trip_requests: {
              include: {
                users_trip_requests_requested_by_user_idTousers: {
                  include: {
                    departments_users_department_idTodepartments: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
            vehicles: true,
          },
          orderBy: { created_at: "desc" },
          take: 20,
        })
      : [];

    const mapped = assignments.map(mapDriverAssignment);
    const today = new Date().toISOString().split("T")[0];
    const todayAssignments = mapped.filter((a) => a.date === today);

    const stats = {
      todayTrips: todayAssignments.length,
      activeTrips: mapped.filter((a) => a.status === "active").length,
      completedTrips: mapped.filter((a) => a.status === "completed").length,
      totalDistance: mapped.reduce((sum, a) => {
        const num = Number((a.distance || "").replace(/[^\d.]/g, ""));
        return sum + (Number.isFinite(num) ? num : 0);
      }, 0),
    };

    return {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        role: user.position || "DRIVER",
        department:
          user.departments_users_department_idTodepartments?.name || "N/A",
        businessUnit:
          user.business_units_users_business_unit_idTobusiness_units?.name || "N/A",
      },
      stats,
      assignments: mapped,
      currentVehicle: driver?.vehicles_drivers_current_vehicle_idTovehicles
        ? {
            make: driver.vehicles_drivers_current_vehicle_idTovehicles.make,
            model: driver.vehicles_drivers_current_vehicle_idTovehicles.model,
            year: String(driver.vehicles_drivers_current_vehicle_idTovehicles.year),
            licensePlate:
              driver.vehicles_drivers_current_vehicle_idTovehicles
                .registration_number,
            fuelType:
              driver.vehicles_drivers_current_vehicle_idTovehicles.fuel_type ||
              "N/A",
            seatingCapacity:
              driver.vehicles_drivers_current_vehicle_idTovehicles
                .seating_capacity || 0,
            assignedDate: driver.assigned_to_vehicle_date
              ? new Date(driver.assigned_to_vehicle_date)
                  .toISOString()
                  .split("T")[0]
              : "",
          }
        : null,
    };
  }

  static async getDriverAssignments(userId: string, viewMode = "all") {
    const { driver } = await this.getDriverContext(userId);
    if (!driver) return [];

    const assignments = await prisma.trip_assignments.findMany({
      where: { driver_id: driver.id },
      include: {
        trip_requests: {
          include: {
            users_trip_requests_requested_by_user_idTousers: {
              include: {
                departments_users_department_idTodepartments: {
                  select: { name: true },
                },
              },
            },
          },
        },
        vehicles: true,
      },
      orderBy: { created_at: "desc" },
    });

    const mapped = assignments.map(mapDriverAssignment);
    if (viewMode === "active") {
      return mapped.filter((a) => a.status === "active");
    }
    return mapped.filter((a) => a.status !== "completed");
  }

  static async startDriverTrip(
    userId: string,
    assignmentId: string,
    payload: { location?: string; odometer?: number | null; remarks?: string },
  ) {
    const { driver } = await this.getDriverContext(userId);
    if (!driver) throw new Error("Driver profile not found");

    const assignment = await prisma.trip_assignments.findFirst({
      where: { id: assignmentId, driver_id: driver.id },
      include: { trip_requests: true, vehicles: true },
    });
    if (!assignment) throw new Error("Assignment not found");

    const now = new Date();
    await prisma.trip_assignments.update({
      where: { id: assignment.id },
      data: {
        assignment_status: "In_Progress",
        started_at: now,
        actual_departure_time: now,
        current_status: "In Progress",
        updated_at: now,
      },
    });

    await prisma.trip_logs.upsert({
      where: { trip_assignment_id: assignment.id },
      create: {
        trip_assignment_id: assignment.id,
        trip_request_id: assignment.trip_request_id,
        trip_number:
          assignment.trip_requests?.request_number || `TRIP-${assignment.id.slice(0, 8)}`,
        trip_date: assignment.trip_requests?.departure_date || now,
        trip_status: "Started",
        from_location: payload.location || assignment.trip_requests?.from_location_address,
        to_location: assignment.trip_requests?.to_location_address,
        vehicle_registration: assignment.vehicles?.registration_number,
        actual_departure: now,
        comments: payload.remarks || null,
      },
      update: {
        trip_status: "Started",
        actual_departure: now,
        from_location: payload.location || undefined,
        comments: payload.remarks || undefined,
      },
    });
  }

  static async endDriverTrip(
    userId: string,
    assignmentId: string,
    payload: { location?: string; odometer?: number | null; remarks?: string },
  ) {
    const { driver } = await this.getDriverContext(userId);
    if (!driver) throw new Error("Driver profile not found");

    const assignment = await prisma.trip_assignments.findFirst({
      where: { id: assignmentId, driver_id: driver.id },
      include: { trip_requests: true, vehicles: true },
    });
    if (!assignment) throw new Error("Assignment not found");

    const now = new Date();
    const actualDistance = await calculateAssignmentDistanceKm(assignment.id);
    const duration =
      assignment.actual_departure_time != null
        ? Math.max(
            0,
            Math.floor(
              (now.getTime() - new Date(assignment.actual_departure_time).getTime()) /
                60000,
            ),
          )
        : null;

    await prisma.trip_assignments.update({
      where: { id: assignment.id },
      data: {
        assignment_status: "Completed",
        completed_at: now,
        actual_arrival_time: now,
        actual_distance: actualDistance ?? undefined,
        actual_duration: duration ?? undefined,
        current_status: "Completed",
        updated_at: now,
      },
    });

    await prisma.trip_logs.upsert({
      where: { trip_assignment_id: assignment.id },
      create: {
        trip_assignment_id: assignment.id,
        trip_request_id: assignment.trip_request_id,
        trip_number:
          assignment.trip_requests?.request_number || `TRIP-${assignment.id.slice(0, 8)}`,
        trip_date: assignment.trip_requests?.departure_date || now,
        trip_status: "Completed",
        from_location: assignment.trip_requests?.from_location_address,
        to_location: payload.location || assignment.trip_requests?.to_location_address,
        vehicle_registration: assignment.vehicles?.registration_number,
        actual_departure: assignment.actual_departure_time || null,
        actual_arrival: now,
        actual_distance: actualDistance ?? null,
        total_duration: duration,
        comments: payload.remarks || null,
      },
      update: {
        trip_status: "Completed",
        actual_arrival: now,
        actual_distance: actualDistance ?? undefined,
        total_duration: duration ?? undefined,
        to_location: payload.location || undefined,
        comments: payload.remarks || undefined,
      },
    });
  }

  static async getDriverTripLogs(userId: string, month?: string) {
    const { driver } = await this.getDriverContext(userId);
    if (!driver) return [];

    const monthRange = getMonthRange(month);
    const where: any = {
      trip_assignments: { is: { driver_id: driver.id } },
    };

    if (monthRange) {
      where.trip_date = { gte: monthRange.start, lt: monthRange.end };
    }

    const logs = await prisma.trip_logs.findMany({
      where,
      include: {
        trip_assignments: {
          include: { vehicles: true },
        },
        trip_requests: true,
      },
      orderBy: { trip_date: "desc" },
    });

    return logs.map((log) => ({
      id: log.id,
      tripNumber: log.trip_number,
      date: log.trip_date ? new Date(log.trip_date).toISOString().split("T")[0] : "",
      status: log.trip_status || "Unknown",
      employee: log.passenger_name || "N/A",
      fromLocation: log.from_location || "N/A",
      destination: log.to_location || "N/A",
      startTime: log.actual_departure,
      endTime: log.actual_arrival,
      actualDistance: Number(log.actual_distance || 0),
      fuelConsumed: Number(log.fuel_cost || 0),
      remarks: log.comments || "",
      rating: Number(log.overall_rating || 0),
      vehicle:
        log.trip_assignments?.vehicles?.registration_number ||
        log.vehicle_registration ||
        "N/A",
      purpose: log.trip_requests?.purpose_category || "General",
    }));
  }

  static async getDriverProfile(userId: string) {
    const { user, driver } = await this.getDriverContext(userId);

    const [documents, logs, assignments] = await Promise.all([
      prisma.documents.findMany({
        where: {
          entity_type: "DRIVER",
          deleted_at: null,
          OR: [{ entity_id: driver?.id || user.id }, { entity_id: user.id }],
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.trip_logs.findMany({
        where: {
          trip_assignments: {
            is: {
              driver_id: driver?.id || "00000000-0000-0000-0000-000000000000",
            },
          },
        },
      }),
      prisma.trip_assignments.findMany({
        where: { driver_id: driver?.id || "00000000-0000-0000-0000-000000000000" },
      }),
    ]);

    const completedTrips = assignments.filter((a) =>
      /completed/i.test(a.assignment_status || ""),
    ).length;
    const ratingLogs = logs.filter((l) => l.overall_rating != null);
    const avgRating = ratingLogs.length
      ? ratingLogs.reduce((s, l) => s + Number(l.overall_rating || 0), 0) /
        ratingLogs.length
      : 0;
    const onTimeKnown = logs.filter((l) => l.on_time != null);
    const onTimePct = onTimeKnown.length
      ? Math.round(
          (onTimeKnown.filter((l) => l.on_time === true).length /
            onTimeKnown.length) *
            100,
        )
      : 0;

    return {
      personalInfo: {
        name: `${user.first_name} ${user.last_name}`.trim(),
        employeeId: user.employee_id,
        phone: user.phone || "",
        email: user.email,
        address: [user.address_street, user.address_city, user.address_state]
          .filter(Boolean)
          .join(", "),
        dateOfJoining: user.hire_date
          ? new Date(user.hire_date).toISOString().split("T")[0]
          : "",
        licenseNumber: driver?.license_number || "",
        licenseExpiry: driver?.license_expiry_date
          ? new Date(driver.license_expiry_date).toISOString().split("T")[0]
          : "",
      },
      currentVehicle: driver?.vehicles_drivers_current_vehicle_idTovehicles
        ? {
            make: driver.vehicles_drivers_current_vehicle_idTovehicles.make,
            model: driver.vehicles_drivers_current_vehicle_idTovehicles.model,
            year: String(driver.vehicles_drivers_current_vehicle_idTovehicles.year),
            licensePlate:
              driver.vehicles_drivers_current_vehicle_idTovehicles
                .registration_number,
            fuelType:
              driver.vehicles_drivers_current_vehicle_idTovehicles.fuel_type ||
              "N/A",
            seatingCapacity:
              driver.vehicles_drivers_current_vehicle_idTovehicles
                .seating_capacity || 0,
            assignedDate: driver.assigned_to_vehicle_date
              ? new Date(driver.assigned_to_vehicle_date)
                  .toISOString()
                  .split("T")[0]
              : "",
          }
        : null,
      documents: documents.map((doc) => ({
        id: doc.id,
        type: doc.document_type,
        number: doc.document_number || "",
        issueDate: doc.issue_date
          ? new Date(doc.issue_date).toISOString().split("T")[0]
          : "",
        expiryDate: doc.expiry_date
          ? new Date(doc.expiry_date).toISOString().split("T")[0]
          : "",
        status: doc.status || "Pending_Verification",
      })),
      performance: {
        totalTrips: completedTrips,
        averageRating: Number(avgRating.toFixed(1)),
        onTimePercentage: onTimePct,
        incidents: Number((driver?.violations_count || 0) + (driver?.accidents_count || 0)),
        compliments: logs.filter((l) => Number(l.overall_rating || 0) >= 4).length,
      },
    };
  }

  static async getTeamDashboard(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        departments_users_department_idTodepartments: { select: { name: true } },
        business_units_users_business_unit_idTobusiness_units: {
          select: { name: true },
        },
      },
    });
    if (!user) throw new Error("User not found");

    const whereUsers: any = { deleted_at: null };
    if (isHodPosition(user.position)) {
      whereUsers.department_id = user.department_id || undefined;
    } else {
      whereUsers.OR = [{ manager_id: user.id }, { department_id: user.department_id || undefined }];
    }

    const teamUsers = await prisma.users.findMany({
      where: whereUsers,
      select: { id: true, first_name: true, last_name: true },
    });

    const teamUserIds = teamUsers.map((u) => u.id);
    if (!teamUserIds.length) {
      return {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim(),
          role: user.position,
          department:
            user.departments_users_department_idTodepartments?.name || "N/A",
          businessUnit:
            user.business_units_users_business_unit_idTobusiness_units?.name || "N/A",
        },
        stats: {
          pendingApprovals: 0,
          totalTeamTrips: 0,
          approvedThisMonth: 0,
          teamMembers: 0,
        },
        pendingRequests: [],
        recentActivity: [],
        teamUtilization: [],
      };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingRequests, teamTrips, recentActivity] = await Promise.all([
      prisma.trip_requests.findMany({
        where: {
          requested_by_user_id: { in: teamUserIds },
          status: "Pending",
        },
        include: {
          users_trip_requests_requested_by_user_idTousers: {
            include: {
              departments_users_department_idTodepartments: { select: { name: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 6,
      }),
      prisma.trip_requests.findMany({
        where: {
          requested_by_user_id: { in: teamUserIds },
          departure_date: { gte: monthStart },
        },
      }),
      prisma.trip_approvals.findMany({
        where: { approver_user_id: user.id },
        include: {
          trip_requests: true,
          users: { select: { first_name: true, last_name: true } },
        },
        orderBy: { updated_at: "desc" },
        take: 6,
      }),
    ]);

    const requestsByUser = new Map<string, { count: number; lastTrip?: Date }>();
    for (const trip of teamTrips) {
      const rec = requestsByUser.get(trip.requested_by_user_id) || { count: 0 };
      rec.count += 1;
      if (!rec.lastTrip || (trip.departure_date && trip.departure_date > rec.lastTrip)) {
        rec.lastTrip = trip.departure_date;
      }
      requestsByUser.set(trip.requested_by_user_id, rec);
    }

    return {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        role: user.position || "MANAGER",
        department: user.departments_users_department_idTodepartments?.name || "N/A",
        businessUnit:
          user.business_units_users_business_unit_idTobusiness_units?.name || "N/A",
      },
      stats: {
        pendingApprovals: pendingRequests.length,
        totalTeamTrips: teamTrips.length,
        approvedThisMonth: teamTrips.filter((t) => t.status === "Approved").length,
        teamMembers: teamUsers.length,
      },
      pendingRequests: pendingRequests.map((r) => ({
        id: r.id,
        requestNumber: r.request_number,
        employee: `${
          r.users_trip_requests_requested_by_user_idTousers?.first_name || ""
        } ${
          r.users_trip_requests_requested_by_user_idTousers?.last_name || ""
        }`.trim(),
        department:
          r.users_trip_requests_requested_by_user_idTousers
            ?.departments_users_department_idTodepartments?.name || "N/A",
        destination: r.to_location_address,
        date: r.departure_date ? new Date(r.departure_date).toISOString().split("T")[0] : "",
        time: formatTime(r.departure_time),
        purpose: r.purpose_category || "General",
        priority: (r.priority || "Medium").toLowerCase(),
        submittedAt: r.created_at,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: `${a.status || "Pending"} trip request`,
        employee:
          [
            a.users?.first_name,
            a.users?.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim() || "Unknown",
        tripId: a.trip_requests?.request_number || "N/A",
        timestamp: a.updated_at || a.created_at,
      })),
      teamUtilization: teamUsers.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`.trim(),
        trips: requestsByUser.get(u.id)?.count || 0,
        lastTrip: requestsByUser.get(u.id)?.lastTrip || null,
      })),
    };
  }

  static async getTeamApprovalQueue(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        departments_users_department_idTodepartments: { select: { name: true } },
        business_units_users_business_unit_idTobusiness_units: {
          select: { name: true },
        },
      },
    });

    if (!user) throw new Error("User not found");
    const position = (user.position || "").toUpperCase();
    const isHod = isHodPosition(position);
    const isManager = isManagerPosition(position);
    if (!isHod && !isManager) throw new Error("User is not an approver");

    const pending = await prisma.trip_approvals.findMany({
      where: {
        approver_user_id: userId,
        status: "Pending",
      },
      include: {
        trip_requests: {
          include: {
            users_trip_requests_requested_by_user_idTousers: {
              include: {
                departments_users_department_idTodepartments: {
                  select: { name: true },
                },
              },
            },
            trip_approvals: {
              select: { id: true, approval_level: true, status: true },
              orderBy: { approval_level: "asc" },
            },
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const actionable = pending.filter((step) => {
      const allSteps = step.trip_requests?.trip_approvals || [];
      return allSteps
        .filter((s) => s.approval_level < step.approval_level)
        .every((s) => s.status === "Approved");
    });

    return {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        role: user.position || "APPROVER",
        department:
          user.departments_users_department_idTodepartments?.name || "N/A",
        businessUnit:
          user.business_units_users_business_unit_idTobusiness_units?.name || "N/A",
      },
      notifications: {
        unreadCount: actionable.length,
      },
      approvals: actionable.map(mapApprovalQueueItem),
    };
  }

  static async processTeamApproval(
    userId: string,
    approvalId: string,
    payload: { action: "Approved" | "Rejected"; comments?: string },
  ) {
    const step = await prisma.trip_approvals.findUnique({
      where: { id: approvalId },
      include: {
        trip_requests: {
          include: {
            trip_approvals: {
              orderBy: { approval_level: "asc" },
            },
          },
        },
      },
    });

    if (!step) throw new Error("Approval step not found");
    if (step.approver_user_id !== userId) throw new Error("Approval step is not assigned to this user");
    if (step.status !== "Pending") throw new Error("Approval already processed");

    const previousSteps =
      step.trip_requests.trip_approvals?.filter(
        (s) => s.approval_level < step.approval_level,
      ) || [];
    const canAct = previousSteps.every((s) => s.status === "Approved");
    if (!canAct) throw new Error("Previous approval level is still pending");

    const now = new Date();
    await prisma.trip_approvals.update({
      where: { id: step.id },
      data: {
        status: payload.action,
        comments: payload.comments || null,
        approved_at: now,
        updated_at: now,
      },
    });

    if (payload.action === "Rejected") {
      await prisma.trip_requests.update({
        where: { id: step.trip_request_id },
        data: { status: "Rejected", updated_at: now },
      });
      return { tripRequestId: step.trip_request_id, status: "Rejected" };
    }

    const remaining = await prisma.trip_approvals.findMany({
      where: { trip_request_id: step.trip_request_id, status: "Pending" },
      select: { id: true },
    });

    if (!remaining.length) {
      await prisma.trip_requests.update({
        where: { id: step.trip_request_id },
        data: { status: "Approved", updated_at: now },
      });
      return { tripRequestId: step.trip_request_id, status: "Approved" };
    }

    await prisma.trip_requests.update({
      where: { id: step.trip_request_id },
      data: { status: "Pending", updated_at: now },
    });
    return { tripRequestId: step.trip_request_id, status: "Pending" };
  }

  static async getVehicleAdminDashboard(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        departments_users_department_idTodepartments: { select: { name: true } },
        business_units_users_business_unit_idTobusiness_units: {
          select: { name: true },
        },
      },
    });
    if (!user) throw new Error("User not found");

    const [availableVehicles, assignedVehicles, activeTrips, approvedWaiting, pendingTrips, fleet] =
      await Promise.all([
        prisma.vehicles.count({
          where: {
            deleted_at: null,
            availability_status: { equals: "Available", mode: "insensitive" },
          },
        }),
        prisma.vehicles.count({
          where: {
            deleted_at: null,
            availability_status: { equals: "Assigned", mode: "insensitive" },
          },
        }),
        prisma.trip_assignments.count({
          where: {
            assignment_status: { in: ["Started", "In_Progress", "Accepted"] },
          },
        }),
        prisma.trip_requests.count({
          where: {
            status: "Approved",
            trip_assignments: { none: {} },
          },
        }),
        prisma.trip_requests.findMany({
          where: {
            status: "Approved",
            trip_assignments: { none: {} },
          },
          include: {
            users_trip_requests_requested_by_user_idTousers: {
              include: {
                departments_users_department_idTodepartments: { select: { name: true } },
              },
            },
            trip_approvals: {
              where: { status: "Approved" },
              include: {
                users: { select: { first_name: true, last_name: true } },
              },
              orderBy: { approved_at: "desc" },
              take: 1,
            },
          },
          orderBy: { created_at: "desc" },
          take: 6,
        }),
        prisma.vehicles.findMany({
          where: { deleted_at: null },
          include: {
            drivers_vehicles_current_driver_idTodrivers: {
              include: {
                users_drivers_user_idTousers: { select: { first_name: true, last_name: true } },
              },
            },
          },
          orderBy: { created_at: "desc" },
          take: 8,
        }),
      ]);

    return {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        role: user.position || "VEHICLE_ADMIN",
        department: user.departments_users_department_idTodepartments?.name || "N/A",
        businessUnit:
          user.business_units_users_business_unit_idTobusiness_units?.name || "N/A",
      },
      stats: {
        availableVehicles,
        assignedVehicles,
        approvedTripsWaiting: approvedWaiting,
        activeTrips,
      },
      pendingTrips: pendingTrips.map((trip) => ({
        id: trip.id,
        requestNumber: trip.request_number,
        employee:
          [
            trip.users_trip_requests_requested_by_user_idTousers?.first_name,
            trip.users_trip_requests_requested_by_user_idTousers?.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim() || "Unknown",
        department:
          trip.users_trip_requests_requested_by_user_idTousers
            ?.departments_users_department_idTodepartments?.name || "N/A",
        destination: trip.to_location_address,
        date: trip.departure_date ? new Date(trip.departure_date).toISOString().split("T")[0] : "",
        time: formatTime(trip.departure_time),
        priority: (trip.priority || "Medium").toLowerCase(),
        vehicleType: trip.vehicle_type_required || "Any",
        passengers: trip.passenger_count || 1,
        approvedBy:
          trip.trip_approvals?.[0]?.users
            ? `${trip.trip_approvals[0].users.first_name || ""} ${trip.trip_approvals[0].users.last_name || ""}`.trim()
            : "Approver",
      })),
      fleet: fleet.map((v) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        licensePlate: v.registration_number,
        status: (v.availability_status || "Unknown").toLowerCase(),
        location: v.current_location || "N/A",
        fuelLevel: 0,
        driver: v.drivers_vehicles_current_driver_idTodrivers
          ? `${
              v.drivers_vehicles_current_driver_idTodrivers.users_drivers_user_idTousers
                ?.first_name || ""
            } ${
              v.drivers_vehicles_current_driver_idTodrivers.users_drivers_user_idTousers
                ?.last_name || ""
            }`.trim()
          : "Unassigned",
      })),
    };
  }

  static async getVehicleAdminProfile(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        departments_users_department_idTodepartments: { select: { name: true } },
        business_units_users_business_unit_idTobusiness_units: {
          select: { name: true },
        },
      },
    });
    if (!user) throw new Error("User not found");

    const [totalAssignments, successfulAssignments, pendingAssignments, activeVehicles] =
      await Promise.all([
        prisma.trip_assignments.count({ where: { assigned_by: userId } }),
        prisma.trip_assignments.count({
          where: { assigned_by: userId, assignment_status: "Completed" },
        }),
        prisma.trip_assignments.count({
          where: { assigned_by: userId, assignment_status: { in: ["Assigned", "Accepted"] } },
        }),
        prisma.vehicles.count({
          where: { deleted_at: null, availability_status: "Assigned" },
        }),
      ]);

    return {
      personalInfo: {
        name: `${user.first_name} ${user.last_name}`.trim(),
        employeeId: user.employee_id,
        phone: user.phone || "",
        email: user.email,
        address: [user.address_street, user.address_city, user.address_state]
          .filter(Boolean)
          .join(", "),
        dateOfJoining: user.hire_date
          ? new Date(user.hire_date).toISOString().split("T")[0]
          : "",
        department: user.departments_users_department_idTodepartments?.name || "N/A",
        businessUnit:
          user.business_units_users_business_unit_idTobusiness_units?.name || "N/A",
      },
      permissions: [
        "Vehicle Assignment",
        "Driver Management",
        "Fleet Overview",
        "Trip Assignment",
      ],
      stats: {
        totalAssignments,
        successfulAssignments,
        pendingAssignments,
        activeVehicles,
      },
    };
  }

  static async getVehicleAdminApprovedTrips() {
    const rows = await prisma.trip_requests.findMany({
      where: {
        status: "Approved",
        trip_assignments: { none: {} },
      },
      include: {
        users_trip_requests_requested_by_user_idTousers: {
          include: {
            departments_users_department_idTodepartments: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return rows.map((trip) => ({
      id: trip.id,
      requestNumber: trip.request_number,
      employee:
        [
          trip.users_trip_requests_requested_by_user_idTousers?.first_name,
          trip.users_trip_requests_requested_by_user_idTousers?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() || "Unknown",
      employeePhone: trip.users_trip_requests_requested_by_user_idTousers?.phone || "",
      department:
        trip.users_trip_requests_requested_by_user_idTousers
          ?.departments_users_department_idTodepartments?.name || "N/A",
      destination: trip.to_location_address,
      fromLocation: trip.from_location_address,
      date: trip.departure_date ? new Date(trip.departure_date).toISOString().split("T")[0] : "",
      time: formatTime(trip.departure_time),
      returnTime: formatTime(trip.return_time),
      purpose: trip.purpose_category || "General",
      priority: (trip.priority || "Medium").toLowerCase(),
      vehicleType: trip.vehicle_type_required || "Any",
      passengers: trip.passenger_count || 1,
      estimatedDistance: trip.estimated_distance ? `${Number(trip.estimated_distance)} km` : "N/A",
      status: "awaiting-vehicle",
    }));
  }

  static async getVehicleAdminAssignments() {
    const driverUsers = await prisma.users.findMany({
      where: {
        deleted_at: null,
        status: "Active",
        position: { contains: "DRIVER", mode: "insensitive" },
      },
      select: { id: true, employee_id: true },
    });

    await Promise.all(
      driverUsers.map((u) =>
        prisma.drivers.upsert({
          where: { user_id: u.id },
          update: {
            deleted_at: null,
            updated_at: new Date(),
          },
          create: {
            user_id: u.id,
            license_number: `AUTO-${u.employee_id || u.id.slice(0, 8)}-${u.id.slice(0, 4)}`.slice(
              0,
              100,
            ),
            driver_status: "Available",
          },
        }),
      ),
    );

    const [approvedTrips, vehicles, assignments, drivers] = await Promise.all([
      this.getVehicleAdminApprovedTrips(),
      prisma.vehicles.findMany({
        where: { deleted_at: null },
        include: {
          drivers_vehicles_current_driver_idTodrivers: {
            include: {
              users_drivers_user_idTousers: {
                select: { first_name: true, last_name: true, phone: true },
              },
            },
          },
        },
      }),
      prisma.trip_assignments.findMany({
        include: {
          trip_requests: true,
          vehicles: true,
          drivers: {
            include: {
              users_drivers_user_idTousers: { select: { first_name: true, last_name: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      }),
      prisma.drivers.findMany({
        where: { deleted_at: null },
        include: {
          users_drivers_user_idTousers: {
            select: { first_name: true, last_name: true, phone: true },
          },
        },
      }),
    ]);

    const assignedByRequest = new Map(
      assignments.map((a) => [a.trip_request_id, a]),
    );

    const trips = approvedTrips.map((trip) => {
      const assignment = assignedByRequest.get(trip.id);
      if (!assignment) return trip;
      return {
        ...trip,
        status: "vehicle-assigned",
        assignedVehicle: assignment.vehicles
          ? `${assignment.vehicles.make} ${assignment.vehicles.model} - ${assignment.vehicles.registration_number}`
          : null,
        assignedDriver: assignment.drivers
          ? `${assignment.drivers.users_drivers_user_idTousers?.first_name || ""} ${
              assignment.drivers.users_drivers_user_idTousers?.last_name || ""
            }`.trim()
          : null,
      };
    });

    const driverOptionsFromDrivers = drivers.map((d) => ({
      id: d.id,
      name: `${d.users_drivers_user_idTousers?.first_name || ""} ${
        d.users_drivers_user_idTousers?.last_name || ""
      }`.trim(),
      phone: d.users_drivers_user_idTousers?.phone || "",
    }));

    return {
      trips,
      vehicles: vehicles.map((v) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        licensePlate: v.registration_number,
        type: v.vehicle_type || "UNKNOWN",
        seating: v.seating_capacity || 0,
        driver: v.drivers_vehicles_current_driver_idTodrivers
          ? `${
              v.drivers_vehicles_current_driver_idTodrivers.users_drivers_user_idTousers
                ?.first_name || ""
            } ${
              v.drivers_vehicles_current_driver_idTodrivers.users_drivers_user_idTousers
                ?.last_name || ""
            }`.trim()
          : "Unassigned",
        driverPhone:
          v.drivers_vehicles_current_driver_idTodrivers?.users_drivers_user_idTousers
            ?.phone || "",
        status: (v.availability_status || "Unknown").toLowerCase(),
        location: v.current_location || "N/A",
        fuelLevel: 0,
      })),
      drivers: driverOptionsFromDrivers,
    };
  }

  static async assignVehicleAdminTrip(userId: string, payload: {
    tripRequestId: string;
    vehicleId: string;
    driverId: string;
    assignmentNotes?: string;
  }) {
    let resolvedDriver = await prisma.drivers.findFirst({
      where: {
        OR: [{ id: payload.driverId }, { user_id: payload.driverId }],
      },
      select: { id: true, deleted_at: true, user_id: true, license_number: true },
    });

    if (!resolvedDriver) {
      const selectedUser = await prisma.users.findUnique({
        where: { id: payload.driverId },
        select: { id: true, position: true, employee_id: true, status: true },
      });

      const isDriverUser = (selectedUser?.position || "")
        .toUpperCase()
        .includes("DRIVER");

      if (!selectedUser || !isDriverUser || selectedUser.status !== "Active") {
        throw new Error("Selected driver is invalid or inactive.");
      }

      const base = selectedUser.employee_id || selectedUser.id.slice(0, 8);
      const autoLicense = `AUTO-${base}-${Date.now().toString().slice(-6)}`.slice(
        0,
        100,
      );

      const createdOrUpdated = await prisma.drivers.upsert({
        where: { user_id: selectedUser.id },
        update: { deleted_at: null, updated_at: new Date(), updated_by: userId },
        create: {
          user_id: selectedUser.id,
          license_number: autoLicense,
          driver_status: "Available",
          created_by: userId,
        },
        select: { id: true, deleted_at: true, user_id: true, license_number: true },
      });

      resolvedDriver = createdOrUpdated;
    } else if (resolvedDriver.deleted_at) {
      resolvedDriver = await prisma.drivers.update({
        where: { id: resolvedDriver.id },
        data: { deleted_at: null, updated_at: new Date(), updated_by: userId },
        select: { id: true, deleted_at: true, user_id: true, license_number: true },
      });
    }

    const existing = await prisma.trip_assignments.findFirst({
      where: { trip_request_id: payload.tripRequestId },
      select: { id: true },
    });

    if (existing) {
      await prisma.trip_assignments.update({
        where: { id: existing.id },
        data: {
          vehicle_id: payload.vehicleId,
          driver_id: resolvedDriver.id,
          assignment_notes: payload.assignmentNotes || null,
          assignment_status: "Assigned",
          assigned_by: userId,
          assigned_at: new Date(),
          updated_at: new Date(),
        },
      });
      return { id: existing.id, updated: true };
    }

    const created = await prisma.trip_assignments.create({
      data: {
        trip_request_id: payload.tripRequestId,
        vehicle_id: payload.vehicleId,
        driver_id: resolvedDriver.id,
        assignment_notes: payload.assignmentNotes || null,
        assignment_status: "Assigned",
        assigned_by: userId,
        assigned_at: new Date(),
      },
      select: { id: true },
    });
    return { id: created.id, updated: false };
  }
}
