import { useState, useEffect, useRef } from 'react';
import type { FollowStats as FollowStatsData } from '../api/follows.api.js';
import './follows.css';

interface FollowStatsProps {
  stats: FollowStatsData;
  variant?: 'inline' | 'compact';
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// NOTE: isFirstRender is per-mount, so a route change that unmounts and
// remounts FollowStats will replay the count-up animation on the same
// value. That's intentional — treating each profile visit as a "first
// look" feels right for this UX.
function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Subsequent updates snap immediately — no looping animation
    if (!isFirstRender.current) {
      setValue(target);
      return;
    }
    isFirstRender.current = false;

    // Snap immediately for reduced-motion users
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * easeOutCubic(t)));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  return value;
}

export function FollowStats({ stats, variant = 'inline' }: FollowStatsProps): React.JSX.Element {
  const displayFollowers = useCountUp(stats.followers_count);
  const displayFollowing = useCountUp(stats.following_count);

  return (
    <div
      className={`follow-stats follow-stats--${variant}`}
      aria-label="Follow statistics"
    >
      <span className="follow-stats__item">
        <strong className="follow-stats__count">{displayFollowers.toLocaleString()}</strong>
        <span className="follow-stats__label">
          {stats.followers_count === 1 ? 'follower' : 'followers'}
        </span>
      </span>
      <span className="follow-stats__separator" aria-hidden="true">·</span>
      <span className="follow-stats__item">
        <strong className="follow-stats__count">{displayFollowing.toLocaleString()}</strong>
        <span className="follow-stats__label">following</span>
      </span>
    </div>
  );
}
