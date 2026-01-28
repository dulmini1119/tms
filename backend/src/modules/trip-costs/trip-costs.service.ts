import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- Helper: Financial Calculations ---
const calculateTotals = (data: any) => {
  const {
    base_fare = 0,
    distance_charges = 0,
    time_charges = 0,
    fuel_cost = 0,
    toll_charges = 0,
    parking_charges = 0,
    waiting_charges = 0,
    night_surcharge = 0,
    holiday_surcharge = 0,
    driver_allowance = 0,
    other_charges = 0,
    discount = 0,
    tax_percentage = 0,
  } = data;

  const subTotal =
    base_fare +
    distance_charges +
    time_charges +
    fuel_cost +
    toll_charges +
    parking_charges +
    waiting_charges +
    night_surcharge +
    holiday_surcharge +
    driver_allowance +
    other_charges -
    discount;

  const taxAmount = subTotal * (tax_percentage / 100);
  const totalCost = subTotal + taxAmount;

  return {
    sub_total: subTotal,
    tax_amount: taxAmount,
    total_cost: totalCost,
  };
};

// --- Helper: Get Full Name ---
const getFullName = (user: any) => {
  if (!user) return "Unknown";
  const first = user.first_name || "";
  const last = user.last_name || "";
  return `${first} ${last}`.trim() || user.employee_id || "Unknown";
};

// --- Helper: Map DB Result to Frontend Interface ---
const mapDbToFrontend = (cost: any) => {
  const assignment = cost.trip_assignments;
  const request = assignment?.trip_requests;
  const requester = request?.users_trip_requests_requested_by_user_idTousers;
  const department = requester?.departments_users_department_idTodepartments;
  const vehicle = assignment?.vehicles;
  const vendor = vehicle?.cab_services;

  return {
    id: cost.id,
    tripRequestId: request?.id || "N/A",
    requestNumber: request?.request_number || "N/A",
    cabServiceName: vendor?.name || "Unassigned",
    cabServiceId: vendor?.id || "",
    
    // Use the DB payment_status directly
    status: cost.payment_status || "Draft",
            
    createdAt: cost.created_at,
    totalCost: Number(cost.total_cost) || 0,
    
    billing: {
      billToDepartment: 
      department?.name || 
      request?.cost_center || 
      requester?.department_name || "Unassigned",
      taxAmount: Number(cost.tax_amount) || 0,
    },

    payment: {
      status: cost.payment_status || "Draft",
      method: cost.payment_method || "N/A",
      paidDate: cost.paid_at || null,
      invoiceNumber: cost.invoice_number || "N/A",
    },
    
    requestedBy: requester ? {
      id: requester.id,
      name: getFullName(requester),
      email: requester.email,
    } : {
      id: "N/A",
      name: "Unknown",
      email: "N/A",
    },
  };
};

/**
 * Get all trip costs with optional filtering
 */
export const getAllTripCosts = async (filters: any) => {
  const { status, vendor_id, start_date, end_date, page, pageSize } = filters;
  
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(pageSize) || 10;
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  // --- 1. FILTER: Vendor ---
  if (vendor_id && vendor_id !== "all" && vendor_id !== "all-vendors") {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendor_id)) {
      console.warn("Invalid vendor_id format:", vendor_id);
    } else {
      where.trip_assignments = {
        vehicles: {
          cab_service_id: vendor_id,
        },
      };
    }
  }

  // --- 2. FILTER: Date / Month ---
  if (filters.month) {
    const [year, monthNum] = filters.month.split("-");
    if (year && monthNum) {
      const start = new Date(Number(year), Number(monthNum) - 1, 1);
      const end = new Date(Number(year), Number(monthNum), 1);

      where.created_at = {
        gte: start,
        lt: end,
      };
    }
  } else if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at.gte = new Date(start_date);
    if (end_date) where.created_at.lte = new Date(end_date);
  }

  // --- 3. FILTER: Status ---
  if (status && status === "Draft") {
     where.invoice_id = null; 
  }
  if (status && status !== "all" && status !== "Draft") {
     where.payment_status = status;
  }

  // --- 4. EXECUTE QUERY ---
  const [costs, totalCount] = await Promise.all([
    prisma.trip_costs.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { created_at: "desc" },
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
            vehicles: {
              include: {
                cab_services: true
              }
            },
            drivers: true
          },
        },
      },
    }),
    prisma.trip_costs.count({ where }),
  ]);

  return {
    data: costs.map(mapDbToFrontend),
    meta: { 
      total: totalCount, 
      page: pageNum, 
      pageSize: limitNum, 
      totalPages: Math.ceil(totalCount / limitNum) 
    },
  };
};

