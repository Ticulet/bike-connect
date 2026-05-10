import type { ComponentReminder, ReminderStatus } from '../api/reminders.api.js';
import '../reminders.css';

interface ReminderBadgeProps {
  reminder: ComponentReminder;
  /** Compact mode — shows icon only; full label visible on focus/hover via title + aria-label. */
  compact?: boolean;
}

// ── Hand-rolled icons ──────────────────────────────────────────────────────

function AlertIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M7 1.5L12.5 11H1.5L7 1.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path d="M7 5.5v2.5" stroke="var(--color-surface-1, #fff)" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="9.5" r="0.6" fill="var(--color-surface-1, #fff)" />
    </svg>
  );
}

function ClockIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M4.5 7l2 2 3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Status configuration ───────────────────────────────────────────────────

interface StatusConfig {
  icon: React.JSX.Element;
  label: string;
  modifier: string;
}

function getStatusConfig(status: ReminderStatus, reminder: ComponentReminder): StatusConfig {
  const daysSince = reminder.days_since_last_service;
  const kmSince = reminder.km_since_last_service;

  switch (status) {
    case 'overdue': {
      const detail = daysSince !== null ? `${daysSince} days ago` : (kmSince !== null ? `${kmSince} km ago` : '');
      return {
        icon: <AlertIcon />,
        label: detail ? `Overdue · ${detail}` : 'Overdue',
        modifier: 'overdue',
      };
    }
    case 'due_soon': {
      const threshold = reminder.threshold;
      const daysLeft = threshold !== null && daysSince !== null
        ? Math.max(0, threshold.months * 30 - daysSince)
        : null;
      const label = daysLeft !== null ? `Due in ${daysLeft} days` : 'Due soon';
      return { icon: <ClockIcon />, label, modifier: 'due-soon' };
    }
    case 'no_threshold':
      return { icon: <CalendarIcon />, label: 'Scheduled', modifier: 'scheduled' };
    case 'no_service_yet':
      return { icon: <CalendarIcon />, label: 'No service yet', modifier: 'scheduled' };
    case 'ok':
    default:
      return { icon: <CheckIcon />, label: 'Completed', modifier: 'ok' };
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function ReminderBadge({ reminder, compact = false }: ReminderBadgeProps): React.JSX.Element {
  const config = getStatusConfig(reminder.status, reminder);
  const ariaLabel = `${reminder.component_name}: ${config.label}`;

  return (
    <span
      className={`reminder-badge reminder-badge--${config.modifier}${compact ? ' reminder-badge--compact' : ''}`}
      title={ariaLabel}
      aria-label={ariaLabel}
    >
      {config.icon}
      {!compact && (
        <span className="reminder-badge__label">{config.label}</span>
      )}
    </span>
  );
}
