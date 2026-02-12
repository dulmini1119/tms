// src/modules/auditLogs/auditLogs.service.ts
import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger.js";

const prisma = new PrismaClient();

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/(^|\s)\S/g, (char) => char.toUpperCase());

const normalizeActionType = (action: string | null | undefined) => {
  if (!action) return "Read";
  return toTitleCase(action);
};

const buildDisplayAction = (log: any, actionType: string) => {
  const moduleName = log.module || "system";
  const target = log.entity_name || log.entity_type || moduleName;
  return `${actionType} ${target}`;
};

// Helper to map DB row to Frontend Interface
const mapDbToFrontend = (log: any) => {
  const normalizedStatus: "Success" | "Failed" | "Pending" =
    log.status === "Failed" || log.status === "Pending" ? log.status : "Success";
  
  const normalizedActionType = normalizeActionType(log.action);
  const displayAction = buildDisplayAction(log, normalizedActionType);

  return {
    id: log.id,
    timestamp: log.created_at,
    userId: log.user_id,
    userName: log.user_name,
    userRole: log.user_role,
    
    actionType: normalizedActionType, // e.g., "Create"
    
    // ✅ FIX: Use description (detailed) first, then fallback to generated displayAction
    action: log.description || displayAction, 
    
    module: log.module,
    
    entityType: log.entity_type,
    entityId: log.entity_id,
    entityName: log.entity_name,
    description: log.description || null,
    
    changes: Array.isArray(log.changes) ? log.changes : null,
    
    status: normalizedStatus,
    severity: normalizedStatus === "Failed" ? "Error" : "Info",
    duration: null,
    
    errorMessage: log.error_message,
    
    metadata: {
      ipAddress: log.ip_address,
      sessionId: log.session_id,
      requestId: log.request_id,
      userAgent: log.user_agent,
    },
    tags: [],
    archived: false,
    retentionDate: null,
    createdAt: log.created_at,
  };
};

export const getAuditLogs = async (filters: any) => {
  const { page, limit, search, action, module, status } = filters;

  const pageInt = parseInt(page, 10) || 1;
  const limitInt = parseInt(limit, 10) || 10;
  const skip = (pageInt - 1) * limitInt;

  const where: any = {};

  // Search: Search in description, action, or entity name
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
      { entity_name: { contains: search, mode: "insensitive" } },
      { user_name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (action) where.action = action;
  if (module) where.module = module;
  if (status) where.status = status;

  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      skip,
      take: limitInt,
      orderBy: { created_at: "desc" },
    }),
    prisma.audit_logs.count({ where }),
  ]);

  return {
    logs: logs.map(mapDbToFrontend),
    meta: {
      total,
      page: pageInt,
      limit: limitInt,
      totalPages: Math.ceil(total / limitInt),
    },
  };
};

export const createAuditLog = async (data: any) => {
  const {
    userId,
    userName,
    userRole,
    action,
    module,
    entityType,
    entityId,
    entityName,
    changes,
    ipAddress,
    userAgent,
    status,
    errorMessage,
    description,
  } = data;

  const newLog = await prisma.audit_logs.create({
    data: {
      user_id: userId || null,
      user_name: userName || "System",
      user_role: userRole || null,
      action,
      module,
      entity_type: entityType || null,
      entity_id: entityId || null,
      entity_name: entityName || null,
      changes: changes || [],
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      status: status || "Success",
      error_message: errorMessage || null,
      description: description || `${action} on ${module}`,
      // Defaults
      request_method: "POST", // Assuming API context
      created_at: new Date(),
    },
  });

  return mapDbToFrontend(newLog);
};
