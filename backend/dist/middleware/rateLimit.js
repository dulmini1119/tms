import rateLimit from 'express-rate-limit';
import config from '../config/environment.js';
import { ERROR_CODES } from '../utils/constants.js';
/**
 * General API Rate Limiter
 */
export const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        error: {
            code: ERROR_CODES.TOO_MANY_REQUESTS,
            message: 'Too many requests from this IP, please try again later',
            timestamp: new Date().toISOString(),
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * AUTH RATE LIMITER – Smart version (dev = unlimited, prod = strict)
 */
export const authLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    // In development: 1000 attempts = basically unlimited
    // In production: use your strict config (e.g. 5 attempts)
    max: config.app.env === 'development' ? 9999 : config.rateLimit.authMax,
    // Don't count successful logins against the limit
    skipSuccessfulRequests: true,
    message: {
        success: false,
        error: {
            code: ERROR_CODES.TOO_MANY_REQUESTS,
            message: 'Too many login attempts, please try again later',
            timestamp: new Date().toISOString(),
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Factory function
 */
export const createRateLimiter = (windowMs, max) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: {
                code: ERROR_CODES.TOO_MANY_REQUESTS,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
//# sourceMappingURL=rateLimit.js.map