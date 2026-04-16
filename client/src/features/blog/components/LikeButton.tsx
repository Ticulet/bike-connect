import { useState, useEffect } from 'react';
import { fetchLikeInfo, toggleLike } from '../api/likes.api.js';
import './blog-social.css';

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
      className={`like-btn${isLiked ? ' like-btn--liked' : ''}`}
      onClick={() => void handleToggle()}
      disabled={!isAuthenticated || isToggling || isLoading}
      aria-label={label}
      aria-pressed={isAuthenticated ? isLiked : undefined}
      title={!isAuthenticated ? 'Log in to like' : undefined}
    >
      <span className="like-btn__icon" aria-hidden="true">
        {isLiked ? '♥' : '♡'}
      </span>
      <span className="like-btn__count">{isLoading ? '—' : count}</span>
    </button>
  );
}
