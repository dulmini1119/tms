import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';
const generateAccessToken = (userId) => {
    const secret = process.env.JWT_ACCESS_SECRET;
    return jwt.sign({ userId }, secret, { expiresIn: '15m' });
};
export const authenticate = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;
        if (!accessToken && !refreshToken) {
            return ApiResponse.error(res, 'UNAUTHORIZED', 'No token provided', 401);
        }
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
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
                        position: true,
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
                        position: user.position || undefined,
                    };
                    return next();
                }
            }
            catch (err) {
                logger.debug('Access token invalid or expired');
            }
        }
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
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
                        position: true,
                        status: true,
                    },
                });
                if (!user || user.status !== 'Active') {
                    res.clearCookie('accessToken');
                    res.clearCookie('refreshToken');
                    return ApiResponse.error(res, 'UNAUTHORIZED', 'Invalid session', 401);
                }
                const newAccessToken = generateAccessToken(user.id);
                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 15 * 60 * 1000,
                });
                req.user = {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    department_id: user.department_id || undefined,
                    business_unit_id: user.business_unit_id || undefined,
                    manager_id: user.manager_id || undefined,
                    position: user.position || undefined,
                };
                return next();
            }
            catch (err) {
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return ApiResponse.error(res, 'TOKEN_EXPIRED', 'Session expired', 401);
            }
        }
        return ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication failed', 401);
    }
    catch (error) {
        logger.error('Auth middleware error:', error);
        return ApiResponse.error(res, 'INTERNAL_ERROR', 'Authentication failed', 500);
    }
};
//# sourceMappingURL=auth.js.map