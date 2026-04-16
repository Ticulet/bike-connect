import { apiClient } from '../../../lib/api-client.js';

export interface CommentItem {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author_display_name: string;
  author_avatar_url: string | null;
}

export function fetchComments(postId: string): Promise<CommentItem[]> {
  return apiClient<CommentItem[]>(`/posts/${postId}/comments`);
}

export function createComment(
  postId: string,
  content: string,
  parentId?: string | null,
): Promise<CommentItem> {
  return apiClient<CommentItem>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parent_id: parentId ?? null }),
  });
}

export function updateComment(id: string, content: string): Promise<CommentItem> {
  return apiClient<CommentItem>(`/comments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(id: string): Promise<void> {
  await apiClient<unknown>(`/comments/${id}`, { method: 'DELETE' });
}
