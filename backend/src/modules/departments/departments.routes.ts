// backend/src/modules/departments/departments.routes.ts

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { DepartmentController } from './departments.controller.js';
import { validateBody } from '../../middleware/validation.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from './departments.validation.js';

const router = Router();
const controller = new DepartmentController();

router.get('/', authenticate, controller.getAll.bind(controller));
router.get('/:id', authenticate, controller.getById.bind(controller));
router.post('/', authenticate, validateBody(createDepartmentSchema), controller.create.bind(controller));
router.put('/:id', authenticate, validateBody(updateDepartmentSchema), controller.update.bind(controller));
router.delete('/:id', authenticate, controller.delete.bind(controller));

export default router;