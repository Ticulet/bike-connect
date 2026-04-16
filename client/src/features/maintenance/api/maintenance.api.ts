import { apiClient } from '../../../lib/api-client.js';

export interface MaintenanceLogItem {
  id: string;
  bike_id: string;
  component_id: string | null;
  component_name: string | null;
  type: string;
  title: string;
  description: string | null;
  cost: string | null;
  mileage_at_service: number | null;
  performed_at: string;
  created_at: string;
}

export interface CreateMaintenancePayload {
  type: string;
  title: string;
  description?: string;
  component_id?: string | null;
  cost?: number | null;
  mileage_at_service?: number;
  performed_at: string;
}

export interface UpdateMaintenancePayload extends Partial<CreateMaintenancePayload> {}

export function fetchMaintenanceLogs(bikeId: string): Promise<MaintenanceLogItem[]> {
  return apiClient<MaintenanceLogItem[]>(`/bikes/${bikeId}/maintenance`);
}

export function createMaintenanceLog(
  bikeId: string,
  data: CreateMaintenancePayload,
): Promise<MaintenanceLogItem> {
  return apiClient<MaintenanceLogItem>(`/bikes/${bikeId}/maintenance`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMaintenanceLog(
  bikeId: string,
  logId: string,
  data: UpdateMaintenancePayload,
): Promise<MaintenanceLogItem> {
  return apiClient<MaintenanceLogItem>(`/bikes/${bikeId}/maintenance/${logId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteMaintenanceLog(bikeId: string, logId: string): Promise<void> {
  await apiClient<unknown>(`/bikes/${bikeId}/maintenance/${logId}`, { method: 'DELETE' });
}
