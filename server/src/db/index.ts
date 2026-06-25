import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from '../config/env.js';
import type { Database } from './types.js';

const { Pool, types } = pg;

// PostgreSQL DATE columns (maintenance performed_at, ride date, component
// installed_at) are calendar dates with no time or zone. By default
// node-postgres parses them into JS Date objects, which JSON-serialise to a
// zoned ISO timestamp — shifting the calendar day and breaking the plain
// 'YYYY-MM-DD' string both the client and our db types expect. Keep them as the
// raw string. (1082 is the OID of the DATE type.)
types.setTypeParser(1082, (value: string): string => value);

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  }),
});

export const db = new Kysely<Database>({ dialect });
