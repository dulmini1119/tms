import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as invoiceController from "./invoice.controller.js";

const router = Router();

router.use(authenticate);

// Add this route to fix 404
router.get("/", invoiceController.getAllInvoices);

// Existing routes
router.get("/preview", invoiceController.previewInvoice);
router.post("/generate", invoiceController.generateInvoice);
router.post("/:id/pay", invoiceController.recordPayment);

export default router;
