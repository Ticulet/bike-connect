import { apiClient } from '../../../lib/api-client.js';
import type { BikeItem } from './bikes.api.js';

export interface BikeWithOwner extends BikeItem {
  owner_display_name: string;
  owner_avatar_url: string | null;
}

interface ExploreResponse {
  data: BikeWithOwner[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export function fetchExploreBikes(params: {
  cursor?: string;
  limit?: number;
  type?: string;
}): Promise<ExploreResponse> {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.type) query.set('type', params.type);
  const qs = query.toString();
  return apiClient<ExploreResponse>(`/bikes/explore${qs ? `?${qs}` : ''}`);
}
