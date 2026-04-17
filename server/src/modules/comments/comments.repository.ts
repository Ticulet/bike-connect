import { db } from '../../db/index.js';
import type { Comment, NewComment } from '../../db/types.js';

export interface CommentWithAuthor extends Comment {
  author_display_name: string;
  author_avatar_url: string | null;
}

export const commentsRepository = {
  async findByPostId(postId: string): Promise<CommentWithAuthor[]> {
    return db
      .selectFrom('comments')
      .innerJoin('users', 'users.id', 'comments.user_id')
      .selectAll('comments')
      .select([
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .where('comments.post_id', '=', postId)
      .orderBy('comments.created_at', 'asc')
      .execute();
  },

  async findById(id: string): Promise<Comment | undefined> {
    return db
      .selectFrom('comments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  },

  async findByIdWithAuthor(id: string): Promise<CommentWithAuthor | undefined> {
    return db
      .selectFrom('comments')
      .innerJoin('users', 'users.id', 'comments.user_id')
      .selectAll('comments')
      .select([
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .where('comments.id', '=', id)
      .executeTakeFirst();
  },

  async create(data: NewComment): Promise<CommentWithAuthor> {
    const inserted = await db
      .insertInto('comments')
      .values(data)
      .returning('id')
      .executeTakeFirstOrThrow();
    const row = await db
      .selectFrom('comments')
      .innerJoin('users', 'users.id', 'comments.user_id')
      .selectAll('comments')
      .select([
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .where('comments.id', '=', inserted.id)
      .executeTakeFirstOrThrow();
    return row;
  },

  async update(id: string, content: string): Promise<CommentWithAuthor | undefined> {
    const updated = await db
      .updateTable('comments')
      .set({ content })
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirst();
    if (!updated) return undefined;
    return db
      .selectFrom('comments')
      .innerJoin('users', 'users.id', 'comments.user_id')
      .selectAll('comments')
      .select([
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .where('comments.id', '=', updated.id)
      .executeTakeFirstOrThrow();
  },

  async deleteById(id: string): Promise<void> {
    await db.deleteFrom('comments').where('id', '=', id).execute();
  },
};
