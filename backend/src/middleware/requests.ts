// src/middleware/trip.ts

import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from './auth.js';
import ApiResponse from '../utils/response.js';

// You can later move this to a constants file
const EDITABLE_STATUSES = new Set(['Pending']);
// If you want to allow corrections after rejection:
// EDITABLE_STATUSES.add('Rejected');

export const restrictEditAfterApproval = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const { id } = req.params;

  try {
    const trip = await prisma.trip_requests.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!trip) {
      return ApiResponse.error(res, 'NOT_FOUND', 'Trip request not found', 404);
    }

    if (!trip.status || !EDITABLE_STATUSES.has(trip.status)) {
      return ApiResponse.error(
        res,
        'FORBIDDEN',
        `Cannot edit trip request in status "${trip.status}". ` +
          'Only Pending requests can be modified.',
        403
      );
    }

    next();
  } catch (error) {
    console.error('Edit restriction check failed:', error);
    return ApiResponse.error(res, 'INTERNAL_ERROR', 'Server error', 500);
  }
};