import Joi from "joi";

export const createCabServiceSchema = Joi.object({
  name: Joi.string().max(255).required(),
  code: Joi.string().max(50).required(),
  type: Joi.string().max(50).optional(), // <-- ADD THIS LINE
  status: Joi.string().valid("Active", "Inactive").default("Active"),

  registration_number: Joi.string().allow(null, ""),
  tax_id: Joi.string().allow(null, ""),
  website: Joi.string().uri().allow(null, ""), // <-- ADD THIS LINE

  primary_contact_name: Joi.string().allow(null, ""),
  primary_contact_email: Joi.string().email().allow(null, ""),
  primary_contact_phone: Joi.string().pattern(/^\+94\d{9}$/).allow(null, ""),

  address_street: Joi.string().allow(null, ""),
  address_city: Joi.string().allow(null, ""),

  service_areas: Joi.array().items(Joi.string()).required(),
  is_24x7: Joi.boolean().default(false),
});

// It's good practice to have a separate schema for updates
export const updateCabServiceSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  code: Joi.string().max(50).optional(),
  type: Joi.string().max(50).optional(),
  status: Joi.string().valid("Active", "Inactive").optional(),

  registration_number: Joi.string().allow(null, "").optional(),
  tax_id: Joi.string().allow(null, "").optional(),
  website: Joi.string().uri().allow(null, "").optional(),

  primary_contact_name: Joi.string().allow(null, "").optional(),
  primary_contact_email: Joi.string().email().allow(null, "").optional(),
  primary_contact_phone: Joi.string().pattern(/^\+94\d{9}$/).allow(null, "").optional(),

  address_street: Joi.string().allow(null, "").optional(),
  address_city: Joi.string().allow(null, "").optional(),

  service_areas: Joi.array().items(Joi.string()).optional(),
  is_24x7: Joi.boolean().optional(),
});