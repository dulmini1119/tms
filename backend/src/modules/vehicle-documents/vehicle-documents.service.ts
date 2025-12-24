import prisma from "../../config/database.js";
import { DOCUMENT_ENTITY } from "../../utils/constants.js";

export class VehicleDocumentsService {
  static async create(data: any) {
    return prisma.documents.create({
      data: {
        entity_type: DOCUMENT_ENTITY.VEHICLE,
        entity_id: data.vehicle_id,
        document_type: data.document_type,
        document_number: data.document_number,
        issue_date: data.issue_date,
        expiry_date: data.expiry_date,
        issuing_authority: data.issuing_authority,
        file_name: data.file_name,
        file_path: data.file_path,
        file_size: data.file_size,
        mime_type: data.mime_type,
        status: data.status ?? "Valid",
        created_by: data.created_by,
      },
    });
  }

  static async getByVehicle(vehicleId: string) {
    return prisma.documents.findMany({
      where: {
        entity_type: DOCUMENT_ENTITY.VEHICLE,
        entity_id: vehicleId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  static async delete(id: string) {
    return prisma.documents.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
