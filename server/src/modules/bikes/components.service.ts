import { bikesService } from './bikes.service.js';
import { componentsRepository } from './components.repository.js';
import { ApiError } from '../../lib/api-error.js';
import type { BikeComponent } from '../../db/types.js';
import type { z } from 'zod';
import type { createComponentSchema, updateComponentSchema } from '@bike-connect/shared';

type CreateComponentData = z.infer<typeof createComponentSchema>;
type UpdateComponentData = z.infer<typeof updateComponentSchema>;

export const componentsService = {
  async listComponents(bikeId: string, requesterId?: string): Promise<BikeComponent[]> {
    await bikesService.getBike(bikeId, requesterId);
    return componentsRepository.findByBikeId(bikeId);
  },

  async createComponent(
    bikeId: string,
    userId: string,
    data: CreateComponentData,
  ): Promise<BikeComponent> {
    const bike = await bikesService.getBike(bikeId, userId);
    if (bike.user_id !== userId) throw ApiError.forbidden();

    return componentsRepository.create({
      bike_id: bikeId,
      category: data.category,
      name: data.name,
      brand: data.brand ?? null,
      model: data.model ?? null,
      installed_at: data.installed_at ?? null,
      mileage_at_install: data.mileage_at_install ?? null,
      notes: data.notes ?? null,
    });
  },

  async updateComponent(
    bikeId: string,
    userId: string,
    componentId: string,
    data: UpdateComponentData,
  ): Promise<BikeComponent> {
    const bike = await bikesService.getBike(bikeId, userId);
    if (bike.user_id !== userId) throw ApiError.forbidden();

    const component = await componentsRepository.findById(componentId);
    if (!component) throw ApiError.notFound('Component');
    if (component.bike_id !== bikeId) throw ApiError.notFound('Component');

    const updated = await componentsRepository.update(componentId, data);
    if (!updated) throw ApiError.notFound('Component');

    return updated;
  },

  async deleteComponent(bikeId: string, userId: string, componentId: string): Promise<void> {
    const bike = await bikesService.getBike(bikeId, userId);
    if (bike.user_id !== userId) throw ApiError.forbidden();

    const component = await componentsRepository.findById(componentId);
    if (!component) throw ApiError.notFound('Component');
    if (component.bike_id !== bikeId) throw ApiError.notFound('Component');

    await componentsRepository.deleteById(componentId);
  },
};
