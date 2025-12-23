import Joi from "joi";

export const createDriverDocumentSchema = Joi.object({
  driver_id: Joi.string().uuid().required(),
  document_type: Joi.string().required(),
  document_number: Joi.string().allow(null, ""),
  issue_date: Joi.date().optional(),
  expiry_date: Joi.date().optional(),
  issuing_authority: Joi.string().allow(null, ""),
  file_name: Joi.string().required(),
  file_path: Joi.string().required(),
});
