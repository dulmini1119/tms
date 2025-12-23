// =================================================================
// 1. INTERFACES FOR RELATED DATA (from Prisma relations)
// =================================================================

/**
 * Represents a driver assigned to a vehicle.
 * We only include the fields we need for display in the vehicle list.
 */
export interface Driver {
  id: string;
  name: string;
  // Add other driver fields if needed (e.g., license, contact)
}

/**
 * Represents a single maintenance record for a vehicle.
 */
export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string; // ISO date string, e.g., "2024-05-20T12:00:00.000Z"
  description: string;
  cost: number;
}

/**
 * Represents an insurance policy for a vehicle.
 */
export interface InsurancePolicy {
  id: string;
  policy_number: string;
  provider: string;
  expiry_date: string; // ISO date string
}

/**
 * Represents the cab service a vehicle might belong to.
 */
export interface CabService {
  id: string;
  name: string;
  contact_number?: string;
}

/**
 * Represents the department a vehicle is assigned to.
 */
export interface Department {
  id: string;
  name: string;
}


// =================================================================
// 2. MAIN VEHICLE INTERFACES
// =================================================================

/**
 * Represents the complete Vehicle object as returned by the API.
 * This matches the structure of your Prisma model, including relations.
 * Dates are handled as strings from the API.
 * Numbers (like year, mileage) are kept as numbers.
 */
export interface Vehicle {
  id: string; // UUID
  registration_number: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  chassis_number?: string;
  engine_number?: string;
  vehicle_type: string;
  fuel_type: string;
  transmission?: string;
  seating_capacity: number;
  operational_status: string; // e.g., "Active", "Under Repair"
  availability_status: string; // e.g., "Available", "On Trip"
  condition_status?: string;
  ownership_type: string; // e.g., "Owned", "Leased"
  total_kilometers: number;
  purchase_date?: string; // ISO date string
  purchase_price?: number;
  
  // --- Relations ---
  drivers_vehicles_current_driver_idTodrivers?: Driver | null;
  maintenance_logs?: MaintenanceLog[];
  insurance_policies?: InsurancePolicy[];
  cab_services?: CabService | null;
  departments?: Department | null;

  // --- Audit Fields ---
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Defines the structure of the paginated response from the backend API.
 */
export interface PaginatedVehiclesResponse {
  data: Vehicle[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}


// =================================================================
// 3. FORM DATA INTERFACES
// =================================================================

/**
 * Represents the data structure for the "Add" and "Edit" vehicle forms.
 * All fields are strings because HTML form inputs return string values.
 * The conversion to the correct type (e.g., string to number) happens
 * in the component before sending the data to the API.
 */
export interface VehicleFormData {
  registration_number: string;
  make: string;
  model: string;
  year: string;
  color: string;
  chassis_number: string;
  engine_number: string;
  vehicle_type: string;
  fuel_type: string;
  transmission: string;
  seating_capacity: string;
  ownership_type: string;
  availability_status: string;
  total_kilometers: string;
  purchase_date: string;
  purchase_price: string;
}

/**
 * Type for creating a new vehicle. All form fields are required.
 */
export type CreateVehicleFormData = VehicleFormData;

/**
 * Type for updating an existing vehicle. All form fields are optional,
 * allowing for partial updates.
 */
export type UpdateVehicleFormData = Partial<VehicleFormData>;