import type { FollowStats as FollowStatsData } from '../api/follows.api.js';
import './follows.css';

interface FollowStatsProps {
  stats: FollowStatsData;
}

export function FollowStats({ stats }: FollowStatsProps): React.JSX.Element {
  return (
    <div className="follow-stats" aria-label="Follow statistics">
      <span className="follow-stats__item">
        <strong className="follow-stats__count">{stats.followers_count}</strong>
        <span className="follow-stats__label">
          {stats.followers_count === 1 ? 'follower' : 'followers'}
        </span>
      </span>
      <span className="follow-stats__separator" aria-hidden="true">·</span>
      <span className="follow-stats__item">
        <strong className="follow-stats__count">{stats.following_count}</strong>
        <span className="follow-stats__label">following</span>
      </span>
    </div>
  );
}
