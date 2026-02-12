import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audit Log Middleware
 * Logs all API operations with normalized action/status values.
 */


export const auditLog = (moduleName?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (shouldSkipRequest(req)) return next();

    const requestId = uuidv4(); // Generate unique request_id for this API call

    const originalSend = res.send;
    const originalJson = res.json;
    let responseData: any;
    const startedAt = Date.now();

    res.send = function (data: any) {
      responseData = data;
      res.send = originalSend;
      return originalSend.call(this, data);
    };

    res.json = function (data: any) {
      responseData = data;
      res.json = originalJson;
      return originalJson.call(this, data);
    };

    res.on('finish', async () => {
      try {
        const action = determineAction(req.method, req.path);
        const module = moduleName || extractModule(req.path);
        const entityType = extractResourceType(req.path);
        const entityId = extractResourceId(req, responseData);
        const status = mapStatus(res.statusCode);
        const errorMessage = status === 'Failed' ? extractErrorMessage(responseData) : null;
        const userName = buildUserName(req);
        const durationMs = Date.now() - startedAt;

        await prisma.audit_logs.create({
          data: {
            user_id: req.user?.id || null,
            user_name: userName,
            user_email: req.user?.email || null,
            user_role: req.user?.position || null,
            action,
            module,
            entity_type: entityType,
            entity_id: entityId,
            changes: {
              request: {
                method: req.method,
                path: req.path,
                params: req.params,
                query: req.query,
                body: sanitizeData(req.body),
              },
              response: {
                statusCode: res.statusCode,
              },
              durationMs,
            },
            ip_address: getClientIp(req),
            user_agent: req.get('user-agent') || null,
            request_method: req.method,
            request_url: req.originalUrl,
            status,
            error_message: errorMessage,
            description: buildDescription(action, module, entityType, entityId),
            request_id: requestId, // <-- attach request_id
          },
        });

        logger.info(`Audit log created: ${action} on ${module} by ${req.user?.email || 'anonymous'}`);
      } catch (error) {
        logger.error('Failed to create audit log:', error);
      }
    });

    next();
  };
};


function determineAction(method: string, path: string): string {
  if (path.startsWith('/auth/login')) return 'Login';
  if (path.startsWith('/auth/logout')) return 'Logout';

  switch (method) {
    case 'POST': return 'Create';
    case 'GET': return 'Read';
    case 'PUT':
    case 'PATCH': return 'Update';
    case 'DELETE': return 'Delete';
    default: return method;
  }
}

function extractResourceType(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return segments[0] || 'system';
}

function extractModule(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return segments[0] || 'system';
}

function extractResourceId(req: AuthRequest, responseData: any): string | null {
  if (req.params.id && isUuid(req.params.id)) return req.params.id;

  const idParams = ['userId', 'tripId', 'vehicleId', 'organizationId', 'cabServiceId'];
  for (const param of idParams) {
    if (req.params[param] && isUuid(req.params[param])) return req.params[param];
  }

  try {
    const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    if (parsed?.data?.id && isUuid(parsed.data.id)) return parsed.data.id;
    for (const key of Object.keys(parsed?.data || {})) {
      if (parsed.data[key]?.id && isUuid(parsed.data[key].id)) return parsed.data[key].id;
    }
  } catch {}
  return null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapStatus(statusCode: number): 'Success' | 'Failed' | 'Pending' {
  if (statusCode >= 500) return 'Failed';
  if (statusCode >= 400) return 'Failed';
  if (statusCode === 202) return 'Pending';
  return 'Success';
}

function extractErrorMessage(responseData: any): string | null {
  const parsed = safelyParseResponse(responseData);
  if (!parsed || typeof parsed !== 'object') return null;

  if (typeof parsed.message === 'string') return parsed.message;
  if (parsed.error && typeof parsed.error.message === 'string') return parsed.error.message;
  if (typeof parsed.error === 'string') return parsed.error;
  return null;
}

function buildUserName(req: AuthRequest): string | null {
  if (!req.user) return null;
  const firstName = req.user.first_name || '';
  const lastName = req.user.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || req.user.email || null;
}

function buildDescription(action: string, module: string, entityType: string, entityId: string | null): string {
  const target = entityId ? `${entityType} (${entityId})` : entityType;
  return `${action} on ${module} - ${target}`;
}

function safelyParseResponse(responseData: any): any {
  if (typeof responseData !== 'string') return responseData;
  try {
    return JSON.parse(responseData);
  } catch {
    return null;
  }
}

function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveFields = new Set([
    'password',
    'password_hash',
    'passwordHash',
    'token',
    'refreshToken',
    'accessToken',
    'secret',
    'otp',
  ]);

  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (sensitiveFields.has(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    }
  }

  return sanitized;
}

function getClientIp(req: AuthRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown'
  ) as string;
}

function shouldSkipRequest(req: AuthRequest): boolean {
  if (req.method === 'OPTIONS' || req.method === 'HEAD') return true;

  // Avoid recursive/noisy logs for audit log reads/creates.
  if (req.path.startsWith('/audit-logs')) return true;

  return false;
}
