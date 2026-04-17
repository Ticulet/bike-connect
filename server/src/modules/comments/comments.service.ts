import { commentsRepository } from './comments.repository.js';
import type { CommentWithAuthor } from './comments.repository.js';
import { postsRepository } from '../posts/posts.repository.js';
import { ApiError } from '../../lib/api-error.js';
import type { NewComment } from '../../db/types.js';

export const commentsService = {
  async listForPost(postId: string): Promise<CommentWithAuthor[]> {
    const post = await postsRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post');
    return commentsRepository.findByPostId(postId);
  },

  async addComment(
    postId: string,
    userId: string,
    data: { content: string; parent_id?: string | null },
  ): Promise<CommentWithAuthor> {
    const post = await postsRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post');

    if (data.parent_id) {
      const parent = await commentsRepository.findById(data.parent_id);
      if (!parent || parent.post_id !== postId) {
        throw ApiError.badRequest('Parent comment does not belong to this post');
      }
      if (parent.parent_id !== null) {
        throw ApiError.badRequest('Replies to replies are not supported');
      }
    }

    const newComment: NewComment = {
      post_id: postId,
      user_id: userId,
      parent_id: data.parent_id ?? null,
      content: data.content,
    };

    return commentsRepository.create(newComment);
  },

  async updateComment(
    commentId: string,
    userId: string,
    content: string,
  ): Promise<CommentWithAuthor> {
    const comment = await commentsRepository.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment');
    if (comment.user_id !== userId) throw ApiError.forbidden();

    const updated = await commentsRepository.update(commentId, content);
    if (!updated) throw ApiError.notFound('Comment');
    return updated;
  },

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await commentsRepository.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment');
    if (comment.user_id !== userId) throw ApiError.forbidden();

    await commentsRepository.deleteById(commentId);
  },
};
