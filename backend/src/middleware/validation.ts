// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import Joi, { ObjectSchema } from 'joi';
import { ERROR_CODES, HTTP_STATUS } from '../utils/constants.js';
import ApiResponse from '../utils/response.js';

/**
 * Extended Request interface with validated data
 */
export interface ValidatedRequest extends Request {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
}

/**
 * Validate request body against Joi schema
 */
export const validateBody = (schema: ObjectSchema) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void | Response => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.reduce<Record<string, string>>((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});

      return ApiResponse.error(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        details
      );
    }

    req.validatedBody = value;
    next();
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ObjectSchema) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void | Response => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.reduce<Record<string, string>>((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});

      return ApiResponse.error(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        'Query validation failed',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        details
      );
    }

    req.validatedQuery = value;
    next();
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: ObjectSchema) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void | Response => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.reduce<Record<string, string>>((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});

      return ApiResponse.error(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        'Parameter validation failed',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        details
      );
    }

    req.validatedParams = value;
    next();
  };
};
