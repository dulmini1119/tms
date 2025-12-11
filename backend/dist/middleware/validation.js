import { ERROR_CODES, HTTP_STATUS } from '../utils/constants';
import ApiResponse from '../utils/response';
/**
 * Validate request body against Joi schema
 */
export const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        if (error) {
            const details = error.details.reduce((acc, err) => {
                const path = err.path.join('.');
                acc[path] = err.message;
                return acc;
            }, {});
            return ApiResponse.error(res, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
        }
        req.body = value;
        next();
    };
};
/**
 * Validate query parameters
 */
export const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        if (error) {
            const details = error.details.reduce((acc, err) => {
                const path = err.path.join('.');
                acc[path] = err.message;
                return acc;
            }, {});
            return ApiResponse.error(res, ERROR_CODES.VALIDATION_ERROR, 'Query validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
        }
        req.query = value;
        next();
    };
};
/**
 * Validate route parameters
 */
export const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        if (error) {
            const details = error.details.reduce((acc, err) => {
                const path = err.path.join('.');
                acc[path] = err.message;
                return acc;
            }, {});
            return ApiResponse.error(res, ERROR_CODES.VALIDATION_ERROR, 'Parameter validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
        }
        req.params = value;
        next();
    };
};
//# sourceMappingURL=validation.js.map