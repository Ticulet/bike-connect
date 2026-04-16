import type { ComponentReminder, ReminderStatus } from '../api/reminders.api.js';
import '../reminders.css';

interface ReminderBadgeProps {
  reminder: ComponentReminder;
}

const STATUS_LABELS: Record<ReminderStatus, string> = {
  ok: 'OK',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  no_threshold: 'No Threshold',
  no_service_yet: 'No Service Yet',
};

function buildTooltip(reminder: ComponentReminder): string {
  const parts: string[] = [];

  if (reminder.km_since_last_service !== null) {
    parts.push(`${reminder.km_since_last_service} km since last service`);
  }

  if (reminder.days_since_last_service !== null) {
    parts.push(`${reminder.days_since_last_service} days since last service`);
  }

  if (reminder.threshold !== null) {
    parts.push(`Threshold: ${reminder.threshold.km} km / ${reminder.threshold.months} months`);
  }

  if (reminder.last_service_date !== null) {
    const date = new Date(reminder.last_service_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    parts.push(`Last serviced: ${date}`);
  }

  return parts.length > 0 ? parts.join(' · ') : STATUS_LABELS[reminder.status];
}

export function ReminderBadge({ reminder }: ReminderBadgeProps): React.JSX.Element {
  const label = STATUS_LABELS[reminder.status];
  const tooltip = buildTooltip(reminder);

  return (
    <span
      className={`reminder-badge reminder-badge--${reminder.status}`}
      title={tooltip}
      aria-label={`${reminder.component_name}: ${label}${tooltip !== label ? ` — ${tooltip}` : ''}`}
    >
      <span className="reminder-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
