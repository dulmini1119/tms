// backend/modules/permissions/permission.service.ts

import prisma from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class PermissionsService {
  /**
   * Get all data needed for the permissions matrix UI
   * Returns: permissions[], roles[], roleMap { roleId: [permissionId, ...] }
   */
  async getAllWithRoleAssignments() {
    const [permissions, rolePermissions, roles] = await Promise.all([
      prisma.permissions.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          module: true,
          action: true,
          resource: true,
        },
        orderBy: { name: 'asc' },
      }),

      prisma.role_permissions.findMany({
        select: {
          role_id: true,
          permission_id: true,
        },
      }),

      prisma.roles.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          level: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Build role → permissions map
    const roleMap = rolePermissions.reduce<Record<string, string[]>>((acc, rp) => {
      acc[rp.role_id] ??= [];
      acc[rp.role_id].push(rp.permission_id);
      return acc;
    }, {});

    return {
      permissions,
      roles,
      roleMap,
    };
  }

  /**
   * Get ALL permissions — used by Permissions Management page (CRUD list)
   */
  async getAllPermissions() {
    return await prisma.permissions.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        module: true,
        action: true,
        resource: true,
        description: true,
        created_at: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Replace all permissions for a role (full overwrite)
   * Used by the permission matrix "Save" button
   */
  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const roleExists = await prisma.roles.findUnique({
      where: { id: roleId },
      select: { id: true },
    });

    if (!roleExists) {
      throw new Error('Role not found');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Remove all existing
      await tx.role_permissions.deleteMany({
        where: { role_id: roleId },
      });

      // 2. Insert new ones
      if (permissionIds.length > 0) {
        const data: Prisma.role_permissionsCreateManyInput[] = permissionIds.map(
          (permission_id) => ({
            role_id: roleId,
            permission_id,
          })
        );

        await tx.role_permissions.createMany({
          data,
          skipDuplicates: true,
        });
      }
    });
  }
}