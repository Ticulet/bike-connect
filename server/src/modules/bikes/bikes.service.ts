import { bikesRepository } from './bikes.repository.js';
import { ApiError } from '../../lib/api-error.js';
import type { Bike } from '../../db/types.js';
import type { CreateBike, UpdateBike } from '@bike-connect/shared';

export const bikesService = {
  async listMyBikes(userId: string): Promise<Bike[]> {
    return bikesRepository.findByUserId(userId);
  },

  async getBike(bikeId: string, requesterId?: string): Promise<Bike> {
    const bike = await bikesRepository.findById(bikeId);
    if (!bike) throw ApiError.notFound('Bike');

    if (!bike.is_public && bike.user_id !== requesterId) {
      throw ApiError.notFound('Bike');
    }

    return bike;
  },

  async createBike(userId: string, data: CreateBike): Promise<Bike> {
    return bikesRepository.create({
      user_id: userId,
      name: data.name,
      brand: data.brand,
      model: data.model,
      year: data.year,
      type: data.type,
      description: data.description ?? null,
      is_public: data.is_public,
    });
  },

  async updateBike(bikeId: string, userId: string, data: UpdateBike): Promise<Bike> {
    const existing = await bikesRepository.findById(bikeId);
    if (!existing) throw ApiError.notFound('Bike');
    if (existing.user_id !== userId) throw ApiError.forbidden();

    const updated = await bikesRepository.update(bikeId, data);

    if (!updated) throw ApiError.notFound('Bike');

    return updated;
  },

  async deleteBike(bikeId: string, userId: string): Promise<void> {
    const existing = await bikesRepository.findById(bikeId);
    if (!existing) throw ApiError.notFound('Bike');
    if (existing.user_id !== userId) throw ApiError.forbidden();

    await bikesRepository.deleteById(bikeId);
  },
};
