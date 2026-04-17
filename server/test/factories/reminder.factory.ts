import { randomUUID } from 'node:crypto';
import type { ComponentReminder, ReminderStatus } from '../../src/modules/reminders/reminders.service.js';

// Reminders are computed on-demand from components + maintenance_logs; there
// is no `reminders` table. This factory produces the response shape used in
// tests for the reminder list endpoint.
export function makeReminder(overrides: Partial<ComponentReminder> = {}): ComponentReminder {
  const status: ReminderStatus = overrides.status ?? 'ok';
  const candidate: ComponentReminder = {
    component_id: randomUUID(),
    component_category: 'chain',
    component_name: 'Chain',
    status,
    last_service_date: null,
    last_service_mileage_km: null,
    km_since_last_service: null,
    days_since_last_service: null,
    threshold: null,
    ...overrides,
  };
  return candidate;
}
