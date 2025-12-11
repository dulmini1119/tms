import { verifyAccessToken } from '../utils/jwt';
import { ERROR_CODES, HTTP_STATUS } from '../utils/constants';
import ApiResponse from '../utils/response';
import prisma from '../config/database';
import logger from '../utils/logger';
/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.error(res, ERROR_CODES.UNAUTHORIZED, 'No token provided', HTTP_STATUS.UNAUTHORIZED);
        }
        const token = authHeader.split(' ')[1];
        try {
            // Verify token
            const decoded = verifyAccessToken(token);
            // Get user from database
            const user = await prisma.users.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    department_id: true,
                    business_unit_id: true,
                    manager_id: true,
                    status: true,
                },
            });
            if (!user) {
                return ApiResponse.error(res, ERROR_CODES.UNAUTHORIZED, 'User not found', HTTP_STATUS.UNAUTHORIZED);
            }
            if (user.status !== 'Active') {
                return ApiResponse.error(res, ERROR_CODES.UNAUTHORIZED, 'User account is not active', HTTP_STATUS.UNAUTHORIZED);
            }
            // Attach user to request
            req.user = {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                department_id: user.department_id || undefined,
                business_unit_id: user.business_unit_id || undefined,
                manager_id: user.manager_id || undefined,
            };
            next();
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                return ApiResponse.error(res, ERROR_CODES.TOKEN_EXPIRED, 'Token has expired', HTTP_STATUS.UNAUTHORIZED);
            }
            return ApiResponse.error(res, ERROR_CODES.UNAUTHORIZED, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
        }
    }
    catch (error) {
        logger.error('Authentication error:', error);
        return ApiResponse.error(res, ERROR_CODES.INTERNAL_ERROR, 'Authentication failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};
/**
 * Optional Authentication - attaches user if token is valid, but doesn’t require it
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = verifyAccessToken(token);
                const user = await prisma.users.findUnique({
                    where: { id: decoded.userId },
                    select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                        department_id: true,
                        business_unit_id: true,
                        manager_id: true,
                        status: true,
                    },
                });
                if (user && user.status === 'Active') {
                    req.user = {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        department_id: user.department_id || undefined,
                        business_unit_id: user.business_unit_id || undefined,
                        manager_id: user.manager_id || undefined,
                    };
                }
            }
            catch (error) {
                logger.debug('Optional auth: Invalid token provided');
            }
        }
        next();
    }
    catch (error) {
        logger.error('Optional authentication error:', error);
        next();
    }
};
/**
 * Role-based Authorization Middleware
 * You can replace role checks with custom logic if needed
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.error(res, ERROR_CODES.UNAUTHORIZED, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        }
        // For now, since users table has no roles, you can implement logic later
        // Example: you can allow all users or restrict by department/business_unit
        next();
    };
};
//# sourceMappingURL=auth.js.map