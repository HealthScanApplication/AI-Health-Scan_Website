/*
 * Protocol admin CRUD — targets the REAL production tables `protocols` and
 * `protocol_items` over Supabase PostgREST.
 *
 * IMPORTANT: the legacy admin "Protocols" tab pointed at `catalog_protocols`,
 * which does NOT exist in the live database (404). Routines/protocols actually
 * live in `protocols` (+ `protocol_items`). This module is the single source of
 * truth for reading and writing them from the admin panel.
 *
 * Writes require a valid admin session (accessToken). Reads of public protocols
 * fall back to the anon key. Both projectId/publicAnonKey follow the selected
 * environment (staging | production) via ../utils/supabase/info.
 */
import { projectId, publicAnonKey } from './supabase/info';

const rest = () => `https://${projectId}.supabase.co/rest/v1`;

export interface AdminProtocol {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  target_gender: string | null;
  creator: string | null;
  source: string | null;
  image_url: string | null;
  health_score: number | null;
  total_days: number | null;
  is_suggested: boolean | null;
  is_active: boolean | null;
  is_public: boolean | null;
  start_time: string | null;
  sort_order: number | null;
  updated_at?: string | null;
}

export interface AdminProtocolItem {
  id: string;
  protocol_id: string;
  display_name: string | null;
  item_type: string | null;   // supplement | consume | recipe | activity | product
  kind: string | null;        // action | rule_do | rule_dont
  scope: string | null;
  scheduled_time: string | null; // 'HH:MM:SS'
  duration_minutes: number | null;
  group_name: string | null;
  day_number: number | null;
  sort_order: number | null;
  parent_protocol_item_id: string | null; // child description items point at their parent
  has_children: boolean | null;
  category: string | null;   // consume | do | sleep | supplement
  subtype: string | null;    // consume: meal|drink|snack|beverage · do: hygiene|wellness|exercise
  hidden: boolean | null;    // kept in the protocol but hidden from the day view
  catalog_recipe_id: string | null;
  catalog_product_id: string | null;
  catalog_activity_id: string | null;
  catalog_ingredient_id: string | null;
  supplement_id: string | null;
  // cadence / recurrence (read by the mobile app's itemShowsOnDate + day_number cycle)
  recurrence_type: string | null;            // daily | weekly | biweekly | monthly | custom | one_off
  recurrence_days_of_week: number[] | null;  // 0..6 = Sun..Sat (weekly/biweekly)
  recurrence_interval_days: number | null;   // every N days (custom)
  recurrence_start_date: string | null;      // ISO date anchor
  recurrence_end_date: string | null;        // ISO date bound
  scheduled_date: string | null;             // ISO date — one_off items
}

const PROTOCOL_COLS =
  'id,name,description,category,type,target_gender,creator,source,image_url,health_score,total_days,is_suggested,is_active,is_public,start_time,sort_order,updated_at';
const ITEM_COLS =
  'id,protocol_id,display_name,item_type,kind,scope,scheduled_time,duration_minutes,group_name,day_number,sort_order,parent_protocol_item_id,has_children,category,subtype,hidden,catalog_recipe_id,catalog_product_id,catalog_activity_id,catalog_ingredient_id,supplement_id,recurrence_type,recurrence_days_of_week,recurrence_interval_days,recurrence_start_date,recurrence_end_date,scheduled_date';

