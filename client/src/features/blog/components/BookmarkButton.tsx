import { useState, useEffect } from 'react';
import { toggleBookmark, fetchBookmarkInfo } from '../api/bookmarks.api.js';
import './blog-social.css';

function BookmarkFilledIcon(): React.JSX.Element {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" fill="currentColor">
      <path d="M2 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13l-5-3-5 3V2z" />
    </svg>
  );
}

function BookmarkOutlineIcon(): React.JSX.Element {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13l-5-3-5 3V2z" strokeLinejoin="round" />
    </svg>
  );
}

interface BookmarkButtonProps {
  postId: string;
  isAuthenticated: boolean;
  initialIsBookmarked?: boolean;
}

export function BookmarkButton({
  postId,
  isAuthenticated,
  initialIsBookmarked = false,
}: BookmarkButtonProps): React.JSX.Element {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(isAuthenticated);

  // Load the persisted bookmark state on mount so the button reflects whether
  // the post is already bookmarked (mirrors LikeButton). Without this it always
  // rendered "not bookmarked" on load, regardless of the saved state.
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    fetchBookmarkInfo(postId)
      .then((info) => {
        if (!controller.signal.aborted) {
          setIsBookmarked(info.bookmarked);
        }
      })
      .catch(() => {
        // Non-critical: leave the current state
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [postId, isAuthenticated]);

  async function handleToggle(): Promise<void> {
    if (!isAuthenticated || isToggling) return;

    // Optimistic update
    const previous = isBookmarked;
    setIsBookmarked(!isBookmarked);

    setIsToggling(true);
    try {
      const result = await toggleBookmark(postId);
      setIsBookmarked(result.bookmarked);
    } catch {
      // Revert on error
      setIsBookmarked(previous);
    } finally {
      setIsToggling(false);
    }
  }

  const label = isAuthenticated
    ? isBookmarked
      ? 'Remove bookmark'
      : 'Bookmark'
    : 'Log in to bookmark';

  return (
    <button
      type="button"
      className={`btn-toggle bookmark-btn${isBookmarked ? ' bookmark-btn--bookmarked' : ''}`}
      onClick={() => void handleToggle()}
      disabled={!isAuthenticated || isToggling || isLoading}
      aria-label={label}
      aria-pressed={isAuthenticated ? isBookmarked : undefined}
      title={!isAuthenticated ? 'Log in to bookmark' : undefined}
    >
      <span className="btn-toggle__icon bookmark-btn__icon" aria-hidden="true">
        {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkOutlineIcon />}
      </span>
      <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
}
