export interface CreateVehicleDto {
  registration_number: string;
  make: string;
  model: string;
  year: number;

  color?: string;
  vehicle_type?: string;
  fuel_type?: string;
  transmission?: string;
  seating_capacity?: number;

  cab_service_id?: string;
  assigned_department_id?: string;
}
