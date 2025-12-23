export interface UpdateVehicleDto {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  registration_number?: string;

  operational_status?: string;
  availability_status?: string;

  current_driver_id?: string;
  assigned_department_id?: string;
}
