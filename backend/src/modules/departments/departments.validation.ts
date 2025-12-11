import Joi from 'joi';

export const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'string.empty': 'Department name is required',
    'string.min': 'Department name must be at least 2 characters long',
    'string.max': 'Department name cannot exceed 200 characters',
    'any.required': 'Department name is required'
  }),
  code: Joi.string().trim().min(2).max(50).optional().messages({
    'string.min': 'Department code must be at least 2 characters long',
    'string.max': 'Department code cannot exceed 50 characters'
  }),
  description: Joi.string().trim().allow('', null).max(1000).optional(),
  type: Joi.string().trim().allow('', null).max(100).optional(),
  status: Joi.string().valid('Active', 'Inactive').optional(),
  business_unit_id: Joi.string().uuid().allow(null).optional(),
  head_id: Joi.string().uuid().allow(null).optional(),
  budget_allocated: Joi.number().positive().allow(null).optional(),
  budget_currency: Joi.string().trim().allow('', null).max(10).optional(),
  fiscal_year: Joi.string().trim().allow('', null).max(20).optional()
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).optional(),
  code: Joi.string().trim().min(2).max(50).optional(),
  description: Joi.string().trim().allow('', null).max(1000).optional(),
  type: Joi.string().trim().allow('', null).max(100).optional(),
  status: Joi.string().valid('Active', 'Inactive').optional(),
  business_unit_id: Joi.string().uuid().allow(null).optional(),
  head_id: Joi.string().uuid().allow(null).optional(),
  budget_allocated: Joi.number().positive().allow(null).optional(),
  budget_utilized: Joi.number().allow(null).optional(),
  budget_currency: Joi.string().trim().allow('', null).max(10).optional(),
  fiscal_year: Joi.string().trim().allow('', null).max(20).optional()
});