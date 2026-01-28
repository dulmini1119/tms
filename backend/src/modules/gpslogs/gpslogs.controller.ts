// src/modules/gpslogs/gpslogs.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { GPSLogsService } from './gpslogs.service.js';
import ApiResponse from '../../utils/response.js';
import { ValidatedRequest } from '../../middleware/validation.js';
import { GPSLogsResponse, TripReplayData } from './gpslogs.types.js';


export class GPSLogsController {
  private gpsLogsService = new GPSLogsService();

  // GET /gps-logs
  getGPSLogs = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        page: req.validatedQuery?.page ? Number(req.validatedQuery.page) : 1,
        limit: req.validatedQuery?.limit ? Number(req.validatedQuery.limit) : 10,
        searchTerm: req.validatedQuery?.searchTerm as string | undefined,
        status: req.validatedQuery?.status as any,
        vehicleId: req.validatedQuery?.vehicleId as string | undefined,
        driverId: req.validatedQuery?.driverId as string | undefined,
      };

      const result: GPSLogsResponse = await this.gpsLogsService.getGPSLogs(filters);

      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  // GET /gps-logs/:id
  getGPSLogById = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.validatedParams?.id || req.params.id;
      const log = await this.gpsLogsService.getGPSLogById(id);

      ApiResponse.success(res, { log });
    } catch (error) {
      next(error);
    }
  };

  // GET /gps-logs/replay/:tripId
  getTripReplay = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const tripId = req.validatedParams?.tripId || req.params.tripId;
      const replayData: TripReplayData = await this.gpsLogsService.getTripReplayData(tripId);

      ApiResponse.success(res, { replayData });
    } catch (error) {
      next(error);
    }
  };

  // POST /gps-logs/export
  exportGPSLogs = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        ...req.validatedBody,
        page: 1,
        limit: 10000, // max for export
      };

      const { logs }: GPSLogsResponse = await this.gpsLogsService.getGPSLogs(filters);

      // CSV Headers
      const headers = [
        'Vehicle Number',
        'Driver Name',
        'Request Number',
        'Latitude',
        'Longitude',
        'Address',
        'Speed (km/h)',
        'Status',
        'Ignition',
        'Panic Button',
        'Timestamp',
        'Mileage (km)',
        'Battery Level (%)',
      ];

      const rows = logs.map((log) => [
        log.vehicleNumber,
        log.driverName,
        log.requestNumber || '',
        log.location.latitude,
        log.location.longitude,
        log.location.address || '',
        log.location.speed,
        log.status,
        log.ignitionStatus,
        log.panicButton ? 'Yes' : 'No',
        log.location.timestamp.toISOString(),
        log.mileage,
        log.batteryLevel,
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="gps_logs_${new Date().toISOString().split('T')[0]}.csv"`);

      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  };
}