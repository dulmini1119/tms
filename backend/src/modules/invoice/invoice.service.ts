import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Helper: Get Draft Details (Uninvoiced Trips)
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
      invoice_id: null, // Only uninvoiced
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
                include: { departments_users_department_idTodepartments: { select: { name: true } } }
              }
            },
          },
          vehicles: {
            include: { cab_services: true },
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
      tripCosts[0].trip_assignments?.vehicles?.cab_services?.name || "Unknown Vendor",
    month,
    tripCount: tripCosts.length,
    totalAmount,
    trips: tripCosts,
    tripIds: tripCosts.map((t) => t.id),
  };
};

/**
 * GENERATE: Create Invoice (Link Trips & Save Total)
 */
export const createMonthlyInvoice = async (payload: {
  cabServiceId: string;
  month: string;
  dueDate: string;
  notes: string;
  userId: string;
}) => {
  const { cabServiceId, month, dueDate, notes, userId } = payload;

  // 1. Calculate data from uninvoiced trips
  const draftData = await getDraftInvoiceDetails(cabServiceId, month);
  const tripIds = draftData?.tripIds || [];
  const totalAmount = draftData?.totalAmount || 0;
  const tripCount = draftData?.tripCount || 0;

  let finalNotes = notes || "";
  if (tripIds.length === 0) {
    finalNotes = finalNotes
      ? `${finalNotes}\n[Auto: No billable trips found for this period]`
      : "[Auto: No billable trips found for this period]";
  }

  // 2. Create Invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoice_number: `INV-${cabServiceId.slice(0, 4).toUpperCase()}-${month.replace("-", "")}-${Date.now()}`,
      cab_service_id: cabServiceId,
      billing_month: month,
      total_amount: totalAmount, // Save calculated total
      due_date: new Date(dueDate),
      notes: finalNotes,
      created_by: userId,
      status: tripCount === 0 ? "NoCharges" : "Pending",
      trip_costs: {
        connect: tripIds.map((id) => ({ id })), // Link trips
      },
    },
    include: { cab_service: true },
  });

  // 3. Update Trip Costs to link back to Invoice
  if (tripIds.length > 0) {
    await prisma.trip_costs.updateMany({
      where: { id: { in: tripIds } },
      data: { invoice_id: invoice.id, payment_status: "Pending" },
    });
  }

  return invoice;
};

/**
 * PAYMENT: Mark Invoice as Paid
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
  });

  await prisma.trip_costs.updateMany({
    where: { invoice_id: invoiceId },
    data: { payment_status: "Paid" },
  });

  return updatedInvoice;
};

/**
 * FETCH LIST: Get Invoices Grouped by Service & Month
 */
export const getInvoices = async (filters: any = {}) => {
  const { status, cab_service_id, month, search } = filters;
  const where: any = {};

  if (status && status !== "all") where.status = status;
  if (cab_service_id && cab_service_id !== "all") where.cab_service_id = cab_service_id;
  if (month && month !== "all") where.billing_month = month; // Filter by Month
  
  if (search) {
    where.OR = [
      { invoice_number: { contains: search, mode: 'insensitive' } },
      { cab_service: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      cab_service: { select: { id: true, name: true } },
      trip_costs: { select: { id: true, total_cost: true } }
    },
    orderBy: { billing_month: "desc" },
  });

  // Group Logic
  const groupedData: Record<string, any> = {};

  for (const inv of invoices) {
    // Key: ServiceID + Month (e.g., "123-Jan2026")
    const key = `${inv.cab_service_id}-${inv.billing_month}`;

    if (!groupedData[key]) {
      groupedData[key] = {
        id: inv.cab_service_id,
        cabServiceId: inv.cab_service_id,
        cabServiceName: inv.cab_service.name,
        billingMonth: inv.billing_month,
        tripCount: 0,
        totalAmount: 0,
        statuses: new Set<string>(),
        _mostRecentInvoiceId: inv.id
      };
    }

    const group = groupedData[key];
    let invoiceRealTotal = 0;
    let invoiceRealCount = 0;

    if (inv.status === "Draft") {
      // Draft: Look for uninvoiced trips
      const [year, monthNum] = inv.billing_month.split("-");
      const start = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const end = new Date(parseInt(year), parseInt(monthNum), 1);

      const draftTrips = await prisma.trip_costs.findMany({
        where: {
          invoice_id: null,
          trip_assignments: { vehicles: { cab_service_id: inv.cab_service_id } },
          created_at: { gte: start, lt: end }
        },
        select: { total_cost: true }
      });

      invoiceRealTotal = draftTrips.reduce((sum, t) => sum + Number(t.total_cost), 0);
      invoiceRealCount = draftTrips.length;
    } else {
      // Paid/Pending: Use linked trips
      // Edge case: If status is Paid but total is 0 (manual DB error), fallback to uninvoiced
      let linkedTotal = inv.trip_costs.reduce((sum, t) => sum + Number(t.total_cost), 0);
      
      if (linkedTotal > 0) {
        invoiceRealTotal = linkedTotal;
        invoiceRealCount = inv.trip_costs.length;
      } else {
        // Fallback check
        const [year, monthNum] = inv.billing_month.split("-");
        const start = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const end = new Date(parseInt(year), parseInt(monthNum), 1);

        const orphanTrips = await prisma.trip_costs.findMany({
          where: {
            invoice_id: null,
            trip_assignments: { vehicles: { cab_service_id: inv.cab_service_id } },
            created_at: { gte: start, lt: end }
          },
          select: { total_cost: true }
        });
        invoiceRealTotal = orphanTrips.reduce((sum, t) => sum + Number(t.total_cost), 0);
        invoiceRealCount = orphanTrips.length;
      }
    }

    group.tripCount += invoiceRealCount;
    group.totalAmount += invoiceRealTotal;
    group.statuses.add(inv.status);
  }

  const result = Object.values(groupedData).map((group: any) => {
    let finalStatus = "Draft";
    if (group.statuses.has("Overdue")) finalStatus = "Overdue";
    else if (group.statuses.has("Pending")) finalStatus = "Pending";
    else if (group.statuses.has("Paid")) finalStatus = "Paid";
    else if (group.statuses.has("NoCharges")) finalStatus = "NoCharges";

    return {
      ...group,
      status: finalStatus,
      statuses: undefined,
      _mostRecentInvoiceId: undefined
    };
  });

  return result;
};

