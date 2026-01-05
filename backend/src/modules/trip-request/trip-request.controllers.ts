import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import * as tripService from "./trip-request.service.js";
import { createTripRequestSchema, updateTripRequestSchema } from "./trip-request.validation.js";

// Helper function
const validateRequest = (schema: any, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((detail: any) => detail.message);
    return { isValid: false, errors };
  }
  return { isValid: true, value };
};

// Helper specifically for updates to ensure partial data is valid
const validateUpdateRequest = (schema: any, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: false });
  if (error) {
    const errors = error.details.map((detail: any) => detail.message);
    return { isValid: false, errors };
  }
  return { isValid: true, value };
};

export const getAllTripRequests = async (req: AuthRequest, res: Response) => {
  try {
    const {
      searchTerm = '',
      status = 'all-status',
      department = 'all-departments',
      priority = 'all-priorities',
      page = '1',
      pageSize = '10',
    } = req.query;

    const filters = { searchTerm, status, department, priority, page, pageSize };

    const result = await tripService.getAllTripRequests(filters);
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
    if (error.message === "Trip Request not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createTripRequest = async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateRequest(createTripRequestSchema, req.body);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const newRequest = await tripService.createTripRequest(validation.value);
    res.status(201).json(newRequest);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.code === 'P2002') {
        return res.status(400).json({ error: "Unique constraint failed (Request Number might exist)" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateTripRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validation = validateUpdateRequest(updateTripRequestSchema, req.body);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const updatedRequest = await tripService.updateTripRequest(id, validation.value);
    res.json(updatedRequest);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Trip Request not found" });
    }
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
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Trip Request not found" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};