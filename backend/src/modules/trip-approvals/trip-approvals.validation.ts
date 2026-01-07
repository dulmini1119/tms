import Joi from "joi";

export const approveActionSchema = Joi.object({
  status: Joi.string().valid("Approved", "Rejected").required(),
  comments: Joi.string().allow("").max(500).optional(),
});