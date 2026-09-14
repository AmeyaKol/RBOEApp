import fs from 'node:fs';
import path from 'node:path';
import { withClient } from './lib/db.mjs';
import { ROOT } from './lib/env.mjs';

/**
 * Applies one or more .sql files to the Supabase database, each wrapped in a
 * transaction. No migration tracking table — this project applies SQL by hand;
 * these scripts just make "by hand" reproducible.
 *
 * Usage:
 *   node scripts/apply-sql.mjs sql/migrations/001_request_links_and_comments.sql
 *   node scripts/apply-sql.mjs sql/migrations/002_demo_platform.sql
 */
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/apply-sql.mjs <file.sql> [<file.sql> ...]');
  process.exit(1);
}

await withClient(async (c) => {
  for (const rel of files) {
    const abs = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
    const sql = fs.readFileSync(abs, 'utf8');
    process.stdout.write(`\n=== applying ${rel} ... `);
    try {
      await c.query('begin');
      await c.query(sql);
      await c.query('commit');
      console.log('ok ===');
    } catch (err) {
      await c.query('rollback');
      console.log('FAILED (rolled back) ===');
      console.error(err.message);
      process.exit(1);
    }
  }
});
console.log('\nall files applied.');
