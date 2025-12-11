import rateLimit from 'express-rate-limit';
import config from '../config/environment';
import { ERROR_CODES } from '../utils/constants';
/**
 * General API Rate Limiter
 */
export const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Too many requests from this IP, please try again later',
            timestamp: new Date().toISOString(),
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Stricter Rate Limiter for Authentication Routes
 */
export const authLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.authMax,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Too many login attempts, please try again later',
            timestamp: new Date().toISOString(),
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Factory function to create custom rate limiter
 */
export const createRateLimiter = (windowMs, max) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: {
                code: ERROR_CODES.INTERNAL_ERROR,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
//# sourceMappingURL=rateLimit.js.map