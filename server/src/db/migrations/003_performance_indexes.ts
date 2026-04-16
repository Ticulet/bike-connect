import { sql, type Kysely } from 'kysely';

/**
 * Performance indexes flagged by Phase 3 code review.
 * The composite index covers the primary feed query
 * (`WHERE status = 'published' ORDER BY published_at DESC, id DESC`)
 * so it can be served by an index scan once the table grows.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_posts_status_published_at_id
    ON posts (status, published_at DESC, id DESC)
  `.execute(db);

  // The old single-column index on status is redundant when the composite
  // index exists, since a composite (status, ...) can serve status-only
  // lookups. Drop it.
  await sql`DROP INDEX IF EXISTS idx_posts_status`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status)`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_posts_status_published_at_id`.execute(db);
}
