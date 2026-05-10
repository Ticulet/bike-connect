import { Link } from 'react-router';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { PageHeader } from '../components/ui/PageHeader.js';
import { StatStrip } from '../components/ui/StatStrip.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { ReminderList } from '../features/reminders/components/ReminderList.js';
import { useMeStats } from '../hooks/useMeStats.js';
import './me-hub.css';

// ───────────────────────── Icons ─────────────────────────

function PenIcon(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15.232 5.232l3.536 3.536M9 11l-5 5v3h3l5-5-3-3zm6.232-5.768a2 2 0 012.828 2.828L7 19H4v-3L15.232 5.232z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BikeIcon(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="5" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="19" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 17l4-7h5l2 4M14 10l-2 4M12 7h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeedIcon(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 10h16M4 14h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookmarkIcon(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 3h14a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ───────────────────────── QuickLink ─────────────────────────

interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function QuickLink({ to, icon, label, badge }: QuickLinkProps): React.JSX.Element {
  return (
    <li>
      <Link to={to} className="me-hub__link">
        <span className="me-hub__link-icon" aria-hidden="true">{icon}</span>
        <span className="me-hub__link-label">{label}</span>
        {badge !== undefined && (
          <span className="me-hub__link-badge" aria-label={`${badge} items`}>{badge}</span>
        )}
      </Link>
    </li>
  );
}

// ───────────────────────── ActivityList ─────────────────────────

import type { ActivityItem } from '../hooks/useMeStats.js';

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActivityListProps {
  items: ActivityItem[];
}

function ActivityList({ items }: ActivityListProps): React.JSX.Element {
  return (
    <ul className="me-hub__activity-list">
      {items.map((item) => (
        <li key={item.id} className="me-hub__activity-item">
          <Link to={item.href} className="me-hub__activity-link">
            <span className="me-hub__activity-label">{item.label}</span>
            <time
              className="me-hub__activity-time"
              dateTime={item.timestamp}
            >
              {formatRelativeTime(item.timestamp)}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────── Greeting ─────────────────────────

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ───────────────────────── MeHubPage ─────────────────────────

function HubSkeleton(): React.JSX.Element {
  return (
    <div className="me-hub__skeleton" aria-label="Loading hub…">
      <Skeleton variant="rect" height="4rem" />
      <Skeleton variant="rect" height="5rem" />
      <div className="me-hub__skeleton-links">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} variant="card" height="6rem" />
        ))}
      </div>
    </div>
  );
}

export function MeHubPage(): React.JSX.Element {
  const { user } = useAuth();
  const stats = useMeStats();

  if (stats.isLoading) {
    return <HubSkeleton />;
  }

  const displayName = user?.display_name ?? 'Rider';

  return (
    <div className="me-hub">
      <PageHeader
        eyebrow={greeting()}
        title={displayName}
        subtitle="Your field journal."
        variant="editorial"
      />

      <section className="me-hub__summary" aria-labelledby="me-hub-summary">
        <h2 id="me-hub-summary" className="sr-only">Activity summary</h2>
        <StatStrip
          stats={[
            { label: 'Posts published', value: stats.postsPublished },
            { label: 'Bikes registered', value: stats.bikeCount },
            { label: 'Distance this month', value: stats.kmThisMonth },
            { label: 'Bookmarks', value: stats.bookmarkCount },
          ]}
          orientation="horizontal"
        />
      </section>

      <section className="me-hub__quick-links" aria-labelledby="me-hub-quick">
        <h2 id="me-hub-quick" className="section-heading">Jump to</h2>
        <ul className="me-hub__links">
          <QuickLink to="/me/posts" icon={<PenIcon />} label="Posts" badge={stats.postsTotal} />
          <QuickLink to="/me/bikes" icon={<BikeIcon />} label="Bikes" badge={stats.bikeCount} />
          <QuickLink to="/feed" icon={<FeedIcon />} label="Feed" />
          <QuickLink to="/me/bookmarks" icon={<BookmarkIcon />} label="Bookmarks" badge={stats.bookmarkCount} />
          <QuickLink to="/me/settings" icon={<SettingsIcon />} label="Settings" />
        </ul>
      </section>

      {stats.recentReminders.length > 0 && (
        <section className="me-hub__reminders" aria-labelledby="me-hub-reminders">
          <h2 id="me-hub-reminders" className="section-heading">Upcoming maintenance</h2>
          <ReminderList reminders={stats.recentReminders} compact />
        </section>
      )}

      {stats.recentActivity.length > 0 && (
        <section className="me-hub__activity" aria-labelledby="me-hub-activity">
          <h2 id="me-hub-activity" className="section-heading">Recent activity</h2>
          <ActivityList items={stats.recentActivity} />
        </section>
      )}
    </div>
  );
}
