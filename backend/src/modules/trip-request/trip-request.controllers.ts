import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import * as tripService from "./trip-request.service.js";
import prisma from "../../config/database.js";

export const getAllTripRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { searchTerm = "", status = "all-status", department = "all-departments", priority = "all-priorities", page = "1", pageSize = "10" } = req.query;
    
    const result = await tripService.getAllTripRequests({ searchTerm, status, department, priority, page, pageSize, user: req.user });
    res.json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTripRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await tripService.getTripRequestById(id);
    res.json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.message === "Trip Request not found") return res.status(404).json({ error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createTripRequest = async (req: AuthRequest, res: Response) => {
  try {
    // Inject User ID from auth middleware
    const payload = {
      ...req.body,
      requestedByUserId: req.user!.id,
    };
    
    const newRequest = await tripService.createTripRequest(payload);
    res.status(201).json(newRequest);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateTripRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updatedRequest = await tripService.updateTripRequest(id, req.body);
    res.json(updatedRequest);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.code === "P2025") return res.status(404).json({ error: "Trip Request not found" });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteTripRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await tripService.deleteTripRequest(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.code === "P2025") return res.status(404).json({ error: "Trip Request not found" });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// trip-request.controllers.ts or a new middleware
export const restrictEditAfterApproval = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const trip = await prisma.trip_requests.findUnique({
    where: { id },
    select: {
      status: true,
      requested_by_user_id: true,   // ← currently unused
    },
  });

  if (!trip) return res.status(404).json({ error: "Trip request not found" });

  const allowedEditStatuses = ["Pending" /* , "Rejected" if you want */];

  if (!trip.status || !allowedEditStatuses.includes(trip.status)) {
    return res.status(403).json({
      error: `Cannot edit trip request in status: ${trip.status}. ` +
             "Please cancel and create a new request if changes are required."
    });
  }

  next();
};