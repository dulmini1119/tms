// src/modules/auditLogs/auditLogs.validation.ts
import Joi from "joi";
export const createAuditLogSchema = Joi.object({
    userId: Joi.string().allow(null, ""),
    userName: Joi.string().allow(null, ""),
    userRole: Joi.string().allow(null, ""),
    // Mapped from Frontend 'actionType' to DB 'action'
    action: Joi.string()
        .valid("Create", "Read", "Update", "Delete", "Login", "Logout", "Export", "Import", "Approve", "Reject")
        .required(),
    // Mapped from Frontend 'module'
    module: Joi.string().required(),
    // Entity Info
    entityType: Joi.string().allow(null, ""),
    entityId: Joi.string().allow(null, ""),
    entityName: Joi.string().allow(null, ""),
    // Changes (Stored as JSON in DB)
    changes: Joi.array().items(Joi.object({
        field: Joi.string().required(),
        oldValue: Joi.any().allow(null),
        newValue: Joi.any().allow(null),
    })).optional(),
    // Request Metadata
    ipAddress: Joi.string().ip().allow(null),
    userAgent: Joi.string().allow(null),
    requestMethod: Joi.string().allow(null),
    requestUrl: Joi.string().allow(null),
    // Status
    status: Joi.string().valid("Success", "Failed", "Pending").default("Success"),
    // Error Handling
    errorMessage: Joi.string().allow(null, ""),
    // Other
    sessionId: Joi.string().allow(null),
    requestId: Joi.string().allow(null),
    description: Joi.string().allow(null, ""),
});
export const getAuditLogsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    action: Joi.string().allow("", null),
    module: Joi.string().allow("", null),
    status: Joi.string().allow("", null),
});
//# sourceMappingURL=audit-logs.validation.js.map