import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
// Adjust the import path to match where you saved the controller
import * as invoiceController from './invoice.controller.js';

const router = Router();

// Apply authentication to all invoice routes
router.use(authenticate);

// 1. Preview Invoice (Check what trips will be billed)
// GET /api/invoices/preview?cab_service_id=...&month=...
router.get('/preview', invoiceController.previewInvoice);

// 2. Generate Monthly Invoice
// POST /api/invoices/generate
router.post('/generate', invoiceController.generateInvoice);

// 3. Pay Monthly Invoice
// POST /api/invoices/:id/pay
router.post('/:id/pay', invoiceController.recordPayment);

export default router;