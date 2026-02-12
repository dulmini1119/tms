// src/modules/auditLogs/auditLogs.routes.ts
import { Router } from "express";
import * as auditLogController from "./audit-logs.controller.js";
import { authenticate } from "../../middleware/auth.js";
const router = Router();
// All audit log routes require authentication
router.use(authenticate);
router
    .route("/")
    .get(auditLogController.getAuditLogs) // GET /audit-logs
    .post(auditLogController.createAuditLog); // POST /audit-logs
export default router;
//# sourceMappingURL=audit-logs.routes.js.map