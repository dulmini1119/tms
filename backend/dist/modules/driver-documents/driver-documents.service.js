import prisma from "../../config/database.js";
import { DOCUMENT_ENTITY } from "../../utils/constants.js";
export class DriverDocumentsService {
    static async buildDriverLookup(entityIds) {
        const uniqueIds = [...new Set(entityIds.filter(Boolean))];
        if (!uniqueIds.length)
            return {};
        const drivers = await prisma.drivers.findMany({
            where: {
                deleted_at: null,
                OR: [{ id: { in: uniqueIds } }, { user_id: { in: uniqueIds } }],
            },
            include: {
                users_drivers_user_idTousers: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        employee_id: true,
                    },
                },
            },
        });
        const driverMap = {};
        for (const driver of drivers) {
            const user = driver.users_drivers_user_idTousers;
            const mapped = {
                id: driver.id,
                user_id: driver.user_id,
                license_number: driver.license_number ?? null,
                employee_id: user?.employee_id ?? null,
                name: [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
                    null,
            };
            driverMap[driver.id] = mapped;
            if (driver.user_id) {
                driverMap[driver.user_id] = mapped;
            }
        }
        const unresolvedUserIds = uniqueIds.filter((id) => !driverMap[id]);
        if (!unresolvedUserIds.length)
            return driverMap;
        const users = await prisma.users.findMany({
            where: {
                id: { in: unresolvedUserIds },
                deleted_at: null,
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                employee_id: true,
            },
        });
        for (const user of users) {
            driverMap[user.id] = {
                id: user.id,
                user_id: user.id,
                license_number: null,
                employee_id: user.employee_id ?? null,
                name: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
                    null,
            };
        }
        return driverMap;
    }
    static async create(data) {
        return prisma.documents.create({
            data: {
                entity_type: DOCUMENT_ENTITY.DRIVER,
                entity_id: data.driver_id,
                document_type: data.document_type,
                document_number: data.document_number,
                issue_date: data.issue_date ? new Date(data.issue_date) : null,
                expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
                issuing_authority: data.issuing_authority,
                file_name: data.file_name,
                file_path: data.file_path,
                file_size: data.file_size,
                mime_type: data.mime_type,
                status: data.status ?? "Pending_Verification",
                notes: data.notes ?? null,
                created_by: data.created_by ?? null,
                updated_by: data.created_by ?? null,
            },
        });
    }
    static async getAll() {
        const docs = await prisma.documents.findMany({
            where: {
                entity_type: DOCUMENT_ENTITY.DRIVER,
                deleted_at: null,
            },
            orderBy: { created_at: "desc" },
        });
        const driverMap = await this.buildDriverLookup(docs.map((d) => d.entity_id));
        return docs.map((doc) => ({
            ...doc,
            driver: driverMap[doc.entity_id] ?? null,
        }));
    }
    static async getByDriver(driverId) {
        const docs = await prisma.documents.findMany({
            where: {
                entity_type: DOCUMENT_ENTITY.DRIVER,
                entity_id: driverId,
                deleted_at: null,
            },
        });
        const driverMap = await this.buildDriverLookup([driverId]);
        const driverInfo = driverMap[driverId] ?? null;
        return docs.map((doc) => ({
            ...doc,
            driver: driverInfo,
        }));
    }
    static async getById(id) {
        return prisma.documents.findFirst({
            where: {
                id,
                entity_type: DOCUMENT_ENTITY.DRIVER,
                deleted_at: null,
            },
        });
    }
    static async getDriverOptions() {
        const [drivers, driverUsers] = await Promise.all([
            prisma.drivers.findMany({
                where: {
                    deleted_at: null,
                },
                include: {
                    users_drivers_user_idTousers: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            employee_id: true,
                        },
                    },
                },
                orderBy: { created_at: "desc" },
            }),
            prisma.users.findMany({
                where: {
                    deleted_at: null,
                    OR: [
                        { position: { equals: "DRIVER", mode: "insensitive" } },
                        { position: { contains: "driver", mode: "insensitive" } },
                        {
                            user_roles_user_roles_user_idTousers: {
                                some: {
                                    role: { code: "driver" },
                                },
                            },
                        },
                    ],
                },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    employee_id: true,
                },
                orderBy: { created_at: "desc" },
            }),
        ]);
        const options = drivers.map((driver) => {
            const user = driver.users_drivers_user_idTousers;
            return {
                id: driver.id,
                name: [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
                    "Unknown Driver",
                employee_id: user?.employee_id ?? null,
                license_number: driver.license_number,
            };
        });
        const driverUserIds = new Set(drivers.map((d) => d.user_id));
        for (const user of driverUsers) {
            if (driverUserIds.has(user.id))
                continue;
            options.push({
                id: user.id,
                name: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
                    "Unknown Driver",
                employee_id: user.employee_id ?? null,
                license_number: null,
            });
        }
        return options;
    }
    static async update(id, data) {
        const payload = {
            document_type: data.document_type,
            document_number: data.document_number,
            issue_date: data.issue_date ? new Date(data.issue_date) : null,
            expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
            issuing_authority: data.issuing_authority,
            notes: data.notes ?? null,
            status: data.status,
            verification_status: data.verification_status,
            updated_at: new Date(),
            updated_by: data.updated_by ?? null,
        };
        if (data.file_name)
            payload.file_name = data.file_name;
        if (data.file_path)
            payload.file_path = data.file_path;
        if (typeof data.file_size !== "undefined")
            payload.file_size = data.file_size;
        if (data.mime_type)
            payload.mime_type = data.mime_type;
        return prisma.documents.update({
            where: { id },
            data: payload,
        });
    }
    static async verify(id, userId) {
        return prisma.documents.update({
            where: { id },
            data: {
                status: "Valid",
                verification_status: "Verified",
                verified_by: userId,
                verified_at: new Date(),
                updated_at: new Date(),
                updated_by: userId,
            },
        });
    }
    static async delete(id, userId) {
        return prisma.documents.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                updated_at: new Date(),
                updated_by: userId,
            },
        });
    }
}
//# sourceMappingURL=driver-documents.service.js.map