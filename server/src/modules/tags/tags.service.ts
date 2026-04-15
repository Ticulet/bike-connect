import { tagsRepository } from './tags.repository.js';
import { ApiError } from '../../lib/api-error.js';
import type { Tag } from '../../db/types.js';

export const tagsService = {
  async listTags(search?: string): Promise<Tag[]> {
    return tagsRepository.findAll(search);
  },

  async getTagBySlug(slug: string): Promise<Tag> {
    const tag = await tagsRepository.findBySlug(slug);
    if (!tag) throw ApiError.notFound('Tag');
    return tag;
  },

  async ensureTagsExist(tagIds: number[]): Promise<void> {
    if (tagIds.length === 0) return;

    const found = await tagsRepository.findByIds(tagIds);
    if (found.length !== tagIds.length) {
      throw ApiError.badRequest('One or more tag IDs do not exist');
    }
  },
};
