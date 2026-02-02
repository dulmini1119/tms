import Joi from "joi";
import { validateBody, validateParams, validateQuery } from "../../middleware/validation.js";

/**
 * Create Expiry Alert
 * Controlled input from frontend
 */
export const createExpiryAlertSchema = {
  body: Joi.object({
    alert_type: Joi.string()
      .min(3)
      .required(),

    entity_type: Joi.string()
      .valid("Vehicle", "Driver", "Document", "Insurance")
      .required(),

    entity_id: Joi.string()
      .uuid()
      .required(),

    entity_name: Joi.string()
      .min(2)
      .optional(),

    document_id: Joi.string()
      .uuid()
      .optional(),

    document_name: Joi.string()
      .optional(),

    document_number: Joi.string()
      .allow(null, "")
      .optional(),

    issue_date: Joi.date()
      .iso()
      .optional(),

    expiry_date: Joi.date()
      .iso()
      .greater(Joi.ref("issue_date"))
      .required(),

    priority: Joi.string()
      .valid("Critical", "High", "Medium", "Low")
      .required(),

    department: Joi.string()
      .optional(),

    assigned_to: Joi.string()
      .uuid()
      .optional(),

    notes: Joi.string()
      .allow(null, "")
      .optional(),

    renewal_cost: Joi.number()
      .positive()
      .optional(),

    renewal_vendor: Joi.string()
      .optional(),
  }),
};

export const validate = {
  body: validateBody,
  query: validateQuery,
  params: validateParams,
};
