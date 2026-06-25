import type { Transaction } from 'kysely';
import { db } from '../../db/index.js';
import { bikesRepository } from '../bikes/bikes.repository.js';
import { ridesRepository } from './rides.repository.js';
import { ApiError } from '../../lib/api-error.js';
import { currentMonthRange } from '../../lib/month-range.js';
import type { Database, Ride } from '../../db/types.js';
import type { CreateRide, UpdateRide } from '@bike-connect/shared';

async function assertBikeOwnership(bikeId: string, userId: string) {
  const bike = await bikesRepository.findById(bikeId);
  if (!bike) throw ApiError.notFound('Bike');
  if (bike.user_id !== userId) throw ApiError.forbidden();
  return bike;
}

async function recalcMileage(trx: Transaction<Database>, bikeId: string): Promise<void> {
  const sumResult = await trx
    .selectFrom('rides')
    .select(trx.fn.sum<string>('distance_km').as('sum'))
    .where('bike_id', '=', bikeId)
    .executeTakeFirst();
  const sum = sumResult?.sum ?? '0';
  await trx.updateTable('bikes').set({ total_mileage_km: sum }).where('id', '=', bikeId).execute();
}

export const ridesService = {
  async listRides(bikeId: string, userId: string): Promise<Ride[]> {
    await assertBikeOwnership(bikeId, userId);
    return ridesRepository.findByBikeId(bikeId);
  },

  async createRide(bikeId: string, userId: string, data: CreateRide): Promise<Ride> {
    await assertBikeOwnership(bikeId, userId);
    return db.transaction().execute(async (trx) => {
      const ride = await trx
        .insertInto('rides')
        .values({
          bike_id: bikeId,
          user_id: userId,
          distance_km: data.distance_km,
          duration_min: data.duration_min ?? null,
          date: data.date,
          notes: data.notes ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await recalcMileage(trx, bikeId);
      return ride;
    });
  },

  async updateRide(bikeId: string, userId: string, rideId: string, data: UpdateRide): Promise<Ride> {
    await assertBikeOwnership(bikeId, userId);
    const existing = await ridesRepository.findById(rideId);
    if (!existing) throw ApiError.notFound('Ride');
    if (existing.bike_id !== bikeId) throw ApiError.notFound('Ride');

    return db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable('rides')
        .set({
          ...(data.distance_km !== undefined ? { distance_km: data.distance_km } : {}),
          ...(data.duration_min !== undefined ? { duration_min: data.duration_min } : {}),
          ...(data.date !== undefined ? { date: data.date } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        })
        .where('id', '=', rideId)
        .returningAll()
        .executeTakeFirstOrThrow();
      await recalcMileage(trx, bikeId);
      return updated;
    });
  },

  async deleteRide(bikeId: string, userId: string, rideId: string): Promise<void> {
    await assertBikeOwnership(bikeId, userId);
    const existing = await ridesRepository.findById(rideId);
    if (!existing) throw ApiError.notFound('Ride');
    if (existing.bike_id !== bikeId) throw ApiError.notFound('Ride');

    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom('rides').where('id', '=', rideId).execute();
      await recalcMileage(trx, bikeId);
    });
  },

  async getStats(bikeId: string, userId: string): Promise<{ total_distance_km: string; ride_count: number }> {
    await assertBikeOwnership(bikeId, userId);
    const [total_distance_km, ride_count] = await Promise.all([
      ridesRepository.sumDistanceForBike(bikeId),
      ridesRepository.countForBike(bikeId),
    ]);
    return { total_distance_km, ride_count };
  },

  /**
   * Total distance (km) a user has ridden in the current calendar month,
   * summed across all of their bikes. `now` is injectable for testing.
   */
  async getMonthlyDistanceForUser(
    userId: string,
    now: Date = new Date(),
  ): Promise<{ km_this_month: number }> {
    const { start, endExclusive } = currentMonthRange(now);
    const sum = await ridesRepository.sumDistanceForUserInRange(userId, start, endExclusive);
    return { km_this_month: Number(sum) };
  },
};
