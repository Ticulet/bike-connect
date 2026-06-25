import { apiClient } from '../../../lib/api-client.js';

export interface BookmarkedPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string;
  published_at: string | null;
  author_display_name: string;
  author_avatar_url: string | null;
  bookmarked_at: string;
}

export interface ToggleBookmarkResult {
  bookmarked: boolean;
}

export interface BookmarkInfo {
  bookmarked: boolean;
}

export function fetchBookmarkInfo(postId: string): Promise<BookmarkInfo> {
  return apiClient<BookmarkInfo>(`/posts/${postId}/bookmark`);
}

export function toggleBookmark(postId: string): Promise<ToggleBookmarkResult> {
  return apiClient<ToggleBookmarkResult>(`/posts/${postId}/bookmark/toggle`, {
    method: 'POST',
  });
}

export function fetchMyBookmarks(): Promise<BookmarkedPost[]> {
  return apiClient<BookmarkedPost[]>('/me/bookmarks');
}
