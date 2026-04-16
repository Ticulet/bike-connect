import { apiClient } from '../../../lib/api-client.js';

export interface LikeInfo {
  count: number;
  is_liked: boolean;
}

export interface ToggleLikeResult {
  liked: boolean;
  count: number;
}

export function fetchLikeInfo(postId: string): Promise<LikeInfo> {
  return apiClient<LikeInfo>(`/posts/${postId}/likes`);
}

export function toggleLike(postId: string): Promise<ToggleLikeResult> {
  return apiClient<ToggleLikeResult>(`/posts/${postId}/likes/toggle`, {
    method: 'POST',
  });
}
