// src/modules/cab-agreement/cab-agreement.validation.ts
import Joi from "joi";

// A reusable schema for common fields
const agreementFields = {
  cab_service_id: Joi.string().uuid().required(),
  agreement_number: Joi.string().max(100).required(),
  title: Joi.string().max(255).required(),
  type: Joi.string().max(100).optional(),
  document_url: Joi.string().max(500).allow(null, '').optional(),
  status: Joi.string().valid("Draft", "Active", "Expired", "Pending", "Terminated").default("Draft"),
  priority: Joi.string().valid("Low", "Medium", "High").optional(),
  client_company_name: Joi.string().max(255).optional(),
  client_contact_person: Joi.string().max(255).optional(),
  client_email: Joi.string().email().allow(null, '').optional(),
  client_phone: Joi.string().max(20).allow(null, '').optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  auto_renewal: Joi.boolean().default(false),
  renewal_period: Joi.string().max(50).optional(),
  notice_period_days: Joi.number().integer().min(0).optional(),
  contract_value: Joi.number().min(0).optional(),
  currency: Joi.string().max(10).optional(),
  payment_terms: Joi.string().optional(),
  payment_schedule: Joi.string().max(50).optional(),
  security_deposit: Joi.number().min(0).optional(),
  insurance_required: Joi.boolean().default(false),
  insurance_amount: Joi.number().min(0).optional(),
  insurance_provider: Joi.string().max(255).allow(null, '').optional(),
  insurance_policy_number: Joi.string().max(100).allow(null, '').optional(),
  insurance_expiry_date: Joi.date().iso().allow(null).optional(),
  sla_response_time: Joi.number().integer().min(0).optional(),
  sla_availability_percentage: Joi.number().min(0).max(100).optional(),
  sla_on_time_performance: Joi.number().min(0).max(100).optional(),
  termination_clause: Joi.string().optional(),
  penalty_clause: Joi.string().optional(),
};

export const createAgreementSchema = Joi.object(agreementFields);

// For updates, all fields are optional
export const updateAgreementSchema = Joi.object({
  ...Object.keys(agreementFields).reduce((acc, key) => {
    if (key === "end_date") {
      acc[key] = Joi.date().iso().when("start_date", {
        is: Joi.exist(),
        then: Joi.date().min(Joi.ref("start_date")),
        otherwise: Joi.date(),
      }).optional();
    } else {
      acc[key] = agreementFields[key as keyof typeof agreementFields].optional();
    }
    return acc;
  }, {} as { [key: string]: Joi.Schema }),
});
