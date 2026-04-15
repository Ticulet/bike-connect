import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Usage: tsx src/db/create-migration.ts <migration-name>');
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[-:T]/g, '')
  .slice(0, 14);

const fileName = `${timestamp}_${migrationName}.ts`;
const migrationsDir = path.join(__dirname, 'migrations');
const filePath = path.join(migrationsDir, fileName);

const template = `import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Add migration logic here
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Add rollback logic here
}
`;

await fs.writeFile(filePath, template);
console.log(`Created migration: ${fileName}`);
