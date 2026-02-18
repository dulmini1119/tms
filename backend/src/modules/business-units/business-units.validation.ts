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

const headId = uuid.allow(null).optional();
const managerId = uuid.allow(null).optional(); // Backward compatibility alias
const description = Joi.string().trim().allow('', null).max(1000).optional();
const status = Joi.string().valid('Active', 'Inactive').optional();

export interface CreateBusinessUnitDto {
  name: string;
  code?: string;
  description?: string | null;
  status?: "Active" | "Inactive";
  head_id?: string | null;
  manager_id?: string | null;
}

export interface UpdateBusinessUnitDto {
  name?: string;
  code?: string;
  description?: string | null;
  status?: "Active" | "Inactive";
  head_id?: string | null;
  manager_id?: string | null;
}

export const createBusinessUnitSchema = Joi.object({
  name: name.required(),
  code,
  description,
  status,
  head_id: headId,
  manager_id: managerId,
}).options({ stripUnknown: true });

export const updateBusinessUnitSchema = Joi.object({
  name: name.optional(),
  code,
  description,
  status,
  head_id: headId,
  manager_id: managerId,
}).options({ stripUnknown: true });
