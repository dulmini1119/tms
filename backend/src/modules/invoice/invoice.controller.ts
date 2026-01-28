import { Request, Response } from "express";
import * as service from "./invoice.service.js";
import { AuthRequest } from "../../middleware/auth.js";

export const previewInvoice = async (req: AuthRequest, res: Response) => {
  const { cabServiceId, month } = req.query;

  const data = await service.previewInvoice(
    cabServiceId as string,
    month as string,
    req.user!.id
  );

  res.json(data);
};

export const generateInvoice = async (req: Request, res: Response) => {
  await service.generateInvoice(
    req.body.invoiceId,
    req.body.dueDate,
    req.body.notes
  );
  res.status(201).json({ message: "Invoice generated" });
};

export const recordPayment = async (req: Request, res: Response) => {
  await service.recordPayment(req.params.id, req.body);
  res.json({ message: "Invoice paid" });
};

export const listInvoices = async (_: Request, res: Response) => {
  const invoices = await service.listInvoices();
  res.json(invoices);
};

export const getInvoiceById = async (req: Request, res: Response) => {
  const invoice = await service.getInvoiceDetails(req.params.id);
  res.json(invoice);
};
