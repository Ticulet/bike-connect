import { bookmarksRepository } from './bookmarks.repository.js';
import type { BookmarkedPost } from './bookmarks.repository.js';
import { postsRepository } from '../posts/posts.repository.js';
import { ApiError } from '../../lib/api-error.js';

export const bookmarksService = {
  async toggleBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
    const post = await postsRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post');

    const bookmarked = await bookmarksRepository.toggle(userId, postId);
    return { bookmarked };
  },

  async listMine(userId: string): Promise<BookmarkedPost[]> {
    return bookmarksRepository.listByUser(userId);
  },
};
