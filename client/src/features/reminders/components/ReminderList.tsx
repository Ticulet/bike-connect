import type { ComponentReminder } from '../api/reminders.api.js';
import { ReminderBadge } from './ReminderBadge.js';
import { useToast } from '../../../components/ui/useToast.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import '../reminders.css';

function BellIcon(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ReminderListProps {
  reminders: ComponentReminder[];
  /** Compact sidebar display — omits dismiss button. */
  compact?: boolean;
  /** Called when a reminder is dismissed. Parent should remove from state. */
  onDismiss?: (componentId: string) => void;
}

// X icon — hand-rolled inline SVG
function XIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ReminderList({ reminders, compact = false, onDismiss }: ReminderListProps): React.JSX.Element {
  const toast = useToast();

  if (reminders.length === 0) {
    return (
      <EmptyState
        icon={<BellIcon />}
        title="No reminders"
        description="No components with maintenance thresholds set."
      />
    );
  }

  function handleDismiss(reminder: ComponentReminder): void {
    toast.success('Reminder dismissed');
    onDismiss?.(reminder.component_id);
  }

  return (
    <ul className="reminder-list" aria-label="Component maintenance reminders">
      {reminders.map((reminder) => (
        <li key={reminder.component_id} className="reminder-list__row">
          <ReminderBadge reminder={reminder} compact={compact} />
          <div className="reminder-list__detail">
            <p className="reminder-list__title">{reminder.component_name}</p>
            <p className="reminder-list__meta">
              {reminder.component_category}
              {reminder.km_since_last_service !== null && ` · ${reminder.km_since_last_service} km since last service`}
            </p>
          </div>
          {!compact && onDismiss !== undefined && (
            <button
              type="button"
              className="reminder-list__dismiss"
              onClick={() => handleDismiss(reminder)}
              aria-label={`Dismiss reminder: ${reminder.component_name}`}
            >
              <XIcon />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
