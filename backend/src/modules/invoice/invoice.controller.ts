import { Request, Response } from "express";
import * as invoiceService from "./invoice.service.js";
import { AuthRequest } from "../../middleware/auth.js";
import {
  generateInvoiceSchema,
  recordPaymentSchema,
} from "./invoice.validation.js";
import prisma from "../../config/database.js";

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
 * GET ALL INVOICES (List View)
 */
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    
    // Fetch grouped data
    const invoices = await invoiceService.getInvoices(filters);

    const formattedInvoices = invoices.map((inv: any) => {
      const rawMonth = inv.billingMonth; 
      let displayMonth = "N/A";
      
      if (rawMonth) {
        const [year, month] = rawMonth.split("-");
        displayMonth = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      return {
        id: inv.id, // This is now the Cab Service ID
        cabServiceId: inv.cabServiceId,
        cabServiceName: inv.cabServiceName,
        billingMonth: inv.billingMonth, 
        displayMonth: displayMonth, 
        tripCount: inv.tripCount,
        totalAmount: inv.totalAmount, // Now calculated correctly!
        status: inv.status,
        dueDate: null, // Grouped view might not have a single due date
        paidDate: null,
        invoiceNumber: "Multiple", // Indicate multiple invoices
      };
    });

    res.json({ data: formattedInvoices });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to fetch invoices" });
  }
};

/**
 * GET INVOICE BY ID (Detail View)
 * Returns full data grouped by Vehicle
 */
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoiceData = await invoiceService.getInvoiceById(id);
    res.json(invoiceData);
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
 * PREVIEW INVOICE
 */
export const previewInvoice = async (req: Request, res: Response) => {
  try {
    const { cab_service_id, month } = req.query;
    
    if (!cab_service_id || !month) {
      return res.status(400).json({ error: "Missing cab_service_id or month" });
    }

    const data = await invoiceService.getDraftInvoiceDetails(
      cab_service_id as string,
      month as string
    );
    if (!data) return res.status(404).json({ message: "No trips found for this period" });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Invoice Details by Cab Service & Month
 * This handles Grouped View where ID is actually a CabService ID.
 */
// FIXED: Added 'export' keyword
export const getInvoiceDetailsByService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { month } = req.query;

    if (!month) return res.status(400).json({ error: "Month parameter is required" });

    // Find the actual invoice for this Service + Month
    const targetInvoice = await prisma.invoice.findFirst({
      where: {
        cab_service_id: serviceId,
        billing_month: month as string,
      },
      orderBy: [
        { status: "asc" },
        { created_at: "desc" }
      ]
    });

    if (!targetInvoice) return res.status(404).json({ error: "No invoice found for this vendor/month" });

    // Use the standard service function to get breakdown
    const invoiceData = await invoiceService.getInvoiceById(targetInvoice.id);
    res.json(invoiceData);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to fetch details" });
  }
};