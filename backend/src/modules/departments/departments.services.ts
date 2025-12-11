import prisma from "../../config/database.js";
import { AppError } from "../../middleware/errorHandler.js";
import { ERROR_CODES, HTTP_STATUS } from "../../utils/constants.js";

interface CreateDepartmentData {
  name: string;
  code?: string;
  description?: string | null;
  type?: string | null;
  status?: string;
  business_unit_id?: string | null;
  head_id?: string | null;
  budget_allocated?: number | null;
  budget_currency?: string | null;
  fiscal_year?: string | null;
}

interface UpdateDepartmentData {
  name?: string;
  code?: string;
  description?: string | null;
  type?: string | null;
  status?: string;
  business_unit_id?: string | null;
  head_id?: string | null;
  budget_allocated?: number | null;
  budget_utilized?: number | null;
  budget_currency?: string | null;
  fiscal_year?: string | null;
}

interface DepartmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  business_unit_id?: string;
  sort_by?: "name" | "code" | "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
}

export class DepartmentService {
  private async findDepartmentOrThrow(id: string) {
    const department = await prisma.departments.findUnique({
      where: { id },
      select: { id: true, name: true, code: true },
    });

    if (!department) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Department not found",
        HTTP_STATUS.NOT_FOUND
      );
    }
    return department;
  }

  // --- GET ALL DEPARTMENTS ---
  async getAll(query: DepartmentQueryParams = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const search = query.search || "";
    const status = query.status || "";
    const business_unit_id = query.business_unit_id || "";
    const sort_by = query.sort_by || "created_at";
    const sort_order = query.sort_order || "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all-status") {
      where.status = status;
    }

    if (business_unit_id && business_unit_id !== "all-business-units") {
      where.business_unit_id = business_unit_id;
    }

    const [departments, total] = await Promise.all([
      prisma.departments.findMany({
        where,
        skip,
        take: limit,
        include: {
          business_units: { select: { id: true, name: true, code: true } },
          users_departments_head_idTousers: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              user_roles_user_roles_user_idTousers: {
                select: {
                  role: { select: { code: true } },
                },
              },
            },
          },
          _count: {
            select: {
              users_users_department_idTodepartments: true,
              vehicles: true,
              trip_requests: true,
              expenses: true,
            },
          },
        },
        orderBy: { [sort_by]: sort_order },
      }),
      prisma.departments.count({ where }),
    ]);

    return {
      departments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // --- GET DEPARTMENT BY ID ---
  async getById(id: string) {
    const department = await prisma.departments.findUnique({
      where: { id },
      include: {
        business_units: { select: { id: true, name: true, code: true } },
        users_departments_head_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        users_users_department_idTodepartments: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            position: true,
            status: true,
          },
        },
        vehicles: {
          select: {
            id: true,
            make: true,
            model: true,
            registration_number: true,
            availability_status: true,
          },
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            description: true,
            expense_date: true,
            status: true,
          },
          orderBy: { expense_date: "desc" },
        },
      },
    });

    if (!department) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Department not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    return department;
  }

  // --- CREATE DEPARTMENT ---
  async create(data: CreateDepartmentData, userId: string) {
    const name = data.name.trim();
    if (!name) {
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        "Department name is required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const code =
      data.code?.trim().toUpperCase().replace(/\s+/g, "_") ||
      name.toUpperCase().replace(/\s+/g, "_");

    const exists = await prisma.departments.findFirst({
      where: { OR: [{ name }, { code }] },
    });

    if (exists) {
      throw new AppError(
        ERROR_CODES.ALREADY_EXISTS,
        "Department with this name or code already exists",
        HTTP_STATUS.CONFLICT
      );
    }

    return await prisma.departments.create({
      data: {
        name,
        code,
        description: data.description?.trim() || null,
        type: data.type?.trim() || null,
        status: data.status || "Active",
        business_unit_id: data.business_unit_id || null,
        head_id: data.head_id || null,
        budget_allocated: data.budget_allocated || null,
        budget_currency: data.budget_currency || null,
        fiscal_year: data.fiscal_year || null,
        created_by: userId,
        updated_by: userId,
      },
      include: {
        business_units: true,
        users_departments_head_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });
  }

  // --- UPDATE DEPARTMENT ---
  async update(id: string, data: UpdateDepartmentData, userId: string) {
    await this.findDepartmentOrThrow(id);

    let name = data.name?.trim();
    let code: string | undefined;

    if (name) {
      code =
        data.code?.trim().toUpperCase().replace(/\s+/g, "_") ||
        name.toUpperCase().replace(/\s+/g, "_");

      const exists = await prisma.departments.findFirst({
        where: { OR: [{ name }, { code }], id: { not: id } },
      });

      if (exists) {
        throw new AppError(
          ERROR_CODES.ALREADY_EXISTS,
          "Another department with this name or code already exists",
          HTTP_STATUS.CONFLICT
        );
      }
    }

    return await prisma.departments.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        description: data.description?.trim() || null,
        type: data.type?.trim() || null,
        ...(data.status && { status: data.status }),
        ...(data.business_unit_id !== undefined && {
          business_unit_id: data.business_unit_id,
        }),
        ...(data.head_id !== undefined && { head_id: data.head_id }),
        ...(data.budget_allocated !== undefined && {
          budget_allocated: data.budget_allocated,
        }),
        ...(data.budget_utilized !== undefined && {
          budget_utilized: data.budget_utilized,
        }),
        budget_currency: data.budget_currency?.trim() || null,
        fiscal_year: data.fiscal_year?.trim() || null,
        updated_by: userId,
      },
      include: {
        business_units: true,
        users_departments_head_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });
  }

  // --- DELETE DEPARTMENT ---
  async delete(id: string) {
    await this.findDepartmentOrThrow(id);

    const associatedRecords = await prisma.departments.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users_users_department_idTodepartments: true,
            vehicles: true,
            expenses: true,
            trip_requests: true,
          },
        },
      },
    });

    const counts = associatedRecords!._count;

    if (
      counts.users_users_department_idTodepartments > 0 ||
      counts.vehicles > 0 ||
      counts.expenses > 0 ||
      counts.trip_requests > 0
    ) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Cannot delete department with associated users, vehicles, expenses, or trip requests",
        HTTP_STATUS.FORBIDDEN
      );
    }

    await prisma.departments.delete({ where: { id } });
    return true;
  }

  // --- GET POTENTIAL DEPARTMENT HEADS ---
async getPotentialHeads(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where: {
        status: "Active",
        OR: [
          { position: "HOD" },
          { user_roles_user_roles_user_idTousers: { some: { role: { code: "HOD" } } } }
        ]
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        position: true,
        user_roles_user_roles_user_idTousers: {
          select: { role: { select: { code: true } } }
        },
      },
      skip,
      take: limit,
    }),
    prisma.users.count({
      where: {
        status: "Active",
        OR: [
          { position: "HOD" },
          { user_roles_user_roles_user_idTousers: { some: { role: { code: "HOD" } } } }
        ]
      },
    }),
  ]);

  return {
    users: users.map(u => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      roles: u.user_roles_user_roles_user_idTousers.map(ur => ur.role.code.toUpperCase()),
      position: u.position
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}


}

export const departmentService = new DepartmentService();
