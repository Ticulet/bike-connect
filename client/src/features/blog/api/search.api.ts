import { apiClient } from '../../../lib/api-client.js';
import type { PostSummary } from './posts.api.js';

export function searchPosts(query: string, limit = 10): Promise<PostSummary[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return apiClient<PostSummary[]>(`/posts/search?${params.toString()}`);
}
