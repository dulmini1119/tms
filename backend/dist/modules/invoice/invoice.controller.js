import * as service from "./invoice.service.js";
export const previewInvoice = async (req, res) => {
    const { cabServiceId, month } = req.query;
    const data = await service.previewInvoice(cabServiceId, month, req.user.id);
    res.json(data);
};
export const generateInvoice = async (req, res) => {
    await service.generateInvoice(req.body.invoiceId, req.body.dueDate, req.body.notes);
    res.status(201).json({ message: "Invoice generated" });
};
export const recordPayment = async (req, res) => {
    await service.recordPayment(req.params.id, req.body);
    res.json({ message: "Invoice paid" });
};
export const listInvoices = async (_, res) => {
    const invoices = await service.listInvoices();
    res.json(invoices);
};
export const getInvoiceById = async (req, res) => {
    const invoice = await service.getInvoiceDetails(req.params.id);
    res.json(invoice);
};
//# sourceMappingURL=invoice.controller.js.map