import { db } from '../../db/index.js';
import type { Post } from '../../db/types.js';

export interface BookmarkedPost {
  id: string;
  bookmarked_at: Date;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: Post['category'];
  published_at: Date | null;
  author_display_name: string;
  author_avatar_url: string | null;
}

export const bookmarksRepository = {
  async toggle(userId: string, postId: string): Promise<boolean> {
    return db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom('bookmarks')
        .select('user_id')
        .where('user_id', '=', userId)
        .where('post_id', '=', postId)
        .executeTakeFirst();

      if (existing) {
        await trx
          .deleteFrom('bookmarks')
          .where('user_id', '=', userId)
          .where('post_id', '=', postId)
          .execute();
        return false;
      }

      await trx
        .insertInto('bookmarks')
        .values({ user_id: userId, post_id: postId })
        .execute();
      return true;
    });
  },

  async isBookmarkedByUser(userId: string, postId: string): Promise<boolean> {
    const row = await db
      .selectFrom('bookmarks')
      .select('user_id')
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .executeTakeFirst();
    return row !== undefined;
  },

  async listByUser(userId: string): Promise<BookmarkedPost[]> {
    return db
      .selectFrom('bookmarks')
      .innerJoin('posts', 'posts.id', 'bookmarks.post_id')
      .innerJoin('users', 'users.id', 'posts.author_id')
      .where('bookmarks.user_id', '=', userId)
      .select([
        'posts.id',
        'bookmarks.created_at as bookmarked_at',
        'posts.author_id',
        'posts.title',
        'posts.slug',
        'posts.excerpt',
        'posts.cover_image_url',
        'posts.category',
        'posts.published_at',
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .orderBy('bookmarks.created_at', 'desc')
      .execute();
  },
};
