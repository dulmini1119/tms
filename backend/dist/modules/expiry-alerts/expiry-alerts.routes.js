// src/modules/expiry-alerts/expiry-alerts.routes.ts
import { Router } from "express";
import { createExpiryAlert, getExpiryAlerts, updateExpiryAlert, triggerSync, } from "./expiry-alerts.controller.js";
import { validateBody } from '../../middleware/validation.js';
import { createExpiryAlertSchema } from "./expiry-alerts.validation.js";
import { authenticate } from "../../middleware/auth.js";
const router = Router();
router.get("/", authenticate, getExpiryAlerts);
router.patch("/:id", authenticate, updateExpiryAlert);
router.post("/", authenticate, validateBody(createExpiryAlertSchema.body), createExpiryAlert);
router.get("/sync", authenticate, triggerSync);
export default router;
//# sourceMappingURL=expiry-alerts.routes.js.map