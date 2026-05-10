import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { fetchFeed } from '../api/feed.api.js';
import { PostCard } from '../../blog/components/PostCard.js';
import { fetchPosts, type PostSummary } from '../../blog/api/posts.api.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import './feed.css';

// ───────────────────────── Icons ─────────────────────────

function FeedIcon(): React.JSX.Element {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 10h16M4 14h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ───────────────────────── Skeleton ─────────────────────────

function FeedSkeleton(): React.JSX.Element {
  return (
    <div className="feed__skeleton" aria-label="Loading feed…">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="feed__skeleton-card">
          <Skeleton variant="rect" height="12rem" />
          <div className="feed__skeleton-body">
            <Skeleton variant="text" width="40%" height="0.875rem" />
            <Skeleton variant="text" width="85%" height="1.5rem" />
            <Skeleton variant="text" width="95%" height="1rem" />
            <Skeleton variant="text" width="75%" height="1rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── Suggested authors (retained) ─────────────────────────

interface SuggestedAuthor {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface SuggestedAuthorsProps {
  authors: SuggestedAuthor[];
}

function SuggestedAuthors({ authors }: SuggestedAuthorsProps): React.JSX.Element {
  if (authors.length === 0) return <></>;

  return (
    <section className="feed-page__suggested" aria-labelledby="suggested-heading">
      <h3 id="suggested-heading" className="feed-page__suggested-heading">
        Writers to discover
      </h3>
      <ul className="feed-page__suggested-list">
        {authors.map((author) => {
          const initial = author.display_name.charAt(0).toUpperCase() || '?';
          return (
            <li key={author.id}>
              <Link to={`/users/${author.id}`} className="feed-page__suggested-item">
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
  );
}

// ───────────────────────── FeedPage ─────────────────────────

export function FeedPage(): React.JSX.Element {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
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
      setIsFetchingMore(true);
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
        setIsFetchingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadFeed();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadFeed]);

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
        // Non-critical; suggested section simply won't appear.
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
    <div className="feed">
      <PageHeader
        eyebrow="From people you follow"
        title="Feed"
        subtitle="Latest stories from your network."
        variant="editorial"
        actions={
          <Link to="/explore/bikes" className="btn btn-ghost">
            Explore
          </Link>
        }
      />

      {error && (
        <p className="feed__error" role="alert">{error}</p>
      )}

      {isLoading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <>
          <EmptyState
            icon={<FeedIcon />}
            title="Nothing to read yet"
            description="Follow more people to see their posts here. Or wander the journal."
            action={
              <Link to="/posts" className="btn btn-primary">
                Browse all posts
              </Link>
            }
            secondaryAction={
              <Link to="/explore/bikes" className="btn btn-ghost">
                Explore bikes
              </Link>
            }
          />
          <SuggestedAuthors authors={suggested} />
        </>
      ) : (
        <ul className="feed__list">
          {posts.map((p) => (
            <li key={p.id}>
              <PostCard post={p} variant="medium" />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="feed__pagination">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            aria-busy={isFetchingMore}
          >
            {isFetchingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
