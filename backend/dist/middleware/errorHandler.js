import { Prisma } from '@prisma/client';
import { ERROR_CODES, HTTP_STATUS } from '../utils/constants';
import ApiResponse from '../utils/response';
import logger from '../utils/logger';
/**
 * Custom Application Error Class
 */
export class AppError extends Error {
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });
    // Handle AppError (custom application errors)
    if (err instanceof AppError) {
        return ApiResponse.error(res, err.code, err.message, err.statusCode, err.details);
    }
    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(err, res);
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
        return ApiResponse.error(res, ERROR_CODES.VALIDATION_ERROR, 'Database validation error', HTTP_STATUS.BAD_REQUEST);
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return ApiResponse.error(res, ERROR_CODES.UNAUTHORIZED, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
    if (err.name === 'TokenExpiredError') {
        return ApiResponse.error(res, ERROR_CODES.TOKEN_EXPIRED, 'Token has expired', HTTP_STATUS.UNAUTHORIZED);
    }
    // Handle validation errors (e.g., express-validator)
    if (err.name === 'ValidationError') {
        return ApiResponse.error(res, ERROR_CODES.VALIDATION_ERROR, err.message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    // Default internal server error
    return ApiResponse.error(res, ERROR_CODES.INTERNAL_ERROR, process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined);
};
/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (err, res) => {
    switch (err.code) {
        case 'P2002':
            // Unique constraint violation
            const field = err.meta?.target?.join(', ') || 'field';
            return ApiResponse.error(res, ERROR_CODES.ALREADY_EXISTS, `A record with this ${field} already exists`, HTTP_STATUS.CONFLICT, { field });
        case 'P2025':
            // Record not found
            return ApiResponse.error(res, ERROR_CODES.NOT_FOUND, 'Record not found', HTTP_STATUS.NOT_FOUND);
        case 'P2003':
            // Foreign key constraint violation
            return ApiResponse.error(res, ERROR_CODES.CONFLICT, 'Referenced record does not exist', HTTP_STATUS.CONFLICT);
        case 'P2014':
            // Required relation violation
            return ApiResponse.error(res, ERROR_CODES.VALIDATION_ERROR, 'Required relationship is missing', HTTP_STATUS.BAD_REQUEST);
        default:
            return ApiResponse.error(res, ERROR_CODES.DATABASE_ERROR, 'Database operation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};
/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
    return ApiResponse.error(res, ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.path} not found`, HTTP_STATUS.NOT_FOUND);
};
/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=errorHandler.js.map