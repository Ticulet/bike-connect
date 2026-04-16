import { apiClient } from '../../../lib/api-client.js';

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export interface PublicUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export function fetchFollowStats(userId: string): Promise<FollowStats> {
  return apiClient<FollowStats>(`/users/${userId}/follows/stats`);
}

export function toggleFollow(userId: string): Promise<{ following: boolean }> {
  return apiClient<{ following: boolean }>(`/users/${userId}/follows/toggle`, {
    method: 'POST',
  });
}

export function fetchFollowers(userId: string): Promise<PublicUser[]> {
  return apiClient<PublicUser[]>(`/users/${userId}/follows/followers`);
}

export function fetchFollowing(userId: string): Promise<PublicUser[]> {
  return apiClient<PublicUser[]>(`/users/${userId}/follows/following`);
}
