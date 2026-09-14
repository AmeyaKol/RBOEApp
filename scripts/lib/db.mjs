import pg from 'pg';
import { ENV } from './env.mjs';

/**
 * Direct Postgres connection to the Supabase project, used only by the
 * demo migration/seed scripts. Prefers an explicit SUPABASE_DB_URL, then
 * the plain `postgresql://` DATABASE_URL (not the `prisma+postgres://` one).
 */
export function dbUrl() {
  if (ENV.SUPABASE_DB_URL) return ENV.SUPABASE_DB_URL;
  const candidates = [ENV.DATABASE_URL, ENV.DIRECT_URL].filter(Boolean);
  const direct = candidates.find((u) => u.startsWith('postgres://') || u.startsWith('postgresql://'));
  if (!direct) {
    throw new Error(
      'No direct postgres URL found. Set SUPABASE_DB_URL or a postgresql:// DATABASE_URL in .env'
    );
  }
  return direct;
}

export async function withClient(fn) {
  const client = new pg.Client({
    connectionString: dbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
