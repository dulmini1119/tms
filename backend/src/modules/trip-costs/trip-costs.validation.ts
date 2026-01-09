const Joi = require('joi');

const createTripCostSchema = Joi.object({
  trip_assignment_id: Joi.string().uuid().required(),
  base_fare: Joi.number().precision(2).default(0),
  distance_charges: Joi.number().precision(2).default(0),
  time_charges: Joi.number().precision(2).default(0),
  fuel_cost: Joi.number().precision(2).default(0),
  toll_charges: Joi.number().precision(2).default(0),
  parking_charges: Joi.number().precision(2).default(0),
  waiting_charges: Joi.number().precision(2).default(0),
  night_surcharge: Joi.number().precision(2).default(0),
  holiday_surcharge: Joi.number().precision(2).default(0),
  driver_allowance: Joi.number().precision(2).default(0),
  other_charges: Joi.number().precision(2).default(0),
  tax_percentage: Joi.number().precision(2).default(0),
  currency: Joi.string().max(10).default('LKR'),
});

const updateTripCostSchema = Joi.object({
  base_fare: Joi.number().precision(2).optional(),
  distance_charges: Joi.number().precision(2).optional(),
  time_charges: Joi.number().precision(2).optional(),
  fuel_cost: Joi.number().precision(2).optional(),
  toll_charges: Joi.number().precision(2).optional(),
  parking_charges: Joi.number().precision(2).optional(),
  waiting_charges: Joi.number().precision(2).optional(),
  night_surcharge: Joi.number().precision(2).optional(),
  holiday_surcharge: Joi.number().precision(2).optional(),
  driver_allowance: Joi.number().precision(2).optional(),
  other_charges: Joi.number().precision(2).optional(),
  tax_percentage: Joi.number().precision(2).optional(),
  currency: Joi.string().max(10).optional(),
  cost_breakdown_details: Joi.object().optional(),
});

const recordPaymentSchema = Joi.object({
  payment_method: Joi.string().valid('bank_transfer', 'check', 'neft', 'rtgs', 'upi', 'cash').required(),
  paid_at: Joi.date().iso().default(Date.now),
  transaction_id: Joi.string().optional(),
  notes: Joi.string().optional(),
});

const generateInvoiceSchema = Joi.object({
  due_date: Joi.date().iso().required(),
  invoice_number: Joi.string().max(100).optional(),
  notes: Joi.string().optional(),
});

const filterSchema = Joi.object({
  status: Joi.string().valid('Draft', 'Pending', 'Paid', 'Overdue').optional(),
  vendor_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  createTripCostSchema,
  updateTripCostSchema,
  recordPaymentSchema,
  generateInvoiceSchema,
  filterSchema,
};