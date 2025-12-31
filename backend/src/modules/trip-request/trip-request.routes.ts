import { Router } from 'express';
import * as tripController from './trip-request.controllers.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// GET /api/trip-requests          → list with filters & pagination
router.get('/', authenticate, tripController.getAllTripRequests);

// GET /api/trip-requests/:id      → single item
router.get('/:id', authenticate, tripController.getTripRequestById);

// POST /api/trip-requests
router.post('/', authenticate, tripController.createTripRequest);

// PUT /api/trip-requests/:id
router.put('/:id', authenticate, tripController.updateTripRequest);

// DELETE /api/trip-requests/:id
router.delete('/:id', authenticate, tripController.deleteTripRequest);

export default router;