import { db } from '../../db/index.js';

export interface PublicUserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
}

export const followsRepository = {
  async toggle(followerId: string, followingId: string): Promise<boolean> {
    return db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom('follows')
        .select('follower_id')
        .where('follower_id', '=', followerId)
        .where('following_id', '=', followingId)
        .executeTakeFirst();

      if (existing) {
        await trx
          .deleteFrom('follows')
          .where('follower_id', '=', followerId)
          .where('following_id', '=', followingId)
          .execute();
        return false;
      }

      await trx
        .insertInto('follows')
        .values({ follower_id: followerId, following_id: followingId })
        .execute();
      return true;
    });
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const row = await db
      .selectFrom('follows')
      .select('follower_id')
      .where('follower_id', '=', followerId)
      .where('following_id', '=', followingId)
      .executeTakeFirst();
    return row !== undefined;
  },

  async countFollowers(userId: string): Promise<number> {
    const result = await db
      .selectFrom('follows')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('following_id', '=', userId)
      .executeTakeFirstOrThrow();
    return parseInt(result.count, 10);
  },

  async countFollowing(userId: string): Promise<number> {
    const result = await db
      .selectFrom('follows')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('follower_id', '=', userId)
      .executeTakeFirstOrThrow();
    return parseInt(result.count, 10);
  },

  async listFollowers(userId: string): Promise<PublicUserProfile[]> {
    return db
      .selectFrom('users')
      .innerJoin('follows', 'users.id', 'follows.follower_id')
      .select([
        'users.id',
        'users.display_name',
        'users.avatar_url',
        'users.bio',
        'users.created_at',
      ])
      .where('follows.following_id', '=', userId)
      .execute();
  },

  async listFollowing(userId: string): Promise<PublicUserProfile[]> {
    return db
      .selectFrom('users')
      .innerJoin('follows', 'users.id', 'follows.following_id')
      .select([
        'users.id',
        'users.display_name',
        'users.avatar_url',
        'users.bio',
        'users.created_at',
      ])
      .where('follows.follower_id', '=', userId)
      .execute();
  },
};
