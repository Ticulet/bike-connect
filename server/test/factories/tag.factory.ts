import type { NewTag } from '../../src/db/types.js';
import { nextCounter, workerTag } from './_counter.js';

export function makeTag(overrides: Partial<NewTag> = {}): NewTag {
  const n = nextCounter('tag');
  const candidate: NewTag = {
    name: `tag-${workerTag()}-${n}`,
    slug: `tag-${workerTag()}-${n}`,
    ...overrides,
  };
  return candidate;
}
