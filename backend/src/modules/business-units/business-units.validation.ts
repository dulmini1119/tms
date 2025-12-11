// src/modules/business-units/business-units.validation.ts

import Joi from 'joi';

// Helper: reusable UUID validator (DRY)
const uuid = Joi.string().guid({ version: ['uuidv4'] }).messages({
  'string.guid': 'Must be a valid UUID',
});

const name = Joi.string().trim().min(2).max(200).messages({
  'string.min': 'Name must be at least 2 characters',
  'string.max': 'Name cannot exceed 200 characters',
  'any.required': 'Name is required',
});

const code = Joi.string()
  .trim()
  .min(2)
  .max(50)
  .uppercase()
  .pattern(/^[A-Z0-9_]+$/)
  .optional()
  .messages({
    'string.pattern.base': 'Code can only contain uppercase letters, numbers, and underscores',
  });

const managerId = uuid.allow(null).optional();
const departmentId = uuid.allow(null).optional();

const budget = Joi.number().positive().precision(2).allow(null).optional().messages({
  'number.positive': 'Budget must be a positive number',
});

const established = Joi.date().iso().max('now').allow(null).optional().messages({
  'date.max': 'Established date cannot be in the future',
});

export interface CreateBusinessUnitDto {
  name: string;
  code?: string;
  manager_id?: string | null;
  department_id?: string | null;
  budget?: number | null;
  established?: string | null;
}

export interface UpdateBusinessUnitDto {
  name?: string;
  code?: string;
  manager_id?: string | null;
  department_id?: string | null;
  budget?: number | null;
  established?: string | null;
}

export const createBusinessUnitSchema = Joi.object({
  name: name.required(),
  code,
  manager_id: managerId,
  department_id: departmentId,
  budget,
  established,
}).options({ stripUnknown: true });

export const updateBusinessUnitSchema = Joi.object({
  name: name.optional(),
  code,
  manager_id: managerId,
  department_id: departmentId,
  budget,
  established,
}).options({ stripUnknown: true });