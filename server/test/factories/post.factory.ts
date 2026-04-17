import { randomUUID } from 'node:crypto';
import type { NewPost, PostCategory } from '../../src/db/types.js';
import { nextCounter, workerTag } from './_counter.js';

interface MakePostOptions extends Partial<NewPost> {
  author_id: string;
}

export function makePost(options: MakePostOptions): NewPost {
  const n = nextCounter('post');
  const category: PostCategory = options.category ?? 'general';
  const candidate: NewPost = {
    id: randomUUID(),
    title: `Test Post ${n}`,
    slug: `test-post-${workerTag()}-${n}`,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: `Sample body ${n}` }],
        },
      ],
    },
    excerpt: `Excerpt ${n}`,
    cover_image_url: null,
    category,
    status: 'draft',
    published_at: null,
    ...options,
  };
  return candidate;
}
