import prisma from "../../config/database.js";
import { DOCUMENT_ENTITY } from "../../utils/constants.js";

export class DriverDocumentsService {
  static async create(data: any) {
    return prisma.documents.create({
      data: {
        entity_type: DOCUMENT_ENTITY.DRIVER,
        entity_id: data.driver_id,
        document_type: data.document_type,
        document_number: data.document_number,
        issue_date: data.issue_date,
        expiry_date: data.expiry_date,
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

    const driverIds = [...new Set(docs.map((d) => d.entity_id))];

    const drivers = await prisma.drivers.findMany({
      where: { id: { in: driverIds } },
      include: {
        users_drivers_user_idTousers: {
          select: {
            first_name: true,
            last_name: true,
            employee_id: true,
          },
        },
      },
    });

    const driverMap = drivers.reduce(
      (acc, d) => {
        const user = d.users_drivers_user_idTousers;
        acc[d.id] = {
          id: d.id,
          license_number: d.license_number,
          employee_id: user?.employee_id ?? null,
          name: [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || null,
        };
        return acc;
      },
      {} as Record<string, { id: string; license_number: string; employee_id: string | null; name: string | null }>,
    );

    return docs.map((doc) => ({
      ...doc,
      driver: driverMap[doc.entity_id] ?? null,
    }));
  }

  static async getByDriver(driverId: string) {
    const docs = await prisma.documents.findMany({
      where: {
        entity_type: DOCUMENT_ENTITY.DRIVER,
        entity_id: driverId,
        deleted_at: null,
      },
    });

    const driver = await prisma.drivers.findUnique({
      where: { id: driverId },
      include: {
        users_drivers_user_idTousers: {
          select: {
            first_name: true,
            last_name: true,
            employee_id: true,
          },
        },
      },
    });

    const driverInfo = driver
      ? {
          id: driver.id,
          license_number: driver.license_number,
          employee_id: driver.users_drivers_user_idTousers?.employee_id ?? null,
          name:
            [
              driver.users_drivers_user_idTousers?.first_name,
              driver.users_drivers_user_idTousers?.last_name,
            ]
              .filter(Boolean)
              .join(" ")
              .trim() || null,
        }
      : null;

    return docs.map((doc) => ({
      ...doc,
      driver: driverInfo,
    }));
  }

  static async getDriverOptions() {
    const drivers = await prisma.drivers.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        users_drivers_user_idTousers: {
          select: {
            first_name: true,
            last_name: true,
            employee_id: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return drivers.map((driver) => {
      const user = driver.users_drivers_user_idTousers;
      return {
        id: driver.id,
        name: [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || "Unknown Driver",
        employee_id: user?.employee_id ?? null,
        license_number: driver.license_number,
      };
    });
  }

  static async update(id: string, data: any) {
    const payload: any = {
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

    if (data.file_name) payload.file_name = data.file_name;
    if (data.file_path) payload.file_path = data.file_path;
    if (typeof data.file_size !== "undefined") payload.file_size = data.file_size;
    if (data.mime_type) payload.mime_type = data.mime_type;

    return prisma.documents.update({
      where: { id },
      data: payload,
    });
  }

  static async verify(id: string, userId: string) {
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

  static async delete(id: string, userId: string) {
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
