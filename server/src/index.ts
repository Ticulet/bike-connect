import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './db/index.js';

async function main() {
  // Verify database connectivity — log but do not exit on failure so the
  // server remains reachable (e.g. during local development without a DB).
  try {
    await db.selectFrom('users').select('id').limit(1).execute();
    console.log('Database connection verified.');
  } catch (err) {
    console.error('Database connection failed (server will still start):', err);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`Server listening on port ${String(env.PORT)} [${env.NODE_ENV}]`);
  });

  function shutdown(): void {
    console.log('Shutting down gracefully...');
    server.close(() => {
      db.destroy()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err: unknown) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
