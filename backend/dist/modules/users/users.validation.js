import * as Joi from 'joi';
export const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().optional().allow(null, ''),
    role: Joi.string().valid('ADMIN', 'FLEET_MANAGER', 'DRIVER', 'FINANCE', 'VIEWER').required(),
    organizationId: Joi.string().uuid().optional().allow(null),
    employeeId: Joi.string().optional().allow(null, ''),
    licenseNumber: Joi.string().optional().allow(null, ''),
    licenseExpiry: Joi.date().optional().allow(null),
    address: Joi.object().optional().allow(null),
});
export const updateUserSchema = Joi.object({
    email: Joi.string().email().optional(),
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().optional().allow(null, ''),
    role: Joi.string().valid('ADMIN', 'FLEET_MANAGER', 'DRIVER', 'FINANCE', 'VIEWER').optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),
    organizationId: Joi.string().uuid().optional().allow(null),
    employeeId: Joi.string().optional().allow(null, ''),
    licenseNumber: Joi.string().optional().allow(null, ''),
    licenseExpiry: Joi.date().optional().allow(null),
    address: Joi.object().optional().allow(null),
});
export const getUsersQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().optional(),
    role: Joi.string().valid('ADMIN', 'FLEET_MANAGER', 'DRIVER', 'FINANCE', 'VIEWER').optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),
    organizationId: Joi.string().uuid().optional(),
    sortBy: Joi.string().valid('createdAt', 'firstName', 'lastName', 'email').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
export const updatePermissionsSchema = Joi.object({
    permissions: Joi.array().items(Joi.string()).required(),
});
export const userIdSchema = Joi.object({
    userId: Joi.string().uuid().required(),
});
//# sourceMappingURL=users.validation.js.map