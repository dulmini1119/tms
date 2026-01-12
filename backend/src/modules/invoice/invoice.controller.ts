import { Request, Response, NextFunction } from "express";
import * as invoiceService from "./invoice.service.js";
import { AuthRequest } from "../../middleware/auth.js"; 
// Assuming you are using CommonJS or have configured module resolution for .js files

// Import Validation Schemas
const { previewInvoiceSchema, generateInvoiceSchema, recordPaymentSchema } = require("./invoice.validation.js");

// Helper function to run Joi validation
const validate = (schema: any, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = source === 'body' ? req.body : req.query;
    const { error, value } = schema.validate(dataToValidate, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: any) => detail.message);
      return res.status(400).json({ 
        error: "Validation Error", 
        details: errors 
      });
    }

    // If validation passes, replace the request data with the clean values
    if (source === 'body') req.body = value;
    if (source === 'query') req.query = value;
    
    next();
  };
};

// 1. GET /api/invoices/preview?cab_service_id=...&month=...
export const previewInvoice = [
  validate(previewInvoiceSchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const { cab_service_id, month } = req.query;
      
      const data = await invoiceService.getDraftInvoiceDetails(
        cab_service_id as string, 
        month as string
      );

      if (!data) {
        return res.status(404).json({ message: "No trips found for this period" });
      }

      res.json(data);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
];

// 2. POST /api/invoices/generate
export const generateInvoice = [
  validate(generateInvoiceSchema, 'body'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { cabServiceId, month, dueDate, notes } = req.body;
      const userId = req.user!.id;

      const result = await invoiceService.createMonthlyInvoice({
        cabServiceId,
        month,
        dueDate,
        notes,
        userId
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate invoice" });
    }
  }
];

// 3. POST /api/invoices/:id/pay
export const recordPayment = [
  validate(recordPaymentSchema, 'body'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paid_at, transaction_id, notes } = req.body;

      const result = await invoiceService.payInvoice(id, {
        paid_at,
        transaction_id,
        notes
      });

      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to record payment" });
    }
  }
];