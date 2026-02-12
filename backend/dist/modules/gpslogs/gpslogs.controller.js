import { GPSLogsService } from './gpslogs.service.js';
import ApiResponse from '../../utils/response.js';
export class GPSLogsController {
    gpsLogsService = new GPSLogsService();
    // GET /gps-logs
    getGPSLogs = async (req, res, next) => {
        try {
            const filters = {
                page: req.validatedQuery?.page ? Number(req.validatedQuery.page) : 1,
                limit: req.validatedQuery?.limit ? Number(req.validatedQuery.limit) : 10,
                searchTerm: req.validatedQuery?.searchTerm,
                status: req.validatedQuery?.status,
                vehicleId: req.validatedQuery?.vehicleId,
                driverId: req.validatedQuery?.driverId,
            };
            const result = await this.gpsLogsService.getGPSLogs(filters);
            ApiResponse.success(res, result);
        }
        catch (error) {
            next(error);
        }
    };
    // GET /gps-logs/:id
    getGPSLogById = async (req, res, next) => {
        try {
            const id = req.validatedParams?.id || req.params.id;
            const log = await this.gpsLogsService.getGPSLogById(id);
            ApiResponse.success(res, { log });
        }
        catch (error) {
            next(error);
        }
    };
    // GET /gps-logs/replay/:tripId
    getTripReplay = async (req, res, next) => {
        try {
            const tripId = req.validatedParams?.tripId || req.params.tripId;
            const replayData = await this.gpsLogsService.getTripReplayData(tripId);
            ApiResponse.success(res, { replayData });
        }
        catch (error) {
            next(error);
        }
    };
    // POST /gps-logs/export
    exportGPSLogs = async (req, res, next) => {
        try {
            const filters = {
                ...req.validatedBody,
                page: 1,
                limit: 10000, // max for export
            };
            const { logs } = await this.gpsLogsService.getGPSLogs(filters);
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
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=gpslogs.controller.js.map