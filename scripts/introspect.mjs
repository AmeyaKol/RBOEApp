import { withClient } from './lib/db.mjs';

/**
 * Prints the current shape of the demo-relevant schema so we can see exactly
 * what migrations have/haven't run before touching anything.
 * Usage: node scripts/introspect.mjs
 */
const COLS = [
  ['requests', 'application_id'],
  ['requests', 'urgency'],
  ['requests', 'category'],
  ['comments', 'application_id'],
  ['comments', 'author_role'],
  ['profiles', 'onboarding_stage'],
  ['profiles', 'intake_data'],
];

const TABLES = [
  'profiles', 'documents', 'applications', 'requests', 'comments',
  'onboarding_tasks', 'alumni', 'outreach_log', 'visa_mock_interviews',
  'universities', 'document_versions',
];

await withClient(async (c) => {
  console.log('connected:', (await c.query('select current_database(), current_user')).rows[0]);

  console.log('\n--- column probes ---');
  for (const [t, col] of COLS) {
    const { rows } = await c.query(
      `select data_type from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`,
      [t, col]
    );
    console.log(`${t}.${col}`.padEnd(32), rows.length ? `present (${rows[0].data_type})` : 'MISSING');
  }

  console.log('\n--- table row counts ---');
  for (const t of TABLES) {
    const exists = await c.query(`select to_regclass('public.${t}') as r`);
    if (!exists.rows[0].r) { console.log(t.padEnd(24), 'does not exist'); continue; }
    const { rows } = await c.query(`select count(*)::int as n from public.${t}`);
    console.log(t.padEnd(24), rows[0].n);
  }

  console.log('\n--- enums ---');
  const { rows: enums } = await c.query(`
    select t.typname, string_agg(e.enumlabel, ', ' order by e.enumsortorder) as labels
    from pg_type t join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace and n.nspname='public'
    group by t.typname order by t.typname`);
  for (const r of enums) console.log(r.typname.padEnd(24), r.labels);

  console.log('\n--- profiles ---');
  const { rows: profs } = await c.query('select user_id, full_name, role from profiles order by role, full_name');
  for (const p of profs) console.log(' ', p.role.padEnd(8), (p.full_name ?? '(null)').padEnd(20), p.user_id);

  console.log('\n--- RLS policies (demo tables) ---');
  const { rows: pol } = await c.query(`
    select tablename, policyname, cmd from pg_policies
    where schemaname='public' order by tablename, policyname`);
  for (const p of pol) console.log(' ', p.tablename.padEnd(22), p.cmd.padEnd(8), p.policyname);
});
