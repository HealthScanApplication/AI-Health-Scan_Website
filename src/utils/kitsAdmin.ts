/*
 * kitsAdmin — CRUD + coverage audit for the REAL "buy this protocol's kit"
 * feature (protocol_kits / protocol_kit_items / catalog_region_rules).
 *
 * Distinct from `hs_packages`/`package_items` (the "Packages" tab): those two
 * tables have zero rows of items and are not read anywhere in the mobile app.
 * protocol_kits is what src/components/ProtocolKitButton.tsx in the mobile
 * repo actually queries (via the anon key, `stagingSupabase`) to render the
 * "Shop the Kit" button on a protocol screen — store lane (HealthScan Shopify
 * variant) + affiliate lane (external brand link), gated by `is_live` and the
 * user's region (US/EU/UK/AU). `protocol_kits.protocol_id` has an FK to
 * `catalog_protocols`, which is the REAL table behind the `protocols` VIEW
 * the rest of the admin edits — so any protocol_id valid in `protocols` is
 * automatically valid here (protocols is a plain, updatable 1:1 view).
 */
import { projectId, publicAnonKey } from './supabase/info';

const rest = () => `https://${projectId}.supabase.co/rest/v1`;
const REGIONS = ['US', 'EU', 'UK', 'AU'] as const;
export type KitRegion = (typeof REGIONS)[number];
export { REGIONS };

function headers(accessToken: string, extra: Record<string, string> = {}) {
  return { apikey: publicAnonKey, Authorization: `Bearer ${accessToken || publicAnonKey}`, 'Content-Type': 'application/json', ...extra };
}
async function handle(res: Response, ctx: string): Promise<any> {
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { detail = await res.text().catch(() => ''); }
    throw new Error(`${ctx} failed (${res.status}): ${detail || res.statusText}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export interface ProtocolKit {
  id: string; protocol_id: string; slug: string; market: KitRegion; kind: string | null;
  title: string | null; subtitle: string | null; cart_url: string | null;
  partner_label: string | null; partner_cart_url: string | null;
  price_usd: number | null; is_live: boolean; items_slug: string | null; created_at?: string;
}
export interface KitItem {
  id: string; slug: string; market: KitRegion; lane: 'store' | 'affiliate' | string;
  variant_id: string | null; title: string | null; price_usd: number | null;
  image_url: string | null; affiliate_url: string | null; catalog_product_id: string | null;
  sort: number | null; sku: string | null;
}
export interface ProtocolLite { id: string; name: string; is_public: boolean | null; source: string | null }

const KIT_COLS = 'id,protocol_id,slug,market,kind,title,subtitle,cart_url,partner_label,partner_cart_url,price_usd,is_live,items_slug,created_at';
const ITEM_COLS = 'id,slug,market,lane,variant_id,title,price_usd,image_url,affiliate_url,catalog_product_id,sort,sku';

export async function listAllKits(accessToken: string): Promise<ProtocolKit[]> {
  const res = await fetch(`${rest()}/protocol_kits?select=${KIT_COLS}&order=slug.asc,market.asc`, { headers: headers(accessToken) });
  return (await handle(res, 'List kits')) || [];
}
export async function listKitItemsBySlug(accessToken: string, slug: string, market: KitRegion): Promise<KitItem[]> {
  const res = await fetch(`${rest()}/protocol_kit_items?slug=eq.${encodeURIComponent(slug)}&market=eq.${market}&select=${ITEM_COLS}&order=sort.asc.nullslast`, { headers: headers(accessToken) });
  return (await handle(res, 'List kit items')) || [];
}
/** All protocols visible in the admin (id/name/public/source) — for resolving
 *  protocol_kits.protocol_id → a name, and for the "missing a kit" audit. */
export async function listAllProtocolsLite(accessToken: string): Promise<ProtocolLite[]> {
  const res = await fetch(`${rest()}/protocols?select=id,name,is_public,source&order=name.asc`, { headers: headers(accessToken) });
  return (await handle(res, 'List protocols')) || [];
}

export async function createKit(accessToken: string, kit: Partial<ProtocolKit>): Promise<ProtocolKit> {
  const res = await fetch(`${rest()}/protocol_kits`, { method: 'POST', headers: headers(accessToken, { Prefer: 'return=representation' }), body: JSON.stringify(kit) });
  const rows = await handle(res, 'Create kit');
  return Array.isArray(rows) ? rows[0] : rows;
}
export async function updateKit(accessToken: string, id: string, patch: Partial<ProtocolKit>): Promise<void> {
  const res = await fetch(`${rest()}/protocol_kits?id=eq.${id}`, { method: 'PATCH', headers: headers(accessToken), body: JSON.stringify(patch) });
  await handle(res, 'Update kit');
}
export async function deleteKit(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${rest()}/protocol_kits?id=eq.${id}`, { method: 'DELETE', headers: headers(accessToken) });
  await handle(res, 'Delete kit');
}

export async function createKitItem(accessToken: string, item: Partial<KitItem>): Promise<KitItem> {
  const res = await fetch(`${rest()}/protocol_kit_items`, { method: 'POST', headers: headers(accessToken, { Prefer: 'return=representation' }), body: JSON.stringify(item) });
  const rows = await handle(res, 'Create kit item');
  return Array.isArray(rows) ? rows[0] : rows;
}
export async function updateKitItem(accessToken: string, id: string, patch: Partial<KitItem>): Promise<void> {
  const res = await fetch(`${rest()}/protocol_kit_items?id=eq.${id}`, { method: 'PATCH', headers: headers(accessToken), body: JSON.stringify(patch) });
  await handle(res, 'Update kit item');
}
export async function deleteKitItem(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${rest()}/protocol_kit_items?id=eq.${id}`, { method: 'DELETE', headers: headers(accessToken) });
  await handle(res, 'Delete kit item');
}

/** Same slugify the mobile app uses (protocolKitSlug) — keeps a new kit's slug
 *  matching what ProtocolKitButton looks up by protocol name. */
export function kitSlugFor(name: string): string {
  return (name || '').toLowerCase().trim().replace(/\(yours\)$/i, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Create all 4 region rows for a protocol in one shot (all is_live=false —
 *  nothing goes live until an admin reviews items and flips it on). */
export async function createKitAllRegions(accessToken: string, protocolId: string, protocolName: string): Promise<ProtocolKit[]> {
  const slug = kitSlugFor(protocolName);
  const created: ProtocolKit[] = [];
  for (const market of REGIONS) {
    created.push(await createKit(accessToken, { protocol_id: protocolId, slug, market, title: `${protocolName} Essentials`, is_live: false }));
  }
  return created;
}
