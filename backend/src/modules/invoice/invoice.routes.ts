import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as controller from "./invoice.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.listInvoices);
router.get("/preview", controller.previewInvoice);
router.get("/:id", controller.getInvoiceById);
router.post("/generate", controller.generateInvoice);
router.post("/:id/pay", controller.recordPayment);

export default router;
