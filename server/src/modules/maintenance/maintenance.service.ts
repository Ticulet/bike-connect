import { bikesRepository } from '../bikes/bikes.repository.js';
import { componentsRepository } from '../bikes/components.repository.js';
import { maintenanceRepository } from './maintenance.repository.js';
import { ApiError } from '../../lib/api-error.js';
import type { MaintenanceLog } from '../../db/types.js';
import type { MaintenanceLogWithComponent } from './maintenance.repository.js';
import type { z } from 'zod';
import type { createMaintenanceLogSchema, updateMaintenanceLogSchema } from '@bike-connect/shared';

type CreateMaintenanceLogData = z.infer<typeof createMaintenanceLogSchema>;
type UpdateMaintenanceLogData = z.infer<typeof updateMaintenanceLogSchema>;

async function assertBikeOwnership(bikeId: string, userId: string): Promise<void> {
  const bike = await bikesRepository.findById(bikeId);
  if (!bike) throw ApiError.notFound('Bike');
  if (bike.user_id !== userId) throw ApiError.forbidden();
}

async function assertComponentBelongsToBike(componentId: string, bikeId: string): Promise<void> {
  const component = await componentsRepository.findById(componentId);
  if (!component || component.bike_id !== bikeId) {
    throw ApiError.badRequest('Component does not belong to this bike');
  }
}

export const maintenanceService = {
  async listLogs(bikeId: string, userId: string): Promise<MaintenanceLogWithComponent[]> {
    await assertBikeOwnership(bikeId, userId);
    return maintenanceRepository.findByBikeId(bikeId);
  },

  async createLog(
    bikeId: string,
    userId: string,
    data: CreateMaintenanceLogData,
  ): Promise<MaintenanceLog> {
    await assertBikeOwnership(bikeId, userId);

    if (data.component_id) {
      await assertComponentBelongsToBike(data.component_id, bikeId);
    }

    return maintenanceRepository.create({
      bike_id: bikeId,
      component_id: data.component_id ?? null,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      cost: data.cost ?? null,
      mileage_at_service: data.mileage_at_service ?? null,
      performed_at: data.performed_at,
    });
  },

  async updateLog(
    bikeId: string,
    userId: string,
    logId: string,
    data: UpdateMaintenanceLogData,
  ): Promise<MaintenanceLog> {
    await assertBikeOwnership(bikeId, userId);

    const log = await maintenanceRepository.findById(logId);
    if (!log) throw ApiError.notFound('Maintenance log');
    if (log.bike_id !== bikeId) throw ApiError.notFound('Maintenance log');

    if (data.component_id) {
      await assertComponentBelongsToBike(data.component_id, bikeId);
    }

    const updated = await maintenanceRepository.update(logId, data);
    if (!updated) throw ApiError.notFound('Maintenance log');

    return updated;
  },

  async deleteLog(bikeId: string, userId: string, logId: string): Promise<void> {
    await assertBikeOwnership(bikeId, userId);

    const log = await maintenanceRepository.findById(logId);
    if (!log) throw ApiError.notFound('Maintenance log');
    if (log.bike_id !== bikeId) throw ApiError.notFound('Maintenance log');

    await maintenanceRepository.deleteById(logId);
  },
};
