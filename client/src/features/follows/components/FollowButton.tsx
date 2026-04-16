import { useState } from 'react';
import { toggleFollow, type FollowStats } from '../api/follows.api.js';
import { ApiClientError } from '../../../lib/api-client.js';
import './follows.css';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  isAuthenticated: boolean;
  onStatsChange?: (update: Partial<FollowStats>) => void;
}

export function FollowButton({
  userId,
  isFollowing,
  isAuthenticated,
  onStatsChange,
}: FollowButtonProps): React.JSX.Element | null {
  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(): Promise<void> {
    if (!isAuthenticated || isLoading) return;

    const previousValue = localIsFollowing;
    const nextValue = !localIsFollowing;

    // Optimistic update
    setLocalIsFollowing(nextValue);
    setError(null);

    if (onStatsChange) {
      onStatsChange({ is_following: nextValue });
    }

    setIsLoading(true);

    try {
      const result = await toggleFollow(userId);
      setLocalIsFollowing(result.following);

      if (onStatsChange) {
        onStatsChange({ is_following: result.following });
      }
    } catch (err: unknown) {
      // Rollback on failure
      setLocalIsFollowing(previousValue);

      if (onStatsChange) {
        onStatsChange({ is_following: previousValue });
      }

      if (err instanceof ApiClientError) {
        setError(`Could not update follow status (${err.code}).`);
      } else {
        setError('Could not update follow status. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="follow-button-wrapper">
      <button
        type="button"
        className={`follow-btn${localIsFollowing ? ' follow-btn--following' : ''}`}
        onClick={() => void handleToggle()}
        disabled={isLoading}
        aria-busy={isLoading}
        aria-pressed={localIsFollowing}
        aria-label={localIsFollowing ? 'Unfollow this user' : 'Follow this user'}
      >
        {isLoading ? '...' : localIsFollowing ? 'Following' : 'Follow'}
      </button>
      {error !== null && (
        <p className="follow-btn__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
