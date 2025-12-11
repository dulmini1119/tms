// src/services/roles.service.ts
import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ERROR_CODES, HTTP_STATUS } from '../../utils/constants.js';

export class RolesService {
  private async findRoleOrThrow(id: string) {
    const role = await prisma.roles.findUnique({
      where: { id },
      select: { id: true, name: true, code: true },
    });

    if (!role) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        'Role not found',
        HTTP_STATUS.NOT_FOUND
      );
    }
    return role;
  }

  async getAll() {
    return await prisma.roles.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: { user_roles: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const role = await prisma.roles.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: {
            permissions: {
              select: { id: true, name: true, code: true, description: true },
            },
          },
        },
      },
    });

    if (!role) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Role not found', HTTP_STATUS.NOT_FOUND);
    }

    return role;
  }

  async create(data: { name: string; description?: string | null }) {
    const name = data.name.trim();
    if (!name) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, 'Role name is required', HTTP_STATUS.BAD_REQUEST);
    }

    const code = name.toUpperCase().replace(/\s+/g, '_');

    // Prevent creating new 'superadmin' role (only one allowed from seed)
    if (code === 'SUPERADMIN') {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Cannot create another Super Admin role',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const exists = await prisma.roles.findFirst({
      where: {
        OR: [{ name }, { code }],
      },
    });

    if (exists) {
      throw new AppError(
        ERROR_CODES.ALREADY_EXISTS,
        'Role with this name or code already exists',
        HTTP_STATUS.CONFLICT
      );
    }

    return await prisma.roles.create({
      data: {
        name,
        code,
        description: data.description?.trim() || null,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string | null }) {
    const role = await this.findRoleOrThrow(id);

    // Block updating the Super Admin role name/code
    if (role.code === 'SUPERADMIN') {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Super Admin role cannot be modified',
        HTTP_STATUS.FORBIDDEN
      );
    }

    let name = data.name?.trim();
    let code: string | undefined;

    if (name) {
      if (!name) {
        throw new AppError(ERROR_CODES.BAD_REQUEST, 'Role name cannot be empty', HTTP_STATUS.BAD_REQUEST);
      }
      code = name.toUpperCase().replace(/\s+/g, '_');

      const exists = await prisma.roles.findFirst({
        where: {
          OR: [{ name }, { code }],
          id: { not: id },
        },
      });

      if (exists) {
        throw new AppError(
          ERROR_CODES.ALREADY_EXISTS,
          'Another role with this name or code already exists',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    return await prisma.roles.update({
      where: { id },
      data: {
        name: name || undefined,
        code: code || undefined,
        description: data.description?.trim() || null,
      },
    });
  }

  async delete(id: string) {
    const role = await this.findRoleOrThrow(id);

    // NEVER allow deleting Super Admin role
    if (role.code === 'SUPERADMIN') {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Cannot delete Super Admin role',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const assignedCount = await prisma.user_roles.count({
      where: { role_id: id },
    });

    if (assignedCount > 0) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Cannot delete role: ${assignedCount} user(s) are assigned to it`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    await prisma.roles.delete({ where: { id } });
    return true; // optional: return success
  }
}