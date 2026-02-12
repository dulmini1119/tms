import Joi from 'joi';

export const systemSettingsValidation = {
  // Schema for creating a new setting
  create: Joi.object({
    setting_key: Joi.string().max(255).required(),
    setting_value: Joi.string().allow(null, '').optional(),
    setting_type: Joi.string().valid('String', 'Number', 'Boolean', 'JSON').default('String'),
    category: Joi.string().max(100).optional(),
    description: Joi.string().allow(null, '').optional(),
    is_encrypted: Joi.boolean().default(false),
  }),

  // Schema for updating a setting
  update: Joi.object({
    setting_value: Joi.string().required(), // Frontend sends string, we parse based on type
    description: Joi.string().allow(null, '').optional(),
    is_encrypted: Joi.boolean().optional(),
  }),

  // Query params for listing
  query: Joi.object({
    category: Joi.string().optional(),
    search: Joi.string().optional(),
  }),
};