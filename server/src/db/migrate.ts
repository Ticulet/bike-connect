import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileMigrationProvider, Migrator } from 'kysely';
import { db } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, 'migrations'),
  }),
});

const { error, results } = await migrator.migrateToLatest();

results?.forEach((result) => {
  if (result.status === 'Success') {
    console.log(`migration "${result.migrationName}" was executed successfully`);
  } else if (result.status === 'Error') {
    console.error(`failed to execute migration "${result.migrationName}"`);
  }
});

if (error) {
  console.error('failed to run migrations');
  console.error(error);
  process.exit(1);
}

await db.destroy();
