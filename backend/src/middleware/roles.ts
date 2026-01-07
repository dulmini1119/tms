// src/middleware/roles.ts

import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from './auth.js';
import ApiResponse from '../utils/response.js';

export const requireOwnershipOrAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const { id } = req.params;

  if (!req.user) {
    return ApiResponse.error(res, 'UNAUTHORIZED', 'User not authenticated', 401);
  }

  // Allow full access if user is admin / super-admin
  // Adjust the condition based on how you store roles in your users table
  // Option A: if you have a role field
  // if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') return next();

  // Option B: if you use a boolean isAdmin / isSuperAdmin field (common)
  // if (req.user.isAdmin || req.user.isSuperAdmin) return next();

  // Option C: if you determine admin by absence of department/manager (fallback – less recommended)
  const isAdmin = !req.user.department_id && !req.user.manager_id; // adjust logic to your reality

  if (isAdmin) {
    return next();
  }

  try {
    const trip = await prisma.trip_requests.findUnique({
      where: { id },
      select: { requested_by_user_id: true },
    });

    if (!trip) {
      return ApiResponse.error(res, 'NOT_FOUND', 'Trip request not found', 404);
    }

    if (trip.requested_by_user_id !== req.user.id) {
      return ApiResponse.error(
        res,
        'FORBIDDEN',
        'You are not authorized to modify this trip request',
        403
      );
    }

    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return ApiResponse.error(res, 'INTERNAL_ERROR', 'Server error', 500);
  }
};

// Optional: pure admin check for other routes (e.g. delete all, manage departments)
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.user) {
    return ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  const isAdmin = /* your admin condition here, e.g. */ true; // replace with real check

  if (!isAdmin) {
    return ApiResponse.error(res, 'FORBIDDEN', 'Admin access required', 403);
  }

  next();
};