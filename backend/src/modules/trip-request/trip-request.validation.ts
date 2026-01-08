import Joi from "joi";

const locationSchema = Joi.object({
  address: Joi.string().required().messages({ "string.empty": "Address is required" }),
  coordinates: Joi.object({
    lat: Joi.number().allow(null).optional(),
    lng: Joi.number().allow(null).optional(),
  }).optional(),
});

const userSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  department: Joi.string().required(),
  employeeId: Joi.string().allow("", null).optional(),
});

const tripDetailsSchema = Joi.object({
  fromLocation: locationSchema.required(),
  toLocation: locationSchema.required(),
  departureDate: Joi.string().isoDate().required(),
  departureTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  returnDate: Joi.string().isoDate().allow(null, "").optional(),
  returnTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, "").optional(),
  isRoundTrip: Joi.boolean().optional().default(false),
  estimatedDistance: Joi.number().optional().default(0),
  estimatedDuration: Joi.number().optional().default(0),
});

const purposeSchema = Joi.object({
  category: Joi.string().required(),
  description: Joi.string().required(),
  projectCode: Joi.string().allow("", null).optional(),
  costCenter: Joi.string().allow("", null).optional(),
  businessJustification: Joi.string().allow("", null).optional(),
});

const requirementsSchema = Joi.object({
  vehicleType: Joi.string().allow("", null).optional(),
  passengerCount: Joi.number().integer().min(1).optional().default(1),
  luggage: Joi.string().allow("", null).optional(),
  acRequired: Joi.boolean().optional().default(true),
  specialRequirements: Joi.string().allow("", null).optional(),
});

// Frontend sends a flat structure in mapFormToPayload.
// However, your controller validates against 'req.body' which IS the object sent by frontend.
// So the Schema matches the Frontend's Input Object (Nested).
export const createTripRequestSchema = Joi.object({
  requestNumber: Joi.string().optional(),
  tripDetails: tripDetailsSchema,
  purpose: purposeSchema,
  requirements: requirementsSchema,
  priority: Joi.string().valid("Low", "Medium", "High", "Urgent").required(),
  status: Joi.string().valid("Pending", "Approved", "Rejected", "Cancelled", "Assigned", "In Progress", "Completed").default("Pending"),
  estimatedCost: Joi.number().min(0).required(),
  approvalRequired: Joi.boolean().optional().default(true),
});

// Update Schema - All fields optional
export const updateTripRequestSchema = Joi.object({
  requestNumber: Joi.string().optional(),
  tripDetails: tripDetailsSchema.optional(),
  purpose: purposeSchema.optional(),
  requirements: requirementsSchema.optional(),
  priority: Joi.string().valid("Low", "Medium", "High", "Urgent").optional(),
  status: Joi.string().valid("Pending", "Approved", "Rejected", "Cancelled", "Assigned", "In Progress", "Completed").optional(),
  estimatedCost: Joi.number().min(0).optional(),
  approvalRequired: Joi.boolean().optional(),
});