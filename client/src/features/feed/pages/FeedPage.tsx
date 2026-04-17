import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { fetchFeed } from '../api/feed.api.js';
import { PostCard } from '../../blog/components/PostCard.js';
import { fetchPosts, type PostSummary } from '../../blog/api/posts.api.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import './feed.css';

interface SuggestedAuthor {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export function FeedPage(): React.JSX.Element {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedAuthor[]>([]);

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

  // Fetch suggested authors (the authors of the most recent public posts,
  // de-duplicated and filtered to exclude the current user). Shown only when
  // the personal feed is empty so the empty state becomes a discovery surface.
  useEffect(() => {
    const controller = new AbortController();
    fetchPosts({ limit: 20 })
      .then((result) => {
        if (controller.signal.aborted) return;
        const seen = new Set<string>();
        const authors: SuggestedAuthor[] = [];
        for (const p of result.data) {
          if (seen.has(p.author_id)) continue;
          if (user && p.author_id === user.id) continue;
          seen.add(p.author_id);
          authors.push({
            id: p.author_id,
            display_name: p.author_display_name,
            avatar_url: p.author_avatar_url,
          });
          if (authors.length >= 6) break;
        }
        setSuggested(authors);
      })
      .catch(() => {
        // Non-critical — the empty state still renders without suggestions.
      });
    return () => {
      controller.abort();
    };
  }, [user]);

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
          <h2 className="feed-page__empty-title">Your feed is empty</h2>
          <p className="feed-page__empty-lead">
            Follow a few riders to see their latest posts here. Tap a profile to
            get started.
          </p>

          {suggested.length > 0 && (
            <section
              className="feed-page__suggested"
              aria-labelledby="suggested-heading"
            >
              <h3 id="suggested-heading" className="feed-page__suggested-heading">
                Writers to discover
              </h3>
              <ul className="feed-page__suggested-list">
                {suggested.map((author) => {
                  const initial = author.display_name.charAt(0).toUpperCase() || '?';
                  return (
                    <li key={author.id}>
                      <Link
                        to={`/users/${author.id}`}
                        className="feed-page__suggested-item"
                      >
                        {isSafeImageUrl(author.avatar_url) ? (
                          <img
                            src={author.avatar_url}
                            alt=""
                            className="feed-page__suggested-avatar"
                            aria-hidden="true"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="feed-page__suggested-avatar-placeholder"
                            aria-hidden="true"
                          >
                            {initial}
                          </div>
                        )}
                        <span className="feed-page__suggested-name">
                          {author.display_name}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <p className="feed-page__empty-hint">
            Or browse the{' '}
            <Link to="/posts" className="feed-page__empty-link">full blog</Link>{' '}
            and follow authors whose posts you enjoy.
          </p>
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
