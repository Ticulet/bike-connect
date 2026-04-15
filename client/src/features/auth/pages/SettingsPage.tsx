import { useState, useId } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import { apiClient, ApiClientError } from '../../../lib/api-client.js';
import type { AuthUser } from '../api/auth.api.js';
import './settings.css';

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

export function SettingsPage(): React.JSX.Element {
  const { user, isLoading } = useAuth();
  const displayNameId = useId();
  const bioId = useId();

  const [values, setValues] = useState<FormValues>({
    display_name: user?.display_name ?? '',
    bio: user?.bio ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <main id="main" className="settings-page">
        <p role="status" aria-live="polite">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function handleChange(field: keyof FormValues, value: string): void {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setSuccessMessage(null);
    setServerError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSuccessMessage(null);
    setServerError(null);

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
      setSuccessMessage('Profile updated. Changes will appear on next page load.');
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setServerError('Failed to save changes. Please try again.');
      } else {
        setServerError('An unexpected error occurred.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main id="main" className="settings-page">
      <h1 className="settings-page__title">Profile Settings</h1>

      <form
        className="settings-page__form"
        onSubmit={(e) => { void handleSubmit(e); }}
        noValidate
      >
        <div className="settings-page__field">
          <label htmlFor={displayNameId} className="settings-page__label">
            Display Name
          </label>
          <input
            id={displayNameId}
            type="text"
            className="settings-page__input"
            value={values.display_name}
            onChange={(e) => handleChange('display_name', e.target.value)}
            maxLength={100}
            aria-required="true"
            aria-invalid={errors.display_name ? 'true' : 'false'}
            aria-describedby={errors.display_name ? `${displayNameId}-error` : undefined}
          />
          {errors.display_name && (
            <p id={`${displayNameId}-error`} className="settings-page__error" role="alert">
              {errors.display_name}
            </p>
          )}
        </div>

        <div className="settings-page__field">
          <label htmlFor={bioId} className="settings-page__label">
            Bio
          </label>
          <textarea
            id={bioId}
            className="settings-page__textarea"
            value={values.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            maxLength={500}
            aria-invalid={errors.bio ? 'true' : 'false'}
            aria-describedby={
              errors.bio ? `${bioId}-error` : `${bioId}-hint`
            }
          />
          {errors.bio ? (
            <p id={`${bioId}-error`} className="settings-page__error" role="alert">
              {errors.bio}
            </p>
          ) : (
            <p id={`${bioId}-hint`} className="settings-page__hint">
              Up to 500 characters.
            </p>
          )}
        </div>

        <div className="settings-page__actions">
          <button
            type="submit"
            className="settings-page__submit"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>

          {successMessage && (
            <p className="settings-page__success" role="status" aria-live="polite">
              {successMessage}
            </p>
          )}

          {serverError && (
            <p className="settings-page__server-error" role="alert">
              {serverError}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
