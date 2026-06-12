import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load .env from the repo root so a single file serves all workspaces,
// regardless of which cwd tsx is invoked from.
const __filename = fileURLToPath(import.meta.url);
const repoRootEnv = path.resolve(path.dirname(__filename), '..', '..', '..', '.env');
dotenv.config({ path: repoRootEnv });

const isProduction = process.env['NODE_ENV'] === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgresql://bike_connect:bike_connect_dev@localhost:5432/bike_connect'),
  GOOGLE_CLIENT_ID: isProduction ? z.string().min(1) : z.string().default('google-client-id-placeholder'),
  GOOGLE_CLIENT_SECRET: isProduction ? z.string().min(1) : z.string().default('google-client-secret-placeholder'),
  JWT_SECRET: isProduction ? z.string().min(32) : z.string().min(32).default('development-jwt-secret-min-32-chars-long!!'),
  JWT_EXPIRY: z.string().regex(/^\d+[smhdwy]$/, 'JWT_EXPIRY must be a valid duration (e.g. 7d, 1h)').default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  IMAGE_STORAGE: z.enum(['cloudinary', 'local']).default('local'),
  CLOUDINARY_URL: z.string().optional(),
  LOCAL_UPLOAD_DIR: z.string().default('./uploads'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
