import { sql } from 'kysely';
import { db } from '../../db/index.js';
import { ApiError } from '../../lib/api-error.js';
import type { Bike, NewBike, BikeUpdate, BikeType } from '../../db/types.js';

export interface BikeWithOwner extends Bike {
  owner_display_name: string;
  owner_avatar_url: string | null;
}

export interface BikeWithStats extends Bike {
  /** Number of registered components on the bike. */
  component_count: number;
  /** Date (YYYY-MM-DD) of the most recent ride, or null if none. */
  last_ride_at: string | null;
}

interface ExploreBikeCursor {
  created_at: string;
  id: string;
}

function decodeBikeCursor(encoded: string): ExploreBikeCursor {
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    return JSON.parse(json) as ExploreBikeCursor;
  } catch {
    throw ApiError.badRequest('Invalid pagination cursor');
  }
}

export const bikesRepository = {
  async findByUserId(userId: string): Promise<BikeWithStats[]> {
    // Enrich each bike with the stats the workshop card shows. Correlated
    // subqueries (not joins) avoid a components×rides cross product; ::int and
    // ::text give deterministic number / 'YYYY-MM-DD' types over the wire.
    return db
      .selectFrom('bikes')
      .selectAll()
      .select([
        sql<number>`(select count(*)::int from bike_components where bike_components.bike_id = bikes.id)`.as(
          'component_count',
        ),
        sql<string | null>`(select max(date)::text from rides where rides.bike_id = bikes.id)`.as(
          'last_ride_at',
        ),
      ])
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  },

  async findPublicByUserId(userId: string): Promise<Bike[]> {
    return db
      .selectFrom('bikes')
      .selectAll()
      .where('user_id', '=', userId)
      .where('is_public', '=', true)
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

  async findPublic(params: { cursor?: string; limit: number; type?: BikeType }): Promise<BikeWithOwner[]> {
    let query = db
      .selectFrom('bikes')
      .innerJoin('users', 'users.id', 'bikes.user_id')
      .selectAll('bikes')
      .select([
        'users.display_name as owner_display_name',
        'users.avatar_url as owner_avatar_url',
      ])
      .where('bikes.is_public', '=', true);

    if (params.cursor) {
      const cursor = decodeBikeCursor(params.cursor);
      query = query.where((eb) =>
        eb.or([
          eb('bikes.created_at', '<', new Date(cursor.created_at)),
          eb.and([
            eb('bikes.created_at', '=', new Date(cursor.created_at)),
            eb('bikes.id', '<', cursor.id),
          ]),
        ]),
      );
    }

    if (params.type) {
      query = query.where('bikes.type', '=', params.type);
    }

    return query
      .orderBy('bikes.created_at', 'desc')
      .orderBy('bikes.id', 'desc')
      .limit(params.limit + 1)
      .execute();
  },
};
