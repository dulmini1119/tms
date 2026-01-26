import { Request, Response } from "express";
import * as invoiceService from "./invoice.service.js";
import { AuthRequest } from "../../middleware/auth.js";
import {
  generateInvoiceSchema,
  recordPaymentSchema,
} from "./invoice.validation.js";

// Helper function to run Joi validation
const validate = (schema: any) => {
  return (req: Request, res: Response, next: Function) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    req.body = value;
    next();
  };
};

/**
 * GET ALL INVOICES (Mapped to Frontend Interface)
 * Changed: Now uses service.getInvoices and maps 'billing_month' to 'displayMonth'
 */


export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const invoices = await invoiceService.getInvoices(filters);

    const formattedInvoices = invoices.map((inv: any) => {
      // 1. Get the RAW database string (e.g., "2024-01")
      const rawMonth = inv.billing_month; 
      
      // 2. Create the pretty string ONLY for displayMonth
      let displayMonth = "N/A";
      
      if (rawMonth) {
        const [year, month] = rawMonth.split("-");
        displayMonth = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      return {
        id: inv.id,
        cabServiceId: inv.cab_service_id,
        cabServiceName: inv.cab_service?.name || "Unknown Vendor",
        
        billingMonth: rawMonth, 
        
        displayMonth: displayMonth, 
        
        tripCount: inv.trip_costs?.length || 0,
        totalAmount: Number(inv.total_amount),
        status: inv.status,
        dueDate: inv.due_date,
        paidDate: inv.paid_date,
        invoiceNumber: inv.invoice_number,
        trips: inv.trip_costs || [] 
      };
    });

    res.json({ data: formattedInvoices });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to fetch invoices" });
  }
};

/**
 * GET INVOICE BY ID (For Details Dialog)
 */
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id);
    res.json(invoice);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Invoice not found" });
  }
};

/**
 * GENERATE INVOICE
 */
export const generateInvoice = [
  validate(generateInvoiceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { cabServiceId, month, dueDate, notes } = req.body;
      const userId = req.user!.id;

      const result = await invoiceService.createMonthlyInvoice({
        cabServiceId,
        month,
        dueDate,
        notes,
        userId,
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate invoice" });
    }
  },
];

/**
 * RECORD PAYMENT
 */
export const recordPayment = [
  validate(recordPaymentSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paid_at, transaction_id, notes } = req.body;

      const result = await invoiceService.payInvoice(id, {
        paid_at,
        transaction_id,
        notes,
      });

      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to record payment" });
    }
  },
];

/**
 * PREVIEW INVOICE (Optional Helper)
 */
export const previewInvoice = async (req: Request, res: Response) => {
  try {
    const { cab_service_id, month } = req.query;
    const data = await invoiceService.getDraftInvoiceDetails(
      cab_service_id as string,
      month as string
    );
    if (!data) return res.status(404).json({ message: "No trips found" });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};