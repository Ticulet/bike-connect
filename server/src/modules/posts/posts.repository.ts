import { db } from '../../db/index.js';
import { decodeCursor } from '../../lib/pagination.js';
import type { NewPost, Post, PostUpdate, Tag } from '../../db/types.js';

export interface PostWithAuthor extends Post {
  author_display_name: string;
  author_avatar_url: string | null;
}

export interface PostWithDetails extends PostWithAuthor {
  tags: Tag[];
}

export interface FindPublishedParams {
  cursor?: string;
  limit: number;
  category?: Post['category'];
  tagSlug?: string;
}

export const postsRepository = {
  async findPublished(params: FindPublishedParams): Promise<PostWithAuthor[]> {
    let query = db
      .selectFrom('posts')
      .innerJoin('users', 'users.id', 'posts.author_id')
      .selectAll('posts')
      .select([
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .where('posts.status', '=', 'published');

    if (params.cursor) {
      const cursor = decodeCursor(params.cursor);
      query = query.where((eb) =>
        eb.or([
          eb('posts.published_at', '<', new Date(cursor.published_at)),
          eb.and([
            eb('posts.published_at', '=', new Date(cursor.published_at)),
            eb('posts.id', '<', cursor.id),
          ]),
        ]),
      );
    }

    if (params.category) {
      query = query.where('posts.category', '=', params.category);
    }

    if (params.tagSlug) {
      query = query.where('posts.id', 'in',
        db.selectFrom('post_tags')
          .innerJoin('tags', 'tags.id', 'post_tags.tag_id')
          .where('tags.slug', '=', params.tagSlug)
          .select('post_tags.post_id'),
      );
    }

    return query
      .orderBy('posts.published_at', 'desc')
      .orderBy('posts.id', 'desc')
      .limit(params.limit + 1)
      .execute();
  },

  async findBySlug(slug: string): Promise<PostWithDetails | undefined> {
    const post = await db
      .selectFrom('posts')
      .innerJoin('users', 'users.id', 'posts.author_id')
      .selectAll('posts')
      .select([
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .where('posts.slug', '=', slug)
      .executeTakeFirst();

    if (!post) return undefined;

    const tags = await db
      .selectFrom('tags')
      .innerJoin('post_tags', 'post_tags.tag_id', 'tags.id')
      .selectAll('tags')
      .where('post_tags.post_id', '=', post.id)
      .execute();

    return { ...post, tags };
  },

  async findByIdWithDetails(id: string): Promise<PostWithDetails | undefined> {
    const post = await db
      .selectFrom('posts')
      .innerJoin('users', 'users.id', 'posts.author_id')
      .selectAll('posts')
      .select([
        'users.display_name as author_display_name',
        'users.avatar_url as author_avatar_url',
      ])
      .where('posts.id', '=', id)
      .executeTakeFirst();

    if (!post) return undefined;

    const tags = await db
      .selectFrom('tags')
      .innerJoin('post_tags', 'post_tags.tag_id', 'tags.id')
      .selectAll('tags')
      .where('post_tags.post_id', '=', post.id)
      .execute();

    return { ...post, tags };
  },

  async findByAuthor(authorId: string, limit = 20): Promise<Post[]> {
    return db
      .selectFrom('posts')
      .selectAll()
      .where('author_id', '=', authorId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
  },

  async create(post: NewPost, tagIds?: number[]): Promise<Post> {
    return db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('posts')
        .values(post)
        .returningAll()
        .executeTakeFirstOrThrow();

      if (tagIds && tagIds.length > 0) {
        await trx
          .insertInto('post_tags')
          .values(tagIds.map((tag_id) => ({ post_id: created.id, tag_id })))
          .execute();
      }

      return created;
    });
  },

  async update(id: string, data: PostUpdate, expectedUpdatedAt: string, tagIds?: number[]): Promise<Post | undefined> {
    return db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable('posts')
        .set(data)
        .where('id', '=', id)
        .where('updated_at', '=', new Date(expectedUpdatedAt))
        .returningAll()
        .executeTakeFirst();

      if (updated && tagIds !== undefined) {
        await trx.deleteFrom('post_tags').where('post_id', '=', id).execute();
        if (tagIds.length > 0) {
          await trx
            .insertInto('post_tags')
            .values(tagIds.map((tag_id) => ({ post_id: id, tag_id })))
            .execute();
        }
      }

      return updated;
    });
  },

  async deleteById(id: string): Promise<void> {
    await db.deleteFrom('posts').where('id', '=', id).execute();
  },

  async findSlugExists(slug: string): Promise<boolean> {
    const row = await db
      .selectFrom('posts')
      .select('id')
      .where('slug', '=', slug)
      .executeTakeFirst();
    return row !== undefined;
  },

  async findById(id: string): Promise<Post | undefined> {
    return db.selectFrom('posts').selectAll().where('id', '=', id).executeTakeFirst();
  },
};
