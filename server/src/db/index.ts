import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';

const { Pool } = pg;

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env['DATABASE_URL'],
  }),
});

export const db = new Kysely<Database>({ dialect });
export type { Database } from './types.js';
