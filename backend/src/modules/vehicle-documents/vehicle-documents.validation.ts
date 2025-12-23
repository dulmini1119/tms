import Joi from "joi";

export const createVehicleDocumentSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  document_type: Joi.string().max(100).required(),
  document_number: Joi.string().max(100).allow(null, ""),
  issue_date: Joi.date().optional(),
  expiry_date: Joi.date().optional(),
  issuing_authority: Joi.string().max(255).allow(null, ""),
  file_name: Joi.string().required(),
  file_path: Joi.string().required(),
  status: Joi.string().valid("Valid", "Expired").optional(),
});
