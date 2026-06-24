import { apiClient } from '../../../lib/api-client.js';
import type { CreateBike, UpdateBike } from '@bike-connect/shared';

export interface BikeItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  description: string | null;
  hero_image_url: string | null;
  is_public: boolean;
  user_id: string;
  total_mileage_km: string; // decimal; lifetime odometer (cache of ride sums)
  created_at: string;
  updated_at: string;
}

export function fetchMyBikes(): Promise<BikeItem[]> {
  return apiClient<BikeItem[]>('/bikes');
}

export function fetchUserPublicBikes(
  userId: string,
  options?: { signal?: AbortSignal },
): Promise<BikeItem[]> {
  return apiClient<BikeItem[]>(`/users/${userId}/bikes`, options);
}

export function fetchBike(id: string): Promise<BikeItem> {
  return apiClient<BikeItem>(`/bikes/${id}`);
}

export function createBike(data: CreateBike): Promise<BikeItem> {
  return apiClient<BikeItem>('/bikes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateBike(id: string, data: UpdateBike): Promise<BikeItem> {
  return apiClient<BikeItem>(`/bikes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteBike(id: string): Promise<void> {
  await apiClient<unknown>(`/bikes/${id}`, { method: 'DELETE' });
}
