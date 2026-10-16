// Run the migration with a preservation fixture, verify, and always roll it back.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const migration = readFileSync(new URL('../supabase/migrations/20261016122017_repair_supplement_composition_links.sql', import.meta.url), 'utf8').replace(/^BEGIN;/m, '').replace(/COMMIT;\s*$/, '');
const assertions = readFileSync(new URL('./test-supplement-composition.sql', import.meta.url), 'utf8');
const fixture = `
INSERT INTO public.catalog_product_elements(product_id,element_id,amount_per_serving,metadata)
VALUES('prod_generic_glycine','glycine',123,'{"serving_unit":"mg","serving_size":"QA existing serving","composition_source":"QA original source"}')
ON CONFLICT(product_id,element_id) DO UPDATE SET amount_per_serving=123,metadata=excluded.metadata;
`;
const preservation = `DO $$ BEGIN
IF NOT EXISTS(SELECT 1 FROM public.catalog_product_elements WHERE product_id='prod_generic_glycine' AND element_id='glycine' AND amount_per_serving=123 AND metadata->>'serving_unit'='mg' AND metadata->>'serving_size'='QA existing serving' AND metadata->>'composition_source'='QA original source') THEN
RAISE EXCEPTION 'Repair erased existing quantity/unit/serving/source'; END IF;
END $$;`;
const sql = `BEGIN;\n${fixture}\n${migration}\n${assertions}\n${preservation}\nROLLBACK;`;
const result = spawnSync('supabase', ['db', 'query', '--yes', '--linked', '--project-ref', 'mofhvoudjxinvpplsytd', sql], { encoding: 'utf8' });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
process.exitCode = result.status ?? 1;
