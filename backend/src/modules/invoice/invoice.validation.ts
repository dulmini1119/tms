import Joi from "joi";

export const previewInvoiceSchema = Joi.object({
  cabServiceId: Joi.string().uuid().required(),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
});

export const generateInvoiceSchema = Joi.object({
  invoiceId: Joi.string().uuid().required(),
  dueDate: Joi.date().iso().greater("now").required(),
  notes: Joi.string().allow("").max(500),
});

export const recordPaymentSchema = Joi.object({
  paid_at: Joi.date().iso().max("now").required(),
  payment_method: Joi.string()
    .valid("bank_transfer", "check", "neft", "rtgs", "upi", "cash")
    .required(),
  transaction_id: Joi.string().allow("").max(100),
  notes: Joi.string().allow("").max(500),
});
