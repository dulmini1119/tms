// src/modules/employee-dashboard/employee-dashboard.controller.ts
import { Response } from 'express';
import prisma from '../../config/database.js';
import { AuthRequest } from '../../middleware/auth.js';
import ApiResponse from '../../utils/response.js';
import logger from '../../utils/logger.js';

export const getEmployeeDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return ApiResponse.error(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    const userId = req.user.id;

    // Fetch trips for this employee
    const trips = await prisma.trip_requests.findMany({
      where: { requested_by_user_id: userId },
      include: {
        trip_approvals: true, // Include approval info
      },
      orderBy: { departure_date: 'desc' },
    });

    const now = new Date();

    // Separate recent and upcoming trips
    const recentTrips = trips.filter(t => new Date(t.departure_date) <= now);
    const upcomingTrips = trips.filter(t => new Date(t.departure_date) > now);

    // Calculate stats
    const stats = {
      totalTrips: trips.length,
      pendingRequests: trips.filter(t => t.status === 'Pending').length,
      approvedTrips: trips.filter(t => t.status === 'Approved').length,
      completedTrips: trips.filter(t => t.status === 'Completed').length,
    };

    return ApiResponse.success(res, {
      user: {
        id: req.user.id,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        email: req.user.email,
        department_id: req.user.department_id,
        business_unit_id: req.user.business_unit_id,
      },
      stats,
      recentTrips,
      upcomingTrips,
    });
  } catch (err) {
    logger.error('Employee Dashboard error:', err);
    return ApiResponse.error(res, 'SERVER_ERROR', 'Failed to fetch dashboard', 500);
  }
};
