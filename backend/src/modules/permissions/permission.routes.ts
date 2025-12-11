// backend/modules/permissions/permission.routes.ts

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { PermissionsController } from './permission.controllers.js';
import { validateBody } from '../../middleware/validation.js';
import { saveRolePermissionsSchema } from './permission.validation.js';

const router = Router();
const controller = new PermissionsController();

// Existing routes (keep them)
router.get('/', authenticate, controller.getAll);                    // ← for matrix
router.post('/save', authenticate, validateBody(saveRolePermissionsSchema), controller.save);

// ADD THIS ONE LINE — THAT'S IT
router.get('/all', authenticate, controller.getAllPermissions);      // ← NEW

export default router;