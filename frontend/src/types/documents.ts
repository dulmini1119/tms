// types/documents.ts

// Raw shape from Prisma/API (snake_case)
export interface RawVehicleDocument {
  id: string;
  entity_type: string;
  entity_id: string;
  document_type: string | null;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  file_name: string;
  file_path: string;
  file_size: string | null;           // string after BigInt fix
  mime_type: string | null;
  status: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  version: string | null;
  is_current: boolean | null;
  replaces_document_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;

  // Included vehicle relation (if you add include: { vehicle: ... } in backend)
  vehicle?: {
    registration_number: string;
    make: string | null;
    model: string | null;
  } | null;
}

// Normalized frontend shape (camelCase + derived fields)
export interface VehicleDocument {
  id: string;
  entity_type: string;
  entity_id: string;

  documentType: string | null;
  documentNumber: string | null;
  documentName: string;

  vehicleNumber: string;
  vehicleId?: string;         // ← optional
  vehicleMake?: string | null;
  vehicleModel?: string | null;

  issuingAuthority: string | null;

  issueDate: string | null;
  expiryDate: string | null;

  status: string | null;
  fileName: string;
  fileUrl: string | null;

  file_size?: number | null;
  mime_type?: string | null;
  notes?: string | null;

  category?: string;          // ← optional
  priority?: string;
  renewalCost?: number;
  currency?: string;
  vendor?: string;
  contactNumber?: string;
  remindersSent?: number;

  // Computed fields
  daysToExpiry?: number;
  complianceScore?: number;
  riskLevel?: string;
}