import { Router } from 'express';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { systemSettingsValidation } from './system-settings.validation.js';
import * as controller from './system-settings.controller.js';

const router = Router();

// All settings routes require authentication
// Use 'authenticate' (matching the export in auth.ts)
router.use(authenticate);

// GET /system-settings - List all settings (with filters)
router.get(
  '/',
  validateQuery(systemSettingsValidation.query), // Use validateQuery for req.query
  controller.getSettings
);

// GET /system-settings/:key - Get single setting
router.get('/:key', controller.getSettingByKey);

// POST /system-settings - Create new setting
router.post(
  '/',
  validateBody(systemSettingsValidation.create), // Use validateBody for req.body
  controller.createSetting
);

// PUT /system-settings/:key - Update setting
router.put(
  '/:key',
  validateBody(systemSettingsValidation.update), // Use validateBody for req.body
  controller.updateSetting
);

// DELETE /system-settings/:key - Delete setting
router.delete('/:key', controller.deleteSetting);

export default router;