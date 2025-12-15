// src/middleware/auth.ts

import { Request, Response, NextFunction, ParamsDictionary } from 'express-serve-static-core'; // Import core types
import { ParsedQs } from 'qs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';

// --- CHANGE 1: Make AuthRequest generic ---
// This allows it to be used like AuthRequest<{}, {}, CreateDepartmentDto> in your controllers
export interface AuthRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  Query = ParsedQs,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, Query, Locals> {
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    department_id?: string;
    business_unit_id?: string;
    manager_id?: string;
  };
}

const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET!;
  return jwt.sign({ userId }, secret, { expiresIn: '15m' });
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  console.log("Auth middleware: Cokkies received are" ,req.cookies);
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
      return ApiResponse.error(res, 'UNAUTHORIZED', 'No token provided', 401);
    }

    // Try access token
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as { userId: string };
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
          return next();
        }
      } catch (err) {
        // Expired or invalid → fall through to refresh token
        logger.debug('Access token invalid or expired');
      }
    }

    // Try refresh token
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
        // --- CHANGE 2 (Optional but Recommended): Fetch full user data on refresh for consistency ---
        const user = await prisma.users.findUnique({
          where: { id: decoded.userId },
          select: { // Select the same full set of fields
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

        // Attach the full user object, not just id and email
        req.user = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          department_id: user.department_id || undefined,
          business_unit_id: user.business_unit_id || undefined,
          manager_id: user.manager_id || undefined,
        };
        return next();
      } catch (err) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return ApiResponse.error(res, 'TOKEN_EXPIRED', 'Session expired', 401);
      }
    }

    return ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication failed', 401);
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return ApiResponse.error(res, 'INTERNAL_ERROR', 'Authentication failed', 500);
  }
};