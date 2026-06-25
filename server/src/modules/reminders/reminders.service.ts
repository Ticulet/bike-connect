import { db } from '../../db/index.js';
import { bikesRepository } from '../bikes/bikes.repository.js';
import { ApiError } from '../../lib/api-error.js';
import { DEFAULT_THRESHOLDS } from './reminder-thresholds.js';
import type { ComponentThreshold } from './reminder-thresholds.js';
import type { BikeComponent, MaintenanceLog } from '../../db/types.js';

export type ReminderStatus = 'ok' | 'due_soon' | 'overdue' | 'no_threshold' | 'no_service_yet';

export interface ComponentReminder {
  component_id: string;
  component_category: string;
  component_name: string;
  status: ReminderStatus;
  last_service_date: string | null;
  last_service_mileage_km: number | null;
  km_since_last_service: number | null;
  days_since_last_service: number | null;
  threshold: ComponentThreshold | null;
  /** Set only by the cross-bike aggregate (getUserActiveReminders). */
  bike_id?: string;
  bike_name?: string;
}

/**
 * Derive one component's reminder from its most recent maintenance log, the
 * bike's accumulated mileage, and the per-category threshold. Pure, and shared
 * by the per-bike read and the cross-bike (hub) read so the two never diverge.
 */
function computeComponentReminder(
  component: BikeComponent,
  lastLog: MaintenanceLog | undefined,
  totalMileageKm: number,
  now: Date,
): ComponentReminder {
  const threshold = DEFAULT_THRESHOLDS[component.category] ?? null;

  if (!threshold) {
    return {
      component_id: component.id,
      component_category: component.category,
      component_name: component.name,
      status: 'no_threshold',
      last_service_date: lastLog?.performed_at ?? null,
      last_service_mileage_km: lastLog?.mileage_at_service ?? null,
      km_since_last_service: null,
      days_since_last_service: null,
      threshold: null,
    };
  }

  if (!lastLog) {
    return {
      component_id: component.id,
      component_category: component.category,
      component_name: component.name,
      status: 'no_service_yet',
      last_service_date: null,
      last_service_mileage_km: null,
      km_since_last_service: null,
      days_since_last_service: null,
      threshold,
    };
  }

  const km_since =
    lastLog.mileage_at_service !== null
      ? totalMileageKm - Number(lastLog.mileage_at_service)
      : null;

  const lastServiceDate = new Date(lastLog.performed_at);
  const days_since = Math.floor(
    (now.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const months_since = days_since / 30.44;

  const kmRatio = km_since !== null ? km_since / threshold.km : 0;
  const monthRatio = months_since / threshold.months;
  const worstRatio = Math.max(kmRatio, monthRatio);

  let status: ReminderStatus = 'ok';
  if (worstRatio >= 1) status = 'overdue';
  else if (worstRatio >= 0.9) status = 'due_soon';

  return {
    component_id: component.id,
    component_category: component.category,
    component_name: component.name,
    status,
    last_service_date: lastLog.performed_at,
    last_service_mileage_km: lastLog.mileage_at_service,
    km_since_last_service: km_since,
    days_since_last_service: days_since,
    threshold,
  };
}

/**
 * Most-recent maintenance log per component, in a single DISTINCT ON query.
 * Returns an empty map for an empty id list (avoids an invalid `IN ()`).
 */
async function loadLastLogs(componentIds: string[]): Promise<Map<string, MaintenanceLog>> {
  if (componentIds.length === 0) return new Map();
  const lastLogs = await db
    .selectFrom('maintenance_logs')
    .distinctOn('component_id')
    .selectAll()
    .where('component_id', 'in', componentIds)
    .orderBy('component_id')
    .orderBy('performed_at', 'desc')
    .execute();
  return new Map(
    lastLogs
      .filter((l): l is typeof l & { component_id: string } => l.component_id !== null)
      .map((l) => [l.component_id, l]),
  );
}

const severityRank: Record<ReminderStatus, number> = {
  overdue: 0,
  due_soon: 1,
  no_service_yet: 2,
  no_threshold: 3,
  ok: 4,
};

export const remindersService = {
  async getBikeReminders(bikeId: string, userId: string): Promise<ComponentReminder[]> {
    const bike = await bikesRepository.findById(bikeId);
    if (!bike) throw ApiError.notFound('Bike');
    if (bike.user_id !== userId) throw ApiError.forbidden();

    const components = await db
      .selectFrom('bike_components')
      .selectAll()
      .where('bike_id', '=', bikeId)
      .execute();

    const lastLogByComponentId = await loadLastLogs(components.map((c) => c.id));
    const totalMileageKm = Number(bike.total_mileage_km);
    const now = new Date();

    return components.map((component) =>
      computeComponentReminder(
        component,
        lastLogByComponentId.get(component.id),
        totalMileageKm,
        now,
      ),
    );
  },

  /**
   * Active (due-soon or overdue) reminders across every bike the user owns,
   * each tagged with its bike, most-urgent first. Powers the /me hub panel.
   */
  async getUserActiveReminders(userId: string): Promise<ComponentReminder[]> {
    const bikes = await bikesRepository.findByUserId(userId);
    if (bikes.length === 0) return [];

    const components = await db
      .selectFrom('bike_components')
      .selectAll()
      .where(
        'bike_id',
        'in',
        bikes.map((b) => b.id),
      )
      .execute();
    if (components.length === 0) return [];

    const lastLogByComponentId = await loadLastLogs(components.map((c) => c.id));
    const bikeById = new Map(bikes.map((b) => [b.id, b]));
    const now = new Date();

    const active = components
      .map((component) => {
        const bike = bikeById.get(component.bike_id);
        const reminder = computeComponentReminder(
          component,
          lastLogByComponentId.get(component.id),
          bike ? Number(bike.total_mileage_km) : 0,
          now,
        );
        return { ...reminder, bike_id: component.bike_id, bike_name: bike?.name ?? '' };
      })
      .filter((r) => r.status === 'overdue' || r.status === 'due_soon');

    active.sort((first, second) => {
      const bySeverity = severityRank[first.status] - severityRank[second.status];
      if (bySeverity !== 0) return bySeverity;
      return (second.days_since_last_service ?? 0) - (first.days_since_last_service ?? 0);
    });

    return active;
  },
};
