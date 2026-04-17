/**
 * Truncate helper for multi-request HTTP integration tests where transactional
 * rollback is insufficient (the service under test commits its own
 * transactions). Call from a beforeEach in integration test files.
 */

import { sql, type Kysely } from 'kysely';
import type { Database } from '../src/db/types.js';

export async function truncateTables(
  db: Kysely<Database>,
  tables: Array<keyof Database>,
): Promise<void> {
  if (tables.length === 0) return;
  const idents = sql.join(
    tables.map((t) => sql.id(String(t))),
    sql`, `,
  );
  await sql`TRUNCATE ${idents} RESTART IDENTITY CASCADE`.execute(db);
}
