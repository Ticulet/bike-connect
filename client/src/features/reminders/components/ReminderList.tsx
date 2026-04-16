import type { ComponentReminder } from '../api/reminders.api.js';
import { ReminderBadge } from './ReminderBadge.js';
import '../reminders.css';

interface ReminderListProps {
  reminders: ComponentReminder[];
}

export function ReminderList({ reminders }: ReminderListProps): React.JSX.Element {
  if (reminders.length === 0) {
    return (
      <p className="reminder-list__empty">
        No components with maintenance thresholds set.
      </p>
    );
  }

  return (
    <div className="reminder-list" role="list" aria-label="Component maintenance reminders">
      <div className="reminder-list__items">
        {reminders.map((reminder) => (
          <div
            key={reminder.component_id}
            className="reminder-item"
            role="listitem"
          >
            <div className="reminder-item__info">
              <span className="reminder-item__name">{reminder.component_name}</span>
              <span className="reminder-item__category">{reminder.component_category}</span>
              {reminder.km_since_last_service !== null && (
                <span className="reminder-item__detail">
                  {reminder.km_since_last_service} km since last service
                </span>
              )}
            </div>
            <div className="reminder-item__badge-col">
              <ReminderBadge reminder={reminder} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
