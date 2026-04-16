import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from '../config/env.js';
import type { Database } from './types.js';

const { Pool } = pg;

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  }),
});

export const db = new Kysely<Database>({ dialect });
