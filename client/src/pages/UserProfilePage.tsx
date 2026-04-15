import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { apiClient, ApiClientError } from '../lib/api-client.js';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    setIsLoading(true);
    setNotFound(false);
    setError(null);

    apiClient<UserProfile>(`/users/${id}`, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setProfile(result);
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
  }, [id]);

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

        {profile.bio && (
          <p className="user-profile-page__bio">{profile.bio}</p>
        )}

        <p className="user-profile-page__joined">
          Member since {formatMemberSince(profile.created_at)}
        </p>
      </article>
    </main>
  );
}
