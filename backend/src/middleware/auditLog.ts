import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Audit Log Middleware
 * Logs all mutation operations (POST, PUT, PATCH, DELETE)
 */
export const auditLog = (moduleName?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

    const originalSend = res.send;
    const originalJson = res.json;
    let responseData: any;

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
        if (res.statusCode >= 400) return;

        const action = determineAction(req.method, req.path);
        const entityType = extractResourceType(req.path);
        const entityId = extractResourceId(req, responseData);

        await prisma.audit_logs.create({
          data: {
            user_id: req.user?.id || null,
            user_name: req.user ? `${req.user.first_name} ${req.user.last_name}` : null,
            user_email: req.user?.email || null,
            action,
            module: moduleName || 'GENERAL',
            entity_type: entityType,
            entity_id: entityId,
            changes: {
              method: req.method,
              path: req.path,
              body: sanitizeData(req.body),
              query: req.query,
            },
            ip_address: getClientIp(req),
            user_agent: req.get('user-agent') || null,
            request_method: req.method,
            request_url: req.originalUrl,
            status: res.statusCode.toString(),
          },
        });

        logger.info(`Audit log created: ${action} by ${req.user?.email || 'anonymous'}`);
      } catch (error) {
        logger.error('Failed to create audit log:', error);
      }
    });

    next();
  };
};

function determineAction(method: string, path: string): string {
  const segments = path.split('/').filter(Boolean);
  const resource = segments[segments.length - 1] || 'unknown';
  switch (method) {
    case 'POST': return `CREATE_${resource.toUpperCase()}`;
    case 'PUT':
    case 'PATCH': return `UPDATE_${resource.toUpperCase()}`;
    case 'DELETE': return `DELETE_${resource.toUpperCase()}`;
    default: return `${method}_${resource.toUpperCase()}`;
  }
}

function extractResourceType(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const resourceIndex = segments.indexOf('v1') + 1;
  return segments[resourceIndex]?.toUpperCase() || 'UNKNOWN';
}

function extractResourceId(req: AuthRequest, responseData: any): string | null {
  if (req.params.id) return req.params.id;

  const idParams = ['userId', 'tripId', 'vehicleId', 'organizationId', 'cabServiceId'];
  for (const param of idParams) if (req.params[param]) return req.params[param];

  try {
    const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    if (parsed?.data?.id) return parsed.data.id;
    for (const key of Object.keys(parsed?.data || {})) {
      if (parsed.data[key]?.id) return parsed.data[key].id;
    }
  } catch {}
  return null;
}

function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret'];
  for (const field of sensitiveFields) {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
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
