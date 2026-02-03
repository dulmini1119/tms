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

export const updateExpiryAlert = async (
  req: AuthRequest<{ id: string }, {}, any>,
  res: Response
) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const { assigned_to, ...restOfBody } = req.body;

    const isValidUUID = (str: string) => {
      return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(str);
    };

    const sanitizedBody = { ...restOfBody };

    // Handle 'assigned_to' (Relation)
    if (assigned_to && isValidUUID(assigned_to)) {
      sanitizedBody.users_expiry_alerts_assigned_toTousers = {
        connect: { id: assigned_to }
      };
      delete sanitizedBody.assigned_to;
    }

    // ❌ REMOVE THIS BLOCK: updated_by is not in your schema
    // if (userId) {
    //   sanitizedBody.updated_by = userId;
    //   if (sanitizedBody.status === "Renewed") {
    //     sanitizedBody.resolved_by = userId; // Wait, resolved_by IS in schema
    //   }
    // }

    // ✅ We keep resolved_by logic because it IS in schema
    if (userId && restOfBody.status === "Renewed") {
      sanitizedBody.users_expiry_alerts_resolved_byTousers = {
        connect: { id: userId }
      };
      delete sanitizedBody.resolved_by;
    }

    const updatedAlert = await expiryAlertService.updateExpiryAlert(id, sanitizedBody);
    
    return res.status(200).json(updatedAlert);
  } catch (error: any) {
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    return res.status(500).json({ 
      message: "Error updating alert", 
      details: error.message 
    });
  }
};

export const triggerSync = async (req: AuthRequest, res : Response) => {
  try{
    const count = await expiryAlertService.syncExpiryAlerts();
    res.status(200).json({
      message: "Sync completes successfully",
      alert_created: count
    });
  }catch(error){
    console.error("Error during sync:", error);
    res.status(500).json({ message: "Internal server error during sync" });
  }
}


