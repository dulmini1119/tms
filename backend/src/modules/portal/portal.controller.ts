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

