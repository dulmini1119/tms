import { Router } from 'express';
// ✅ Use Named Imports (matching the 'export const' in controller)
import {
  getAllTripCosts,
  getTripCostById,
  createTripCost,
  updateTripCost,
  deleteTripCost,
  generateInvoice,
  recordPayment,
  restrictEditIfFinalized
} from './trip-costs.controller.js';

// ✅ Import Auth Middleware
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this file
router.use(authenticate);

// Routes
router.get('/', getAllTripCosts);
router.get('/:id', getTripCostById);

router.post('/', createTripCost);

// Actions
router.post('/:id/generate-invoice', generateInvoice);
router.post('/:id/record-payment', recordPayment);

// ✅ Added restrictEditIfFinalized middleware to protect updates
router.put(
  '/:id',
  restrictEditIfFinalized, 
  updateTripCost
);

// router.delete('/:id', deleteTripCost); // Uncomment if you want to expose delete route

export default router;