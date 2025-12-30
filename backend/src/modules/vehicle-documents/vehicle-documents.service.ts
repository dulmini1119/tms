import prisma from "../../config/database.js";
import { DOCUMENT_ENTITY } from "../../utils/constants.js";

export class VehicleDocumentsService {
  
  static async create(data: any) {
    // Your existing create logic is fine, keep it exactly as it is
    return prisma.documents.create({
      data: {
        entity_type: DOCUMENT_ENTITY.VEHICLE,
        entity_id: data.entity_id, // This holds the registration_number
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

  // ─────────────────────────────────────────────────────────────
  // ONLY CHANGE THIS FUNCTION (getAll)
  // ─────────────────────────────────────────────────────────────
  static async getAll() {
    // 1. Fetch all vehicle documents (entity_id contains the UUID)
    const docs = await prisma.documents.findMany({
      where: {
        entity_type: DOCUMENT_ENTITY.VEHICLE,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });

    // 2. Extract the Vehicle UUIDs from the documents
    const vehicleIds = [...new Set(docs.map(d => d.entity_id))];

    // 3. Fetch the actual Vehicle details (which have registration_number)
    // We find vehicles where the 'id' matches the document's 'entity_id'
    const vehicles = await prisma.vehicles.findMany({
      where: {
        id: { in: vehicleIds } 
      },
      select: {
        id: true,
        registration_number: true, // <--- THIS IS WHAT WE WANT
        make: true,
        model: true,
      }
    });

    // 4. Create a quick lookup map (Key = UUID, Value = Vehicle Object)
    const vehicleMap = vehicles.reduce((acc, v) => {
      acc[v.id] = v;
      return acc;
    }, {} as Record<string, any>);

    // 5. Merge the data
    const documentsWithVehicleInfo = docs.map(doc => {
      const vehicleInfo = vehicleMap[doc.entity_id]; // Look up vehicle by its UUID
      
      return {
        ...doc,
        // Create the 'vehicle' object so Frontend can read registration_number
        vehicle: vehicleInfo ? {
          registration_number: vehicleInfo.registration_number,
          make: vehicleInfo.make,
          model: vehicleInfo.model,
        } : null
      };
    });

    return documentsWithVehicleInfo;
  }
  static async getByVehicle(vehicleId: string) {
    // Keep existing logic, or you can apply the same merge logic here if needed
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
    // Keep existing logic
    return prisma.documents.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}