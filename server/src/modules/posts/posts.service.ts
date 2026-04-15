import { postsRepository } from './posts.repository.js';
import type { FindPublishedParams, PostWithAuthor, PostWithDetails } from './posts.repository.js';
import { tagsService } from '../tags/tags.service.js';
import { generateSlug } from '../../lib/slug.js';
import { paginateResults } from '../../lib/pagination.js';
import type { PaginatedResult } from '../../lib/pagination.js';
import { ApiError } from '../../lib/api-error.js';
import type { Post, PostUpdate } from '../../db/types.js';
import type { CreatePost, UpdatePost } from '@bike-connect/shared';

export const postsService = {
  async createPost(authorId: string, data: CreatePost): Promise<Post> {
    const { tag_ids, ...postData } = data;

    if (tag_ids && tag_ids.length > 0) {
      await tagsService.ensureTagsExist(tag_ids);
    }

    const baseSlug = generateSlug(postData.title);
    let slug = baseSlug;
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const exists = await postsRepository.findSlugExists(slug);
      if (!exists) break;

      if (attempt === maxAttempts - 1) {
        throw ApiError.conflict('Could not generate a unique slug for this title');
      }
      slug = `${baseSlug}-${attempt + 1}`;
    }

    const publishedAt = postData.status === 'published' ? new Date() : null;

    const newPost = {
      author_id: authorId,
      title: postData.title,
      slug,
      content: postData.content,
      excerpt: postData.excerpt ?? null,
      cover_image_url: postData.cover_image_url ?? null,
      category: postData.category,
      status: postData.status,
      ...(publishedAt ? { published_at: publishedAt } : {}),
    };

    return postsRepository.create(newPost, tag_ids);
  },

  async listPublished(params: FindPublishedParams): Promise<PaginatedResult<PostWithAuthor>> {
    const rows = await postsRepository.findPublished(params);
    return paginateResults(rows, params.limit);
  },

  async getPostBySlug(slug: string): Promise<PostWithDetails> {
    const post = await postsRepository.findBySlug(slug);
    if (!post) throw ApiError.notFound('Post');
    return post;
  },

  async listMyPosts(authorId: string): Promise<Post[]> {
    return postsRepository.findByAuthor(authorId);
  },

  async getPostById(postId: string, userId: string): Promise<PostWithDetails> {
    const post = await postsRepository.findByIdWithDetails(postId);
    if (!post) throw ApiError.notFound('Post');
    if (post.author_id !== userId) throw ApiError.forbidden();
    return post;
  },

  async updatePost(
    postId: string,
    userId: string,
    data: UpdatePost,
    expectedUpdatedAt: string,
  ): Promise<Post> {
    const existing = await postsRepository.findById(postId);
    if (!existing) throw ApiError.notFound('Post');
    if (existing.author_id !== userId) throw ApiError.forbidden();

    const { tag_ids, ...postData } = data;

    if (tag_ids && tag_ids.length > 0) {
      await tagsService.ensureTagsExist(tag_ids);
    }

    const update: PostUpdate = {
      ...postData,
      updated_at: new Date().toISOString(),
    };

    // Set published_at on first publish
    if (postData.status === 'published' && existing.status !== 'published') {
      update.published_at = new Date();
    }

    const updated = await postsRepository.update(postId, update, expectedUpdatedAt, tag_ids);

    if (!updated) {
      throw ApiError.conflict('Post was modified by another request. Please retry with the latest version.');
    }

    return updated;
  },

  async deletePost(postId: string, userId: string): Promise<void> {
    const existing = await postsRepository.findById(postId);
    if (!existing) throw ApiError.notFound('Post');
    if (existing.author_id !== userId) throw ApiError.forbidden();

    await postsRepository.deleteById(postId);
  },
};