function headers(accessToken: string, extra: Record<string, string> = {}) {
  return {
    apikey: publicAnonKey,
    Authorization: `Bearer ${accessToken || publicAnonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function handle(res: Response, ctx: string): Promise<any> {
  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`${ctx} failed (${res.status}): ${detail || res.statusText}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function first<T>(rows: T | T[]): T {
  return Array.isArray(rows) ? rows[0] : rows;
}

/** All protocols, suggested ones first, then by sort order / name. */
export async function listProtocols(accessToken: string): Promise<AdminProtocol[]> {
  const url =
    `${rest()}/protocols?select=${PROTOCOL_COLS}` +
    `&order=is_suggested.desc.nullslast,sort_order.asc.nullslast,name.asc`;
  const res = await fetch(url, { headers: headers(accessToken) });
  return (await handle(res, 'List protocols')) || [];
}

/** Steps for one protocol, ordered chronologically like the app's day view. */
export async function listProtocolItems(
  accessToken: string,
  protocolId: string,
): Promise<AdminProtocolItem[]> {
  const url =
    `${rest()}/protocol_items?protocol_id=eq.${protocolId}&select=${ITEM_COLS}` +
    `&order=scheduled_time.asc.nullslast,sort_order.asc.nullslast`;
  const res = await fetch(url, { headers: headers(accessToken) });
  return (await handle(res, 'List protocol steps')) || [];
}

export async function updateProtocol(
  accessToken: string,
  id: string,
  patch: Partial<AdminProtocol>,
): Promise<AdminProtocol> {
  const res = await fetch(`${rest()}/protocols?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers(accessToken, { Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  return first(await handle(res, 'Update protocol'));
}

export async function updateProtocolItem(
  accessToken: string,
  id: string,
  patch: Partial<AdminProtocolItem>,
): Promise<AdminProtocolItem> {
  const res = await fetch(`${rest()}/protocol_items?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers(accessToken, { Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  return first(await handle(res, 'Update step'));
}

export async function createProtocolItem(
  accessToken: string,
  item: Partial<AdminProtocolItem>,
): Promise<AdminProtocolItem> {
  const res = await fetch(`${rest()}/protocol_items`, {
    method: 'POST',
    headers: headers(accessToken, { Prefer: 'return=representation' }),
    body: JSON.stringify(item),
  });
  return first(await handle(res, 'Create step'));
}

export async function deleteProtocolItem(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${rest()}/protocol_items?id=eq.${id}`, {
    method: 'DELETE',
    headers: headers(accessToken),
  });
  await handle(res, 'Delete step');
}

/* ───────── catalog linking (recipes / products / activities / supplements) ───────── */
export type CatalogKind = 'recipe' | 'ingredient' | 'product' | 'activity' | 'supplement';
export interface CatalogHit { id: string; name: string; image: string | null; price?: number | null; buyUrl?: string | null }
interface CatCfg { table: string; fk: keyof AdminProtocolItem; nameCols: string[]; imgCols: string[]; buyCols?: string[] }
// Only columns that actually exist on each table (a bad column 400s the whole select).
export const CATALOG_CFG: Record<CatalogKind, CatCfg> = {
  recipe: { table: 'catalog_recipes', fk: 'catalog_recipe_id', nameCols: ['name_common'], imgCols: ['image_url', 'image_primary_url', 'images'] },
  ingredient: { table: 'catalog_ingredients', fk: 'catalog_ingredient_id', nameCols: ['name_common', 'name'], imgCols: ['image_url', 'image_primary_url', 'images'] },
  product: { table: 'catalog_products', fk: 'catalog_product_id', nameCols: ['name_common', 'name_brand', 'market_name', 'name'], imgCols: ['image_url', 'image_primary_url', 'image', 'images'], buyCols: ['price_usd', 'affiliate_link_amazon', 'affiliate_link_shopify', 'purchase_url', 'affiliate_url'] },
  activity: { table: 'catalog_activities', fk: 'catalog_activity_id', nameCols: ['name'], imgCols: ['image_url', 'image_primary_url', 'primary_image_url'] },
  supplement: { table: 'hs_supplements', fk: 'supplement_id', nameCols: ['name'], imgCols: ['image_url'] },
};
const ALL_FKS: (keyof AdminProtocolItem)[] = ['catalog_recipe_id', 'catalog_ingredient_id', 'catalog_product_id', 'catalog_activity_id', 'supplement_id'];
const catalogCols = (cfg: CatCfg) => ['id', ...cfg.nameCols, ...cfg.imgCols, ...(cfg.buyCols || [])].join(',');

function mapHit(cfg: CatCfg, row: any): CatalogHit {
  const name = cfg.nameCols.map((c) => row[c]).find(Boolean) || 'Untitled';
  let image: string | null = null;
  for (const c of cfg.imgCols) {
    const v = row[c];
    if (!v) continue;
    image = c === 'images' ? (Array.isArray(v) ? v[0] : typeof v === 'string' ? v : null) : v;
    if (image) break;
  }
  const hit: CatalogHit = { id: row.id, name, image };
  if (cfg.buyCols) {
    hit.price = row.price_usd ?? null;
    hit.buyUrl = row.affiliate_link_amazon || row.affiliate_link_shopify || row.purchase_url || row.affiliate_url || null;
  }
  return hit;
}

/** Search a catalog by name (empty query → top suggestions). */
export async function searchCatalog(accessToken: string, kind: CatalogKind, query: string, limit = 8): Promise<CatalogHit[]> {
  const cfg = CATALOG_CFG[kind];
  let url = `${rest()}/${cfg.table}?select=${catalogCols(cfg)}&limit=${limit}`;
  const q = query.trim();
  if (q) {
    const or = cfg.nameCols.map((c) => `${c}.ilike.*${encodeURIComponent(q)}*`).join(',');
    url += `&or=(${or})`;
  } else {
    url += `&order=${cfg.nameCols[0]}.asc.nullslast`;
  }
  const res = await fetch(url, { headers: headers(accessToken) });
  const rows = (await handle(res, `Search ${cfg.table}`)) || [];
  return (rows as any[]).map((r) => mapHit(cfg, r));
}

/** Resolve linked catalog records in one shot (for display + preview images). */
export async function getCatalogByIds(accessToken: string, kind: CatalogKind, ids: string[]): Promise<CatalogHit[]> {
  if (!ids.length) return [];
  const cfg = CATALOG_CFG[kind];
  const res = await fetch(`${rest()}/${cfg.table}?id=in.(${ids.join(',')})&select=${catalogCols(cfg)}`, { headers: headers(accessToken) });
  const rows = (await handle(res, `Get ${cfg.table}`)) || [];
  return (rows as any[]).map((r) => mapHit(cfg, r));
}

/** Which catalog kind (if any) an item is currently linked to. */
export function linkedKind(item: AdminProtocolItem): CatalogKind | null {
  if (item.catalog_recipe_id) return 'recipe';
  if (item.catalog_ingredient_id) return 'ingredient';
  if (item.catalog_product_id) return 'product';
  if (item.catalog_activity_id) return 'activity';
  if (item.supplement_id) return 'supplement';
  return null;
}
/** Patch that sets one catalog FK and clears the others. */
export function linkPatch(kind: CatalogKind | null, id: string | null): Partial<AdminProtocolItem> {
  const patch: any = {};
  for (const fk of ALL_FKS) patch[fk] = null;
  if (kind && id) patch[CATALOG_CFG[kind].fk] = id;
  return patch;
}

/** The primary editable name column for a catalog kind. */
export function catalogNameCol(kind: CatalogKind): string {
  return CATALOG_CFG[kind].nameCols[0];
}

/** Patch arbitrary fields on a linked catalog record via the admin edge function (service role). */
export async function updateCatalogFields(accessToken: string, kind: CatalogKind, id: string, updates: Record<string, any>): Promise<void> {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/update`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: CATALOG_CFG[kind].table, id, updates }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.error || `Update failed (${res.status})`);
}

/** Set image_url on a linked catalog record (thin wrapper over updateCatalogFields). */
export async function updateCatalogImage(accessToken: string, kind: CatalogKind, id: string, imageUrl: string): Promise<string> {
  await updateCatalogFields(accessToken, kind, id, { image_url: imageUrl });
  return imageUrl;
}

/** Delete a catalog record via the admin edge function (service role). */
export async function deleteCatalogRecord(accessToken: string, kind: CatalogKind, id: string): Promise<void> {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/delete`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: CATALOG_CFG[kind].table, id }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.error || `Delete failed (${res.status})`);
}

/** Merge a duplicate catalog record into a survivor — re-points protocol links +
 *  recipe↔ingredient junctions onto the survivor, then deletes the duplicate.
 *  Returns per-table re-point counts.
 *
 *  Done CLIENT-SIDE via PostgREST (no edge-function dependency, so it can't 404 on
 *  a stale deploy). protocol_items + catalog_recipe_ingredients writes require the
 *  is_healthscan_admin() RLS policies — see migration
 *  20260625_catalog_recipe_ingredients_admin_write_rls.sql. The duplicate delete
 *  goes through the service-role /delete endpoint (also handles KV products). */
export async function mergeCatalogRecords(accessToken: string, kind: CatalogKind, survivorId: string, duplicateId: string): Promise<Record<string, number>> {
  if (!survivorId || !duplicateId || survivorId === duplicateId) throw new Error('Pick two different records');
  // One atomic RPC (SECURITY DEFINER) re-points every FK referencing the table —
  // junctions, element links, and the self-referential parent_ingredient_id that
  // would otherwise block the delete — de-dups colliding rows, then deletes the
  // duplicate. See migration 20260625_merge_catalog_records_rpc.sql.
  const res = await fetch(`${rest()}/rpc/merge_catalog_records`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({ p_table: CATALOG_CFG[kind].table, p_survivor: survivorId, p_duplicate: duplicateId }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    if (res.status === 404) throw new Error('Merge function not found — apply migration supabase/migrations/20260625_merge_catalog_records_rpc.sql, then retry.');
    throw new Error(`Merge failed (${res.status}): ${detail || res.statusText}`);
  }
  return (await res.json().catch(() => ({}))) || {};
}

/** How many protocol_items across ALL protocols reference this catalog record (for delete warnings). */
export async function countProtocolRefs(accessToken: string, kind: CatalogKind, id: string): Promise<number> {
  const fk = CATALOG_CFG[kind].fk;
  const res = await fetch(`${rest()}/protocol_items?${fk}=eq.${id}&select=id`, {
    method: 'GET',
    headers: headers(accessToken, { Prefer: 'count=exact' }),
  });
  // PostgREST returns the count in Content-Range: 0-24/123
  const cr = res.headers.get('content-range');
  if (cr && cr.includes('/')) { const n = parseInt(cr.split('/')[1], 10); if (!Number.isNaN(n)) return n; }
  const rows = (await handle(res, 'Count refs')) || [];
  return Array.isArray(rows) ? rows.length : 0;
}

/** Upload an image to storage via the admin edge function; returns the public URL. */
export async function uploadProtocolImage(accessToken: string, file: File, bucket = 'catalog-media'): Promise<string> {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/storage/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('bucket', bucket);
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.publicUrl;
}
