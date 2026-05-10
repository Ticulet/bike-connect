import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { apiClient, ApiClientError } from '../lib/api-client.js';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import {
  fetchFollowStats,
  type FollowStats as FollowStatsData,
} from '../features/follows/api/follows.api.js';
import { FollowButton } from '../features/follows/components/FollowButton.js';
import { FollowStats } from '../features/follows/components/FollowStats.js';
import { fetchPosts, type PostSummary } from '../features/blog/api/posts.api.js';
import { PostCard } from '../features/blog/components/PostCard.js';
import './user-profile.css';

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

function formatMemberSince(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

export function UserProfilePage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [followStats, setFollowStats] = useState<FollowStatsData | null>(null);

  const [authorPosts, setAuthorPosts] = useState<PostSummary[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const loadFollowStats = useCallback(
    async (userId: string, signal: AbortSignal): Promise<void> => {
      if (signal.aborted) return;
      try {
        const stats = await fetchFollowStats(userId);
        if (!signal.aborted) {
          setFollowStats(stats);
        }
      } catch {
        // Non-critical: follow stats failure should not block the profile page
      }
    },
    [],
  );

  const loadAuthorPosts = useCallback(
    async (userId: string, signal: AbortSignal): Promise<void> => {
      if (signal.aborted) return;
      setPostsLoading(true);
      try {
        const result = await fetchPosts({ author: userId, limit: 12 });
        if (!signal.aborted) {
          setAuthorPosts(result.data);
        }
      } catch {
        if (!signal.aborted) {
          setAuthorPosts([]);
        }
      } finally {
        if (!signal.aborted) {
          setPostsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    setIsLoading(true);
    setNotFound(false);
    setError(null);
    setFollowStats(null);
    setAuthorPosts([]);

    apiClient<UserProfile>(`/users/${id}`, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setProfile(result);
          void loadFollowStats(id, controller.signal);
          void loadAuthorPosts(id, controller.signal);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load user profile');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [id, loadFollowStats, loadAuthorPosts]);

  function handleFollowStatsChange(update: Partial<FollowStatsData>): void {
    setFollowStats((prev) => {
      if (!prev) return prev;

      const isFollowingChanged = update.is_following !== undefined && update.is_following !== prev.is_following;
      const followersDelta = isFollowingChanged
        ? update.is_following
          ? 1
          : -1
        : 0;

      return {
        ...prev,
        ...update,
        followers_count: prev.followers_count + followersDelta,
      };
    });
  }

  const isOwnProfile = Boolean(currentUser && id && currentUser.id === id);
  const showFollowButton = isAuthenticated && !isOwnProfile && followStats !== null;

  if (isLoading) {
    return (
      <main id="main" className="user-profile-page">
        <p className="user-profile-page__loading" role="status" aria-live="polite">
          Loading profile...
        </p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main id="main" className="user-profile-page">
        <div className="user-profile-page__not-found">
          <h1>User not found</h1>
          <p>The user you are looking for does not exist.</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main id="main" className="user-profile-page">
        <p className="user-profile-page__error" role="alert">
          {error ?? 'An unexpected error occurred.'}
        </p>
      </main>
    );
  }

  const initial = profile.display_name.charAt(0).toUpperCase();

  return (
    <main id="main" className="user-profile-page">
      <article className="user-profile-page__card">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={`${profile.display_name}'s avatar`}
            className="user-profile-page__avatar"
          />
        ) : (
          <div
            className="user-profile-page__avatar-placeholder"
            aria-hidden="true"
          >
            {initial}
          </div>
        )}

        <h1 className="user-profile-page__name">{profile.display_name}</h1>

        {followStats !== null && (
          <div className="user-profile-page__follow-row">
            <FollowStats stats={followStats} />
            {showFollowButton && (
              <FollowButton
                userId={id ?? ''}
                isFollowing={followStats.is_following}
                isAuthenticated={isAuthenticated}
                onStatsChange={handleFollowStatsChange}
              />
            )}
          </div>
        )}

        {profile.bio && (
          <p className="user-profile-page__bio">{profile.bio}</p>
        )}

        <p className="user-profile-page__joined">
          Member since {formatMemberSince(profile.created_at)}
        </p>
      </article>

      <section className="user-profile-page__posts" aria-labelledby="author-posts-heading">
        <h2 id="author-posts-heading" className="user-profile-page__posts-heading">
          {isOwnProfile ? 'Your posts' : `Posts by ${profile.display_name}`}
        </h2>

        {postsLoading ? (
          <p className="user-profile-page__posts-status" role="status" aria-live="polite">
            Loading posts...
          </p>
        ) : authorPosts.length === 0 ? (
          <p className="user-profile-page__posts-empty" role="status" aria-live="polite">
            {isOwnProfile
              ? "You haven't published any posts yet."
              : `${profile.display_name} hasn't published any posts yet.`}
          </p>
        ) : (
          <ul role="list" className="user-profile-page__posts-grid">
            {authorPosts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
