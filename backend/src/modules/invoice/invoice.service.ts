import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * PREVIEW: Get details for a potential invoice (before generating)
 * Returns the list of trips and the total cost.
 */
export const getDraftInvoiceDetails = async (cabServiceId: string, month: string) => {
  // 1. Define the Date Range for the Month
  const [year, monthIndex] = month.split("-");
  const startDate = new Date(parseInt(year), parseInt(monthIndex) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(monthIndex), 1); // Start of next month

  // 2. Find all Trip Costs that are NOT yet invoiced for this Vendor & Month
  const tripCosts = await prisma.trip_costs.findMany({
    where: {
      invoice_id: null, // MUST NOT be linked to an existing invoice
      trip_assignments: {
        vehicles: {
          cab_service_id: cabServiceId
        }
      },
      created_at: {
        gte: startDate,
        lt: endDate
      }
    },
    include: {
      trip_assignments: {
        include: {
          trip_requests: {
            include: { 
               users_trip_requests_requested_by_user_idTousers: true 
            }
          },
          vehicles: {
            include: { cab_services: true }
          }
        }
      }
    }
  });

  if (tripCosts.length === 0) {
    return null; // No trips to bill
  }

  // 3. Calculate Totals
  const totalAmount = tripCosts.reduce((sum, trip) => sum + Number(trip.total_cost), 0);

  return {
    cabServiceId,
    cabServiceName: tripCosts[0].trip_assignments?.vehicles?.cab_services?.name || "Unknown Vendor",
    month,
    tripCount: tripCosts.length,
    totalAmount,
    trips: tripCosts, // Send full details to frontend for preview
    tripIds: tripCosts.map(t => t.id) // We need these IDs to link them later
  };
};

/**
 * GENERATE: Create the actual Monthly Invoice record in the DB
 */
export const createMonthlyInvoice = async (payload: {
  cabServiceId: string;
  month: string;
  dueDate: string;
  notes: string;
  userId: string;
}) => {
  const { cabServiceId, month, dueDate, notes, userId } = payload;

  // 1. Validate: Get the draft data first to ensure nothing changed
  const draftData = await getDraftInvoiceDetails(cabServiceId, month);
  
  if (!draftData || draftData.tripIds.length === 0) {
    throw new Error("No billable trips found for this vendor and month.");
  }

  // 2. Create the Invoice Record
  const invoice = await prisma.invoice.create({
    data: {
      invoice_number: `INV-${cabServiceId.slice(0,4).toUpperCase()}-${month.replace("-", "")}`,
      cab_service_id: cabServiceId,
      billing_month: month,
      total_amount: draftData.totalAmount,
      due_date: new Date(dueDate),
      notes: notes,
      created_by: userId,
      status: "Pending", // Once generated, it becomes Pending
      
      // CRITICAL STEP: Link all found trips to this invoice
      trip_costs: {
        connect: draftData.tripIds.map(id => ({ id }))
      }
    },
    include: {
      cab_service: true
    }
  });

  // 3. Update individual Trip Costs status to "Pending" (optional, but good for tracking)
  await prisma.trip_costs.updateMany({
    where: { id: { in: draftData.tripIds } },
    data: { payment_status: "Pending" }
  });

  return invoice;
};

/**
 * PAYMENT: Mark a Monthly Invoice as Paid
 */
export const payInvoice = async (invoiceId: string, paymentData: any) => {
  const { paid_at, transaction_id, notes } = paymentData;

  // 1. Get the current invoice to preserve existing notes
  const currentInvoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  if (!currentInvoice) {
    throw new Error("Invoice not found");
  }

  // 2. Construct new notes string
  const newNotes = notes 
    ? `${currentInvoice.notes || ""}\n[Payment Note: ${notes}]` 
    : currentInvoice.notes || "";

  // 3. Update Invoice Table
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "Paid",
      paid_date: new Date(paid_at),
      notes: newNotes
    }
  });

  // 4. IMPORTANT: Also update ALL linked Trip Costs to "Paid"
  await prisma.trip_costs.updateMany({
    where: { invoice_id: invoiceId },
    data: { payment_status: "Paid" }
  });

  return updatedInvoice;
};