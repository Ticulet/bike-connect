import { sql } from 'kysely';
import { db } from '../../db/index.js';
import type { User } from '../../db/types.js';

export const usersRepository = {
  async findById(id: string): Promise<User | undefined> {
    return db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
  },

  async findByGoogleId(googleId: string): Promise<User | undefined> {
    return db.selectFrom('users').selectAll().where('google_id', '=', googleId).executeTakeFirst();
  },

  async upsertByGoogleId(profile: {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  }): Promise<User> {
    return db
      .insertInto('users')
      .values({
        google_id: profile.googleId,
        email: profile.email,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
      })
      .onConflict((oc) =>
        oc.column('google_id').doUpdateSet({
          display_name: profile.displayName,
          avatar_url: profile.avatarUrl,
          updated_at: sql`now()`,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  },
};
