import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: Determine Final Status from approval steps
const calculateFinalStatus = (approvals: any[]): string => {
  if (approvals.length === 0) return "Pending";

  const hasRejection = approvals.some((a) => a.status === "Rejected");
  if (hasRejection) return "Rejected";

  const allApproved = approvals.every((a) => a.status === "Approved");
  if (allApproved) return "Approved";

  return "Pending";
};

// Helper: Find the current pending level
const calculateCurrentLevel = (approvals: any[]): number => {
  for (let i = 0; i < approvals.length; i++) {
    if (approvals[i].status !== "Approved") {
      return approvals[i].approval_level;
    }
  }
  return approvals.length + 1; // All approved → next level
};

// Helper to safely concatenate names
const getFullName = (user: any) => {
  if (!user) return "Unknown";
  const first = user.first_name || "";
  const last = user.last_name || "";
  return `${first} ${last}`.trim() || "Unknown";
};

// Map DB → Frontend structure
const mapApprovalToFrontend = (request: any, approvals: any[]) => {
  // Correct relation name from schema
  const requesterUser = request.users_trip_requests_requested_by_user_idTousers;
  
  const department = requesterUser?.departments_users_department_idTodepartments;

  const sortedApprovals = approvals.sort((a, b) => a.approval_level - b.approval_level);

  return {
    id: request.id,
    tripRequestId: request.id,
    requestNumber: request.request_number,
    finalStatus: calculateFinalStatus(approvals),
    escalated: request.escalated || false,
    createdAt: request.created_at?.toISOString() || "",

    // Workflow & History
    approvalWorkflow: sortedApprovals.map((a) => ({
      level: a.approval_level,
      approverName: a.users ? getFullName(a.users) : "Pending Assignee",
      approverRole: a.approver_role || "Approver",
    })),

    approvalHistory: sortedApprovals.map((a) => ({
      level: a.approval_level,
      approver: {
        name: a.users ? getFullName(a.users) : "System",
        role: a.approver_role || "Approver",
      },
      action: a.status,
      timestamp: a.approved_at?.toISOString() || a.created_at?.toISOString() || "",
      comments: a.comments || "",
      ipAddress: "192.168.1.1", // Placeholder – replace with real value if available
    })),

    currentApprovalLevel: calculateCurrentLevel(sortedApprovals),

    // Rules (currently mocked – load from config/DB later if needed)
    approvalRules: {
      costThreshold: 50000,
      departmentApprovalRequired: true,
      managerApprovalRequired: true,
      financeApprovalRequired: false,
    },

    // Requester details
    requestedBy: {
      id: requesterUser?.id || "",
      name: getFullName(requesterUser),
      email: requesterUser?.email || "",
      employeeId: requesterUser?.employee_id || "",
      department: department?.name || "Unassigned",
    },

    // Trip basics
    tripDetails: {
      fromLocation: { address: request.from_location_address || "" },
      toLocation: { address: request.to_location_address || "" },
      departureDate: request.departure_date ? request.departure_date.toISOString().split("T")[0] : "",
      departureTime: request.departure_time ? request.departure_time.toTimeString().substring(0, 5) : "",
    },
    purpose: {
      description: request.purpose_description || "",
      category: request.purpose_category || "General",
    },
    estimatedCost: Number(request.estimated_cost) || 0,
    currency: request.currency || "LKR",
  };
};

export const getAllTripApprovals = async (filters: any) => {
  const { searchTerm = "", status = "all", page = 1, pageSize = 10 } = filters;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: any = {};

  if (searchTerm) {
    where.OR = [
      { request_number: { contains: searchTerm, mode: "insensitive" } },
      { purpose_description: { contains: searchTerm, mode: "insensitive" } },
      {
        users_trip_requests_requested_by_user_idTousers: {
          OR: [
            { first_name: { contains: searchTerm, mode: "insensitive" } },
            { last_name: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [requests, totalCount] = await Promise.all([
    prisma.trip_requests.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        // Correct relation name for requester
        users_trip_requests_requested_by_user_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            employee_id: true,
            departments_users_department_idTodepartments: { select: { name: true } },
          },
        },
        // All approval steps + their approvers
        trip_approvals: {
          include: {
            users: { select: { id: true, first_name: true, last_name: true } },
          },
          orderBy: { approval_level: "asc" },
        },
      },
    }),
    prisma.trip_requests.count({ where }),
  ]);

  const transformedData = requests.map((req) =>
    mapApprovalToFrontend(req, req.trip_approvals || [])
  );

  let filteredData = transformedData;
  if (status !== "all") {
    filteredData = transformedData.filter((item) => item.finalStatus === status);
  }

  return {
    data: filteredData,
    meta: {
      total: status === "all" ? totalCount : filteredData.length,
      page,
      pageSize,
      totalPages: Math.ceil(
        (status === "all" ? totalCount : filteredData.length) / pageSize
      ),
    },
  };
};

export const getApprovalDetails = async (id: string) => {
  const request = await prisma.trip_requests.findUnique({
    where: { id },
    include: {
      // Correct relation name
      users_trip_requests_requested_by_user_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          employee_id: true,
          departments_users_department_idTodepartments: { select: { name: true } },
        },
      },
      trip_approvals: {
        include: {
          users: { select: { id: true, first_name: true, last_name: true } },
        },
        orderBy: { approval_level: "asc" },
      },
    },
  });

  if (!request) throw new Error("Trip request not found");

  return mapApprovalToFrontend(request, request.trip_approvals || []);
};

export const processApprovalAction = async (approvalId: string, payload: any) => {
  const { status, comments, approverUserId } = payload;

  const approvalStep = await prisma.trip_approvals.findUnique({
    where: { id: approvalId },
    include: { trip_requests: true },
  });

  if (!approvalStep) throw new Error("Approval step not found");
  if (approvalStep.status !== "Pending") throw new Error("Request already processed");

  const updatedStep = await prisma.trip_approvals.update({
    where: { id: approvalId },
    data: {
      status,
      comments,
      approver_user_id: approverUserId,
      approved_at: new Date(),
    },
  });

  return {
    id: updatedStep.id,
    status: updatedStep.status,
    message: `Request ${status.toLowerCase()}`,
  };
};