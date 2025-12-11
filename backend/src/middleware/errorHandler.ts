import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ERROR_CODES, HTTP_STATUS } from '../utils/constants.js';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
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
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Log error
  logger.error('Error occurred:', {
    error: (err as Error).message,
    stack: (err as Error).stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle AppError (custom application errors)
  if (err instanceof AppError) {
    return ApiResponse.error(
      res,
      err.code,
      err.message,
      err.statusCode,
      err.details
    );
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiResponse.error(
      res,
      ERROR_CODES.VALIDATION_ERROR,
      'Database validation error',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Handle JWT errors
  if ((err as any).name === 'JsonWebTokenError') {
    return ApiResponse.error(
      res,
      ERROR_CODES.UNAUTHORIZED,
      'Invalid token',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if ((err as any).name === 'TokenExpiredError') {
    return ApiResponse.error(
      res,
      ERROR_CODES.TOKEN_EXPIRED,
      'Token has expired',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Handle validation errors (e.g., express-validator)
  if ((err as any).name === 'ValidationError') {
    return ApiResponse.error(
      res,
      ERROR_CODES.VALIDATION_ERROR,
      (err as any).message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  // Default internal server error
  return ApiResponse.error(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : (err as Error).message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? { stack: (err as Error).stack } : undefined
  );
};

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
): Response => {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return ApiResponse.error(
        res,
        ERROR_CODES.ALREADY_EXISTS,
        `A record with this ${field} already exists`,
        HTTP_STATUS.CONFLICT,
        { field }
      );

    case 'P2025':
      // Record not found
      return ApiResponse.error(
        res,
        ERROR_CODES.NOT_FOUND,
        'Record not found',
        HTTP_STATUS.NOT_FOUND
      );

    case 'P2003':
      // Foreign key constraint violation
      return ApiResponse.error(
        res,
        ERROR_CODES.CONFLICT,
        'Referenced record does not exist',
        HTTP_STATUS.CONFLICT
      );

    case 'P2014':
      // Required relation violation
      return ApiResponse.error(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        'Required relationship is missing',
        HTTP_STATUS.BAD_REQUEST
      );

    default:
      return ApiResponse.error(
        res,
        ERROR_CODES.DATABASE_ERROR,
        'Database operation failed',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
  }
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  return ApiResponse.error(
    res,
    ERROR_CODES.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    HTTP_STATUS.NOT_FOUND
  );
};

/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
