// Exercise the real audit SQL against isolated temporary tables; never mutate catalogue rows.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const audit = readFileSync(new URL('./test-supplement-composition.sql', import.meta.url), 'utf8')
  .replaceAll('public.catalog_product_elements', 'pg_temp.audit_links')
  .replaceAll('public.catalog_elements', 'pg_temp.audit_elements')
  .replaceAll('public.catalog_products', 'pg_temp.audit_products');
const cases = [
  ['dangling', "INSERT INTO audit_links(product_id,element_id) VALUES('audit-only-product','audit-missing-element')", 'Dangling element junction'],
  ['null element', "INSERT INTO audit_links(product_id,element_id) VALUES('audit-only-product',NULL)", 'Dangling element junction'],
  ['duplicate', "INSERT INTO audit_links(product_id,element_id) VALUES('audit-only-product','calcium'),('audit-only-product','calcium')", 'Duplicate product-element junction'],
  ['partial unique index', "ALTER TABLE audit_links ALTER COLUMN product_id SET NOT NULL, ALTER COLUMN element_id SET NOT NULL; CREATE UNIQUE INDEX audit_partial ON audit_links(product_id,element_id) WHERE product_id<>'audit-only-product'; INSERT INTO audit_links(product_id,element_id) VALUES('audit-only-product','calcium'),('audit-only-product','calcium')", 'Duplicate product-element junction'],
  ['missing expected', "DELETE FROM audit_links WHERE product_id='trelune_baja_gold_minerals' AND element_id='chloride'", 'A repaired product is missing one of its expected ingredient links'],
];
const sql = `BEGIN;
SET LOCAL statement_timeout='10s';
CREATE TEMP TABLE audit_products AS SELECT id,name_common,product_kind,raw_data FROM public.catalog_products WHERE product_kind='supplement';
CREATE TEMP TABLE audit_links AS SELECT pe.product_id,pe.element_id,pe.amount_per_serving,pe.metadata,pe.is_beneficial FROM public.catalog_product_elements pe JOIN audit_products p ON p.id=pe.product_id;
CREATE TEMP TABLE audit_elements AS SELECT id FROM public.catalog_elements;
${audit}
DO $fixture$ BEGIN
${cases.map(([name, mutation, message]) => `
 BEGIN
  ${mutation};
  EXECUTE $audit$${audit}$audit$;
  RAISE EXCEPTION 'Audit incorrectly accepted ${name} fixture';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> '${message}' THEN RAISE; END IF;
 END;
`).join('\n')}
END $fixture$;
${audit}
ROLLBACK;`;
const result = spawnSync('supabase', ['db', 'query', '--yes', '--linked', '--project-ref', 'mofhvoudjxinvpplsytd', sql], { encoding: 'utf8', timeout: 120_000 });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.error) console.error(result.error.message);
if (result.status === 0) console.log('PASS: clean catalogue and five corrupt fixtures (including non-supplement links and a partial unique index).');
process.exitCode = result.status ?? 1;
