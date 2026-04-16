import { likesRepository } from './likes.repository.js';
import { postsRepository } from '../posts/posts.repository.js';
import { ApiError } from '../../lib/api-error.js';

export const likesService = {
  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; count: number }> {
    const post = await postsRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post');

    return likesRepository.toggle(userId, postId);
  },

  async getInfo(postId: string, userId?: string): Promise<{ count: number; is_liked: boolean }> {
    const count = await likesRepository.countForPost(postId);
    const is_liked = userId ? await likesRepository.isLikedByUser(userId, postId) : false;
    return { count, is_liked };
  },
};
