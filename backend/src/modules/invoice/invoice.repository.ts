import prisma from "../../config/database.js";

export const findInvoiceByServiceMonth = (
  cabServiceId: string,
  month: string
) =>
  prisma.invoice.findFirst({
    where: { cab_service_id: cabServiceId, billing_month: month },
  });

export const createDraftInvoice = (
  cabServiceId: string,
  month: string,
  userId: string
) =>
  prisma.invoice.create({
    data: {
      invoice_number: `DRAFT-${cabServiceId.slice(0, 4)}-${month}`,
      cab_service_id: cabServiceId,
      billing_month: month,
      total_amount: 0,
      status: "Draft",
      created_by: userId,
    },
  });

export const getUninvoicedTrips = async (
  cabServiceId: string,
  month: string
) => {
  const [year, m] = month.split("-");
  const start = new Date(+year, +m - 1, 1);
  const end = new Date(+year, +m, 1);

  return prisma.trip_costs.findMany({
    where: {
      invoice_id: null,
      created_at: { gte: start, lt: end },
      trip_assignments: {
        vehicles: { cab_service_id: cabServiceId },
      },
    },
  });
};
