// src/modules/gpslogs/gpslogs.service.ts
import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ERROR_CODES, HTTP_STATUS } from '../../utils/constants.js';
import {
  GPSLogFilters,
  FormattedGPSLog,
  GPSLogsResponse,
  TripReplayData,
} from './gpslogs.types.js';

// Helper: Convert Decimal / string to number safely
const toNumber = (val: any): number => parseFloat(val?.toString() || '0');

// Haversine formula (in km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

export class GPSLogsService {
  /**
   * Get paginated GPS logs with filters
   */
  async getGPSLogs(filters: GPSLogFilters): Promise<GPSLogsResponse> {
    const {
      page = 1,
      limit = 10,
      searchTerm,
      status = 'all',
      vehicleId,
      driverId,
    } = filters;

    const whereClause: any = {};

    if (vehicleId) whereClause.vehicle_id = vehicleId;
    if (driverId) whereClause.driver_id = driverId;

    // Status filtering based on real schema fields
    if (status !== 'all') {
      if (status === 'emergency') {
        whereClause.panic_button = true;
      } else if (status === 'maintenance') {
        whereClause.vehicles = { operational_status: 'Maintenance' };
      } else if (status === 'offline') {
        whereClause.ignition_status = 'Off';
      } else if (status === 'active') {
        whereClause.ignition_status = 'On';
        whereClause.speed = { gt: 5 }; // moving
      } else if (status === 'idle') {
        whereClause.ignition_status = 'On';
        whereClause.speed = { lte: 5 }; // idling
      }
    }

    // Search across vehicle reg, driver name, trip request number, address
    if (searchTerm) {
      whereClause.OR = [
        { vehicles: { registration_number: { contains: searchTerm, mode: 'insensitive' } } },
        {
          drivers: {
            users_drivers_user_idTousers: {
              OR: [
                { first_name: { contains: searchTerm, mode: 'insensitive' } },
                { last_name: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        },
        {
          trip_assignments: {
            trip_requests: { request_number: { contains: searchTerm, mode: 'insensitive' } },
          },
        },
        { address: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.gps_logs.findMany({
        where: whereClause,
        include: {
          vehicles: { select: { registration_number: true, operational_status: true } },
          drivers: {
            select: {
              users_drivers_user_idTousers: {
                select: { first_name: true, last_name: true },
              },
            },
          },
          trip_assignments: {
            select: {
              trip_requests: { select: { request_number: true } },
            },
          },
        },
        orderBy: { server_timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.gps_logs.count({ where: whereClause }),
    ]);

    const formattedLogs: FormattedGPSLog[] = logs.map((log: any) => {
      const isPanic = log.panic_button || false;
      const ignition = log.ignition_status || 'Off';
      const speed = toNumber(log.speed);

      let uiStatus: FormattedGPSLog['status'] = 'Offline';

      if (isPanic) {
        uiStatus = 'Emergency';
      } else if (log.vehicles?.operational_status === 'Maintenance') {
        uiStatus = 'Maintenance';
      } else if (ignition === 'On') {
        uiStatus = speed > 5 ? 'Active' : 'Idle';
      }

      const driverUser = log.drivers?.users_drivers_user_idTousers;
      const driverName = driverUser
        ? `${driverUser.first_name} ${driverUser.last_name}`.trim()
        : 'Unassigned';

      const requestNumber = log.trip_assignments?.trip_requests?.request_number || null;

      return {
        id: log.id,
        vehicleId: log.vehicle_id,
        vehicleNumber: log.vehicles?.registration_number || 'N/A',
        driverId: log.driver_id,
        driverName,
        requestNumber,
        location: {
          latitude: toNumber(log.latitude),
          longitude: toNumber(log.longitude),
          address: log.address,
          speed,
          heading: toNumber(log.heading),
          accuracy: toNumber(log.accuracy),
          altitude: toNumber(log.altitude),
          timestamp: log.device_timestamp,
        },
        status: uiStatus,
        ignitionStatus: ignition,
        fuelLevel: 0, // not in schema → can add later if needed
        mileage: toNumber(log.mileage),
        batteryLevel: toNumber(log.battery_level),
        signalStrength: toNumber(log.signal_strength),
        panicButton: isPanic,
        geofenceStatus: log.geofence_status,
        speedAlerts: {
          currentSpeed: speed,
          speedLimit: toNumber(log.speed_limit),
          isViolation: log.is_speed_violation || false,
          violationCount: log.violation_count || 0,
        },
        lastPing: log.server_timestamp,
        createdAt: log.created_at,
        updatedAt: log.server_timestamp,
      };
    });

    return {
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single GPS log by ID
   */
  async getGPSLogById(logId: string): Promise<FormattedGPSLog & { deviceInfo?: any }> {
    const log = await prisma.gps_logs.findUnique({
      where: { id: logId },
      include: {
        vehicles: {
          select: {
            registration_number: true,
            gps_devices: {
              select: { device_id: true, imei: true, firmware_version: true, manufacturer: true },
            },
          },
        },
        drivers: {
          select: {
            users_drivers_user_idTousers: { select: { first_name: true, last_name: true } },
          },
        },
        trip_assignments: {
          select: { trip_requests: { select: { request_number: true } } },
        },
      },
    });

    if (!log) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'GPS Log not found', HTTP_STATUS.NOT_FOUND);
    }

    const formatted = this.formatLog(log); // reuse formatting
    const device = log.vehicles?.gps_devices?.[0] || null;

    return {
      ...formatted,
      deviceInfo: device
        ? {
            deviceId: device.device_id,
            imei: device.imei,
            firmwareVersion: device.firmware_version,
            manufacturer: device.manufacturer,
            networkProvider: log.network_provider,
          }
        : null,
    };
  }

  /**
   * Get trip replay data (route history)
   */
  async getTripReplayData(tripAssignmentId: string): Promise<TripReplayData> {
    const logs = await prisma.gps_logs.findMany({
      where: { trip_assignment_id: tripAssignmentId },
      orderBy: { device_timestamp: 'asc' },
      select: {
        device_timestamp: true,
        latitude: true,
        longitude: true,
        speed: true,
        heading: true,
        vehicle_id: true,
        trip_assignments: {
          select: {
            vehicles: { select: { registration_number: true } },
            trip_requests: { select: { request_number: true } },
          },
        },
      },
    });

    if (logs.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'No route data found for this trip', HTTP_STATUS.NOT_FOUND);
    }

    let totalDistance = 0;
    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1];
      const curr = logs[i];
      totalDistance += haversineDistance(
        toNumber(prev.latitude),
        toNumber(prev.longitude),
        toNumber(curr.latitude),
        toNumber(curr.longitude)
      );
    }

    const startTime = logs[0].device_timestamp;
    const endTime = logs[logs.length - 1].device_timestamp;
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / 1000 / 60);

    const speeds = logs.map((l) => toNumber(l.speed)).filter((s) => s > 0);
    const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;
    const maxSpeed = speeds.length > 0 ? Math.round(Math.max(...speeds)) : 0;

    return {
      tripId: tripAssignmentId,
      requestNumber: logs[0].trip_assignments?.trip_requests?.request_number || null,
      vehicleNumber: logs[0].trip_assignments?.vehicles?.registration_number || null,
      startTime,
      endTime,
      distance: parseFloat(totalDistance.toFixed(2)),
      durationMinutes,
      avgSpeed,
      maxSpeed,
      routePoints: logs.map((log) => ({
        timestamp: log.device_timestamp,
        latitude: toNumber(log.latitude),
        longitude: toNumber(log.longitude),
        speed: toNumber(log.speed),
        heading: toNumber(log.heading),
      })),
    };
  }

  // Private helper to format a single log (used by both getGPSLogs & getGPSLogById)
  private formatLog(log: any): FormattedGPSLog {
    const isPanic = log.panic_button || false;
    const ignition = log.ignition_status || 'Off';
    const speed = toNumber(log.speed);

    let uiStatus: FormattedGPSLog['status'] = 'Offline';
    if (isPanic) uiStatus = 'Emergency';
    else if (log.vehicles?.operational_status === 'Maintenance') uiStatus = 'Maintenance';
    else if (ignition === 'On') uiStatus = speed > 5 ? 'Active' : 'Idle';

    const driverUser = log.drivers?.users_drivers_user_idTousers;
    const driverName = driverUser
      ? `${driverUser.first_name} ${driverUser.last_name}`.trim()
      : 'Unassigned';

    const requestNumber = log.trip_assignments?.trip_requests?.request_number || null;

    return {
      id: log.id,
      vehicleId: log.vehicle_id,
      vehicleNumber: log.vehicles?.registration_number || 'N/A',
      driverId: log.driver_id,
      driverName,
      requestNumber,
      location: {
        latitude: toNumber(log.latitude),
        longitude: toNumber(log.longitude),
        address: log.address,
        speed,
        heading: toNumber(log.heading),
        accuracy: toNumber(log.accuracy),
        altitude: toNumber(log.altitude),
        timestamp: log.device_timestamp,
      },
      status: uiStatus,
      ignitionStatus: ignition,
      fuelLevel: 0,
      mileage: toNumber(log.mileage),
      batteryLevel: toNumber(log.battery_level),
      signalStrength: toNumber(log.signal_strength),
      panicButton: isPanic,
      geofenceStatus: log.geofence_status,
      speedAlerts: {
        currentSpeed: speed,
        speedLimit: toNumber(log.speed_limit),
        isViolation: log.is_speed_violation || false,
        violationCount: log.violation_count || 0,
      },
      lastPing: log.server_timestamp,
      createdAt: log.created_at,
      updatedAt: log.server_timestamp,
    };
  }
}