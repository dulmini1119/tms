// gpslogs.validation.js
import Joi from 'joi';   // ← changed

export const getGPSLogsSchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    searchTerm: Joi.string().allow('').optional(),
    status: Joi.string().valid('all', 'active', 'idle', 'offline', 'emergency', 'maintenance').default('all'),
    vehicleId: Joi.string().uuid().optional(),
    driverId: Joi.string().uuid().optional(),
  }),
};

export const getGPSLogDetailsSchema = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};

export const getTripReplaySchema = {
  params: Joi.object().keys({
    tripId: Joi.string().uuid().required(),
  }),
};

export const exportGPSLogsSchema = {
  body: Joi.object().keys({
    searchTerm: Joi.string().allow('').optional(),
    status: Joi.string().valid('all', 'active', 'idle', 'offline', 'emergency', 'maintenance').optional(),
    vehicleId: Joi.string().uuid().optional(),
    driverId: Joi.string().uuid().optional(),
  }),
};