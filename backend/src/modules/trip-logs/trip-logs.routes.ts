import { Router } from 'express';
import * as tripLogController from './trip-logs.controller.js';
import { authenticate } from '../../middleware/auth.js'; 
// Import other middleware if needed, e.g.:
// import { restrictUpdateIfFinalized } from './trip-logs.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/trip-logs - Get all logs
router.get('/', tripLogController.getAllTripLogs);

// GET /api/trip-logs/export - Export CSV
router.get('/export', tripLogController.exportTripLogs);

// GET /api/trip-logs/:id - Get single log
router.get('/:id', tripLogController.getTripLogById);

// POST /api/trip-logs - Create log
router.post('/', tripLogController.createTripLog);

// PATCH /api/trip-logs/:id - Update log
router.patch(
  '/:id', 
  // restrictUpdateIfFinalized, // Uncomment if you have this middleware
  tripLogController.updateTripLog
);

// DELETE /api/trip-logs/:id - Delete log
router.delete('/:id', tripLogController.deleteTripLog);

// EXPORT AS DEFAULT
export default router;