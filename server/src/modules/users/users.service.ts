import { usersRepository } from './users.repository.js';
import { ApiError } from '../../lib/api-error.js';
import type { User } from '../../db/types.js';

interface ProfileUpdate {
  display_name?: string;
  bio?: string;
}

export interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
}

export const usersService = {
  async getPublicProfile(userId: string): Promise<PublicProfile> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User');
    }
    return {
      id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
    };
  },

  async updateProfile(userId: string, data: ProfileUpdate): Promise<User> {
    const user = await usersRepository.findById(userId);
    if (!user) throw ApiError.notFound('User');
    return usersRepository.update(userId, data);
  },
};
