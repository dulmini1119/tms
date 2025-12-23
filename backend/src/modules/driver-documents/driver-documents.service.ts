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
      },
    });
  }

  static async getByDriver(driverId: string) {
    return prisma.documents.findMany({
      where: {
        entity_type: DOCUMENT_ENTITY.DRIVER,
        entity_id: driverId,
        deleted_at: null,
      },
    });
  }
}
