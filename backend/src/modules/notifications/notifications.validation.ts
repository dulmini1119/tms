import Joi from "joi";

export const createNotificationSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    "string.empty": "Title is required",
  }),
  message: Joi.string().required().messages({
    "string.empty": "Message is required",
  }),
  type: Joi.string()
    .valid("Info", "Success", "Warning", "Error", "Alert")
    .default("Info"),
  category: Joi.string()
    .valid("Trip", "Vehicle", "Driver", "Document", "System", "Finance", "Emergency", "Maintenance")
    .default("System"),
  severity: Joi.string()
    .valid("Low", "Medium", "High", "Critical")
    .default("Low"),
  // Frontend sends a single object, but we'll map it to DB fields
  recipientType: Joi.string().valid("User", "Role", "Broadcast", "Department").required(),
  recipientDetails: Joi.string().when("recipientType", {
    is: "Broadcast",
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  priority: Joi.string().valid("Normal", "High", "Urgent").default("Normal"),
  scheduledFor: Joi.date().iso().allow(null),
  actionable: Joi.boolean().default(false),
});

export const updateNotificationSchema = Joi.object({
  // Primarily for marking read/acknowledged or updating status
  is_read: Joi.boolean().optional(),
  read_at: Joi.date().iso().optional(),
});