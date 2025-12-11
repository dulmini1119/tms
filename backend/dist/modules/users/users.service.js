import bcrypt from "bcrypt";
import prisma from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES, HTTP_STATUS } from "../../utils/constants";
import logger from "../../utils/logger";
const SALT_ROUNDS = 10;
export class UsersService {
    async getUsers(filters) {
        const { page, limit, search, role, status, departmentId, businessUnitId, sortBy, sortOrder, } = filters;
        const where = {
            deleted_at: null,
        };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }
        if (status)
            where.status = status;
        if (departmentId)
            where.department_id = departmentId;
        if (businessUnitId)
            where.business_unit_id = businessUnitId;
        const [users, total] = await Promise.all([
            prisma.users.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone: true,
                    status: true,
                    department_id: true,
                    business_unit_id: true,
                    employee_id: true,
                    position: true,
                    last_login: true,
                    created_at: true,
                    updated_at: true,
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.users.count({ where }),
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getUserById(userId) {
        const user = await prisma.users.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", HTTP_STATUS.NOT_FOUND);
        }
        return user;
    }
    async createUser(data) {
        const email = data.email.toLowerCase();
        const [existingUser, existingEmployee] = await Promise.all([
            prisma.users.findUnique({ where: { email } }),
            prisma.users.findUnique({ where: { employee_id: data.employee_id } }),
        ]);
        if (existingUser) {
            throw new AppError(ERROR_CODES.ALREADY_EXISTS, "User with this email already exists", HTTP_STATUS.CONFLICT);
        }
        if (existingEmployee) {
            throw new AppError(ERROR_CODES.ALREADY_EXISTS, "Employee ID already exists", HTTP_STATUS.CONFLICT);
        }
        const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
        const user = await prisma.users.create({
            data: {
                email,
                password_hash,
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                department_id: data.department_id,
                business_unit_id: data.business_unit_id,
                position: data.position,
                employee_id: data.employee_id,
                status: "Active",
            },
        });
        logger.info(`User created: ${user.email}`);
        const { password_hash: _, ...cleanUser } = user;
        return cleanUser;
    }
    async updateUser(userId, data) {
        const existingUser = await this.getUserById(userId);
        if (data.email && data.email !== existingUser.email) {
            const emailExists = await prisma.users.findUnique({
                where: { email: data.email.toLowerCase() },
            });
            if (emailExists)
                throw new AppError(ERROR_CODES.ALREADY_EXISTS, "Email already in use", HTTP_STATUS.CONFLICT);
        }
        if (data.employee_id && data.employee_id !== existingUser.employee_id) {
            const employeeExists = await prisma.users.findUnique({
                where: { employee_id: data.employee_id },
            });
            if (employeeExists)
                throw new AppError(ERROR_CODES.ALREADY_EXISTS, "Employee ID already in use", HTTP_STATUS.CONFLICT);
        }
        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: {
                ...data,
                email: data.email?.toLowerCase(),
            },
        });
        const { password_hash: _, ...cleanUser } = updatedUser;
        return cleanUser;
    }
    async deleteUser(userId) {
        // Ensure user exists
        await this.getUserById(userId);
        await prisma.users.update({
            where: { id: userId },
            data: { deleted_at: new Date() },
        });
        logger.info(`User soft deleted: ${userId}`);
        return { message: "User deleted successfully" };
    }
    async getUserPermissions(userId) {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: {
                user_roles_user_roles_assigned_byTousers: {
                    include: {
                        roles: {
                            include: {
                                role_permissions: {
                                    include: {
                                        permissions: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!user)
            throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", HTTP_STATUS.NOT_FOUND);
        const permissions = user.user_roles_user_roles_assigned_byTousers.flatMap((userRole) => userRole.roles.role_permissions.map((rp) => rp.permissions.code));
        return { permissions: [...new Set(permissions)] };
    }
    async updateUserPermissions(userId, permissionIds) {
        // 1. Get user roles
        const userRoles = await prisma.user_roles.findMany({
            where: { user_id: userId },
        });
        if (userRoles.length === 0) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "User has no assigned roles", HTTP_STATUS.NOT_FOUND);
        }
        // For now, we update ALL roles assigned to this user
        for (const userRole of userRoles) {
            const roleId = userRole.role_id;
            // 2. Delete old permissions for this role
            await prisma.role_permissions.deleteMany({
                where: { role_id: roleId },
            });
            // 3. Insert new permissions
            await prisma.role_permissions.createMany({
                data: permissionIds.map((permissionId) => ({
                    role_id: roleId,
                    permission_id: permissionId,
                })),
            });
        }
        return { message: "Permissions updated successfully" };
    }
    async assignUserRole(userId, roleId) {
        await this.getUserById(userId);
        const role = await prisma.roles.findUnique({ where: { id: roleId } });
        if (!role)
            throw new AppError(ERROR_CODES.NOT_FOUND, "Role not found", HTTP_STATUS.NOT_FOUND);
        const existing = await prisma.user_roles.findUnique({
            where: { user_id_role_id: { user_id: userId, role_id: roleId } },
        });
        if (existing)
            throw new AppError(ERROR_CODES.ALREADY_EXISTS, "User already has this role", HTTP_STATUS.CONFLICT);
        await prisma.user_roles.create({
            data: { user_id: userId, role_id: roleId },
        });
        return { message: "Role assigned successfully" };
    }
    async removeUserRole(userId, roleId) {
        await this.getUserById(userId);
        const res = await prisma.user_roles.deleteMany({
            where: { user_id: userId, role_id: roleId },
        });
        if (res.count === 0)
            throw new AppError(ERROR_CODES.NOT_FOUND, "User does not have this role", HTTP_STATUS.NOT_FOUND);
        return { message: "Role removed successfully" };
    }
}
//# sourceMappingURL=users.service.js.map