import { Link } from 'react-router';
import type { RideItem } from '../api/rides.api.js';
import '../rides.css';

interface RideListProps {
  rides: RideItem[];
  bikeId: string;
  isOwner: boolean;
  onDeleteRequest: (rideId: string) => void;
  /** Optional: called when edit is triggered (for drawer invocation). If absent, falls back to Link. */
  onEditRequest?: (ride: RideItem) => void;
}

// ── Pencil icon ────────────────────────────────────────────────────────────

function PencilIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M9.5 2.5l2 2-7 7H2.5v-2l7-7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ── Format helpers ─────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatKm(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `${n.toFixed(1)} km`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function RideList({
  rides,
  bikeId,
  isOwner,
  onDeleteRequest: _onDeleteRequest,
  onEditRequest,
}: RideListProps): React.JSX.Element {
  if (rides.length === 0) {
    return (
      <p className="ride-list__empty">
        No rides logged yet.{isOwner && ' Log your first ride above.'}
      </p>
    );
  }

  return (
    <ol className="ride-list" aria-label="Logged rides">
      {rides.map((ride, index) => (
        <li key={ride.id} className="ride-list__row">
          <span className="ride-list__number" aria-hidden="true">
            {String(rides.length - index).padStart(3, '0')}
          </span>

          <div className="ride-list__main">
            <p className="ride-list__title">{ride.notes?.slice(0, 60) ?? 'Untitled ride'}</p>
            <p className="ride-list__meta">
              <time dateTime={ride.date}>{formatDate(ride.date)}</time>
            </p>
          </div>

          <dl className="ride-list__specs">
            <div className="ride-list__spec">
              <dt>Distance</dt>
              <dd>{formatKm(ride.distance_km)}</dd>
            </div>
            <div className="ride-list__spec">
              <dt>Duration</dt>
              <dd>{ride.duration_min !== null ? formatDuration(ride.duration_min) : '—'}</dd>
            </div>
          </dl>

          {isOwner && (
            onEditRequest !== undefined ? (
              <button
                type="button"
                className="ride-list__edit-btn"
                onClick={() => onEditRequest(ride)}
                aria-label={`Edit ride on ${formatDate(ride.date)}`}
              >
                <PencilIcon />
              </button>
            ) : (
              <Link
                to={`/me/bikes/${bikeId}/rides/${ride.id}/edit`}
                className="ride-list__edit-btn"
                aria-label={`Edit ride on ${formatDate(ride.date)}`}
              >
                <PencilIcon />
              </Link>
            )
          )}
        </li>
      ))}
    </ol>
  );
}
