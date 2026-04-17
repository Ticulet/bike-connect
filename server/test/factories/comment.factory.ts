import { randomUUID } from 'node:crypto';
import type { NewComment } from '../../src/db/types.js';
import { nextCounter } from './_counter.js';

interface MakeCommentOptions extends Partial<NewComment> {
  post_id: string;
  user_id: string;
}

export function makeComment(options: MakeCommentOptions): NewComment {
  const n = nextCounter('comment');
  const candidate: NewComment = {
    id: randomUUID(),
    parent_id: null,
    content: `Test comment body ${n}`,
    ...options,
  };
  return candidate;
}
