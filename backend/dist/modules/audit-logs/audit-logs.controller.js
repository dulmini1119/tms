import * as auditLogService from "./audit-logs.service.js";
import { createAuditLogSchema } from "./audit-logs.validation.js";
import ApiResponse from "../../utils/response.js";
const validateRequest = (schema, data) => {
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
        const errors = error.details.map((detail) => detail.message);
        return { isValid: false, errors };
    }
    return { isValid: true, value };
};
export const getAuditLogs = async (req, res, next) => {
    try {
        const { page, limit, search, action, module, status, actor } = req.query;
        const result = await auditLogService.getAuditLogs({
            page, limit, search, action, module, status, actor
        });
        return ApiResponse.success(res, result);
    }
    catch (error) {
        console.error("Controller Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
export const createAuditLog = async (req, res, next) => {
    try {
        const validation = validateRequest(createAuditLogSchema, req.body);
        if (!validation.isValid) {
            return res.status(400).json({ errors: validation.errors });
        }
        const payload = {
            ...validation.value,
            userId: validation.value.userId || req.user?.id,
            userName: validation.value.userName || `${req.user?.first_name} ${req.user?.last_name}`.trim() || req.user?.email,
            userRole: validation.value.userRole || req.user?.position || "User",
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get("user-agent"),
        };
        const newLog = await auditLogService.createAuditLog(payload);
        return ApiResponse.success(res, { log: newLog }, "Audit log created", 201);
    }
    catch (error) {
        console.error("Controller Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
//# sourceMappingURL=audit-logs.controller.js.map