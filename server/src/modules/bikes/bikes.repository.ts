import { sql } from 'kysely';
import { db } from '../../db/index.js';
import type { Bike, NewBike, BikeUpdate } from '../../db/types.js';

export const bikesRepository = {
  async findByUserId(userId: string): Promise<Bike[]> {
    return db
      .selectFrom('bikes')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  },

  async findById(id: string): Promise<Bike | undefined> {
    return db
      .selectFrom('bikes')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  },

  async create(data: NewBike): Promise<Bike> {
    return db
      .insertInto('bikes')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async update(id: string, data: BikeUpdate): Promise<Bike | undefined> {
    return db
      .updateTable('bikes')
      .set({ ...data, updated_at: sql`now()` })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  },

  async deleteById(id: string): Promise<void> {
    await db.deleteFrom('bikes').where('id', '=', id).execute();
  },
};
