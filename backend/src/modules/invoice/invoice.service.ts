import prisma from "../../config/database.js";
import * as repo from "./invoice.repository.js";

/**
 * PREVIEW
 */
export const previewInvoice = async (
  cabServiceId: string,
  month: string,
  userId: string
) => {
  let invoice = await repo.findInvoiceByServiceMonth(cabServiceId, month);

  if (!invoice) {
    invoice = await repo.createDraftInvoice(cabServiceId, month, userId);
  }

  if (invoice.status !== "Draft") {
    throw new Error("Invoice already generated");
  }

  const trips = await repo.getUninvoicedTrips(cabServiceId, month);

  const totalAmount = trips.reduce(
    (sum, t) => sum + Number(t.total_cost),
    0
  );

  return {
    invoiceId: invoice.id,
    status: invoice.status,
    tripCount: trips.length,
    totalAmount,
    trips,
  };
};

/**
 * GENERATE
 */
export const generateInvoice = async (
  invoiceId: string,
  dueDate: string,
  notes?: string
) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice || invoice.status !== "Draft") {
    throw new Error("Invoice cannot be generated");
  }

  const trips = await repo.getUninvoicedTrips(
    invoice.cab_service_id,
    invoice.billing_month
  );

  const totalAmount = trips.reduce(
    (sum, t) => sum + Number(t.total_cost),
    0
  );

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        total_amount: totalAmount,
        due_date: new Date(dueDate),
        notes,
        status: "Pending",
      },
    }),
    prisma.trip_costs.updateMany({
      where: { id: { in: trips.map(t => t.id) } },
      data: { invoice_id: invoiceId },
    }),
  ]);
};

/**
 * PAY
 */
export const recordPayment = async (
  invoiceId: string,
  data: any
) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice || invoice.status !== "Pending") {
    throw new Error("Invoice cannot be paid");
  }

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "Paid",
        paid_date: new Date(data.paid_at),
        notes: data.notes,
      },
    }),
    prisma.trip_costs.updateMany({
      where: { invoice_id: invoiceId },
      data: {
        payment_status: "Paid",
        payment_method: data.payment_method,
        paid_at: new Date(data.paid_at),
      },
    }),
  ]);
};

/**
 * LIST
 */
export const listInvoices = async () =>
  prisma.invoice.findMany({
    include: {
      cab_service: { select: { name: true } },
    },
    orderBy: { billing_month: "desc" },
  });

/**
 * DETAILS
 */
export const getInvoiceDetails = async (id: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      cab_service: true,
      trip_costs: {
        include: {
          trip_assignments: {
            include: {
              // 1. Vehicles
              vehicles: true,
              
              // 2. Drivers
              drivers: {
                include: {
                  users_drivers_user_idTousers: true,
                },
              },

              // 3. !!! CRITICAL: MISSING PART ADDED !!!
              // This is required to get the Requester Name (User who requested the trip)
              trip_requests: {
                include: {
                  users_trip_requests_requested_by_user_idTousers: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!invoice) throw new Error("Invoice not found");

  return invoice;
};