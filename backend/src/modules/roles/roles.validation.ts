import Joi from 'joi';

const ROLE_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9 ]*[a-zA-Z0-9]$/; 

export const createRoleSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .regex(ROLE_NAME_REGEX)
    .required()
    .custom((value: string, helpers) => {
      // Block creating another "superadmin" role via API
      if (value.toLowerCase() === 'super admin' || value.toLowerCase() === 'superadmin') {
        return helpers.error('any.forbidden', { message: 'Cannot create Super Admin role' });
      }
      return value;
    })
    .messages({
      'string.empty': 'Role name cannot be empty',
      'any.required': 'Role name is required',
      'string.min': 'Role name must be at least 3 characters',
      'string.max': 'Role name cannot exceed 50 characters',
      'string.pattern.base': 'Role name can only contain letters, numbers, and spaces (no leading/trailing spaces)',
      'any.forbidden': '{#message}',
    }),

  description: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .default(null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 255 characters',
    }),
})
  .options({ stripUnknown: true })
  .messages({
    'object.unknown': 'Invalid field: {#key}',
  });

export const updateRoleSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .regex(ROLE_NAME_REGEX)
    .custom((value: string, helpers) => {
      if (value.toLowerCase() === 'super admin' || value.toLowerCase() === 'superadmin') {
        return helpers.error('any.forbidden', { message: 'Cannot rename role to Super Admin' });
      }
      return value;
    })
    .optional()
    .messages({
      'string.min': 'Role name must be at least 3 characters',
      'string.max': 'Role name cannot exceed 50 characters',
      'string.pattern.base': 'Role name can only contain letters, numbers, and spaces (no leading/trailing spaces)',
      'any.forbidden': '{#message}',
    }),

  description: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .default(null)
    .optional(),
}).options({ stripUnknown: true });

export interface CreateRoleDto {
  name: string;
  description?: string | null;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string | null;
}