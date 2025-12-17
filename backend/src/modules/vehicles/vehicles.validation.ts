import Joi from "joi";

export const createVehicleSchema = Joi.object({
  registration_number: Joi.string().max(50).required(),
  make: Joi.string().max(100).required(),
  model: Joi.string().max(100).required(),
  year: Joi.number().min(1900).required(),

  color: Joi.string().optional(),
  vehicle_type: Joi.string().optional(),
  fuel_type: Joi.string().optional(),
  transmission: Joi.string().optional(),
  seating_capacity: Joi.number().positive().optional(),

  cab_service_id: Joi.string().uuid().optional(),
  assigned_department_id: Joi.string().uuid().optional(),
});

export const updateVehicleSchema = Joi.object({
  make: Joi.string().optional(),
  model: Joi.string().optional(),
  year: Joi.number().optional(),
  color: Joi.string().optional(),

  operational_status: Joi.string().optional(),
  availability_status: Joi.string().optional(),

  current_driver_id: Joi.string().uuid().optional(),
  assigned_department_id: Joi.string().uuid().optional(),
});
