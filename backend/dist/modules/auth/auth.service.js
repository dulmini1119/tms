import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { ERROR_CODES, HTTP_STATUS } from '../../utils/constants';
import logger from '../../utils/logger';
const SALT_ROUNDS = 10;
export class AuthService {
    // ------------------------------------------------------
    // LOGIN
    // ------------------------------------------------------
    async login(email, password) {
        const user = await prisma.users.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
        }
        if (user.status !== 'Active') {
            throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Your account is not active. Please contact administrator.', HTTP_STATUS.UNAUTHORIZED);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
        }
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.position || 'USER',
        });
        const refreshToken = generateRefreshToken({ userId: user.id });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expires_at: expiresAt,
            },
        });
        await prisma.users.update({
            where: { id: user.id },
            data: {
                last_login: new Date(),
                login_count: (user.login_count || 0) + 1,
            },
        });
        logger.info(`User logged in: ${user.email}`);
        return {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                position: user.position,
                department_id: user.department_id,
                business_unit_id: user.business_unit_id,
            },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: 3600,
            },
        };
    }
    // ------------------------------------------------------
    // REGISTER
    // ------------------------------------------------------
    async register(data) {
        const existingUser = await prisma.users.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existingUser) {
            throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'User with this email already exists', HTTP_STATUS.CONFLICT);
        }
        const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
        const user = await prisma.users.create({
            data: {
                email: data.email.toLowerCase(),
                password_hash,
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                position: data.position,
                department_id: data.department_id,
                business_unit_id: data.business_unit_id,
                employee_id: data.employee_id || '',
                status: 'Active',
                two_factor_enabled: false,
            },
        });
        logger.info(`New user registered: ${user.email}`);
        return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            position: user.position,
            department_id: user.department_id,
            business_unit_id: user.business_unit_id,
            employee_id: user.employee_id,
        };
    }
    // ------------------------------------------------------
    // REFRESH TOKEN
    // ------------------------------------------------------
    async refreshToken(refreshToken) {
        try {
            const decoded = verifyRefreshToken(refreshToken);
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken },
            });
            if (!storedToken) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
            }
            if (new Date() > storedToken.expires_at) {
                await prisma.refreshToken.delete({ where: { token: refreshToken } });
                throw new AppError(ERROR_CODES.TOKEN_EXPIRED, 'Refresh token expired', HTTP_STATUS.UNAUTHORIZED);
            }
            const user = await prisma.users.findUnique({
                where: { id: decoded.userId },
            });
            if (!user || user.status !== 'Active') {
                throw new AppError(ERROR_CODES.UNAUTHORIZED, 'User not found or inactive', HTTP_STATUS.UNAUTHORIZED);
            }
            const accessToken = generateAccessToken({
                userId: user.id,
                email: user.email,
                role: user.position || 'USER',
            });
            return { accessToken, expiresIn: 3600 };
        }
        catch (err) {
            if (err instanceof AppError)
                throw err;
            throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
        }
    }
    // ------------------------------------------------------
    // LOGOUT
    // ------------------------------------------------------
    async logout(refreshToken) {
        try {
            await prisma.refreshToken.delete({
                where: { token: refreshToken },
            });
            logger.info('User logged out');
        }
        catch {
            logger.debug('Logout: Token not found');
        }
    }
    // ------------------------------------------------------
    // CHANGE PASSWORD
    // ------------------------------------------------------
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.users.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', HTTP_STATUS.NOT_FOUND);
        }
        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid) {
            throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'Current password incorrect', HTTP_STATUS.UNAUTHORIZED);
        }
        const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await prisma.users.update({
            where: { id: userId },
            data: { password_hash },
        });
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });
        logger.info(`Password changed: ${user.email}`);
        return { message: 'Password changed successfully' };
    }
    // ------------------------------------------------------
    // CURRENT USER
    // ------------------------------------------------------
    async getCurrentUser(userId) {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                position: true,
                department_id: true,
                business_unit_id: true,
                employee_id: true,
                status: true,
                last_login: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!user) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', HTTP_STATUS.NOT_FOUND);
        }
        return user;
    }
}
//# sourceMappingURL=auth.service.js.map