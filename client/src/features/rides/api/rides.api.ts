import { apiClient } from '../../../lib/api-client.js';

export interface RideItem {
  id: string;
  user_id: string;
  bike_id: string;
  distance_km: string;
  duration_min: number | null;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface RideStats {
  total_distance_km: string;
  ride_count: number;
}

/** A user's aggregate ride distance for the current calendar month. */
export interface MonthlyRideStats {
  km_this_month: number;
}

export interface CreateRidePayload {
  distance_km: number;
  duration_min?: number;
  date: string;
  notes?: string;
}

export interface UpdateRidePayload {
  distance_km?: number;
  duration_min?: number;
  date?: string;
  notes?: string;
}

export function fetchRides(bikeId: string): Promise<RideItem[]> {
  return apiClient<RideItem[]>(`/bikes/${bikeId}/rides`);
}

export function fetchRideStats(bikeId: string): Promise<RideStats> {
  return apiClient<RideStats>(`/bikes/${bikeId}/rides/stats`);
}

/** The signed-in user's total distance this month across all their bikes. */
export function fetchMyMonthlyRideStats(): Promise<MonthlyRideStats> {
  return apiClient<MonthlyRideStats>('/users/me/ride-stats');
}

export function createRide(bikeId: string, data: CreateRidePayload): Promise<RideItem> {
  return apiClient<RideItem>(`/bikes/${bikeId}/rides`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRide(
  bikeId: string,
  rideId: string,
  data: UpdateRidePayload,
): Promise<RideItem> {
  return apiClient<RideItem>(`/bikes/${bikeId}/rides/${rideId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRide(bikeId: string, rideId: string): Promise<void> {
  await apiClient<unknown>(`/bikes/${bikeId}/rides/${rideId}`, { method: 'DELETE' });
}
