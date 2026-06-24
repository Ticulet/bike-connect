import { useState, useEffect } from 'react';
import { fetchLikeInfo, toggleLike } from '../api/likes.api.js';
import './blog-social.css';

function HeartFilledIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M8 13.7C7.6 13.4 1.5 9.2 1.5 5.5 1.5 3.6 3 2 5 2c1 0 2.1.5 3 1.4C8.9 2.5 10 2 11 2c2 0 3.5 1.6 3.5 3.5 0 3.7-6.1 7.9-6.5 8.2z" />
    </svg>
  );
}

function HeartOutlineIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 13.7C7.6 13.4 1.5 9.2 1.5 5.5 1.5 3.6 3 2 5 2c1 0 2.1.5 3 1.4C8.9 2.5 10 2 11 2c2 0 3.5 1.6 3.5 3.5 0 3.7-6.1 7.9-6.5 8.2z" strokeLinejoin="round" />
    </svg>
  );
}

interface LikeButtonProps {
  postId: string;
  isAuthenticated: boolean;
}

export function LikeButton({ postId, isAuthenticated }: LikeButtonProps): React.JSX.Element {
  const [count, setCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchLikeInfo(postId)
      .then((info) => {
        if (!controller.signal.aborted) {
          setCount(info.count);
          setIsLiked(info.is_liked);
        }
      })
      .catch(() => {
        // Silently fail — like count is non-critical
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [postId]);

  async function handleToggle(): Promise<void> {
    if (!isAuthenticated || isToggling) return;

    // Optimistic update
    const previousCount = count;
    const previousIsLiked = isLiked;
    setIsLiked(!isLiked);
    setCount((prev) => (isLiked ? prev - 1 : prev + 1));

    setIsToggling(true);
    try {
      const result = await toggleLike(postId);
      setIsLiked(result.liked);
      setCount(result.count);
    } catch {
      // Revert on error
      setIsLiked(previousIsLiked);
      setCount(previousCount);
    } finally {
      setIsToggling(false);
    }
  }

  const label = isAuthenticated
    ? isLiked
      ? `Unlike (${count})`
      : `Like (${count})`
    : 'Log in to like';

  return (
    <button
      type="button"
      className={`btn-toggle like-btn${isLiked ? ' like-btn--liked' : ''}`}
      onClick={() => void handleToggle()}
      disabled={!isAuthenticated || isToggling || isLoading}
      aria-label={label}
      aria-pressed={isAuthenticated ? isLiked : undefined}
      title={!isAuthenticated ? 'Log in to like' : undefined}
    >
      <span className="btn-toggle__icon like-btn__icon" aria-hidden="true">
        {isLiked ? <HeartFilledIcon /> : <HeartOutlineIcon />}
      </span>
      <span className="like-btn__count">{isLoading ? '-' : count}</span>
    </button>
  );
}
