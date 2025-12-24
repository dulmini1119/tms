// src/modules/vehicle/vehicle.validation.ts
import Joi from "joi";

export const createVehicleSchema = Joi.object({
  registration_number: Joi.string().max(50).required(),
  make: Joi.string().max(100).required(),
  model: Joi.string().max(100).required(),
  year: Joi.number().min(1900).max(new Date().getFullYear()).required(),

  color: Joi.string().max(50).optional(),
  chassis_number: Joi.string().max(100).optional(),
  engine_number: Joi.string().max(100).optional(),

  vehicle_type: Joi.string().max(50).optional(),
  fuel_type: Joi.string().max(50).optional(),
  transmission: Joi.string().max(20).optional(),
  seating_capacity: Joi.number().min(1).optional(),

  ownership_type: Joi.string().max(50).optional(),
  purchase_date: Joi.date().optional(),
  purchase_price: Joi.number().positive().optional(),

  cab_service_id: Joi.string().uuid().optional(),
  assigned_department_id: Joi.string().uuid().optional(),
});

export const updateVehicleSchema = createVehicleSchema.fork(
  ["registration_number", "make", "model", "year"],
  (schema) => schema.optional()
);
// vehicles.validation.ts
export const getVehiclesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),

  vehicle_type: Joi.string().max(50).optional(),

  availability_status: Joi.string()
    .valid('Available', 'In Use', 'Maintenance', 'Out of Service')
    .optional(),

  ownership_type: Joi.string()
    .valid('Owned', 'Leased', 'Rented')
    .optional(),

  cab_service_id: Joi.string().uuid().optional(),
});

