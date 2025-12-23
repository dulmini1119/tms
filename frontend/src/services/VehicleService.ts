import { Vehicle, CreateVehicleFormData, UpdateVehicleFormData, PaginatedVehiclesResponse } from '@/types/vehicles';

const API_BASE = '/vehicles';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }
  return response.json();
};


export const fetchVehicles = async (params: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  vehicle_type?: string;
  availability_status?: string;
  ownership_type?: string;
}): Promise<PaginatedVehiclesResponse> => {
    const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('limit', params.pageSize.toString());
  if (params.searchTerm) searchParams.append('search', params.searchTerm);
  if (params.vehicle_type && params.vehicle_type !== 'all-types') searchParams.append('vehicle_type', params.vehicle_type);
  if (params.availability_status && params.availability_status !== 'all-status') searchParams.append('availability_status', params.availability_status);
  if (params.ownership_type && params.ownership_type !== 'all-sources') searchParams.append('ownership_type', params.ownership_type);

  const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
  return handleResponse(response);
};


export const createVehicle = async (data: CreateVehicleFormData): Promise<Vehicle> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};


export const updateVehicle = async (id: string, data: UpdateVehicleFormData): Promise<Vehicle> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};


export const deleteVehicle = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};