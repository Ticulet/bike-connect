import { apiClient } from '../../../lib/api-client.js';
import type { CreateComponent, UpdateComponent } from '@bike-connect/shared';

export interface ComponentItem {
  id: string;
  bike_id: string;
  category: string;
  name: string;
  brand: string | null;
  model: string | null;
  installed_at: string | null;
  mileage_at_install: number | null;
  notes: string | null;
}

export function fetchComponents(bikeId: string): Promise<ComponentItem[]> {
  return apiClient<ComponentItem[]>(`/bikes/${bikeId}/components`);
}

export function createComponent(
  bikeId: string,
  data: CreateComponent,
): Promise<ComponentItem> {
  return apiClient<ComponentItem>(`/bikes/${bikeId}/components`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateComponent(
  bikeId: string,
  componentId: string,
  data: UpdateComponent,
): Promise<ComponentItem> {
  return apiClient<ComponentItem>(
    `/bikes/${bikeId}/components/${componentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export async function deleteComponent(
  bikeId: string,
  componentId: string,
): Promise<void> {
  await apiClient<unknown>(`/bikes/${bikeId}/components/${componentId}`, {
    method: 'DELETE',
  });
}
