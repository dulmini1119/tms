import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as invoiceController from "./invoice.controller.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// 1. LIST INVOICES (Grouped)
router.get("/", invoiceController.getAllInvoices);

// 2. SERVICE DETAILS ROUTE (Must be before /:id)
// This fixes the "Route GET /invoices/service/... not found" error
router.get("/service/:serviceId", invoiceController.getInvoiceDetailsByService);

// 3. GENERIC DETAILS ROUTE (Direct ID lookup)
router.get("/:id", invoiceController.getInvoiceById);

// 4. PREVIEW
router.get("/preview", invoiceController.previewInvoice);

// 5. ACTIONS
router.post("/generate", invoiceController.generateInvoice);
router.post("/:id/pay", invoiceController.recordPayment);

export default router;