import { db } from '../../db/index.js';
import type { BikeComponent, NewBikeComponent, BikeComponentUpdate } from '../../db/types.js';

export const componentsRepository = {
  async findByBikeId(bikeId: string): Promise<BikeComponent[]> {
    return db
      .selectFrom('bike_components')
      .selectAll()
      .where('bike_id', '=', bikeId)
      .execute();
  },

  async findById(componentId: string): Promise<BikeComponent | undefined> {
    return db
      .selectFrom('bike_components')
      .selectAll()
      .where('id', '=', componentId)
      .executeTakeFirst();
  },

  async create(data: NewBikeComponent): Promise<BikeComponent> {
    return db
      .insertInto('bike_components')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async update(componentId: string, data: BikeComponentUpdate): Promise<BikeComponent | undefined> {
    return db
      .updateTable('bike_components')
      .set(data)
      .where('id', '=', componentId)
      .returningAll()
      .executeTakeFirst();
  },

  async deleteById(componentId: string): Promise<void> {
    await db.deleteFrom('bike_components').where('id', '=', componentId).execute();
  },
};
