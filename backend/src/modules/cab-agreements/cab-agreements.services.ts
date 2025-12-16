// src/modules/cab-agreement/cab-agreement.service.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class CabAgreementsService {
  // Helper function to map camelCase to snake_case
  private static mapToDbFormat(data: any) {
    return {
      cab_service_id: data.cab_service_id,
      agreement_number: data.agreement_number,
      title: data.title,
      type: data.type, // Added this missing field
      status: data.status,
      document_url: data.document_url,
      priority: data.priority,
      client_company_name: data.client_company_name,
      client_contact_person: data.client_contact_person,
      client_email: data.client_email,
      client_phone: data.client_phone,
      start_date: data.start_date,
      end_date: data.end_date,
      auto_renewal: data.auto_renewal,
      renewal_period: data.renewal_period,
      notice_period_days: data.notice_period_days,
      contract_value: data.contract_value,
      currency: data.currency,
      payment_terms: data.payment_terms,
      payment_schedule: data.payment_schedule,
      security_deposit: data.security_deposit,
      insurance_required: data.insurance_required,
      insurance_amount: data.insurance_amount,
      insurance_provider: data.insurance_provider,
      insurance_policy_number: data.insurance_policy_number,
      insurance_expiry_date: data.insurance_expiry_date,
      sla_response_time: data.sla_response_time,
      sla_availability_percentage: data.sla_availability_percentage,
      sla_on_time_performance: data.sla_on_time_performance,
      termination_clause: data.termination_clause,
      penalty_clause: data.penalty_clause,
    };
  }

  static async create(data: any, userId: string, documentUrl: string | null) {
    const dbData = this.mapToDbFormat({ ...data, document_url: documentUrl });
    return prisma.cab_agreements.create({
      data: {
        ...dbData,
        created_by: userId,
      },
      include: {
        cab_services: { select: { name: true } },
        agreement_rate_cards: true, // Added this relationship
      },
    });
  }

  static async findMany(filters: any, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [agreements, totalCount] = await Promise.all([
      prisma.cab_agreements.findMany({
        where: {
          status: filters.status !== "all-status" ? filters.status : undefined,
          OR: [
            { agreement_number: { contains: filters.search || "", mode: "insensitive" } },
            { title: { contains: filters.search || "", mode: "insensitive" } },
            { client_company_name: { contains: filters.search || "", mode: "insensitive" } },
          ],
          deleted_at: null,
        },
        include: {
          cab_services: { select: { name: true } },
          agreement_rate_cards: true, // Added this relationship
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.cab_agreements.count({
        where: {
          status: filters.status !== "all-status" ? filters.status : undefined,
          OR: [
            { agreement_number: { contains: filters.search || "", mode: "insensitive" } },
            { title: { contains: filters.search || "", mode: "insensitive" } },
            { client_company_name: { contains: filters.search || "", mode: "insensitive" } },
          ],
          deleted_at: null,
        },
      })
    ]);
    
    return {
      data: agreements,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  static async findById(id: string) {
    return prisma.cab_agreements.findUnique({
      where: { 
        id,
        deleted_at: null
      },
      include: {
        cab_services: { select: { name: true } },
        agreement_rate_cards: true,
      },
    });
  }

  static async update(id: string, data: any, userId: string, documentUrl?: string) {
    const dbData = this.mapToDbFormat({ ...data, document_url: documentUrl });
    return prisma.cab_agreements.update({
      where: { id },
      data: {
        ...dbData,
        updated_by: userId,
      },
      include: {
        cab_services: { select: { name: true } },
        agreement_rate_cards: true, // Added this relationship
      },
    });
  }

  static async softDelete(id: string) {
    return prisma.cab_agreements.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}