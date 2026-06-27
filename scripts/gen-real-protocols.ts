/*
 * gen-real-protocols — regenerate src/config/realProtocols.ts from the live DB so
 * the marketing preview phones match the real app: real catalog images per step,
 * the item's note as a description, and child "do/don't" detail lines.
 *
 * Preserves the curated goal/protocol structure (which protocols belong to which
 * goal, their chips/descriptions/dos/donts/scores) by importing the existing
 * GOALS and replacing ONLY each protocol's `items[]` with the current DB timeline.
 * Protocols whose name no longer matches the DB keep their existing (stale) items.
 *
 * Run:  SR=<prod service_role key> npx tsx scripts/gen-real-protocols.ts
 *   (get the key: supabase projects api-keys --project-ref ermbkttsyvpenjjxaxcf)
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { GOALS } from '../src/config/realProtocols';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, '../src/config/realProtocols.ts');
const B = 'https://ermbkttsyvpenjjxaxcf.supabase.co/rest/v1';
const K = process.env.SR;
if (!K) { console.error('Set SR=<prod service_role key>'); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}` } as Record<string, string>;

async function j(url: string): Promise<any[]> {
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${url}\n${await r.text()}`);
  return r.json();
}

// catalog FK -> [table, image columns in priority order]
const CAT: Record<string, [string, string[]]> = {
  catalog_activity_id: ['catalog_activities', ['image_url', 'image_primary_url', 'primary_image_url']],
  catalog_recipe_id: ['catalog_recipes', ['image_url', 'image_primary_url']],
  catalog_product_id: ['catalog_products', ['image_url', 'image_primary_url', 'image']],
  catalog_ingredient_id: ['catalog_ingredients', ['image_url', 'image_primary_url']],
  supplement_id: ['hs_supplements', ['image_url']],
};
const FK_COLS = Object.keys(CAT);

const norm = (s?: string | null) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// map DB item_type/category -> the mockup's 3 buckets that drive the icon
function mockupType(it: any): 'supplement' | 'consume' | 'activity' {
  const t = (it.item_type || '').toLowerCase();
  const c = (it.category || '').toLowerCase();
  if (c === 'supplement' || t === 'supplement') return 'supplement';
  if (c === 'consume' || t === 'recipe' || t === 'consume' || t === 'ingredient') return 'consume';
  return 'activity';
}

async function main() {
  const protos = await j(`${B}/protocols?select=id,name&limit=2000`);
  const byName = new Map<string, any>();
  for (const p of protos) if (!byName.has(norm(p.name))) byName.set(norm(p.name), p);

  let matched = 0, unmatched: string[] = [], totalItems = 0, withImg = 0, withDesc = 0, withKids = 0;

  for (const g of GOALS) for (const p of (g as any).protocols) {
    const db = byName.get(norm(p.name));
    if (!db) { unmatched.push(p.name); continue; }
    matched++;
    const sel = `id,display_name,notes,scheduled_time,sort_order,parent_protocol_item_id,item_type,category,kind,hidden,group_name,${FK_COLS.join(',')}`;
    const items = await j(`${B}/protocol_items?protocol_id=eq.${db.id}&select=${sel}&order=sort_order.asc&limit=500`);

    // children grouped by parent
    const kids = new Map<string, string[]>();
    for (const it of items) if (it.parent_protocol_item_id) {
      const a = kids.get(it.parent_protocol_item_id) || []; a.push(it.display_name); kids.set(it.parent_protocol_item_id, a);
    }
    const tops = items.filter((it) => !it.parent_protocol_item_id && (it.kind === 'action' || !it.kind) && !it.hidden);

    // resolve catalog images in one batch per table
    const idsByFk: Record<string, Set<string>> = {};
    for (const it of tops) for (const fk of FK_COLS) if (it[fk]) (idsByFk[fk] ??= new Set()).add(it[fk]);
    const imgByKey: Record<string, string | null> = {};
    for (const fk of Object.keys(idsByFk)) {
      const [tbl, cols] = CAT[fk]; const ids = [...idsByFk[fk]];
      try {
        const rows = await j(`${B}/${tbl}?id=in.(${ids.join(',')})&select=id,${cols.join(',')}`);
        for (const r of rows) imgByKey[`${fk}:${r.id}`] = cols.map((c) => r[c]).find(Boolean) || null;
      } catch (e) { console.warn(`  image fetch failed for ${tbl}:`, (e as Error).message.split('\n')[0]); }
    }

    p.items = tops.map((it: any) => {
      let image: string | null = null;
      for (const fk of FK_COLS) if (it[fk]) image = imgByKey[`${fk}:${it[fk]}`] || image;
      const desc = (it.notes || '').trim();
      const children = (kids.get(it.id) || []).filter(Boolean);
      const meta = (it.scheduled_time || '').slice(0, 5) || undefined;
      const out: any = { name: it.display_name, item_type: mockupType(it) };
      if (meta) out.meta = meta;
      if (it.group_name) out.group_name = it.group_name;
      if (image) { out.image_url = image; withImg++; }
      if (desc && !/^dosage:/i.test(desc)) { out.description = desc; withDesc++; }
      if (children.length) { out.children = children; withKids++; }
      return out;
    });
    totalItems += p.items.length;
  }

  // emit: keep the file's header + interfaces verbatim, replace the GOALS literal
  const prefix = readFileSync(OUT, 'utf8').split('export const GOALS')[0];
  writeFileSync(OUT, `${prefix}export const GOALS: Goal[] = ${JSON.stringify(GOALS, null, 2)};\n`);

  console.log(JSON.stringify({ matched, totalItems, withImg, withDesc, withKids, unmatched }, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
