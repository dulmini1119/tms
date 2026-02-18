import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { PortalService } from "./portal.service.js";

const sendError = (res: Response, error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : fallback;
  return res.status(500).json({ message });
};

export const getDriverDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const data = await PortalService.getDriverDashboard(req.user!.id);
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch driver dashboard");
  }
};

export const getDriverAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const viewMode = (req.query.viewMode as string) || "all";
    const data = await PortalService.getDriverAssignments(req.user!.id, viewMode);
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch driver assignments");
  }
};

export const startDriverTrip = async (req: AuthRequest, res: Response) => {
  try {
    await PortalService.startDriverTrip(req.user!.id, req.params.id, req.body || {});
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, "Failed to start trip");
  }
};

export const endDriverTrip = async (req: AuthRequest, res: Response) => {
  try {
    await PortalService.endDriverTrip(req.user!.id, req.params.id, req.body || {});
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, "Failed to complete trip");
  }
};

export const getDriverTripLogs = async (req: AuthRequest, res: Response) => {
  try {
    const month = req.query.month as string | undefined;
    const data = await PortalService.getDriverTripLogs(req.user!.id, month);
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch trip logs");
  }
};

export const getDriverProfile = async (req: AuthRequest, res: Response) => {
  try {
    const data = await PortalService.getDriverProfile(req.user!.id);
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch profile");
  }
};

export const getTeamDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const data = await PortalService.getTeamDashboard(req.user!.id);
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch team dashboard");
  }
};

export const getTeamApprovalQueue = async (req: AuthRequest, res: Response) => {
  try {
    const data = await PortalService.getTeamApprovalQueue(req.user!.id);
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch approval queue");
  }
};

export const getTeamApprovalNotifications = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = await PortalService.getTeamApprovalQueue(req.user!.id);
    return res.json({
      unreadCount: data.notifications.unreadCount,
      latest: data.approvals.slice(0, 5),
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch notifications");
  }
};

export const processTeamApprovalAction = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const action = (req.body?.action || "").toString();
    if (action !== "Approved" && action !== "Rejected") {
      return res
        .status(400)
        .json({ message: "action must be Approved or Rejected" });
    }

    const data = await PortalService.processTeamApproval(req.user!.id, req.params.id, {
      action,
      comments: req.body?.comments,
    });
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to process approval");
  }
};

export const getVehicleAdminDashboard = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = await PortalService.getVehicleAdminDashboard(req.user!.id);
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch vehicle admin dashboard");
  }
};

export const getVehicleAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const data = await PortalService.getVehicleAdminProfile(req.user!.id);
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch vehicle admin profile");
  }
};

export const getVehicleAdminApprovedTrips = async (
  _req: AuthRequest,
  res: Response,
) => {
  try {
    const data = await PortalService.getVehicleAdminApprovedTrips();
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch approved trips");
  }
};

export const getVehicleAdminAssignments = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await PortalService.getVehicleAdminAssignments();
    return res.json(data);
  } catch (error) {
    return sendError(res, error, "Failed to fetch vehicle assignments");
  }
};

export const assignVehicleAdminTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { tripRequestId, vehicleId, driverId, assignmentNotes } = req.body || {};
    if (!tripRequestId || !vehicleId || !driverId) {
      return res
        .status(400)
        .json({ message: "tripRequestId, vehicleId and driverId are required" });
    }

    const data = await PortalService.assignVehicleAdminTrip(req.user!.id, {
      tripRequestId,
      vehicleId,
      driverId,
      assignmentNotes,
    });
    return res.status(201).json(data);
  } catch (error) {
    return sendError(res, error, "Failed to assign vehicle");
  }
};
