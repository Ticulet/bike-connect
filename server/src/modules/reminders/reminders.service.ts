import { db } from '../../db/index.js';
import { bikesRepository } from '../bikes/bikes.repository.js';
import { ApiError } from '../../lib/api-error.js';
import { DEFAULT_THRESHOLDS } from './reminder-thresholds.js';
import type { ComponentThreshold } from './reminder-thresholds.js';

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
}

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

    const totalMileageKm = Number(bike.total_mileage_km);
    const now = new Date();

    // Batch-fetch the most recent maintenance log per component (avoids N+1).
    // Uses DISTINCT ON with a stable ordering so we get exactly one row per component.
    const componentIds = components.map((c) => c.id);
    const lastLogs = componentIds.length === 0
      ? []
      : await db
          .selectFrom('maintenance_logs')
          .distinctOn('component_id')
          .selectAll()
          .where('component_id', 'in', componentIds)
          .orderBy('component_id')
          .orderBy('performed_at', 'desc')
          .execute();
    const lastLogByComponentId = new Map(
      lastLogs
        .filter((l): l is typeof l & { component_id: string } => l.component_id !== null)
        .map((l) => [l.component_id, l]),
    );

    const reminders: ComponentReminder[] = components.map((component) => {
        const lastLog = lastLogByComponentId.get(component.id);

        const threshold = DEFAULT_THRESHOLDS[component.category] ?? null;

        if (!threshold) {
          return {
            component_id: component.id,
            component_category: component.category,
            component_name: component.name,
            status: 'no_threshold' as ReminderStatus,
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
            status: 'no_service_yet' as ReminderStatus,
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
      });

    return reminders;
  },
};
