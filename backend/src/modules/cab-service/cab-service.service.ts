import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class CabServicesService {
  static async create(data: any, userId: string) {
    // The frontend is already sending the correct DB field names,
    // so we don't need to map them. Just pass the data through.
    const dbData = {
      name: data.name,
      code: data.code,
      type: data.type, // <-- ADD THIS
      status: data.status || "Active",
      registration_number: data.registration_number, // <-- FIX: was data.businessRegNo
      tax_id: data.tax_id, // <-- ADD THIS
      website: data.website, // <-- ADD THIS
      primary_contact_name: data.primary_contact_name, // <-- FIX: was data.contactPerson
      primary_contact_email: data.primary_contact_email, // <-- FIX: was data.email
      primary_contact_phone: data.primary_contact_phone, // <-- FIX: was data.phone
      address_street: data.address_street, // <-- FIX: was data.address
      address_city: data.address_city, // <-- FIX: was data.city
      service_areas: data.service_areas || [],
      is_24x7: data.is_24x7 ?? false,
      created_by: userId,
    };

    return prisma.cab_services.create({ data: dbData });
  }

  static async list(filters: any) {
    // This is good, no changes needed here.
    return prisma.cab_services.findMany({
      where: {
        status: filters.status !== "all-status" ? filters.status : undefined,
        name: { contains: filters.search || "", mode: "insensitive" },
        deleted_at: null,
      },
      include: { vehicles: true },
      orderBy: { created_at: "desc" },
    });
  }

  static async update(id: string, data: any, userId: string) {
    // Update the method to handle the new fields and fix the mapping.
    const dbData = {
      name: data.name,
      code: data.code,
      type: data.type, // <-- ADD THIS
      status: data.status,
      registration_number: data.registration_number, // <-- FIX
      tax_id: data.tax_id, // <-- ADD THIS
      website: data.website, // <-- ADD THIS
      primary_contact_name: data.primary_contact_name, // <-- FIX
      primary_contact_email: data.primary_contact_email, // <-- FIX
      primary_contact_phone: data.primary_contact_phone, // <-- FIX
      address_street: data.address_street, // <-- FIX
      address_city: data.address_city, // <-- FIX
      service_areas: data.service_areas,
      is_24x7: data.is_24x7,
      updated_by: userId,
    };

    return prisma.cab_services.update({ where: { id }, data: dbData });
  }

  static async remove(id: string) {
    // This is good, no changes needed here.
    return prisma.cab_services.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}