// routes/trip-request.router.ts (or wherever your router is)

import { Router } from 'express';
import * as tripController from './trip-request.controllers.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOwnershipOrAdmin } from '../../middleware/roles.js';
import { restrictEditAfterApproval } from '../../middleware/requests.js';

const router = Router();

router.get('/', authenticate, tripController.getAllTripRequests);
router.get('/:id', authenticate, tripController.getTripRequestById);

router.post('/', authenticate, tripController.createTripRequest);

router.put(
  '/:id',
  authenticate,
  requireOwnershipOrAdmin,
  restrictEditAfterApproval,
  tripController.updateTripRequest
);

router.delete('/:id', authenticate, tripController.deleteTripRequest);

export default router;