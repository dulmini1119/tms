import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import * as tripAssignmentService from "./trip-assignments.service.js";
import { createAssignmentSchema, updateAssignmentSchema, paramsSchema } from "./trip-assignments.validation.js";

// Helper for validation
const validateRequest = (schema: any, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((detail: any) => detail.message);
    return { isValid: false, errors };
  }
  return { isValid: true, value };
};

export const getAllTripAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { search = "", status = "all", page = "1", pageSize = "10" } = req.query;
    
    const filters = { 
      searchTerm: search as string, 
      status: status as string, 
      page: parseInt(page as string), 
      pageSize: parseInt(pageSize as string) 
    };

    const result = await tripAssignmentService.getAllAssignments(filters);
    res.json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAssignmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await tripAssignmentService.getAssignmentById(id);
    res.json(result);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.message === "Assignment not found") return res.status(404).json({ error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateRequest(createAssignmentSchema, req.body);
    if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

    // Inject user who assigned it
    const payload = {
      ...validation.value,
      assignedBy: req.user!.id, 
    };

    const newAssignment = await tripAssignmentService.createAssignment(payload);
    res.status(201).json(newAssignment);
  } catch (error: any) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validation = validateRequest(updateAssignmentSchema, req.body);
    if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

    const updatedAssignment = await tripAssignmentService.updateAssignment(id, validation.value);
    res.json(updatedAssignment);
  } catch (error: any) {
    console.error("Controller Error:", error);
    if (error.message === "Assignment not found") return res.status(404).json({ error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
};