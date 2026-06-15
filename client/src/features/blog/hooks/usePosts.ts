import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPosts, type PostSummary } from '../api/posts.api.js';
import { PAGINATION } from '@bike-connect/shared';

interface UsePostsFilters {
  category?: string;
  tag?: string;
  // Posts fetched per page. Defaults to the shared limit; the post list passes
  // a multiple of its column count so the grid always fills complete rows.
  limit?: number;
}

interface UsePostsResult {
  posts: PostSummary[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  error: string | null;
}

export function usePosts(filters: UsePostsFilters): UsePostsResult {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track whether the initial load for current filters has run
  const filtersRef = useRef(filters);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadPage = useCallback(
    async (pageCursor: string | undefined, append: boolean) => {
      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchPosts({
          cursor: pageCursor,
          limit: filtersRef.current.limit ?? PAGINATION.DEFAULT_LIMIT,
          category: filtersRef.current.category,
          tag: filtersRef.current.tag,
        });

        if (controller.signal.aborted) return;

        setPosts((prev) =>
          append ? [...prev, ...result.data] : result.data,
        );
        setCursor(result.pagination.next_cursor ?? undefined);
        setHasMore(result.pagination.has_more);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load posts',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  // Reset and reload when filters change
  useEffect(() => {
    filtersRef.current = filters;
    setPosts([]);
    setCursor(undefined);
    setHasMore(false);
    void loadPage(undefined, false);

    return () => {
      abortControllerRef.current?.abort();
    };
    // filters.category and filters.tag are the actual dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.tag, loadPage]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      void loadPage(cursor, true);
    }
  }, [cursor, hasMore, isLoading, loadPage]);

  return { posts, isLoading, hasMore, loadMore, error };
}
