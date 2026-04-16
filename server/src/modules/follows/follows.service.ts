import { followsRepository } from './follows.repository.js';
import type { PublicUserProfile } from './follows.repository.js';
import { usersRepository } from '../users/users.repository.js';
import { ApiError } from '../../lib/api-error.js';

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export const followsService = {
  async toggleFollow(followerId: string, targetUserId: string): Promise<{ following: boolean }> {
    if (followerId === targetUserId) {
      throw ApiError.badRequest('Cannot follow yourself');
    }

    const target = await usersRepository.findById(targetUserId);
    if (!target) {
      throw ApiError.notFound('User');
    }

    const following = await followsRepository.toggle(followerId, targetUserId);
    return { following };
  },

  async getFollowStats(userId: string, requesterId?: string): Promise<FollowStats> {
    const [followers_count, following_count] = await Promise.all([
      followsRepository.countFollowers(userId),
      followsRepository.countFollowing(userId),
    ]);

    let is_following = false;
    if (requesterId && requesterId !== userId) {
      is_following = await followsRepository.isFollowing(requesterId, userId);
    }

    return { followers_count, following_count, is_following };
  },

  async listFollowers(userId: string): Promise<PublicUserProfile[]> {
    return followsRepository.listFollowers(userId);
  },

  async listFollowing(userId: string): Promise<PublicUserProfile[]> {
    return followsRepository.listFollowing(userId);
  },
};
