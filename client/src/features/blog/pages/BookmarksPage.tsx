import { useState, useEffect } from 'react';
import { fetchMyBookmarks, type BookmarkedPost } from '../api/bookmarks.api.js';
import { PostCard } from '../components/PostCard.js';
import type { PostSummary } from '../api/posts.api.js';
import '../components/blog-social.css';

function bookmarkedPostToSummary(bp: BookmarkedPost): PostSummary {
  return {
    id: bp.id,
    title: bp.title,
    slug: bp.slug,
    excerpt: bp.excerpt,
    cover_image_url: bp.cover_image_url,
    category: bp.category,
    status: 'published',
    published_at: bp.published_at,
    created_at: bp.created_at,
    updated_at: bp.created_at,
    author_display_name: bp.author_display_name,
    author_avatar_url: bp.author_avatar_url,
  };
}

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

  if (isLoading) {
    return (
      <main id="main" className="bookmarks-page">
        <h1 className="bookmarks-page__heading">My Bookmarks</h1>
        <p className="bookmarks-page__loading" aria-live="polite">
          Loading bookmarks…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main" className="bookmarks-page">
        <h1 className="bookmarks-page__heading">My Bookmarks</h1>
        <p className="bookmarks-page__error" role="alert">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main id="main" className="bookmarks-page">
      <h1 className="bookmarks-page__heading">My Bookmarks</h1>

      {bookmarks.length === 0 ? (
        <p className="bookmarks-page__empty">
          You have no bookmarks yet. Bookmark posts to find them here.
        </p>
      ) : (
        <ul role="list" className="bookmarks-page__grid" aria-label="Bookmarked posts">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              <PostCard post={bookmarkedPostToSummary(bookmark)} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
