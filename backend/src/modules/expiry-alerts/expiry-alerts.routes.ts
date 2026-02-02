// src/modules/expiry-alerts/expiry-alerts.routes.ts
import { Router } from "express";
import {
  createExpiryAlert,
  getExpiryAlerts,     // ✅ ADD: Import GET controller
  updateExpiryAlert,   // ✅ ADD: Import PATCH controller
} from "./expiry-alerts.controller.js";
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.js';
import { createExpiryAlertSchema } from "./expiry-alerts.validation.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// ✅ ADD: GET Route (For fetching alerts)
router.get("/", authenticate, getExpiryAlerts);

// ✅ ADD: PATCH Route (For updating status/renewal)
// We don't use a schema here to allow partial updates, 
// but you could add a patchSchema if desired.
router.patch("/:id", authenticate, updateExpiryAlert);

// Existing POST Route
router.post(
  "/",
  authenticate,
  validateBody(createExpiryAlertSchema.body),
  createExpiryAlert
);

export default router;