import { useEffect, useState } from 'react';
import { fetchMyBikes } from '../features/bikes/api/bikes.api.js';
import { fetchMyPosts } from '../features/blog/api/posts.api.js';
import { fetchMyBookmarks } from '../features/blog/api/bookmarks.api.js';
import type { ComponentReminder } from '../features/reminders/api/reminders.api.js';

export interface MeStats {
  postsPublished: number;
  postsTotal: number;
  bikeCount: number;
  /** Formatted string like "24.5 km" or "0 km". */
  kmThisMonth: string;
  bookmarkCount: number;
  activeReminderCount: number;
  recentReminders: ComponentReminder[];
  recentActivity: ActivityItem[];
  isLoading: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'post' | 'bike';
  label: string;
  timestamp: string;
  href: string;
}

const INITIAL_STATS: MeStats = {
  postsPublished: 0,
  postsTotal: 0,
  bikeCount: 0,
  kmThisMonth: '0 km',
  bookmarkCount: 0,
  activeReminderCount: 0,
  recentReminders: [],
  recentActivity: [],
  isLoading: true,
};

export function useMeStats(): MeStats {
  const [stats, setStats] = useState<MeStats>(INITIAL_STATS);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const [bikes, posts, bookmarks] = await Promise.all([
          fetchMyBikes(),
          fetchMyPosts(),
          fetchMyBookmarks(),
        ]);

        if (cancelled) return;

        const postsPublished = posts.filter((p) => p.status === 'published').length;

        // Build recent activity from posts (last 5, most-recently updated first)
        const recentActivity: ActivityItem[] = posts
          .slice()
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          )
          .slice(0, 5)
          .map((p) => ({
            id: p.id,
            type: 'post' as const,
            label: p.title,
            timestamp: p.updated_at,
            href: `/me/posts/${p.id}/edit`,
          }));

        // Append recent bikes (last 3)
        const bikeActivity: ActivityItem[] = bikes
          .slice()
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
          .slice(0, 3)
          .map((b) => ({
            id: b.id,
            type: 'bike' as const,
            label: b.name,
            timestamp: b.created_at,
            href: `/me/bikes/${b.id}`,
          }));

        setStats({
          postsPublished,
          postsTotal: posts.length,
          bikeCount: bikes.length,
          kmThisMonth: '0 km', // no aggregate endpoint — placeholder
          bookmarkCount: bookmarks.length,
          activeReminderCount: 0, // requires per-bike fetch — omitted for hub
          recentReminders: [],
          recentActivity: [...recentActivity, ...bikeActivity].slice(0, 5),
          isLoading: false,
        });
      } catch {
        if (!cancelled) {
          setStats((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return stats;
}
