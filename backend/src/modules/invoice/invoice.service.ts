import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * PREVIEW: Get details for a potential invoice (before generating)
 */
export const getDraftInvoiceDetails = async (
  cabServiceId: string,
  month: string
) => {
  const [year, monthIndex] = month.split("-");
  const startDate = new Date(parseInt(year), parseInt(monthIndex) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(monthIndex), 1);

  const tripCosts = await prisma.trip_costs.findMany({
    where: {
      invoice_id: null,
      trip_assignments: {
        vehicles: {
          cab_service_id: cabServiceId,
        },
      },
      created_at: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: {
      trip_assignments: {
        include: {
          trip_requests: {
            include: {
              users_trip_requests_requested_by_user_idTousers: {
                include: {
                  departments_users_department_idTodepartments : true
                }
              },
            },
          },
          vehicles: {
            include: {
              cab_services: true,
            },
          },
        },
      },
    },
  });

  if (tripCosts.length === 0) return null;

  const totalAmount = tripCosts.reduce(
    (sum, trip) => sum + Number(trip.total_cost),
    0
  );

  return {
    cabServiceId,
    cabServiceName:
      tripCosts[0].trip_assignments?.vehicles?.cab_services?.name ||
      "Unknown Vendor",
    month,
    tripCount: tripCosts.length,
    totalAmount,
    trips: tripCosts,
    tripIds: tripCosts.map((t) => t.id),
  };
};

/**
 * GENERATE: Create a Monthly Invoice and link trips
 */
export const createMonthlyInvoice = async (payload: {
  cabServiceId: string;
  month: string;
  dueDate: string;
  notes: string;
  userId: string;
}) => {
  const { cabServiceId, month, dueDate, notes, userId } = payload;

  const draftData = await getDraftInvoiceDetails(cabServiceId, month);

  // ────────────────────────────────────────────────────────────────
  // CHANGED: Allow invoice even with ZERO trips
  // ────────────────────────────────────────────────────────────────
  const tripIds = draftData?.tripIds || [];
  const totalAmount = draftData?.totalAmount || 0;
  const tripCount = draftData?.tripCount || 0;

  // Optional: Add a note if no trips
  let finalNotes = notes || "";
  if (tripIds.length === 0) {
    finalNotes = finalNotes
      ? `${finalNotes}\n[Auto: No billable trips found for this period]`
      : "[Auto: No billable trips found for this period]";
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoice_number: `INV-${cabServiceId
        .slice(0, 4)
        .toUpperCase()}-${month.replace("-", "")}-${Date.now()}`,
      cab_service_id: cabServiceId,
      billing_month: month,
      total_amount: totalAmount,           // 0 if no trips
      due_date: new Date(dueDate),
      notes: finalNotes,
      created_by: userId,
      status: tripCount === 0 ? "NoCharges" : "Pending", // ← Optional new status
      trip_costs: {
        connect: tripIds.map((id) => ({ id })), // empty array = no connect
      },
    },
    include: {
      cab_service: true,
      trip_costs: {
        include: {
          trip_assignments: {
            include: {
              trip_requests: {
                include: {
                  users_trip_requests_requested_by_user_idTousers: {
                    include: {
                      departments_users_department_idTodepartments : true
                    }
                  },
                },
              },
              vehicles: {
                include: {
                  cab_services: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Only update payment status if there are trips
  if (tripIds.length > 0) {
    await prisma.trip_costs.updateMany({
      where: { id: { in: tripIds } },
      data: { invoice_id: invoice.id,payment_status: "Pending" },
    });
  }

  return invoice;
};

/**
 * PAYMENT: Mark invoice as Paid and update linked trips
 */
export const payInvoice = async (invoiceId: string, paymentData: any) => {
  const { paid_at, transaction_id, notes } = paymentData;

  const currentInvoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!currentInvoice) throw new Error("Invoice not found");

  const newNotes = notes
    ? `${currentInvoice.notes || ""}\n[Payment Note: ${notes}]`
    : currentInvoice.notes || "";

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "Paid",
      paid_date: new Date(paid_at),
      notes: newNotes,
    },
    include: {
      cab_service: true,
      trip_costs: {
        include: {
          trip_assignments: {
            include: {
              trip_requests: {
                include: {
                  users_trip_requests_requested_by_user_idTousers: true,
                },
              },
              vehicles: {
                include: { cab_services: true },
              },
            },
          },
        },
      },
    },
  });

  await prisma.trip_costs.updateMany({
    where: { invoice_id: invoiceId },
    data: { payment_status: "Paid" },
  });

  return updatedInvoice;
};

/**
 * FETCH: Get all invoices with linked trips
 */

export const getInvoices = async (filters: any = {}) => {
  const { status, cab_service_id, month, search } = filters;

  const where: any = {};

  // 1. Filter by Status
  if (status && status !== "all") {
    where.status = status;
  }

  // 2. Filter by Vendor
  if (cab_service_id && cab_service_id !== "all") {
    where.cab_service_id = cab_service_id;
  }

  // 3. Filter by Month
  if (month && month !== "all") {
    where.billing_month = month;
  }

  // 4. Search (Invoice # or Vendor Name)
  if (search) {
    where.OR = [
      { invoice_number: { contains: search } },
      { cab_service: { name: { contains: search } } },
    ];
  }

  return await prisma.invoice.findMany({
    where,
    include: {
      cab_service: true,
      // WARNING: Including full trip_costs here is risky for performance.
      // Only include if absolutely necessary for the list view.
      // The frontend mapping above handles it if it exists, but ideally keep this empty for lists.
      trip_costs: {
        select: { id: true }, // Just get IDs for counting, don't load full trip data
      },
    },
    orderBy: { billing_month: "desc" },
  });
};

/**
 * FETCH: Get a single invoice by ID with trips
 */
export const getInvoiceById = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      cab_service: true,
      trip_costs: {
        include: {
          trip_assignments: {
            include: {
              trip_requests: {
                include: {
                  users_trip_requests_requested_by_user_idTousers: true,
                },
              },
              vehicles: { include: { cab_services: true } },
            },
          },
        },
      },
    },
  });

  if (!invoice) throw new Error("Invoice not found");

  return invoice;
};