/**
 * Get a specific trip cost by ID
 */
export const getTripCostById = async (id: string) => {
  const cost = await prisma.trip_costs.findUnique({
    where: { id },
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
          vehicles: {
             include: {
                 cab_services: true
             }
          },
          drivers: true,
        },
      },
    },
  });

  if (!cost) throw new Error("Trip Cost not found");
  return mapDbToFrontend(cost);
};

/**
 * Create a new trip cost entry
 */
export const createTripCost = async (data: any) => {
  const { createdByUserId, trip_assignment_id, ...costFields } = data;
  const financials = calculateTotals(costFields);

  const newCost = await prisma.trip_costs.create({
    data: {
      trip_assignment_id,
      ...costFields,
      ...financials,
      payment_status: "Draft", // Default status
      created_by: createdByUserId,
      created_at: new Date(),
    },
    include: {
      trip_assignments: {
        include: {
          trip_requests: {
            include: { users_trip_requests_requested_by_user_idTousers: true }
          },
          vehicles: {
             include: {
                 cab_services: true
             }
          },
        },
      },
    },
  });

  return mapDbToFrontend(newCost);
};

/**
 * Update trip cost details
 */
export const updateTripCost = async (id: string, data: any) => {
  const { updatedByUserId, userRole, ...costFields } = data;
  
  if (userRole !== "SUPERADMIN"){
    throw new Error("FORBIDDEN: You do not have permission to update trip costs.");
  }
  const financials = calculateTotals(costFields);
  const updatedCost = await prisma.trip_costs.update({
    where: { id },
    data: {
      ...costFields,
      ...financials,
      updated_by: updatedByUserId,
      updated_at: new Date(),
    },
    include: {
      trip_assignments: {
        include: {
          trip_requests: {
            include: { users_trip_requests_requested_by_user_idTousers: true }
          },
          vehicles: {
             include: {
                 cab_services: true
             }
          },
        },
      },
    },
  });

  return mapDbToFrontend(updatedCost);
};

/**
 * Delete a trip cost entry
 */
export const deleteTripCost = async (id: string) => {
  await prisma.trip_costs.delete({ where: { id } });
  return { success: true };
};

/**
 * Generate Invoice for a specific trip cost (Legacy function)
 */
export const generateInvoice = async (id: string, data: any) => {
  const { generatedByUserId, due_date, notes } = data;

  const currentCost = await prisma.trip_costs.findUnique({
    where: { id },
    select: { cost_breakdown_details: true }
  });

  if (!currentCost) {
    throw new Error("Trip Cost not found");
  }

  const existingDetails = (currentCost.cost_breakdown_details as any) || {};

  const updatedCost = await prisma.trip_costs.update({
    where: { id },
    data: {
      invoice_number: `INV-${Date.now()}`,
      invoice_date: new Date(),
      payment_status: "Pending",
      updated_by: generatedByUserId,
      updated_at: new Date(),
      cost_breakdown_details: {
        ...existingDetails,
        notes,
        due_date,
      },
    },
    include: {
      trip_assignments: {
        include: {
          trip_requests: {
            include: { users_trip_requests_requested_by_user_idTousers: true }
          },
          vehicles: {
             include: {
                 cab_services: true
             }
          },
        },
      },
    },
  });

  return mapDbToFrontend(updatedCost);
};

/**
 * Record Payment for a trip cost
 */
export const recordPayment = async (id: string, data: any) => {
  const { paymentRecordedByUserId, payment_method, paid_at, transaction_id, notes } = data;

  const cost = await prisma.trip_costs.findUnique({ where: { id } });

  if (!cost) throw new Error("Trip Cost not found");

  const updatedCost = await prisma.trip_costs.update({
    where: { id },
    data: {
      payment_status: "Paid",
      payment_method,
      paid_at: new Date(paid_at),
      updated_by: paymentRecordedByUserId,
      updated_at: new Date(),
      cost_breakdown_details: {
        ...(cost.cost_breakdown_details as object || {}),
        transaction_id,
        payment_notes: notes,
      },
    },
    include: {
      trip_assignments: {
        include: {
          trip_requests: {
            include: { users_trip_requests_requested_by_user_idTousers: true }
          },
          vehicles: {
             include: {
                 cab_services: true
             }
          },
        },
      },
    },
  });

  return mapDbToFrontend(updatedCost);
};