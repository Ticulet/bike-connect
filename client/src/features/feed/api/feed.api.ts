import { apiClient } from '../../../lib/api-client.js';
import type { PostSummary } from '../../blog/api/posts.api.js';

interface FeedResponse {
  data: PostSummary[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export function fetchFeed(params: { cursor?: string; limit?: number }): Promise<FeedResponse> {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiClient<FeedResponse>(`/feed${qs ? `?${qs}` : ''}`);
}
