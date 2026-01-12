const Joi = require('joi');

// Schema for Previewing an Invoice
// Validates query parameters: /preview?cab_service_id=...&month=...
const previewInvoiceSchema = Joi.object({
  cab_service_id: Joi.string().uuid().required().messages({
    'string.guid': 'Cab Service ID must be a valid UUID',
    'any.required': 'Cab Service ID is required'
  }),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
    'string.pattern.base': 'Month must be in YYYY-MM format (e.g., 2023-10)',
    'any.required': 'Billing month is required'
  })
});

// Schema for Generating a Final Monthly Invoice
const generateInvoiceSchema = Joi.object({
  cabServiceId: Joi.string().uuid().required().messages({
    'string.guid': 'Cab Service ID must be a valid UUID',
    'any.required': 'Cab Service ID is required'
  }),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
    'string.pattern.base': 'Month must be in YYYY-MM format (e.g., 2023-10)',
    'any.required': 'Billing month is required'
  }),
  dueDate: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Due date must be in the future',
    'any.required': 'Due date is required'
  }),
  notes: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Notes must be less than 500 characters'
  })
});

// Schema for Recording Payment for a Monthly Invoice
const recordPaymentSchema = Joi.object({
  paid_at: Joi.date().iso().max('now').required().messages({
    'date.max': 'Payment date cannot be in the future',
    'any.required': 'Payment date is required'
  }),
  transaction_id: Joi.string().max(100).allow('').optional(),
  payment_method: Joi.string().valid('bank_transfer', 'check', 'neft', 'rtgs', 'upi', 'cash').optional(),
  notes: Joi.string().max(500).allow('').optional()
});

module.exports = {
  previewInvoiceSchema,
  generateInvoiceSchema,
  recordPaymentSchema,
};