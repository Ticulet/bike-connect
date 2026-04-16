import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchFeed } from '../api/feed.api.js';
import { PostCard } from '../../blog/components/PostCard.js';
import type { PostSummary } from '../../blog/api/posts.api.js';
import './feed.css';

export function FeedPage(): React.JSX.Element {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const loadFeed = useCallback(async (cursor?: string): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!cursor) {
      setIsLoading(true);
      setPosts([]);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const result = await fetchFeed({ cursor, limit: 10 });

      if (controller.signal.aborted) return;

      if (cursor) {
        setPosts((prev) => [...prev, ...result.data]);
      } else {
        setPosts(result.data);
      }
      setNextCursor(result.pagination.next_cursor);
      setHasMore(result.pagination.has_more);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load feed.');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadFeed();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadFeed]);

  function handleLoadMore(): void {
    if (nextCursor) {
      void loadFeed(nextCursor);
    }
  }

  return (
    <main id="main" className="feed-page">
      <h1 className="feed-page__heading">Your Feed</h1>

      {error && (
        <p className="feed-page__error" role="alert">
          {error}
        </p>
      )}

      {isLoading && (
        <p className="feed-page__loading" aria-live="polite">
          Loading your feed...
        </p>
      )}

      {!isLoading && posts.length === 0 && !error && (
        <div className="feed-page__empty">
          <p>Your feed is empty.</p>
          <p>Follow some users to see their posts here.</p>
        </div>
      )}

      {!isLoading && posts.length > 0 && (
        <>
          <div className="feed-page__list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {hasMore && (
            <div className="feed-page__load-more">
              <button
                type="button"
                className="feed-page__load-more-btn"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                aria-busy={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
