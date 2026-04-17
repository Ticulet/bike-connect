# Server Test Harness — ADR-001

This directory centralises the backend test infrastructure: the PostgreSQL
testcontainer bootstrap, the transactional-rollback helper, the truncate
helper, the network interceptor, and the factory library.

## Isolation Strategy

Four tiers, matched to the test style:

| Test style | Isolation pattern | Why |
|------------|-------------------|-----|
| Service unit tests | In-memory fake repository, no DB at all | Fastest; services are pure domain logic |
| Repository tests | Real PG via `withTx`, `BEGIN/ROLLBACK` per test | Matches production (JSON ops, constraints) |
| HTTP integration tests | Real PG, `truncateTables([...])` in `beforeEach` | Multi-request flows commit their own transactions |
| E2E tests | Dedicated seeded DB, shared across Playwright workers | Out of scope for this harness |

Rollback was chosen over truncate-per-test because it is faster and has
stronger guarantees: the test body can throw and rollback still fires in the
`finally`. The tradeoff is that code under test cannot span multiple
HTTP requests inside a single test — for that, truncate is the fallback.

## Why Testcontainers

Over `pg-mem` or SQLite:

- The app uses PostgreSQL-specific features (JSONB, tsvector, partial unique
  indexes, generated columns). In-memory substitutes do not implement these
  fully and silently diverge.
- Testcontainers runs the same image as production (Postgres 17), so any
  behaviour we rely on in tests also holds in prod.

Cost: first worker spin-up is ~5–10 seconds. Subsequent tests in the same
worker reuse the container and run at normal speed.

## Per-Worker Schema

Each Vitest worker gets its own schema `test_worker_${VITEST_WORKER_ID}`.
Migrations run once into a `template` schema at container startup, then each
worker re-runs them into its own schema. No cross-worker contention, no shared
state.

Schemas are dropped on worker exit (`afterAll` in `setup.ts`).

## Network Policy

`installNetworkGuard()` replaces the global undici dispatcher with one that
rejects any request whose host is not on the allow-list. Allow-list:

- `127.0.0.1`, `localhost`, `::1`
- The testcontainer host (dynamically added after bootstrap)

Any other host raises `NetworkBlockedError` with a descriptive message. This
catches tests that inadvertently hit Google OAuth, Cloudinary, Unsplash, etc.

**Opting out**: almost never legitimate. If you genuinely need to reach the
network from a test, call `uninstallNetworkGuard()` in a per-file `beforeAll`
and re-install in `afterAll`, and document why in a code comment.

## Factories

Every factory in `factories/` follows the same contract:

1. Produces a valid, DB-insertable shape (`NewUser`, `NewPost`, etc.).
2. Accepts a `Partial<T>` overrides argument for test-specific fields.
3. Uses deterministic counters keyed per-worker (`nextCounter` + `workerTag`)
   so parallel workers cannot produce colliding unique values.
4. Never returns `https://` URLs for images — only `null` or local/data URIs.
5. Where a factory requires foreign keys (e.g., `post.author_id`), those are
   required props on the options object, not defaulted.

## Pagination Test Discipline

Code reviewers: any test that exercises cursor pagination must seed **at most
25 rows**. List queries should be fast; seeding thousands of rows just to
validate cursor behaviour is wasteful and slows CI.

## Credentials

The container generates its own user/password per run. Never read from `.env`
or `process.env.DATABASE_URL` in test code. The test harness is completely
isolated from production credentials.
