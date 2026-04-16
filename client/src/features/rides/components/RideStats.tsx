import type { RideStats as RideStatsData } from '../api/rides.api.js';
import '../rides.css';

interface RideStatsProps {
  stats: RideStatsData;
}

export function RideStats({ stats }: RideStatsProps): React.JSX.Element {
  const distance = parseFloat(stats.total_distance_km).toFixed(1);

  return (
    <div className="ride-stats" aria-label="Ride statistics">
      <div className="ride-stats__item">
        <span className="ride-stats__value">{distance} km</span>
        <span className="ride-stats__label">Total distance</span>
      </div>
      <div className="ride-stats__item">
        <span className="ride-stats__value">{stats.ride_count}</span>
        <span className="ride-stats__label">
          {stats.ride_count === 1 ? 'Ride' : 'Rides'}
        </span>
      </div>
    </div>
  );
}
