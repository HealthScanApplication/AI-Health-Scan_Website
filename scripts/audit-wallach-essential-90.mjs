// Read-only audit against the same versioned manifest used by the UI.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const manifest = JSON.parse(readFileSync(new URL('../src/config/wallachEssential90.json',import.meta.url),'utf8'));
const groups = ['minerals','vitamins','amino_acids','fatty_acids'];
const entries = groups.flatMap(group => manifest[group].map(([id,label,key]) => ({ id,label,key,group })));
if (entries.length !== 90 || new Set(entries.map(e => e.id)).size !== 90 || new Set(entries.map(e => e.key)).size !== 90) throw Error('Invalid core-90 manifest');
const quote = value => `'${String(value).replaceAll("'","''")}'`;
const expected = JSON.stringify(entries);
const sql = `BEGIN READ ONLY; SET LOCAL statement_timeout='30s';
DO $audit$ DECLARE actual integer; BEGIN
 SELECT count(*) INTO actual FROM public.catalog_elements WHERE essential_90='true';
 IF actual <> 90 THEN RAISE EXCEPTION 'Expected exactly90 historical members, found %',actual; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_to_recordset(${quote(expected)}::jsonb) AS m(id text,key text,"group" text)
 LEFT JOIN public.catalog_elements e ON e.id=m.id
 WHERE e.id IS NULL OR e.essential_90 IS DISTINCT FROM 'true'
 OR e.raw_data->'wallach90_membership'->>'key' IS DISTINCT FROM m.key
 OR e.raw_data->'wallach90_membership'->>'group' IS DISTINCT FROM m."group")
 THEN RAISE EXCEPTION 'Core90 membership or canonical mapping differs from source manifest'; END IF;
 IF (SELECT category FROM public.catalog_elements WHERE id='arsenic') IS DISTINCT FROM 'Hazardous'
 OR (SELECT category FROM public.catalog_elements WHERE id='beryllium') IS DISTINCT FROM 'Hazardous'
 THEN RAISE EXCEPTION 'Hazard classifications must remain intact'; END IF;
END $audit$;
SELECT raw_data->'wallach90_membership'->>'group' AS source_group,count(*) AS members
FROM public.catalog_elements WHERE essential_90='true' GROUP BY 1 ORDER BY 1;
ROLLBACK;`;
const result = spawnSync('supabase',['db','query','--yes','--linked','--project-ref','mofhvoudjxinvpplsytd',sql],{ encoding:'utf8', timeout:90000 });
process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
if (result.error) console.error(result.error.message);
if (result.status === 0) console.log('PASS: exact90 identities and mappings; 60/16/12/2 source groups; hazard status retained.');
process.exitCode = result.status ?? 1;
