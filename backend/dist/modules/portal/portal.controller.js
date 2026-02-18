import { PortalService } from "./portal.service.js";
const sendError = (res, error, fallback) => {
    const message = error instanceof Error ? error.message : fallback;
    return res.status(500).json({ message });
};
export const getDriverDashboard = async (req, res) => {
    try {
        const data = await PortalService.getDriverDashboard(req.user.id);
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch driver dashboard");
    }
};
export const getDriverAssignments = async (req, res) => {
    try {
        const viewMode = req.query.viewMode || "all";
        const data = await PortalService.getDriverAssignments(req.user.id, viewMode);
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch driver assignments");
    }
};
export const startDriverTrip = async (req, res) => {
    try {
        await PortalService.startDriverTrip(req.user.id, req.params.id, req.body || {});
        return res.status(204).send();
    }
    catch (error) {
        return sendError(res, error, "Failed to start trip");
    }
};
export const endDriverTrip = async (req, res) => {
    try {
        await PortalService.endDriverTrip(req.user.id, req.params.id, req.body || {});
        return res.status(204).send();
    }
    catch (error) {
        return sendError(res, error, "Failed to complete trip");
    }
};
export const getDriverTripLogs = async (req, res) => {
    try {
        const month = req.query.month;
        const data = await PortalService.getDriverTripLogs(req.user.id, month);
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch trip logs");
    }
};
export const getDriverProfile = async (req, res) => {
    try {
        const data = await PortalService.getDriverProfile(req.user.id);
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch profile");
    }
};
export const getTeamDashboard = async (req, res) => {
    try {
        const data = await PortalService.getTeamDashboard(req.user.id);
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch team dashboard");
    }
};
export const getTeamApprovalQueue = async (req, res) => {
    try {
        const data = await PortalService.getTeamApprovalQueue(req.user.id);
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch approval queue");
    }
};
export const getTeamApprovalNotifications = async (req, res) => {
    try {
        const data = await PortalService.getTeamApprovalQueue(req.user.id);
        return res.json({
            unreadCount: data.notifications.unreadCount,
            latest: data.approvals.slice(0, 5),
        });
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch notifications");
    }
};
export const processTeamApprovalAction = async (req, res) => {
    try {
        const action = (req.body?.action || "").toString();
        if (action !== "Approved" && action !== "Rejected") {
            return res
                .status(400)
                .json({ message: "action must be Approved or Rejected" });
        }
        const data = await PortalService.processTeamApproval(req.user.id, req.params.id, {
            action,
            comments: req.body?.comments,
        });
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to process approval");
    }
};
export const getVehicleAdminDashboard = async (req, res) => {
    try {
        const data = await PortalService.getVehicleAdminDashboard(req.user.id);
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch vehicle admin dashboard");
    }
};
export const getVehicleAdminProfile = async (req, res) => {
    try {
        const data = await PortalService.getVehicleAdminProfile(req.user.id);
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch vehicle admin profile");
    }
};
export const getVehicleAdminApprovedTrips = async (_req, res) => {
    try {
        const data = await PortalService.getVehicleAdminApprovedTrips();
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch approved trips");
    }
};
export const getVehicleAdminAssignments = async (_req, res) => {
    try {
        const data = await PortalService.getVehicleAdminAssignments();
        return res.json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to fetch vehicle assignments");
    }
};
export const assignVehicleAdminTrip = async (req, res) => {
    try {
        const { tripRequestId, vehicleId, driverId, assignmentNotes } = req.body || {};
        if (!tripRequestId || !vehicleId || !driverId) {
            return res
                .status(400)
                .json({ message: "tripRequestId, vehicleId and driverId are required" });
        }
        const data = await PortalService.assignVehicleAdminTrip(req.user.id, {
            tripRequestId,
            vehicleId,
            driverId,
            assignmentNotes,
        });
        return res.status(201).json(data);
    }
    catch (error) {
        return sendError(res, error, "Failed to assign vehicle");
    }
};
//# sourceMappingURL=portal.controller.js.map