import type { RideStats as RideStatsData, RideItem } from '../api/rides.api.js';
import { StatStrip } from '../../../components/ui/StatStrip.js';
import { Sparkline } from '../../../components/ui/Sparkline.js';
import '../rides.css';

interface RideStatsProps {
  stats: RideStatsData;
  /** Optional list of rides for sparkline data. */
  rides?: RideItem[];
}

function formatKm(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `${n.toFixed(1)} km`;
}

/** Bucket rides into 12 weekly distance bins (most recent week last). */
function buildWeeklyBuckets(rides: RideItem[]): number[] {
  const buckets = Array<number>(12).fill(0);
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  for (const ride of rides) {
    const rideMs = new Date(ride.date).getTime();
    const weeksAgo = Math.floor((now - rideMs) / msPerWeek);
    if (weeksAgo >= 0 && weeksAgo < 12) {
      buckets[11 - weeksAgo] = (buckets[11 - weeksAgo] ?? 0) + parseFloat(ride.distance_km);
    }
  }

  return buckets;
}

export function RideStats({ stats, rides }: RideStatsProps): React.JSX.Element {
  const distance = parseFloat(stats.total_distance_km).toFixed(1);

  const statItems = [
    { label: 'Total rides', value: stats.ride_count },
    { label: 'Total distance', value: formatKm(distance) },
  ];

  const weeklyBuckets = rides !== undefined ? buildWeeklyBuckets(rides) : [];
  const hasSparkline = weeklyBuckets.some((v) => v > 0);

  return (
    <div className="ride-stats-workshop" aria-label="Ride statistics">
      {hasSparkline && (
        <Sparkline
          data={weeklyBuckets}
          height={48}
          ariaLabel="Weekly distance over 12 weeks"
        />
      )}
      <StatStrip stats={statItems} orientation="horizontal" />
    </div>
  );
}
