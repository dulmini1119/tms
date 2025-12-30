// types/vehicles.ts

// Related entity summaries (minimal, only what you use)
export interface Driver {
  id: string;
  name: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  cost: number;
}

export interface InsurancePolicy {
  id: string;
  policy_number: string;
  provider: string;
  expiry_date: string;
}

export interface CabService {
  id: string;
  name: string;
  contact_number?: string;
}

export interface Department {
  id: string;
  name: string;
}

// Full vehicle shape from API (with optional relations)
export interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  color?: string | null;
  chassis_number?: string | null;
  engine_number?: string | null;
  vehicle_type?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  seating_capacity?: number | null;
  operational_status?: string | null;
  availability_status?: string | null;
  condition_status?: string | null;
  current_location?: string | null;
  home_base?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_updated_at?: string | null;
  current_driver_id?: string | null;
  assigned_department_id?: string | null;
  driver_assigned_date?: string | null;
  engine_displacement?: string | null;
  engine_power?: string | null;
  engine_torque?: string | null;
  fuel_capacity?: number | null;
  mileage_city?: number | null;
  mileage_highway?: number | null;
  mileage_combined?: number | null;
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
  wheelbase_mm?: number | null;
  kerb_weight_kg?: number | null;
  gross_weight_kg?: number | null;
  ownership_type?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  current_value?: number | null;
  total_kilometers: number;
  total_trips?: number;
  cab_service_id?: string | null;

  // Relations (optional, only included if queried)
  drivers_vehicles_current_driver_idTodrivers?: Driver | null;
  maintenance_logs?: MaintenanceLog[];
  insurance_policies?: InsurancePolicy[];
  cab_services?: CabService | null;
  departments?: Department | null;

  // Audit
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
  deleted_at?: string | null;
}

// Paginated API response
export interface PaginatedVehiclesResponse {
  data: Vehicle[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// Form data (strings from inputs)
export interface VehicleFormData {
  registration_number: string;
  make: string;
  model: string;
  year: string;
  color?: string;
  chassis_number?: string;
  engine_number?: string;
  vehicle_type?: string;
  fuel_type?: string;
  transmission?: string;
  seating_capacity?: string;
  operational_status?: string;
  availability_status?: string;
  condition_status?: string;
  ownership_type?: string;
  total_kilometers?: string;
  purchase_date?: string;
  purchase_price?: string;
}

// Create / Update types
export type CreateVehicleFormData = VehicleFormData;
export type UpdateVehicleFormData = Partial<VehicleFormData>;