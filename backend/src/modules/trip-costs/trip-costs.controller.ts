import { NextFunction, Response } from "express";
// FIX 1: Added .js extension (Required by ES Modules)
import { AuthRequest } from "../../middleware/auth.js";
import * as costService from "./trip-costs.service.js";
import prisma from "../../config/database.js";

/**
 * Get all trip costs with optional filtering
 */
export const getAllTripCosts = async (req: AuthRequest, res: Response) => {
  try {
    const { status, vendor_id, start_date, end_date, page, pageSize } = req.query;

    // Explicitly cast query params to strings to satisfy TypeScript strict types
    const filters = {
      status: (status as string) || "all-status",
      vendor_id: (vendor_id as string) || "all-vendors",
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
      page: (page as string) || "1",
      pageSize: (pageSize as string) || "10",
      user: req.user,
    };

    const result = await costService.getAllTripCosts(filters);
    res.json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get a specific trip cost by ID
 */
export const getTripCostById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await costService.getTripCostById(id);

    res.json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.message === "Trip Cost not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Create a new trip cost entry
 */
export const createTripCost = async (req: AuthRequest, res: Response) => {
  try {
    const payload = {
      ...req.body,
      createdByUserId: req.user!.id,
    };

    const newCost = await costService.createTripCost(payload);
    res.status(201).json(newCost);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Update trip cost details
 */
export const updateTripCost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const payload = {
      ...req.body,
      updatedByUserId: req.user!.id,
    };

    const updatedCost = await costService.updateTripCost(id, payload);
    res.json(updatedCost);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Trip Cost not found" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Delete a trip cost entry
 */
export const deleteTripCost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await costService.deleteTripCost(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Trip Cost not found" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Generate Invoice for a specific trip cost
 */
export const generateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const payload = {
      ...req.body,
      generatedByUserId: req.user!.id,
    };

    const result = await costService.generateInvoice(id, payload);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.message === "Trip Cost not found") return res.status(404).json({ error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Record Payment for a trip cost
 */
export const recordPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const payload = {
      ...req.body,
      paymentRecordedByUserId: req.user!.id,
    };

    const result = await costService.recordPayment(id, payload);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.message === "Trip Cost not found") return res.status(404).json({ error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Middleware: Restrict editing costs if invoice is generated or paid
 */
export const restrictEditIfFinalized = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const cost = await prisma.trip_costs.findUnique({
      where: { id },
      select: {
        payment_status: true,
        invoice_number: true,
      },
    });

    if (!cost) {
      return res.status(404).json({ error: "Trip cost record not found" });
    }

    const allowedEditStatuses = ["Draft", "Pending"];

    const isFinalized =
      cost.payment_status === "Paid" ||
      (cost.invoice_number && cost.payment_status !== "Draft");

    if (!cost.payment_status || !allowedEditStatuses.includes(cost.payment_status) || isFinalized) {
      return res.status(403).json({
        error: `Cannot edit trip cost. Current status: ${cost.payment_status}. ` +
               "Contact administrator to reverse payments or void invoice."
      });
    }

    next();
  } catch (error: any) {
    console.error("Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};