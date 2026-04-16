import { Link } from 'react-router';
import type { RideItem } from '../api/rides.api.js';
import '../rides.css';

interface RideListProps {
  rides: RideItem[];
  bikeId: string;
  isOwner: boolean;
  onDeleteRequest: (rideId: string) => void;
}

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

export function RideList({
  rides,
  bikeId,
  isOwner,
  onDeleteRequest,
}: RideListProps): React.JSX.Element {
  if (rides.length === 0) {
    return (
      <p className="ride-list__empty">
        No rides logged yet.{isOwner && ' Log your first ride above.'}
      </p>
    );
  }

  return (
    <div className="ride-list" role="region" aria-label="Logged rides">
      <table className="ride-list__table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Distance</th>
            <th scope="col" className="ride-list__col-duration">Duration</th>
            <th scope="col" className="ride-list__col-notes">Notes</th>
            {isOwner && <th scope="col"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {rides.map((ride) => (
            <tr key={ride.id}>
              <td>
                <time dateTime={ride.date}>{formatDate(ride.date)}</time>
              </td>
              <td>{parseFloat(ride.distance_km).toFixed(1)} km</td>
              <td className="ride-list__col-duration">
                {ride.duration_min !== null ? formatDuration(ride.duration_min) : '—'}
              </td>
              <td className="ride-list__col-notes">
                {ride.notes ? (
                  <span className="ride-list__notes" title={ride.notes}>
                    {ride.notes}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              {isOwner && (
                <td>
                  <div className="ride-list__actions">
                    <Link
                      to={`/my-bikes/${bikeId}/rides/${ride.id}/edit`}
                      className="ride-list__btn"
                      aria-label={`Edit ride on ${formatDate(ride.date)}`}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="ride-list__btn ride-list__btn--danger"
                      onClick={() => onDeleteRequest(ride.id)}
                      aria-label={`Delete ride on ${formatDate(ride.date)}`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
