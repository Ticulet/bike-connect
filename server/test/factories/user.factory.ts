import { randomUUID } from 'node:crypto';
import type { NewUser } from '../../src/db/types.js';
import { nextCounter, workerTag } from './_counter.js';

export function makeUser(overrides: Partial<NewUser> = {}): NewUser {
  const n = nextCounter('user');
  const candidate: NewUser = {
    id: randomUUID(),
    google_id: `google-${workerTag()}-${n}`,
    email: `user${n}.${workerTag()}@test.local`,
    display_name: `Test User ${n}`,
    avatar_url: null,
    bio: null,
    ...overrides,
  };
  return candidate;
}
