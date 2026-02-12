import { Router } from 'express';
// ✅ Use Named Imports (matching the 'export const' in controller)
import { getAllTripCosts, getTripCostById, createTripCost, updateTripCost, restrictEditIfFinalized } from './trip-costs.controller.js';
// ✅ Import Auth Middleware
import { authenticate } from '../../middleware/auth.js';
const router = Router();
// Apply authentication to all routes in this file
router.use(authenticate);
// Routes
router.get('/', getAllTripCosts);
router.get('/:id', getTripCostById);
router.post('/', createTripCost);
// ✅ Added restrictEditIfFinalized middleware to protect updates
router.put('/:id', restrictEditIfFinalized, updateTripCost);
// router.delete('/:id', deleteTripCost); // Uncomment if you want to expose delete route
export default router;
//# sourceMappingURL=trip-costs.routes.js.map