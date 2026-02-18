import prisma from "../../config/database.js";
import { AppError } from "../../middleware/errorHandler.js";
import { ERROR_CODES, HTTP_STATUS } from "../../utils/constants.js";

interface CreateBusinessUnitData {
  name: string;
  code?: string;
  description?: string | null;
  status?: "Active" | "Inactive";
  head_id?: string | null;
  manager_id?: string | null; // compatibility alias
}

interface UpdateBusinessUnitData {
  name?: string;
  code?: string;
  description?: string | null;
  status?: "Active" | "Inactive";
  head_id?: string | null;
  manager_id?: string | null; // compatibility alias
}

interface BUQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: "name" | "code" | "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
}

export class BusinessUnitService {
  private async findOrThrow(id: string) {
    const bu = await prisma.business_units.findUnique({ where: { id } });
    if (!bu) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Business Unit not found",
        HTTP_STATUS.NOT_FOUND
      );
    }
    return bu;
  }

async getAll(query: BUQueryParams = {}) {
  let {
    page = 1,
    limit = 10,
    search = "",
    sort_by = "created_at",
    sort_order = "desc",
  } = query;

  // FIX: convert to numbers
  const pageNum = Number(page);
  const limitNum = Number(limit);

  if (isNaN(pageNum) || isNaN(limitNum)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "page and limit must be valid numbers",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const businessUnits = await prisma.business_units.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sort_by]: sort_order },
      include: {
        users_business_units_head_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        departments: { select: { id: true, name: true } },
        _count: {
          select: { users_users_business_unit_idTobusiness_units: true },
        },
      },
    });

    const total = await prisma.business_units.count({ where });

    return {
      businessUnits,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  } catch (error) {
    console.error("Prisma error in getAll:", error);
    throw error;
  }
}


  async getById(id: string) {
    const bu = await prisma.business_units.findUnique({
      where: { id },
      include: {
        users_business_units_head_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        departments: { select: { id: true, name: true } },
        _count: {
          select: { users_users_business_unit_idTobusiness_units: true },
        },
      },
    });

    if (!bu) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Business Unit not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    return bu;
  }

  async create(data: CreateBusinessUnitData, userId: string) {
    const name = data.name.trim();
    const code =
      data.code?.trim().toUpperCase() ||
      name.toUpperCase().replace(/\s+/g, "_");

    const exists = await prisma.business_units.findFirst({
      where: { OR: [{ name }, { code }] },
    });

    if (exists) {
      throw new AppError(
        ERROR_CODES.ALREADY_EXISTS,
        "Business Unit already exists",
        HTTP_STATUS.CONFLICT
      );
    }

    const headId = data.head_id ?? data.manager_id ?? null;

    return await prisma.business_units.create({
      data: {
        name,
        code,
        description: data.description?.trim() || null,
        status: data.status || "Active",
        head_id: headId,
        created_by: userId,
        updated_by: userId,
      },
      include: {
        users_business_units_head_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        departments: { select: { id: true, name: true } },
        _count: {
          select: { users_users_business_unit_idTobusiness_units: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateBusinessUnitData, userId: string) {
    await this.findOrThrow(id);

    const updates: Record<string, unknown> = {};
    const checkUniqueness: any[] = [];

    // Handle name update
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      updates.name = trimmedName;
      checkUniqueness.push({ name: trimmedName });
    }

    // Handle code: auto-generate if name changed and code not provided
    if (data.name !== undefined && data.code === undefined) {
      const autoCode = data.name.trim().toUpperCase().replace(/\s+/g, "_");
      updates.code = autoCode;
      checkUniqueness.push({ code: updates.code });
    } else if (data.code !== undefined) {
      updates.code = data.code.trim().toUpperCase();
      checkUniqueness.push({ code: updates.code });
    }

    if (data.description !== undefined) {
      updates.description = data.description?.trim() || null;
    }
    if (data.status !== undefined) {
      updates.status = data.status;
    }
    if (data.head_id !== undefined || data.manager_id !== undefined) {
      updates.head_id = data.head_id ?? data.manager_id ?? null;
    }

    // Check uniqueness only if name or code is being updated
    if (checkUniqueness.length > 0) {
      const existing = await prisma.business_units.findFirst({
        where: {
          OR: checkUniqueness,
          id: { not: id },
        },
      });

      if (existing) {
        throw new AppError(
          ERROR_CODES.ALREADY_EXISTS,
          "Another Business Unit exists with the same name or code",
          HTTP_STATUS.CONFLICT
        );
      }
    }

    return await prisma.business_units.update({
      where: { id },
      data: {
        ...updates,
        updated_by: userId,
      },
      include: {
        users_business_units_head_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        departments: { select: { id: true, name: true } },
        _count: {
          select: { users_users_business_unit_idTobusiness_units: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findOrThrow(id);

    const bu = await prisma.business_units.findUnique({
      where: { id },
      select: {
        _count: {
          select: { users_users_business_unit_idTobusiness_units: true },
        },
      },
    });

    if (bu!._count.users_users_business_unit_idTobusiness_units > 0) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Cannot delete Business Unit that has employees assigned",
        HTTP_STATUS.FORBIDDEN
      );
    }

    await prisma.business_units.delete({ where: { id } });
    return true;
  }
}

export const businessUnitService = new BusinessUnitService();
