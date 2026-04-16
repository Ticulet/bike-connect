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

  async create(data: NewComment): Promise<Comment> {
    return db
      .insertInto('comments')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async update(id: string, content: string): Promise<Comment | undefined> {
    return db
      .updateTable('comments')
      .set({ content })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  },

  async deleteById(id: string): Promise<void> {
    await db.deleteFrom('comments').where('id', '=', id).execute();
  },
};
