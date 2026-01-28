export type InvoiceStatus =
  | "Draft"
  | "Pending"
  | "Paid"
  | "Overdue";

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  cabServiceId: string;
  cabServiceName: string;
  billingMonth: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate?: string | null;
  paidDate?: string | null;
}
