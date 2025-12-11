import Joi from 'joi';

// Save permissions for a role
export const saveRolePermissionsSchema = Joi.object({
  roleId: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.guid': 'Invalid role ID format. Must be a valid UUID.',
      'any.required': 'roleId is required',
      'string.empty': 'roleId cannot be empty',
    }),

  permissionIds: Joi.array()
    .items(
      Joi.string()
        .uuid({ version: ['uuidv4'] })
        .required()
        .messages({
          'string.guid': '{{#label}} must be a valid UUID',
          'string.empty': 'Permission ID cannot be empty',
        })
    )
    .min(0) // allows clearing all permissions
    .required()
    .messages({
      'array.base': 'permissionIds must be an array',
      'array.includes': 'Each permission ID must be a valid UUID',
      'any.required': 'permissionIds is required',
      'array.min': 'permissionIds cannot be empty (use [] to clear)',
    }),
}).options({ stripUnknown: true });

// Optional: Update a single permission
export const updatePermissionSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'string.empty': 'Name is required',
    })
    .required(),

  code: Joi.string()
    .lowercase()
    .pattern(/^[a-z_]+$/)
    .max(50)
    .trim()
    .messages({
      'string.pattern.base': 'Code must contain only lowercase letters and underscores (e.g., view_users)',
      'string.max': 'Code cannot exceed 50 characters',
      'string.empty': 'Code is required',
    })
    .required(),

  category: Joi.string()
    .trim()
    .max(50)
    .allow('', null)
    .default('')
    .messages({
      'string.max': 'Category cannot exceed 50 characters',
    }),
}).options({ stripUnknown: true });