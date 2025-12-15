import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { CabServicesService } from "./cab-service.service.js";
import { createCabServiceSchema, updateCabServiceSchema } from "./cab-service.validation.js"; // <-- IMPORT updateCabServiceSchema

/**
 * Create cab service
 */
export const createCabService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
    console.log("Received request user:", req.user, req.body);
  try {
    const { error, value } = createCabServiceSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: "Invalid request data", details: error.details });
      return;
    }
    const service = await CabServicesService.create(
      value,
      req.user!.id
    );

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: "Failed to create cab service" });
    console.error("Error creating cab service:", error);
  }
};

/**
 * List cab services
 */
export const listCabServices = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const services = await CabServicesService.list(req.query);

    // NOTE: The frontend expects `vehicles_count`, not `vehicleCount`.
    const formatted = services.map((s) => ({
      ...s,
      vehicles_count: s.vehicles.length, // <-- FIX: was vehicleCount
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cab services" });
  }
};

/**
 * Update cab service
 */
export const updateCabService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // --- ADD VALIDATION ---
    const { error, value } = updateCabServiceSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: "Invalid request data", details: error.details });
      return;
    }
    // --------------------

    const service = await CabServicesService.update(
      req.params.id,
      value, // <-- Use the validated value
      req.user!.id
    );

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: "Failed to update cab service" });
  }
};

/**
 * Delete cab service
 */
export const deleteCabService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await CabServicesService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete cab service" });
  }
};