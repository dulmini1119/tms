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
  // 1. Extract Assignment (Direct relation from trip_costs)
  const assignment = cost.trip_assignments;
  
  // 2. Extract Trip Request (Relation from trip_assignments)
  const request = assignment?.trip_requests;
  
  // 3. Extract Requester User (Relation from trip_requests)
  // Matches Schema: users_trip_requests_requested_by_user_idTousers
  const requester = request?.users_trip_requests_requested_by_user_idTousers;
  
  // 4. Extract Department (Relation from users)
  // Matches Schema: departments_users_department_idTodepartments
  const department = requester?.departments_users_department_idTodepartments;
  
  // 5. Extract Vehicle (Relation from trip_assignments)
  const vehicle = assignment?.vehicles;
  
  // 6. Extract Cab Service (Relation from vehicle, based on your vehicles schema)
  const vendor = vehicle?.cab_services;

  const costBreakdown = {
    driverCharges: {
      baseFare: Number(cost.base_fare) || 0,
      driverAllowance: Number(cost.driver_allowance) || 0,
      total: (Number(cost.base_fare) || 0) + (Number(cost.driver_allowance) || 0),
    },
    vehicleCosts: {
      distanceCharges: Number(cost.distance_charges) || 0,
      timeCharges: Number(cost.time_charges) || 0,
      fuelCost: Number(cost.fuel_cost) || 0,
      total: (Number(cost.distance_charges) || 0) + (Number(cost.time_charges) || 0) + (Number(cost.fuel_cost) || 0),
    },
    additionalCosts: {
      toll: Number(cost.toll_charges) || 0,
      parking: Number(cost.parking_charges) || 0,
      waiting: Number(cost.waiting_charges) || 0,
      nightSurcharge: Number(cost.night_surcharge) || 0,
      holidaySurcharge: Number(cost.holiday_surcharge) || 0,
      others: Number(cost.other_charges) || 0,
      total: (Number(cost.toll_charges) || 0) + 
             (Number(cost.parking_charges) || 0) + 
             (Number(cost.waiting_charges) || 0) + 
             (Number(cost.night_surcharge) || 0) + 
             (Number(cost.holiday_surcharge) || 0) + 
             (Number(cost.other_charges) || 0),
    },
    totalAdditionalCosts: (Number(cost.toll_charges) || 0) + 
                        (Number(cost.parking_charges) || 0) + 
                        (Number(cost.waiting_charges) || 0),
    taxAmount: Number(cost.tax_amount) || 0,
  };

  return {
    id: cost.id,
    tripRequestId: request?.id || "N/A",
    requestNumber: request?.request_number || "N/A",
    cabServiceName: vendor?.name || "Unassigned",
    cabServiceId: vendor?.id || "",
    
    // Mapping Status to Frontend expected types (Draft, Pending, Paid, Overdue)
    status: cost.payment_status === "Paid" ? "Paid" : 
            cost.invoice_number ? "Pending" : 
            new Date(cost.created_at) < new Date(new Date().setDate(new Date().getDate() - 30)) ? "Overdue"
            : "Draft",
            
    createdAt: cost.created_at,
    totalCost: Number(cost.total_cost) || 0,
    costBreakdown: costBreakdown,
    
    billing: {
      billToDepartment: department?.name || request?.cost_center || "General",
      taxAmount: Number(cost.tax_amount) || 0,
    },

    payment: {
      status: cost.payment_status,
      method: cost.payment_method,
      paidDate: cost.paid_at,
      invoiceNumber: cost.invoice_number,
    },
    
    // Extra info useful for frontend list views
    tripCount: 1,
    requestedBy: requester ? {
      id: requester.id,
      name: getFullName(requester),
      email: requester.email,
    } : null,
  };
};

export const getAllTripCosts = async (filters: any) => {
  const { status, vendor_id, start_date, end_date, page, pageSize, user } = filters;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(pageSize) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Initialize where object
  const where: any = {};

  // 1. RBAC: Restrict to own requests if not Admin/Accountant
  if (!["ADMIN", "SUPERADMIN", "ACCOUNTANT"].includes(user?.role)) {
     where.trip_assignments = {
       trip_requests: {
         requested_by_user_id: user.id
       }
     };
  }

  // 2. Filter by Status
  if (status && status !== "all-status") {
    where.payment_status = status;
  }

  // 3. Filter by Vendor (Cab Service)
  // ⚠️ FIX: Use SPREAD (...) to keep RBAC conditions!
  if (vendor_id && vendor_id !== "all-vendors") {
    where.trip_assignments = {
      ...where.trip_assignments, // Keep existing conditions (RBAC)
      vehicles: {
        cab_service_id: vendor_id
      }
    };
  }

  // 4. Filter by Date Range
  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at.gte = new Date(start_date);
    if (end_date) where.created_at.lte = new Date(end_date);
  }

  console.log("Fetching trip costs with filters:", filters);

  const [costs, totalCount] = await Promise.all([
    prisma.trip_costs.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { created_at: "desc" },
      include: {
        trip_assignments: {
          include: {
            // Relation to Trip Request table
            trip_requests: {
              include: {
                // Relation to User who requested
                users_trip_requests_requested_by_user_idTousers: {
                   include: { departments_users_department_idTodepartments: { select: { name: true } } }
                }
              }
            },
            // Relation to Vehicle (needed to get Vendor)
            vehicles: {
              include: {
                cab_services: true
              }
            },
            // Include Driver details
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

export const createTripCost = async (data: any) => {
  const { createdByUserId, trip_assignment_id, ...costFields } = data;
  const financials = calculateTotals(costFields);

  const newCost = await prisma.trip_costs.create({
    data: {
      trip_assignment_id,
      ...costFields,
      ...financials,
      payment_status: "Draft",
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

export const updateTripCost = async (id: string, data: any) => {
  const { updatedByUserId, ...costFields } = data;
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

export const deleteTripCost = async (id: string) => {
  await prisma.trip_costs.delete({ where: { id } });
  return { success: true };
};

export const generateInvoice = async (id: string, data: any) => {
  const { generatedByUserId, due_date, notes } = data;

  const updatedCost = await prisma.trip_costs.update({
    where: { id },
    data: {
      invoice_number: `INV-${Date.now()}`,
      invoice_date: new Date(),
      payment_status: "Pending",
      updated_by: generatedByUserId,
      updated_at: new Date(),
      cost_breakdown_details: {
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

export const recordPayment = async (id: string, data: any) => {
  const { paymentRecordedByUserId, payment_method, paid_at, transaction_id, notes } = data;

  const updatedCost = await prisma.trip_costs.update({
    where: { id },
    data: {
      payment_status: "Paid",
      payment_method,
      paid_at: new Date(paid_at),
      updated_by: paymentRecordedByUserId,
      updated_at: new Date(),
      cost_breakdown_details: {
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