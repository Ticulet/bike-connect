import { useState, useEffect, useCallback, useId } from 'react';
import { useParams, Link } from 'react-router';
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
import { fetchUserPublicBikes, type BikeItem } from '../features/bikes/api/bikes.api.js';
import { isSafeImageUrl } from '../lib/safe-url.js';
import { Tabs } from '../components/ui/Tabs.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Skeleton } from '../components/ui/Skeleton.js';
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

function PenEmptyIcon(): React.JSX.Element {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="13" y1="16" x2="27" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="21" x2="27" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="26" x2="21" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BikeEmptyIcon(): React.JSX.Element {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="12" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 28L20 14L28 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ActivityEmptyIcon(): React.JSX.Element {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <polyline points="4,20 12,12 20,24 28,8 36,20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ProfileBikeCard({ bike }: { bike: BikeItem }): React.JSX.Element {
  return (
    <article className="bike-card">
      <Link to={`/bikes/${bike.id}`} className="bike-card__link" aria-label={`View ${bike.name}`}>
        {isSafeImageUrl(bike.hero_image_url) ? (
          <img
            className="bike-card__image"
            src={bike.hero_image_url ?? ''}
            alt={`${bike.name} hero image`}
            loading="lazy"
          />
        ) : (
          <div className="bike-card__image-placeholder" aria-hidden="true">
            🚲
          </div>
        )}
      </Link>
      <div className="bike-card__body">
        <div className="bike-card__header">
          <h2 className="bike-card__name">
            <Link to={`/bikes/${bike.id}`} className="bike-card__name-link">
              {bike.name}
            </Link>
          </h2>
          <span className="bike-card__badge bike-card__badge--type">{bike.type}</span>
        </div>
        <p className="bike-card__subtitle">
          {bike.brand} {bike.model}, {bike.year}
        </p>
      </div>
    </article>
  );
}

const TAB_IDS = ['posts', 'bikes', 'activity'] as const;

export function UserProfilePage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const tabsBaseId = useId();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followStats, setFollowStats] = useState<FollowStatsData | null>(null);
  const [authorPosts, setAuthorPosts] = useState<PostSummary[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [bikes, setBikes] = useState<BikeItem[]>([]);
  const [bikesLoading, setBikesLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return (TAB_IDS as readonly string[]).includes(hash) ? hash : 'posts';
  });

  useEffect(() => {
    window.history.replaceState(null, '', `#${activeTab}`);
  }, [activeTab]);

  const loadFollowStats = useCallback(
    async (userId: string, signal: AbortSignal): Promise<void> => {
      if (signal.aborted) return;
      try {
        const stats = await fetchFollowStats(userId);
        if (!signal.aborted) setFollowStats(stats);
      } catch { /* non-critical */ }
    },
    [],
  );

  const loadAuthorPosts = useCallback(
    async (userId: string, signal: AbortSignal): Promise<void> => {
      if (signal.aborted) return;
      setPostsLoading(true);
      try {
        const result = await fetchPosts({ author: userId, limit: 12 });
        if (!signal.aborted) setAuthorPosts(result.data);
      } catch {
        if (!signal.aborted) setAuthorPosts([]);
      } finally {
        if (!signal.aborted) setPostsLoading(false);
      }
    },
    [],
  );

  const loadBikes = useCallback(
    async (userId: string, signal: AbortSignal): Promise<void> => {
      if (signal.aborted) return;
      setBikesLoading(true);
      try {
        const result = await fetchUserPublicBikes(userId, { signal });
        if (!signal.aborted) setBikes(result);
      } catch {
        if (!signal.aborted) setBikes([]);
      } finally {
        if (!signal.aborted) setBikesLoading(false);
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
    setBikes([]);

    apiClient<UserProfile>(`/users/${id}`, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setProfile(result);
          void loadFollowStats(id, controller.signal);
          void loadAuthorPosts(id, controller.signal);
          void loadBikes(id, controller.signal);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiClientError && err.status === 404) setNotFound(true);
        else setError(err instanceof Error ? err.message : 'Failed to load user profile');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => { controller.abort(); };
  }, [id, loadFollowStats, loadAuthorPosts, loadBikes]);

  function handleFollowStatsChange(update: Partial<FollowStatsData>): void {
    setFollowStats((prev) => {
      if (!prev) return prev;
      const isFollowingChanged = update.is_following !== undefined && update.is_following !== prev.is_following;
      const delta = isFollowingChanged ? (update.is_following ? 1 : -1) : 0;
      return { ...prev, ...update, followers_count: prev.followers_count + delta };
    });
  }

  const isOwnProfile = Boolean(currentUser && id && currentUser.id === id);
  const showFollowButton = isAuthenticated && !isOwnProfile && followStats !== null;

  if (isLoading) {
    return (
      <main id="main" className="user-profile">
        <div className="user-profile__loading">
          <Skeleton variant="circle" width={96} height={96} />
          <Skeleton variant="text" lines={2} />
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main id="main" className="user-profile">
        <div className="user-profile__not-found">
          <h1>User not found</h1>
          <p>The user you are looking for does not exist.</p>
          <Link to="/" className="btn btn-primary">Go home</Link>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main id="main" className="user-profile">
        <p className="user-profile__error" role="alert">
          {error ?? 'An unexpected error occurred.'}
        </p>
      </main>
    );
  }

  const initial = profile.display_name.charAt(0).toUpperCase();

  const tabItems = [
    { id: 'posts', label: 'Posts', badge: authorPosts.length > 0 ? authorPosts.length : undefined },
    { id: 'bikes', label: 'Bikes' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <main id="main" className="user-profile">
      <div className="user-profile__layout">
        {/* Left: identity card */}
        <aside className="user-profile__identity-card">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${profile.display_name}'s avatar`}
              className="user-profile__avatar"
            />
          ) : (
            <div className="user-profile__avatar-fallback" aria-hidden="true">
              {initial}
            </div>
          )}
          <h1 className="user-profile__display-name">{profile.display_name}</h1>
          {profile.bio && <p className="user-profile__bio">{profile.bio}</p>}
          <p className="user-profile__joined">Member since {formatMemberSince(profile.created_at)}</p>

          {followStats !== null && (
            <div className="user-profile__follow">
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
        </aside>

        {/* Right: tabs + content */}
        <div className="user-profile__content">
          <Tabs
            label="User content"
            items={tabItems}
            activeId={activeTab}
            onChange={setActiveTab}
            baseId={tabsBaseId}
          />

          <div
            role="tabpanel"
            id={`${tabsBaseId}-panel-${activeTab}`}
            aria-labelledby={`${tabsBaseId}-tab-${activeTab}`}
            className="user-profile__panel"
          >
            {activeTab === 'posts' && (
              postsLoading ? (
                <div className="user-profile__posts-grid">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} variant="card" height={200} />
                  ))}
                </div>
              ) : authorPosts.length === 0 ? (
                <EmptyState
                  icon={<PenEmptyIcon />}
                  title="No posts yet"
                  description={isOwnProfile ? "You haven't published any posts yet." : `${profile.display_name} hasn't published yet.`}
                />
              ) : (
                <ul role="list" className="user-profile__posts-grid">
                  {authorPosts.map((post) => (
                    <li key={post.id}>
                      <PostCard post={post} variant="compact" />
                    </li>
                  ))}
                </ul>
              )
            )}

            {activeTab === 'bikes' && (
              bikesLoading ? (
                <div className="user-profile__posts-grid">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} variant="card" height={200} />
                  ))}
                </div>
              ) : bikes.length === 0 ? (
                <EmptyState
                  icon={<BikeEmptyIcon />}
                  title="No public bikes"
                  description={isOwnProfile ? "You haven't made any bikes public yet." : 'None of their bikes are visible publicly.'}
                />
              ) : (
                <ul role="list" className="user-profile__posts-grid">
                  {bikes.map((bike) => (
                    <li key={bike.id}>
                      <ProfileBikeCard bike={bike} />
                    </li>
                  ))}
                </ul>
              )
            )}

            {activeTab === 'activity' && (
              <EmptyState
                icon={<ActivityEmptyIcon />}
                title="Quiet for now"
                description="Activity will appear here."
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
