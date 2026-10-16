// One serialized CLI call avoids temporary-login races. No persistent database changes.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const assertions = ['test-supplement-composition.sql', 'test-verified-supplement-labels.sql']
  .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n');
const sql = `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='60s';
SELECT set_config('audit.started_at',clock_timestamp()::text,true);
${assertions}
SELECT count(*) AS supplement_products,
 count(*) FILTER (WHERE raw_data->'supplement_composition_repair'->>'status'='linked') AS ingredient_lists_linked,
 count(*) FILTER (WHERE raw_data->'supplement_composition_repair'->>'status'='needs_label') AS needs_label,
 round(extract(epoch FROM clock_timestamp()-current_setting('audit.started_at')::timestamptz)::numeric,3) AS database_seconds
FROM public.catalog_products WHERE product_kind='supplement';
ROLLBACK;`;
const result = spawnSync('supabase', ['db', 'query', '--yes', '--linked', '--project-ref', 'mofhvoudjxinvpplsytd', sql], { encoding: 'utf8', timeout: 120_000 });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.error) console.error(result.error.message);
if (result.status === 0) console.log('PASS: global junction integrity, supplement composition and verified label assertions.');
process.exitCode = result.status ?? 1;
