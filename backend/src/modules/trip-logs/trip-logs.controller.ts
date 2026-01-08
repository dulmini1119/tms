import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import * as tripLogService from "./trip-logs.service.js";
import prisma from "../../config/database.js";

/**
 * Get all Trip Logs with filtering, search, and pagination
 */
export const getAllTripLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      searchTerm = "", 
      status = "all", 
      page = "1", 
      pageSize = "10",
      startDate,
      endDate 
    } = req.query;
    
    const result = await tripLogService.getAllTripLogs({
      searchTerm: searchTerm as string,
      status: status as string,
      page: Number(page),
      pageSize: Number(pageSize),
      startDate: startDate as string,
      endDate: endDate as string,
      user: req.user,
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get a single Trip Log by ID
 */
export const getTripLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await tripLogService.getTripLogById(id);
    
    if (!result) {
      return res.status(404).json({ error: "Trip Log not found" });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Create a new Trip Log
 */
export const createTripLog = async (req: AuthRequest, res: Response) => {
  try {
    // Assuming the context (who is recording the log) is the authenticated user
    // though typically logs might be auto-generated or created by admins/dispatchers
    const payload = {
      ...req.body,
      // createdByUserId: req.user?.id, // Optional: if you want to track who created the log entry
    };
    
    const newLog = await tripLogService.createTripLog(payload);
    res.status(201).json(newLog);
  } catch (error: any) {
    console.error("Controller Error:", error);
    // Handle Prisma unique constraint violation for trip_number
    if (error.code === "P2002") {
      return res.status(400).json({ error: "A log with this trip number already exists." });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Update a Trip Log (Used for GPS updates, completion, etc.)
 */
export const updateTripLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updatedLog = await tripLogService.updateTripLog(id, req.body);
    
    if (!updatedLog) {
      return res.status(404).json({ error: "Trip Log not found" });
    }
    
    res.json(updatedLog);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.code === "P2025") return res.status(404).json({ error: "Trip Log not found" });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Delete a Trip Log (Soft delete or hard delete)
 */
export const deleteTripLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await tripLogService.deleteTripLog(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.code === "P2025") return res.status(404).json({ error: "Trip Log not found" });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Export Trip Logs to CSV
 */
export const exportTripLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const csvData = await tripLogService.generateTripLogCsv({
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=trip_logs.csv");
    res.send(csvData);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to export logs" });
  }
};

/**
 * Middleware: Restrict updates if the trip is already 'Completed' or 'Cancelled'
 * (Similar to restrictEditAfterApproval in your previous code)
 */
export const restrictUpdateIfFinalized = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  const trip = await prisma.trip_logs.findUnique({
    where: { id },
    select: { trip_status: true },
  });

  if (!trip) return res.status(404).json({ error: "Trip log not found" });

  const finalStatuses = ["Completed", "Cancelled"];

  if (trip.trip_status && finalStatuses.includes(trip.trip_status)) {
    return res.status(403).json({
      error: `Cannot modify a trip log with status: ${trip.trip_status}.`,
    });
  }

  next();
};