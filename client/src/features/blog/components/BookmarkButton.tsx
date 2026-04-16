import { useState } from 'react';
import { toggleBookmark } from '../api/bookmarks.api.js';
import './blog-social.css';

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
      className={`bookmark-btn${isBookmarked ? ' bookmark-btn--bookmarked' : ''}`}
      onClick={() => void handleToggle()}
      disabled={!isAuthenticated || isToggling}
      aria-label={label}
      aria-pressed={isAuthenticated ? isBookmarked : undefined}
      title={!isAuthenticated ? 'Log in to bookmark' : undefined}
    >
      <span className="bookmark-btn__icon" aria-hidden="true">
        {isBookmarked ? '🔖' : '🏷'}
      </span>
      <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
}
