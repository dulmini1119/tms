import bcrypt from 'bcrypt';
import prisma from '../../config/database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ERROR_CODES, HTTP_STATUS } from '../../utils/constants.js';
import logger from '../../utils/logger.js';
import config from '../../config/environment.js';

const SALT_ROUNDS = 10;

export class AuthService {

  // ------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------
// ------------------------------------------------------
// LOGIN – FULLY WORKING WITH "Remember Me"
// ------------------------------------------------------
async login(email: string, password: string, rememberMe: boolean = false) {
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      'Invalid email or password',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (user.status !== 'Active') {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      'Your account is not active. Please contact administrator.',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      'Invalid email or password',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // === "Remember Me" Logic – Override config temporarily ===
  const originalAccessExpiry = config.jwt.expiry;
  const originalRefreshExpiry = config.jwt.refreshExpiry;

  // Set dynamic expiry
  config.jwt.expiry = rememberMe ? '30d' : originalAccessExpiry;
  config.jwt.refreshExpiry = rememberMe ? '30d' : originalRefreshExpiry;

  // === Generate tokens using your current jwt.ts (no changes needed) ===
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.position || 'USER',
  });

  const refreshToken = generateRefreshToken({ userId: user.id });

  // === Restore original config (optional but clean) ===
  config.jwt.expiry = originalAccessExpiry;
  config.jwt.refreshExpiry = originalRefreshExpiry;

  // === Store refresh token with correct expiry ===
  const refreshTokenExpiresIn = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + refreshTokenExpiresIn);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expires_at: expiresAt,
    },
  });

  // Update login stats
  await prisma.users.update({
    where: { id: user.id },
    data: {
      last_login: new Date(),
      login_count: (user.login_count || 0) + 1,
    },
  });

  logger.info(`User logged in: ${user.email} | Remember Me: ${rememberMe}`);

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
      expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 3600, // 30 days or 1 hour
    },
  };
}

  // ------------------------------------------------------
  // REGISTER
  // ------------------------------------------------------
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    position: string;
    department_id?: string;
    business_unit_id?: string;
    employee_id?: string;
  }) {

    const existingUser = await prisma.users.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError(
        ERROR_CODES.ALREADY_EXISTS,
        'User with this email already exists',
        HTTP_STATUS.CONFLICT
      );
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
  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const storedToken = await (prisma as any).refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken) {
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          'Invalid refresh token',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      if (new Date() > storedToken.expires_at) {
        await (prisma as any).refreshToken.delete({ where: { token: refreshToken } });
        throw new AppError(
          ERROR_CODES.TOKEN_EXPIRED,
          'Refresh token expired',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.status !== 'Active') {
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          'User not found or inactive',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.position || 'USER',
      });

      return { accessToken, expiresIn: 3600 };

    } catch (err) {
      if (err instanceof AppError) throw err;

      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Invalid refresh token',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
  }

  // ------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------
  async logout(refreshToken: string) {
    try {
      await (prisma as any).refreshToken.delete({
        where: { token: refreshToken },
      });
      logger.info('User logged out');
    } catch {
      logger.debug('Logout: Token not found');
    }
  }

  // ------------------------------------------------------
  // CHANGE PASSWORD
  // ------------------------------------------------------
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', HTTP_STATUS.NOT_FOUND);
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!valid) {
      throw new AppError(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Current password incorrect',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.users.update({
      where: { id: userId },
      data: { password_hash },
    });

    await (prisma as any).refreshToken.deleteMany({
      where: { userId },
    });

    logger.info(`Password changed: ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  // ------------------------------------------------------
  // CURRENT USER
  // ------------------------------------------------------
  async getCurrentUser(userId: string) {
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
