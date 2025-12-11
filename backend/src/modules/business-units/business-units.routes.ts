import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { businessUnitController } from './business-units.controllers.js'; // ← Import the singleton
import { validateBody } from '../../middleware/validation.js';
import { createBusinessUnitSchema, updateBusinessUnitSchema } from './business-units.validation.js';

const router = Router();

// Use the pre-instantiated singleton — NO .bind() needed!
router.get('/', authenticate, businessUnitController.getAll);
router.get('/:id', authenticate, businessUnitController.getById);
router.post('/', authenticate, validateBody(createBusinessUnitSchema), businessUnitController.create);
router.put('/:id', authenticate, validateBody(updateBusinessUnitSchema), businessUnitController.update);
router.delete('/:id', authenticate, businessUnitController.delete);

export default router;