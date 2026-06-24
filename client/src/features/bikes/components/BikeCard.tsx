import { Link } from 'react-router';
import type { BikeItem } from '../api/bikes.api.js';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import { ReminderBadge } from '../../reminders/components/ReminderBadge.js';
import type { ComponentReminder } from '../../reminders/api/reminders.api.js';
import './bikes.css';

// ── Types ──────────────────────────────────────────────────────────────────

export interface BikeCardProps {
  bike: BikeItem & {
    totalKm?: number;
    lastRideAt?: string | null;
    componentCount?: number;
    activeReminders?: ComponentReminder[];
  };
  variant?: 'workshop' | 'explore' | 'compact';
}

// ── Format helpers ─────────────────────────────────────────────────────────

function formatKm(km: number | undefined): string {
  if (km === undefined) return '-';
  return `${km.toLocaleString()} km`;
}

function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ── Workshop variant ───────────────────────────────────────────────────────

function WorkshopBikeCard({ bike }: { bike: BikeCardProps['bike'] }): React.JSX.Element {
  const reminders = bike.activeReminders ?? [];

  return (
    <article className="bike-card bike-card--workshop">
      <Link
        to={`/me/bikes/${bike.id}`}
        className="bike-card__link bike-card__link--workshop"
        aria-label={`View ${bike.name}`}
      >
        <div className="bike-card__image-wrap">
          {isSafeImageUrl(bike.hero_image_url) ? (
            <img
              className="bike-card__image"
              src={bike.hero_image_url ?? ''}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className="bike-card__image-placeholder" aria-hidden="true">
              <BikeIcon />
            </div>
          )}
        </div>

        <div className="bike-card__body">
          <p className="bike-card__eyebrow">{bike.type}</p>
          <h2 className="bike-card__title">{bike.name}</h2>
          <p className="bike-card__meta">{bike.brand} · {bike.year}</p>

          <dl className="bike-card__specs">
            <div className="bike-card__spec">
              <dt>Distance</dt>
              <dd>{formatKm(bike.totalKm)}</dd>
            </div>
            <div className="bike-card__spec">
              <dt>Last ride</dt>
              <dd>{formatRelative(bike.lastRideAt)}</dd>
            </div>
            <div className="bike-card__spec">
              <dt>Components</dt>
              <dd>{bike.componentCount ?? '-'}</dd>
            </div>
          </dl>

          {reminders.length > 0 && (
            <ul className="bike-card__reminders">
              {reminders.slice(0, 3).map((r) => (
                <li key={r.component_id}>
                  <ReminderBadge reminder={r} compact />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
    </article>
  );
}

// ── Default (grid card) variant ────────────────────────────────────────────

function DefaultBikeCard({ bike }: { bike: BikeCardProps['bike'] }): React.JSX.Element {
  return (
    <article className="bike-card">
      <Link
        to={`/me/bikes/${bike.id}`}
        className="bike-card__link"
        aria-label={`View ${bike.name}`}
      >
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
            <Link to={`/me/bikes/${bike.id}`} className="bike-card__name-link">
              {bike.name}
            </Link>
          </h2>
          <div className="bike-card__badges">
            <span className="bike-card__badge bike-card__badge--type">{bike.type}</span>
            <span
              className={`bike-card__badge ${bike.is_public ? 'bike-card__badge--public' : 'bike-card__badge--private'}`}
              aria-label={bike.is_public ? 'Public bike' : 'Private bike'}
            >
              {bike.is_public ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        <p className="bike-card__subtitle">
          {bike.brand} {bike.model} &mdash; {bike.year}
        </p>
      </div>
    </article>
  );
}

// ── Inline SVG icon (for placeholder) ─────────────────────────────────────

function BikeIcon(): React.JSX.Element {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" fill="none">
      <circle cx="14" cy="32" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="34" cy="32" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M14 32L20 16h8l6 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 16l-4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 16l6 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Public export ──────────────────────────────────────────────────────────

export function BikeCard({ bike, variant = 'explore' }: BikeCardProps): React.JSX.Element {
  if (variant === 'workshop') {
    return <WorkshopBikeCard bike={bike} />;
  }
  return <DefaultBikeCard bike={bike} />;
}
