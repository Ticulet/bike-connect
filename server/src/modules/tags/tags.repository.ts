import { sql } from 'kysely';
import { db } from '../../db/index.js';
import type { Tag } from '../../db/types.js';

export const tagsRepository = {
  async findAll(search?: string): Promise<Tag[]> {
    let query = db.selectFrom('tags').selectAll();

    if (search) {
      query = query.where(sql<boolean>`name ILIKE ${'%' + search + '%'}`);
    }

    return query.orderBy('name', 'asc').execute();
  },

  async findBySlug(slug: string): Promise<Tag | undefined> {
    return db.selectFrom('tags').selectAll().where('slug', '=', slug).executeTakeFirst();
  },

  async findByIds(ids: number[]): Promise<Tag[]> {
    if (ids.length === 0) return [];
    return db.selectFrom('tags').selectAll().where('id', 'in', ids).execute();
  },

  async findOrCreate(name: string, slug: string): Promise<Tag> {
    await db
      .insertInto('tags')
      .values({ name, slug })
      .onConflict((oc) => oc.column('slug').doNothing())
      .execute();

    return db
      .selectFrom('tags')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirstOrThrow();
  },
};
