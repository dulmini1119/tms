import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import * as expiryAlertService from "./expiry-alerts.service.js";

interface CreateExpiryAlertDto {
  alert_type: string;
  entity_type: "Vehicle" | "Driver" | "Document" | "Insurance";
  entity_id: string;
  expiry_date: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  assigned_to?: string;
  notes?: string;
}

export const createExpiryAlert = async (
  req: AuthRequest<{}, {}, CreateExpiryAlertDto>,
  res: Response
) => {
  const userId = req.user!.id;

  try{
    const alert = await expiryAlertService.createExpiryAlert({
    ...req.body,
    created_by: userId,
  });

  return res.status(201).json(alert);
  }catch(error){
    console.error("Error creating expiry alert:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const getExpiryAlerts = async (req: AuthRequest, res: Response) => {
    try{
        const alerts = await expiryAlertService.getExpiryAlerts();
        return res.status(200).json(alerts);
    }catch (error){
        console.error("Error fetching expiry alerts:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// expiry-alerts.controller.ts
export const updateExpiryAlert = async (
  req: AuthRequest<{ id: string }, {}, any>,
  res: Response
) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    // 1. Destructure the body
    const { assigned_to, ...restOfBody } = req.body;

    // 2. Helper function to check if a string is a valid UUID
    const isValidUUID = (str: string) => {
      return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(str);
    };

    // 3. Create sanitized body
    const sanitizedBody = { ...restOfBody };

    // Only add assigned_to if it is actually a UUID, otherwise ignore it (prevents crash)
    if (assigned_to && isValidUUID(assigned_to)) {
      sanitizedBody.assigned_to = assigned_to;
    }

    // Only update updated_by/resolved_by if we have a valid user ID
    if (userId) {
      sanitizedBody.updated_by = userId;
      if (req.body.status === "Renewed") {
        sanitizedBody.resolved_by = userId;
      }
    }

    // 4. Pass sanitized data to service
    const updatedAlert = await expiryAlertService.updateExpiryAlert(id, sanitizedBody);
    
    return res.status(200).json(updatedAlert);
  } catch (error) {
    console.error("Error updating alert:", error); // Log the specific error in console
    return res.status(500).json({ message: "Error updating alert", error });
  }
};

