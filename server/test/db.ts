/**
 * Test-DB bootstrap. Spins up a PostgreSQL 17 container once per Vitest worker,
 * creates a worker-scoped schema, and runs Kysely migrations into that schema
 * via a pool pinned to it by connection options.
 */

import { Kysely, PostgresDialect, Migrator, FileMigrationProvider } from 'kysely';
import pg from 'pg';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database } from '../src/db/types.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared container per-process; Vitest spawns one process per worker, so each
// worker gets its own container. Lazily initialised on first getTestDb() call.
let container: StartedPostgreSqlContainer | undefined;
let db: Kysely<Database> | undefined;
let adminPool: pg.Pool | undefined;

const TEST_DB_NAME = 'bike_connect_test';

function workerId(): string {
  const raw = process.env.VITEST_WORKER_ID ?? process.env.VITEST_POOL_ID ?? '1';
  return raw.replace(/[^a-zA-Z0-9]/g, '_');
}

function workerSchema(): string {
  return `test_worker_${workerId()}`;
}

async function runMigrations(target: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db: target,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve(__dirname, '..', 'src', 'db', 'migrations'),
    }),
  });
  const { error, results } = await migrator.migrateToLatest();
  if (error) {
    throw new Error(
      `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const failed = results?.find((r) => r.status === 'Error');
  if (failed) {
    throw new Error(`Migration step failed: ${failed.migrationName}`);
  }
}

export async function getTestDb(): Promise<Kysely<Database>> {
  if (db) return db;

  // Same major version as docker-compose.yml so tests run against what prod runs.
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase(TEST_DB_NAME)
    .withUsername('test')
    .withPassword('test')
    .start();

  const dbName = container.getDatabase();
  if (!dbName.startsWith('bike_connect_test')) {
    throw new Error(`Test DB name must start with bike_connect_test, got: ${dbName}`);
  }

  // Admin pool (no search_path pinning) — used only to create the worker schema.
  adminPool = new Pool({
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    database: dbName,
    max: 2,
  });

  const schema = workerSchema();
  await adminPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await adminPool.query(`CREATE SCHEMA "${schema}"`);

  // Worker pool pinned to the worker schema via connection options; every
  // connection in the pool has search_path set server-side, so migrations run
  // consistently no matter which connection the Kysely migrator picks up.
  const workerPool = new Pool({
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    database: dbName,
    max: 5,
    options: `-csearch_path=${schema}`,
  });

  const workerDb = new Kysely<Database>({
    dialect: new PostgresDialect({ pool: workerPool }),
  });
  await runMigrations(workerDb);

  db = workerDb;
  return db;
}

export async function closeTestDb(): Promise<void> {
  if (db) {
    try {
      await db.destroy();
    } catch {
      // ignore teardown errors
    }
    db = undefined;
  }
  if (adminPool) {
    try {
      await adminPool.end();
    } catch {
      // ignore
    }
    adminPool = undefined;
  }
  if (container) {
    try {
      await container.stop();
    } catch {
      // ignore
    }
    container = undefined;
  }
}

export function getContainerHost(): string | undefined {
  return container?.getHost();
}

export function getContainerPort(): number | undefined {
  return container?.getPort();
}
