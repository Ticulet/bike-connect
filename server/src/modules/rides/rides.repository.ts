import { db } from '../../db/index.js';
import type { Ride, NewRide, RideUpdate } from '../../db/types.js';

export const ridesRepository = {
  async findByBikeId(bikeId: string, limit = 50): Promise<Ride[]> {
    return db
      .selectFrom('rides')
      .selectAll()
      .where('bike_id', '=', bikeId)
      .orderBy('date', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
  },

  async findById(rideId: string): Promise<Ride | undefined> {
    return db.selectFrom('rides').selectAll().where('id', '=', rideId).executeTakeFirst();
  },

  async create(data: NewRide): Promise<Ride> {
    return db.insertInto('rides').values(data).returningAll().executeTakeFirstOrThrow();
  },

  async update(rideId: string, data: RideUpdate): Promise<Ride | undefined> {
    return db.updateTable('rides').set(data).where('id', '=', rideId).returningAll().executeTakeFirst();
  },

  async deleteById(rideId: string): Promise<void> {
    await db.deleteFrom('rides').where('id', '=', rideId).execute();
  },

  async sumDistanceForBike(bikeId: string): Promise<string> {
    const result = await db
      .selectFrom('rides')
      .select(db.fn.sum<string>('distance_km').as('sum'))
      .where('bike_id', '=', bikeId)
      .executeTakeFirst();
    return result?.sum ?? '0';
  },

  async countForBike(bikeId: string): Promise<number> {
    const result = await db
      .selectFrom('rides')
      .select(db.fn.countAll<number>().as('count'))
      .where('bike_id', '=', bikeId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  },
};
