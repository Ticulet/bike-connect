import { useState, useId, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import { apiClient, ApiClientError } from '../../../lib/api-client.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { useToast } from '../../../components/ui/useToast.js';
import type { AuthUser } from '../api/auth.api.js';
import './settings.css';

// ───────────────────────── Types ─────────────────────────

interface FormValues {
  display_name: string;
  bio: string;
}

interface FormErrors {
  display_name?: string;
  bio?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.display_name.trim().length === 0) {
    errors.display_name = 'Display name is required.';
  } else if (values.display_name.length > 100) {
    errors.display_name = 'Display name must be 100 characters or fewer.';
  }
  if (values.bio.length > 500) {
    errors.bio = 'Bio must be 500 characters or fewer.';
  }
  return errors;
}

// ───────────────────────── Section config ─────────────────────────

const SECTION_IDS = ['profile', 'account', 'privacy', 'notifications'] as const;
type SectionId = (typeof SECTION_IDS)[number];

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'notifications', label: 'Notifications' },
];

function initialSection(): SectionId {
  const hash = window.location.hash.replace('#', '') as SectionId;
  return SECTION_IDS.includes(hash) ? hash : 'profile';
}

// ───────────────────────── SettingsCard ─────────────────────────

interface SettingsCardProps {
  id: string;
  title: string;
  children: ReactNode;
}

function SettingsCard({ id, title, children }: SettingsCardProps): React.JSX.Element {
  return (
    <section id={id} className="settings-card" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="settings-card__title">{title}</h2>
      <div className="settings-card__body">{children}</div>
    </section>
  );
}

// ───────────────────────── Sub-forms ─────────────────────────

interface ProfileFormProps {
  user: AuthUser;
}

function ProfileForm({ user }: ProfileFormProps): React.JSX.Element {
  const displayNameId = useId();
  const bioId = useId();
  const toast = useToast();

  const [values, setValues] = useState<FormValues>({
    display_name: user.display_name,
    bio: user.bio ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(field: keyof FormValues, value: string): void {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<FormValues> = {};
      if (values.display_name.trim()) {
        payload.display_name = values.display_name.trim();
      }
      payload.bio = values.bio;

      await apiClient<AuthUser>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success('Profile saved.');
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error('Failed to save changes. Please try again.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="settings-form"
      onSubmit={(e) => { void handleSubmit(e); }}
      noValidate
    >
      <div className="settings-form__field">
        <label htmlFor={displayNameId} className="settings-form__label">
          Display Name
        </label>
        <input
          id={displayNameId}
          type="text"
          className="settings-form__input"
          value={values.display_name}
          onChange={(e) => handleChange('display_name', e.target.value)}
          maxLength={100}
          aria-required="true"
          aria-invalid={errors.display_name ? 'true' : 'false'}
          aria-describedby={errors.display_name ? `${displayNameId}-error` : undefined}
        />
        {errors.display_name && (
          <p id={`${displayNameId}-error`} className="settings-form__error" role="alert">
            {errors.display_name}
          </p>
        )}
      </div>

      <div className="settings-form__field">
        <label htmlFor={bioId} className="settings-form__label">
          Bio
        </label>
        <textarea
          id={bioId}
          className="settings-form__textarea"
          value={values.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          maxLength={500}
          aria-invalid={errors.bio ? 'true' : 'false'}
          aria-describedby={errors.bio ? `${bioId}-error` : `${bioId}-hint`}
        />
        {errors.bio ? (
          <p id={`${bioId}-error`} className="settings-form__error" role="alert">
            {errors.bio}
          </p>
        ) : (
          <p id={`${bioId}-hint`} className="settings-form__hint">
            Up to 500 characters.
          </p>
        )}
      </div>

      <div className="settings-form__actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function AccountFields({ user }: { user: AuthUser }): React.JSX.Element {
  return (
    <dl className="settings-info">
      <div className="settings-info__row">
        <dt className="settings-info__label">Email</dt>
        <dd className="settings-info__value">{user.email}</dd>
      </div>
      <div className="settings-info__row">
        <dt className="settings-info__label">Member since</dt>
        <dd className="settings-info__value">
          {new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </dd>
      </div>
    </dl>
  );
}

// NOTE: local state only — no backend privacy endpoint yet.
function PrivacyToggles(): React.JSX.Element {
  const [publicProfile, setPublicProfile] = useState(true);

  return (
    <div className="settings-toggles">
      <label className="settings-toggle">
        <span className="settings-toggle__label">Public profile</span>
        <input
          type="checkbox"
          className="settings-toggle__input"
          checked={publicProfile}
          onChange={(e) => setPublicProfile(e.target.checked)}
          aria-label="Make profile public"
        />
        <span className="settings-toggle__track" aria-hidden="true" />
      </label>
      <p className="settings-toggle__hint">
        When off, your profile and posts are only visible to you.
      </p>
    </div>
  );
}

// NOTE: local state only — no backend notifications endpoint yet.
function NotificationToggles(): React.JSX.Element {
  const [emailNotifs, setEmailNotifs] = useState(true);

  return (
    <div className="settings-toggles">
      <label className="settings-toggle">
        <span className="settings-toggle__label">Email notifications</span>
        <input
          type="checkbox"
          className="settings-toggle__input"
          checked={emailNotifs}
          onChange={(e) => setEmailNotifs(e.target.checked)}
          aria-label="Enable email notifications"
        />
        <span className="settings-toggle__track" aria-hidden="true" />
      </label>
      <p className="settings-toggle__hint">
        Receive email updates for comments and follows.
      </p>
    </div>
  );
}

// ───────────────────────── SettingsPage ─────────────────────────

export function SettingsPage(): React.JSX.Element {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [active, setActive] = useState<SectionId>(initialSection);

  const handleRailClick = useCallback(
    (id: SectionId): void => {
      setActive(id);
      window.history.replaceState(null, '', `#${id}`);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [],
  );

  const handleLogout = useCallback((): void => {
    logout()
      .then(() => {
        toast.success('Signed out');
        navigate('/');
      })
      .catch(() => {
        toast.error('Sign out failed; please try again');
      });
  }, [logout, navigate, toast]);

  if (isLoading) {
    return (
      <div className="settings">
        <p role="status" aria-live="polite" className="settings__loading">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="settings">
        <p role="alert" className="settings__loading">You must be signed in to view settings.</p>
      </div>
    );
  }

  return (
    <div className="settings">
      <PageHeader
        eyebrow="Personal"
        title="Settings"
        subtitle="Tune what we collect, what we show, and what we email."
        variant="workshop"
      />

      <div className="settings__layout">
        <nav className="settings__rail" aria-label="Settings sections">
          <ul className="settings__rail-list">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={
                    active === s.id
                      ? 'settings__rail-link is-active'
                      : 'settings__rail-link'
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    handleRailClick(s.id);
                  }}
                >
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="settings__rail-link settings__rail-link--danger"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </li>
          </ul>
        </nav>

        <div className="settings__main">
          <SettingsCard id="profile" title="Profile">
            <ProfileForm user={user} />
          </SettingsCard>

          <SettingsCard id="account" title="Account">
            <AccountFields user={user} />
          </SettingsCard>

          <SettingsCard id="privacy" title="Privacy">
            <PrivacyToggles />
          </SettingsCard>

          <SettingsCard id="notifications" title="Notifications">
            <NotificationToggles />
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
