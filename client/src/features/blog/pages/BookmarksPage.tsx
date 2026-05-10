import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { fetchMyBookmarks, type BookmarkedPost } from '../api/bookmarks.api.js';
import { PostCard } from '../components/PostCard.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import type { PostSummary } from '../api/posts.api.js';
import './bookmarks.css';

function bookmarkedPostToSummary(bp: BookmarkedPost): PostSummary {
  return {
    id: bp.id,
    author_id: bp.author_id,
    title: bp.title,
    slug: bp.slug,
    excerpt: bp.excerpt,
    cover_image_url: bp.cover_image_url,
    category: bp.category,
    status: 'published',
    published_at: bp.published_at,
    created_at: bp.bookmarked_at,
    updated_at: bp.bookmarked_at,
    author_display_name: bp.author_display_name,
    author_avatar_url: bp.author_avatar_url,
  };
}

// ───────────────────────── Icons ─────────────────────────

function BookmarkIcon(): React.JSX.Element {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 3h14a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ───────────────────────── BookmarksSkeleton ─────────────────────────

function BookmarksSkeleton(): React.JSX.Element {
  return (
    <div className="bookmarks__skeleton" aria-label="Loading bookmarks…">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bookmarks__skeleton-card">
          <Skeleton variant="rect" height="12rem" />
          <div className="bookmarks__skeleton-body">
            <Skeleton variant="text" width="60%" height="1.25rem" />
            <Skeleton variant="text" width="90%" height="1rem" />
            <Skeleton variant="text" width="80%" height="1rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── BookmarksPage ─────────────────────────

export function BookmarksPage(): React.JSX.Element {
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchMyBookmarks()
      .then((data) => {
        if (!controller.signal.aborted) {
          setBookmarks(data);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load bookmarks.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="bookmarks">
      <PageHeader
        eyebrow="Personal"
        title="Bookmarks"
        subtitle={
          !isLoading && bookmarks.length > 0
            ? `${bookmarks.length} saved`
            : undefined
        }
        variant="editorial"
      />

      {error && (
        <p className="bookmarks__error" role="alert">{error}</p>
      )}

      {isLoading ? (
        <BookmarksSkeleton />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon />}
          title="No bookmarks yet"
          description="Tap the bookmark icon on any post to save it here for later."
          action={
            <Link to="/posts" className="btn btn-primary">
              Browse posts
            </Link>
          }
        />
      ) : (
        <ul className="bookmarks__grid" role="list" aria-label="Bookmarked posts">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              <PostCard post={bookmarkedPostToSummary(bookmark)} variant="medium" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
