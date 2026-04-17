/**
 * Transactional rollback helper. Wraps a test body in a BEGIN/ROLLBACK so
 * the database is identical before and after the test, regardless of what the
 * body did (including errors).
 */

import type { Kysely, Transaction } from 'kysely';
import type { Database } from '../src/db/types.js';
import { getTestDb } from './db.js';

class RollbackSignal extends Error {
  constructor() {
    super('withTx rollback signal — not a real error');
    this.name = 'RollbackSignal';
  }
}

export async function withTx<T>(
  fn: (tx: Transaction<Database>) => Promise<T>,
): Promise<T> {
  const db: Kysely<Database> = await getTestDb();
  let result: T;
  try {
    await db.transaction().execute(async (tx) => {
      result = await fn(tx);
      throw new RollbackSignal();
    });
  } catch (err) {
    if (err instanceof RollbackSignal) {
      // Expected: rollback triggered.
      return result!;
    }
    throw err;
  }
  // Unreachable — the RollbackSignal always fires.
  return result!;
}
