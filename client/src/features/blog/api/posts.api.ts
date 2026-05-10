import { apiClient } from '../../../lib/api-client.js';

export interface PostSummary {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_display_name: string;
  author_avatar_url: string | null;
}

export interface PostDetail extends PostSummary {
  content: Record<string, unknown>;
  tags: TagItem[];
  updated_at: string;
}

export interface TagItem {
  id: number;
  name: string;
  slug: string;
}

interface PaginatedPostsResponse {
  data: PostSummary[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export function fetchPosts(params: {
  cursor?: string;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
}): Promise<PaginatedPostsResponse> {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.category) query.set('category', params.category);
  if (params.tag) query.set('tag', params.tag);
  if (params.author) query.set('author', params.author);
  const qs = query.toString();
  return apiClient<PaginatedPostsResponse>(`/posts${qs ? `?${qs}` : ''}`);
}

export function fetchPostBySlug(slug: string): Promise<PostDetail> {
  return apiClient<PostDetail>(`/posts/${slug}`);
}

export function fetchPostById(id: string): Promise<PostDetail> {
  return apiClient<PostDetail>(`/posts/by-id/${id}`);
}

export function fetchMyPosts(): Promise<PostSummary[]> {
  return apiClient<PostSummary[]>('/posts/me');
}

export interface CreatePostPayload {
  title: string;
  category: string;
  status: string;
  content: Record<string, unknown>;
  excerpt?: string | null;
  cover_image_url?: string | null;
  tag_ids?: number[];
}

export interface UpdatePostPayload extends Partial<CreatePostPayload> {
  expected_updated_at: string;
}

export function createPost(data: CreatePostPayload): Promise<PostDetail> {
  return apiClient<PostDetail>('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updatePost(
  id: string,
  data: UpdatePostPayload,
): Promise<PostDetail> {
  return apiClient<PostDetail>(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string): Promise<void> {
  await apiClient<unknown>(`/posts/${id}`, { method: 'DELETE' });
}

export function fetchTags(search?: string): Promise<TagItem[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient<TagItem[]>(`/tags${qs}`);
}
