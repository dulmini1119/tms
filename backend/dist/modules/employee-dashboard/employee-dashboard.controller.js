import prisma from '../../config/database.js';
import ApiResponse from '../../utils/response.js';
import logger from '../../utils/logger.js';
export const getEmployeeDashboard = async (req, res) => {
    try {
        if (!req.user) {
            return ApiResponse.error(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }
        const userId = req.user.id;
        // Load full user so UI can show names (department/business unit) instead of UUIDs
        const currentUser = await prisma.users.findUnique({
            where: { id: userId },
            include: {
                departments_users_department_idTodepartments: {
                    select: { id: true, name: true },
                },
                business_units_users_business_unit_idTobusiness_units: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!currentUser) {
            return ApiResponse.error(res, 'NOT_FOUND', 'User not found', 404);
        }
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
                id: currentUser.id,
                first_name: currentUser.first_name,
                last_name: currentUser.last_name,
                email: currentUser.email,
                department_id: currentUser.department_id,
                business_unit_id: currentUser.business_unit_id,
                department_name: currentUser.departments_users_department_idTodepartments?.name || null,
                business_unit_name: currentUser.business_units_users_business_unit_idTobusiness_units?.name || null,
            },
            stats,
            recentTrips,
            upcomingTrips,
        });
    }
    catch (err) {
        logger.error('Employee Dashboard error:', err);
        return ApiResponse.error(res, 'SERVER_ERROR', 'Failed to fetch dashboard', 500);
    }
};
//# sourceMappingURL=employee-dashboard.controller.js.map