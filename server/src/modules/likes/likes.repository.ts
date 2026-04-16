import { db } from '../../db/index.js';

export const likesRepository = {
  async toggle(userId: string, postId: string): Promise<{ liked: boolean; count: number }> {
    return db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom('likes')
        .select('user_id')
        .where('user_id', '=', userId)
        .where('post_id', '=', postId)
        .executeTakeFirst();

      if (existing) {
        await trx
          .deleteFrom('likes')
          .where('user_id', '=', userId)
          .where('post_id', '=', postId)
          .execute();
      } else {
        await trx
          .insertInto('likes')
          .values({ user_id: userId, post_id: postId })
          .execute();
      }

      const countRow = await trx
        .selectFrom('likes')
        .where('post_id', '=', postId)
        .select((eb) => eb.fn.countAll<string>().as('count'))
        .executeTakeFirstOrThrow();

      return { liked: !existing, count: parseInt(countRow.count, 10) };
    });
  },

  async countForPost(postId: string): Promise<number> {
    const row = await db
      .selectFrom('likes')
      .where('post_id', '=', postId)
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .executeTakeFirstOrThrow();
    return parseInt(row.count, 10);
  },

  async isLikedByUser(userId: string, postId: string): Promise<boolean> {
    const row = await db
      .selectFrom('likes')
      .select('user_id')
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .executeTakeFirst();
    return row !== undefined;
  },
};
