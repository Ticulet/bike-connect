import { db } from '../../db/index.js';
import { decodeCursor, paginateResults } from '../../lib/pagination.js';
import type { PaginatedResult } from '../../lib/pagination.js';
import type { PostWithAuthor } from '../posts/posts.repository.js';

export const feedService = {
  async getFeed(userId: string, cursor?: string, limit: number = 20): Promise<PaginatedResult<PostWithAuthor>> {
    let query = db
      .selectFrom('posts')
      .innerJoin('users', 'users.id', 'posts.author_id')
      .selectAll('posts')
      .select([
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .where('posts.status', '=', 'published')
      .where('posts.author_id', 'in',
        db
          .selectFrom('follows')
          .select('following_id')
          .where('follower_id', '=', userId),
      );

    if (cursor) {
      const decoded = decodeCursor(cursor);
      query = query.where((eb) =>
        eb.or([
          eb('posts.published_at', '<', new Date(decoded.published_at)),
          eb.and([
            eb('posts.published_at', '=', new Date(decoded.published_at)),
            eb('posts.id', '<', decoded.id),
          ]),
        ]),
      );
    }

    const rows = await query
      .orderBy('posts.published_at', 'desc')
      .orderBy('posts.id', 'desc')
      .limit(limit + 1)
      .execute();

    return paginateResults(rows, limit);
  },
};
