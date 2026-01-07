import Joi from "joi";

export const createAssignmentSchema = Joi.object({
  tripRequestId: Joi.string().uuid().required(),
  vehicleId: Joi.string().uuid().required(),
  driverId: Joi.string().uuid().required(),
  assignmentStatus: Joi.string().valid("Assigned", "Accepted", "Rejected", "Started", "Completed", "Cancelled").default("Assigned"),
  scheduledDeparture: Joi.date().iso().required(),
  scheduledReturn: Joi.date().iso().optional().allow(""),
  assignmentNotes: Joi.string().max(500).optional().allow(""),
});

export const updateAssignmentSchema = Joi.object({
  vehicleId: Joi.string().uuid().optional(),
  driverId: Joi.string().uuid().optional(),
  assignmentStatus: Joi.string().valid("Assigned", "Accepted", "Rejected", "Started", "Completed", "Cancelled").optional(),
  scheduledDeparture: Joi.date().iso().optional(),
  scheduledReturn: Joi.date().iso().optional().allow(""),
  assignmentNotes: Joi.string().max(500).optional().allow(""),
  
  // Embedded Vehicle Details (as per frontend 'Edit Assignment' logic)
  vehicleDetails: Joi.object({
    mileage: Joi.number().min(0).optional(),
    seatingCapacity: Joi.number().integer().min(1).optional(),
    insuranceExpiry: Joi.date().iso().optional(),
    lastService: Joi.date().iso().optional().allow(""),
    nextService: Joi.date().iso().optional().allow(""),
    status: Joi.string().optional(),
  }).optional(),

  // Embedded Driver Details
  driverDetails: Joi.object({
    licenseExpiryDate: Joi.date().iso().optional().allow(""),
  }).optional(),
});

export const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});