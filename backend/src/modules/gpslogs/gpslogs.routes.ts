// src/modules/gpslogs/gpslogs.routes.ts
import { Router } from 'express';

import { validateBody, validateQuery, validateParams } from '../../middleware/validation.js';
import { GPSLogsController } from './gpslogs.controller.js';
import { authenticate } from '../../middleware/auth.js';

// Use named imports (cleaner than import * as)
import {
  getGPSLogsSchema,
  getGPSLogDetailsSchema,
  getTripReplaySchema,
  exportGPSLogsSchema,
} from './gpslogs.validation.js';   // ← adjust path if needed (was ../validations/... before)

const router = Router();
const gpsLogsController = new GPSLogsController();

// Apply authentication to all routes in this router
router.use(authenticate);

// GET /gps-logs          → list with pagination & filters
router.get(
  '/',
  validateQuery(getGPSLogsSchema.query),
  gpsLogsController.getGPSLogs
);

// POST /gps-logs/export   → export filtered logs (CSV/PDF/etc.)
router.post(
  '/export',
  validateBody(exportGPSLogsSchema.body),
  gpsLogsController.exportGPSLogs
);

// GET /gps-logs/replay/:tripId   → replay/timeline for one trip
router.get(
  '/replay/:tripId',
  validateParams(getTripReplaySchema.params),
  gpsLogsController.getTripReplay
);

// GET /gps-logs/:id       → single log details
router.get(
  '/:id',
  validateParams(getGPSLogDetailsSchema.params),
  gpsLogsController.getGPSLogById
);

export default router;