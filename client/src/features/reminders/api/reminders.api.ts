import { apiClient } from '../../../lib/api-client.js';

export type ReminderStatus =
  | 'ok'
  | 'due_soon'
  | 'overdue'
  | 'no_threshold'
  | 'no_service_yet';

export interface ComponentReminder {
  component_id: string;
  component_category: string;
  component_name: string;
  status: ReminderStatus;
  last_service_date: string | null;
  last_service_mileage_km: number | null;
  km_since_last_service: number | null;
  days_since_last_service: number | null;
  threshold: { km: number; months: number } | null;
}

export function fetchReminders(bikeId: string): Promise<ComponentReminder[]> {
  return apiClient<ComponentReminder[]>(`/bikes/${bikeId}/reminders`);
}
