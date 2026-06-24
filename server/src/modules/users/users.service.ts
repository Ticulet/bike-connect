import { usersRepository } from './users.repository.js';
import { postsRepository } from '../posts/posts.repository.js';
import { bikesRepository } from '../bikes/bikes.repository.js';
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

export interface ActivityItem {
  id: string;
  type: 'post' | 'bike';
  label: string;
  timestamp: string;
  href: string;
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

  async listPublicActivity(userId: string): Promise<ActivityItem[]> {
    const [posts, bikes] = await Promise.all([
      postsRepository.findPublishedByAuthor(userId, 20),
      bikesRepository.findPublicByUserId(userId),
    ]);

    const postItems = posts.map((p): ActivityItem => ({
      id: p.id,
      type: 'post',
      label: `Published "${p.title}"`,
      timestamp: (p.published_at ?? p.created_at).toISOString(),
      href: `/posts/${p.slug}`,
    }));

    const bikeItems = bikes.map((b): ActivityItem => ({
      id: b.id,
      type: 'bike',
      label: `Added ${b.name}`,
      timestamp: b.created_at.toISOString(),
      href: `/bikes/${b.id}`,
    }));

    return [...postItems, ...bikeItems]
      .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime())
      .slice(0, 20);
  },

  async updateProfile(userId: string, data: ProfileUpdate): Promise<User> {
    const user = await usersRepository.findById(userId);
    if (!user) throw ApiError.notFound('User');
    return usersRepository.update(userId, data);
  },
};
