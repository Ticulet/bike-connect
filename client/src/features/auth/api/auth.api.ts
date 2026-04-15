import { apiClient } from '../../../lib/api-client.js';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiClient<AuthUser>('/auth/me');
}

export async function logoutUser(): Promise<void> {
  await apiClient<{ message: string }>('/auth/logout', { method: 'POST' });
}

export function getGoogleAuthUrl(): string {
  return '/api/auth/google';
}
