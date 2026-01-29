import Joi from "joi";

// Helper for decimal numbers (matches DB Decimal precision)
const decimalSchema = Joi.number().precision(2).optional().allow(null, "");
const dateSchema = Joi.date().iso().optional().allow(null, "");

export const createTripLogSchema = Joi.object({
  // Relations
  tripRequestId: Joi.string().uuid().optional().allow(null), // Optional in DB (linked via trip_assignment_id usually)
  tripAssignmentId: Joi.string().uuid().required(),

  // Identification
  tripNumber: Joi.string().max(100).required(), // Matches DB @unique & @db.VarChar(100)
  tripDate: Joi.date().required(), // Matches DB @db.Date
  
  // Status
  tripStatus: Joi.string()
    .valid("Not Started", "In Progress", "Completed", "Cancelled")
    .optional()
    .allow(null),

  // Locations
  fromLocation: Joi.string().max(500).optional().allow(null),
  toLocation: Joi.string().max(500).optional().allow(null),

  // Passenger Info
  passengerName: Joi.string().max(255).optional().allow(null),
  passengerDepartment: Joi.string().max(255).optional().allow(null),

  // Driver & Vehicle
  driverName: Joi.string().max(255).optional().allow(null),
  vehicleRegistration: Joi.string().max(50).optional().allow(null), // DB: VarChar(50)

  // Metrics
  plannedDistance: decimalSchema,
  actualDistance: decimalSchema,
  
  // Times
  plannedDeparture: dateSchema,
  plannedArrival: dateSchema,
  // Actual times usually set during update, but allowed here if needed
  actualDeparture: dateSchema, 
  actualArrival: dateSchema,

  // Initial Cost Estimates (optional at creation)
  totalCost: decimalSchema,
  fuelCost: decimalSchema,
});

export const updateTripLogSchema = Joi.object({
  // Metrics
  actualDistance: decimalSchema,
  actualDeparture: dateSchema,
  actualArrival: dateSchema,
  tripStatus: Joi.string()
    .valid("Not Started", "In Progress", "Completed", "Cancelled")
    .optional(),
  
  // Financials (Matches DB columns exactly)
  totalCost: decimalSchema,
  fuelCost: decimalSchema,
  tollCharges: decimalSchema,         // Added
  parkingCharges: decimalSchema,      // Added
  otherCharges: decimalSchema,        // Added
  currency: Joi.string().max(10).optional().allow(null),

  // Ratings (Matches DB Decimal(3,2) fields)
  overallRating: Joi.number().max(5).precision(2).optional().allow(null),
  punctualityRating: Joi.number().max(5).precision(2).optional().allow(null),
  driverBehaviorRating: Joi.number().max(5).precision(2).optional().allow(null),
  vehicleConditionRating: Joi.number().max(5).precision(2).optional().allow(null),

  // Feedback
  comments: Joi.string().optional().allow(null, ""),
})
  .min(1); // Ensure at least one field is being updated

export const exportQuerySchema = Joi.object({
  status: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

export const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});