/**
 * FETCH DETAILS: Get Single Invoice with Vehicle Breakdown
 */
export const getInvoiceById = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      cab_service: true,
      trip_costs: { select: { id: true } }
    },
  });

  if (!invoice) throw new Error("Invoice not found");

  let detailedTrips: any[] = [];

  // Logic for Draft vs Finalized
  if (invoice.status === "Draft" || invoice.trip_costs.length === 0) {
    // Fetch Uninvoiced Trips
    const [year, monthIndex] = invoice.billing_month.split("-");
    const startDate = new Date(parseInt(year), parseInt(monthIndex) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthIndex), 1);

    const rawTripCosts = await prisma.trip_costs.findMany({
      where: {
        invoice_id: null,
        trip_assignments: {
          vehicles: { cab_service_id: invoice.cab_service_id },
        },
        created_at: { gte: startDate, lt: endDate },
      },
      include: {
        trip_assignments: {
          include: {
            trip_requests: {
              include: {
                users_trip_requests_requested_by_user_idTousers: {
                  include: { departments_users_department_idTodepartments: { select: { name: true } } }
                }
              }
            },
            vehicles: { select: { id: true, registration_number: true, make: true, model: true } },
            drivers: {
              select: { id: true, users_drivers_user_idTousers: { select: { first_name: true, last_name: true } } }
            }
          },
        },
      },
      orderBy: { created_at: 'desc' }
    });

    detailedTrips = rawTripCosts.map((tc: any) => {
      const driverUser = tc.trip_assignments?.drivers?.users_drivers_user_idTousers;
      return {
        id: tc.id,
        created_at: tc.created_at,
        total_cost: Number(tc.total_cost),
        driverName: driverUser ? `${driverUser.first_name} ${driverUser.last_name}` : "Unassigned",
        trip_assignments: tc.trip_assignments,
        billing: { billToDepartment: tc.trip_assignments?.trip_requests?.users_trip_requests_requested_by_user_idTousers?.departments_users_department_idTodepartments?.name || "Unassigned" }
      };
    });
  } else {
    // Fetch Linked Trips
    const linkedTrips = await prisma.trip_costs.findMany({
      where: { invoice_id: invoiceId },
      include: {
        trip_assignments: {
          include: {
            trip_requests: {
              include: {
                users_trip_requests_requested_by_user_idTousers: {
                  include: { departments_users_department_idTodepartments: { select: { name: true } } }
                }
              }
            },
            vehicles: { select: { id: true, registration_number: true, make: true, model: true } },
            drivers: {
              select: { id: true, users_drivers_user_idTousers: { select: { first_name: true, last_name: true } } }
            }
          },
        },
      },
      orderBy: { created_at: 'desc' }
    });

    detailedTrips = linkedTrips.map((tc: any) => {
      const driverUser = tc.trip_assignments?.drivers?.users_drivers_user_idTousers;
      return {
        id: tc.id,
        created_at: tc.created_at,
        total_cost: Number(tc.total_cost),
        driverName: driverUser ? `${driverUser.first_name} ${driverUser.last_name}` : "Unassigned",
        trip_assignments: tc.trip_assignments,
      };
    });
  }

  // Group by Vehicle
  const vehicleGroups: Record<string, any> = {};
  detailedTrips.forEach((trip) => {
    const vehicle = trip.trip_assignments?.vehicles;
    const regNumber = vehicle?.registration_number || "Unknown Vehicle";

    if (!vehicleGroups[regNumber]) {
      vehicleGroups[regNumber] = {
        vehicleId: vehicle?.id || "unknown",
        registrationNumber: regNumber,
        make: vehicle?.make || "N/A",
        model: vehicle?.model || "N/A",
        trips: [],
        totalCost: 0,
        tripCount: 0
      };
    }

    vehicleGroups[regNumber].trips.push(trip);
    vehicleGroups[regNumber].totalCost += Number(trip.total_cost);
    vehicleGroups[regNumber].tripCount += 1;
  });

  return {
    ...invoice,
    totalAmount: Object.values(vehicleGroups).reduce((sum: any, vg: any) => sum + vg.totalCost, 0),
    breakdownByVehicle: Object.values(vehicleGroups)
  };
};