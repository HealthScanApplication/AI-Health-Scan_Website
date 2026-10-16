// Test against the linked website catalogue, without retaining fixture writes.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const migration = readFileSync(new URL('../supabase/migrations/20261016152128_verified_supplement_labels.sql', import.meta.url), 'utf8').replace(/^BEGIN;/m, '').replace(/COMMIT;\s*$/, '');
const assertions = readFileSync(new URL('./test-verified-supplement-labels.sql', import.meta.url), 'utf8');
const sql = `BEGIN;
SELECT set_config('fv1.skip_product_recompute','on',true);
CREATE TEMP TABLE label_before_products AS SELECT id,is_published,barcode,brand FROM public.catalog_products;
INSERT INTO public.catalog_product_elements(product_id,element_id,amount_per_serving,is_beneficial,metadata)
VALUES('trelune_baja_gold_minerals','chloride',123,NULL,'{"serving_unit":"old unit","serving_size":"old serving","composition_source":"old source"}')
ON CONFLICT(product_id,element_id) DO UPDATE SET amount_per_serving=123,metadata=excluded.metadata;
${migration}
${assertions}
DO $$ BEGIN
IF NOT EXISTS(SELECT 1 FROM public.catalog_product_elements WHERE product_id='trelune_baja_gold_minerals' AND element_id='chloride' AND amount_per_serving=123 AND metadata->>'serving_unit'='old unit' AND metadata->>'serving_size'='old serving' AND metadata->>'composition_source'='old source') THEN
 RAISE EXCEPTION 'Existing measurement/source was overwritten'; END IF;
IF EXISTS(SELECT 1 FROM public.catalog_products p JOIN label_before_products b USING(id) WHERE ROW(p.is_published,p.barcode,p.brand) IS DISTINCT FROM ROW(b.is_published,b.barcode,b.brand)) THEN
 RAISE EXCEPTION 'Repair changed publication or product identity'; END IF;
END $$;
DROP TABLE verified_label_rows,verified_label_products;
${migration}
${assertions}
ROLLBACK;`;
const result = spawnSync('supabase', ['db', 'query', '--yes', '--linked', '--project-ref', 'mofhvoudjxinvpplsytd', sql], { encoding: 'utf8' });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
process.exitCode = result.status ?? 1;
