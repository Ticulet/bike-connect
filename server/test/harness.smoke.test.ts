import { describe, expect, it } from 'vitest';
import { withTx } from './tx.js';
import { makeBike, makeUser } from './factories/index.js';

describe('harness smoke', () => {
  it('rolls back inserts', async () => {
    const user = makeUser();
    await withTx(async (tx) => {
      await tx.insertInto('users').values(user).execute();
      const found = await tx
        .selectFrom('users')
        .selectAll()
        .where('id', '=', user.id as string)
        .executeTakeFirst();
      expect(found).toBeDefined();
      expect(found?.email).toBe(user.email);
    });
    // After rollback, a fresh withTx should not see the user.
    await withTx(async (tx) => {
      const gone = await tx
        .selectFrom('users')
        .selectAll()
        .where('id', '=', user.id as string)
        .executeTakeFirst();
      expect(gone).toBeUndefined();
    });
  });

  it('factories produce unique values across calls', () => {
    const u1 = makeUser();
    const u2 = makeUser();
    expect(u1.email).not.toBe(u2.email);
    expect(u1.google_id).not.toBe(u2.google_id);
  });

  it('bike factory requires user_id', () => {
    const user = makeUser();
    const bike = makeBike({ user_id: user.id as string });
    expect(bike.user_id).toBe(user.id);
    expect(bike.type).toBe('road');
  });

  it('blocks outbound network', async () => {
    await expect(fetch('https://example.com')).rejects.toThrow(
      /Tests may not touch the network/,
    );
  });
});
