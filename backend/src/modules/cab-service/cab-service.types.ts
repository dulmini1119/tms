export interface CreateCabServiceDTO {
  name: string;
  code: string;
  type?: string;
  description?: string;

  registration_number?: string;
  tax_id?: string;

  primary_contact_name?: string;
  primary_contact_position?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;

  address_street?: string;
  address_city?: string;
  website?: string;

  service_areas: string[];
  is_24x7?: boolean;

  operating_hours_weekdays?: string;
  operating_hours_weekends?: string;
  operating_hours_holidays?: string;

  status?: "Active" | "Inactive";
}
