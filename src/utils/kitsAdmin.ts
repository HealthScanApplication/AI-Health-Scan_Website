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
export const REGION_FLAG: Record<KitRegion, string> = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', AU: '🇦🇺' };

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
  image_url: string | null; // kit image (falls back to the protocol's image in the UI)
}
export interface KitItem {
  id: string; slug: string; market: KitRegion; lane: 'store' | 'affiliate' | string;
  variant_id: string | null; title: string | null; price_usd: number | null;
  image_url: string | null; affiliate_url: string | null; catalog_product_id: string | null;
  sort: number | null; sku: string | null;
  // economics (20260710_kit_item_economics): margin_pct is a GENERATED column —
  // read-only, recomputed from price_usd/supplier_cost_usd; never PATCH it.
  supplier_cost_usd: number | null; supplier: string | null; commission_pct: number | null;
  margin_pct: number | null;
}
export interface ProtocolLite { id: string; name: string; is_public: boolean | null; source: string | null; image_url: string | null }
export interface RegionRule {
  id: string; item_type: string; item_id: string; region: KitRegion;
  action: 'block' | 'warn' | string; reason: string | null; substitute_item_id: string | null;
}

const KIT_COLS = 'id,protocol_id,slug,market,kind,title,subtitle,cart_url,partner_label,partner_cart_url,price_usd,is_live,items_slug,created_at,image_url';
const ITEM_COLS = 'id,slug,market,lane,variant_id,title,price_usd,image_url,affiliate_url,catalog_product_id,sort,sku,supplier_cost_usd,supplier,commission_pct,margin_pct';

export async function listAllKits(accessToken: string): Promise<ProtocolKit[]> {
  const res = await fetch(`${rest()}/protocol_kits?select=${KIT_COLS}&order=slug.asc,market.asc`, { headers: headers(accessToken) });
  return (await handle(res, 'List kits')) || [];
}
export async function listKitItemsBySlug(accessToken: string, slug: string, market: KitRegion): Promise<KitItem[]> {
  const res = await fetch(`${rest()}/protocol_kit_items?slug=eq.${encodeURIComponent(slug)}&market=eq.${market}&select=${ITEM_COLS}&order=sort.asc.nullslast`, { headers: headers(accessToken) });
  return (await handle(res, 'List kit items')) || [];
}
/** Every item row for one kit slug across ALL regions — feeds the region matrix. */
export async function listKitItemsAllRegions(accessToken: string, slug: string): Promise<KitItem[]> {
  const res = await fetch(`${rest()}/protocol_kit_items?slug=eq.${encodeURIComponent(slug)}&select=${ITEM_COLS}&order=sort.asc.nullslast`, { headers: headers(accessToken) });
  return (await handle(res, 'List kit items')) || [];
}

/* ── region legality rules (catalog_region_rules — what the app blocks/warns per region) ── */
export async function listRegionRules(accessToken: string): Promise<RegionRule[]> {
  const res = await fetch(`${rest()}/catalog_region_rules?select=id,item_type,item_id,region,action,reason,substitute_item_id&order=region.asc`, { headers: headers(accessToken) });
  return (await handle(res, 'List region rules')) || [];
}
export async function createRegionRule(accessToken: string, rule: Partial<RegionRule>): Promise<RegionRule> {
  const res = await fetch(`${rest()}/catalog_region_rules`, { method: 'POST', headers: headers(accessToken, { Prefer: 'return=representation' }), body: JSON.stringify(rule) });
  const rows = await handle(res, 'Create region rule');
  return Array.isArray(rows) ? rows[0] : rows;
}
export async function deleteRegionRule(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${rest()}/catalog_region_rules?id=eq.${id}`, { method: 'DELETE', headers: headers(accessToken) });
  await handle(res, 'Delete region rule');
}

/** Resolve mixed catalog item_ids (rules reference products / ingredients /
 *  activities / supplements by id) → display names. Best-effort per table. */
export async function resolveItemNames(accessToken: string, ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return out;
  const list = uniq.map(encodeURIComponent).join(',');
  const sources: Array<[string, string]> = [
    ['catalog_products', 'id,name_common'],
    ['catalog_ingredients', 'id,name_common'],
    ['catalog_activities', 'id,name'],
    ['hs_supplements', 'id,name'],
  ];
  await Promise.all(sources.map(async ([table, cols]) => {
    try {
      const res = await fetch(`${rest()}/${table}?id=in.(${list})&select=${cols}`, { headers: headers(accessToken) });
      if (!res.ok) return;
      for (const r of await res.json()) if (!out.has(r.id)) out.set(r.id, r.name_common || r.name);
    } catch { /* best-effort */ }
  }));
  return out;
}

export interface ProductHit {
  id: string; name: string; image: string | null; price_usd: number | null;
  shopify_variant_id: string | null; purchase_url: string | null;
  affiliate_link_shopify: string | null; affiliate_url: string | null; affiliate_link_amazon: string | null;
}
/** Product search for adding kit items / picking rule targets & substitutes.
 *  Returns the purchase fields so a picked product can be turned into a fully
 *  linked kit item (see kitItemFieldsFromProduct). */
export async function searchProductsLite(accessToken: string, q: string, limit = 8): Promise<ProductHit[]> {
  const term = q.trim();
  if (!term) return [];
  const res = await fetch(
    `${rest()}/catalog_products?or=(name_common.ilike.*${encodeURIComponent(term)}*,name_brand.ilike.*${encodeURIComponent(term)}*)`
    + `&select=id,name_common,name_brand,image_url,price_usd,shopify_variant_id,purchase_url,affiliate_link_shopify,affiliate_url,affiliate_link_amazon&limit=${limit}`,
    { headers: headers(accessToken) },
  );
  const rows = (await handle(res, 'Search products')) || [];
  return rows.map((r: any) => ({
    id: r.id, name: r.name_common || r.name_brand || r.id, image: r.image_url, price_usd: r.price_usd ?? null,
    shopify_variant_id: r.shopify_variant_id ?? null, purchase_url: r.purchase_url ?? null,
    affiliate_link_shopify: r.affiliate_link_shopify ?? null, affiliate_url: r.affiliate_url ?? null, affiliate_link_amazon: r.affiliate_link_amazon ?? null,
  }));
}

export interface ProtocolSuggestion extends ProductHit { mentions: number; protocolTitle: string; kinds: string[] }
/** Products the PROTOCOL already references (protocol_items.catalog_product_id)
 *  — the natural candidates to fill an empty/partial kit. Deduped by product,
 *  with the protocol's own display name (e.g. "Wild Yam Cream — Male") and how
 *  many steps mention it. This is the junction to link: protocol → product →
 *  kit item. */
export async function listProtocolBuyableProducts(accessToken: string, protocolId: string): Promise<ProtocolSuggestion[]> {
  const itRes = await fetch(
    `${rest()}/protocol_items?protocol_id=eq.${protocolId}&catalog_product_id=not.is.null&select=display_name,catalog_product_id,kind,sort_order&order=sort_order.asc.nullslast&limit=500`,
    { headers: headers(accessToken) },
  );
  const items: any[] = (await handle(itRes, 'Protocol items')) || [];
  if (!items.length) return [];
  const byProduct = new Map<string, { title: string; mentions: number; kinds: Set<string> }>();
  for (const it of items) {
    const cur = byProduct.get(it.catalog_product_id) || { title: it.display_name || it.catalog_product_id, mentions: 0, kinds: new Set<string>() };
    cur.mentions += 1;
    if (it.kind) cur.kinds.add(it.kind);
    byProduct.set(it.catalog_product_id, cur);
  }
  const ids = [...byProduct.keys()];
  const prodRes = await fetch(
    `${rest()}/catalog_products?id=in.(${ids.map(encodeURIComponent).join(',')})`
    + `&select=id,name_common,name_brand,image_url,price_usd,shopify_variant_id,purchase_url,affiliate_link_shopify,affiliate_url,affiliate_link_amazon`,
    { headers: headers(accessToken) },
  );
  const prodById = new Map<string, any>(((await handle(prodRes, 'Products')) || []).map((p: any) => [p.id, p]));
  return ids.map((id) => {
    const meta = byProduct.get(id)!; const p = prodById.get(id) || {};
    return {
      id, name: meta.title, protocolTitle: meta.title, mentions: meta.mentions, kinds: [...meta.kinds],
      image: p.image_url ?? null, price_usd: p.price_usd ?? null, shopify_variant_id: p.shopify_variant_id ?? null,
      purchase_url: p.purchase_url ?? null, affiliate_link_shopify: p.affiliate_link_shopify ?? null,
      affiliate_url: p.affiliate_url ?? null, affiliate_link_amazon: p.affiliate_link_amazon ?? null,
    };
  }).sort((a, b) => b.mentions - a.mentions);
}

/** BULK version of listProtocolBuyableProducts for the master table: every
 *  product any protocol's steps link to, grouped by protocol_id — so the table
 *  can render "the protocol mentions this but it's NOT in the kit" rows without
 *  one request per protocol. Two round-trips (items + chunked product resolve). */
export async function listAllProtocolProductMentions(accessToken: string): Promise<Map<string, ProtocolSuggestion[]>> {
  const itRes = await fetch(
    `${rest()}/protocol_items?catalog_product_id=not.is.null&select=protocol_id,display_name,catalog_product_id,kind&limit=10000`,
    { headers: headers(accessToken) },
  );
  const rows: any[] = (await handle(itRes, 'Protocol product links')) || [];
  if (!rows.length) return new Map();
  // per (protocol, product): display name + mention count
  const byProto = new Map<string, Map<string, { title: string; mentions: number; kinds: Set<string> }>>();
  const allIds = new Set<string>();
  for (const it of rows) {
    allIds.add(it.catalog_product_id);
    const m = byProto.get(it.protocol_id) || new Map();
    const cur = m.get(it.catalog_product_id) || { title: it.display_name || it.catalog_product_id, mentions: 0, kinds: new Set<string>() };
    cur.mentions += 1;
    if (it.kind) cur.kinds.add(it.kind);
    m.set(it.catalog_product_id, cur);
    byProto.set(it.protocol_id, m);
  }
  // resolve products in chunks — in.() URLs get long
  const prodById = new Map<string, any>();
  const ids = [...allIds];
  for (let at = 0; at < ids.length; at += 80) {
    const res = await fetch(
      `${rest()}/catalog_products?id=in.(${ids.slice(at, at + 80).map(encodeURIComponent).join(',')})`
      + `&select=id,name_common,image_url,price_usd,shopify_variant_id,purchase_url,affiliate_link_shopify,affiliate_url,affiliate_link_amazon`,
      { headers: headers(accessToken) },
    );
    for (const p of ((await handle(res, 'Products')) || [])) prodById.set(p.id, p);
  }
  const out = new Map<string, ProtocolSuggestion[]>();
  for (const [protoId, prods] of byProto) {
    out.set(protoId, [...prods.entries()].map(([id, meta]) => {
      const p = prodById.get(id) || {};
      return {
        id, name: meta.title, protocolTitle: meta.title, mentions: meta.mentions, kinds: [...meta.kinds],
        image: p.image_url ?? null, price_usd: p.price_usd ?? null, shopify_variant_id: p.shopify_variant_id ?? null,
        purchase_url: p.purchase_url ?? null, affiliate_link_shopify: p.affiliate_link_shopify ?? null,
        affiliate_url: p.affiliate_url ?? null, affiliate_link_amazon: p.affiliate_link_amazon ?? null,
      };
    }).sort((a, b) => b.mentions - a.mentions));
  }
  return out;
}

/** Re-point a whole kit (all its region rows, matched by slug) to a different
 *  protocol. Keeps slug + items stable — only which protocol it displays under. */
export async function updateKitProtocol(accessToken: string, slug: string, protocolId: string): Promise<void> {
  const res = await fetch(`${rest()}/protocol_kits?slug=eq.${encodeURIComponent(slug)}`, {
    method: 'PATCH', headers: headers(accessToken), body: JSON.stringify({ protocol_id: protocolId }),
  });
  await handle(res, 'Re-point kit');
}

/** Kit-item fields for a picked catalog product — lane derived exactly like the
 *  mobile app (numeric shopify_variant_id → store lane, else its affiliate /
 *  purchase URL → affiliate lane). The item arrives LINKED (catalog_product_id
 *  set) so region-legality badges and compliant copying work automatically. */
export function kitItemFieldsFromProduct(p: ProductHit): Partial<KitItem> {
  const variant = String(p.shopify_variant_id || '').trim();
  const isStore = /^\d+$/.test(variant);
  const affiliate = p.purchase_url || p.affiliate_link_shopify || p.affiliate_url || p.affiliate_link_amazon || null;
  return {
    title: p.name, catalog_product_id: p.id, price_usd: p.price_usd, image_url: p.image,
    lane: isStore ? 'store' : 'affiliate',
    variant_id: isStore ? variant : null,
    affiliate_url: isStore ? null : affiliate,
  };
}

/** A kit item is sellable when it has a purchase path: a numeric Shopify
 *  variant (store lane) OR an affiliate URL. Linking a catalog product is the
 *  usual way to get one, but items can also be filled in by hand. */
export function kitItemBuyPath(i: { variant_id?: string | null; affiliate_url?: string | null }): 'store' | 'affiliate' | null {
  if (/^\d+$/.test(String(i.variant_id || ''))) return 'store';
  if (i.affiliate_url) return 'affiliate';
  return null;
}

/** Link an EXISTING kit item to a catalog product: sets catalog_product_id (so
 *  region-legality + coverage work) and upgrades its purchase path from the
 *  product — a Shopify variant → store lane, else the product's affiliate/
 *  purchase URL → affiliate lane. Never clobbers a title or a purchase path the
 *  admin already set (only fills blanks). */
export async function linkKitItemToProduct(accessToken: string, item: KitItem, p: ProductHit): Promise<void> {
  const variant = String(p.shopify_variant_id || '').trim();
  const isStore = /^\d+$/.test(variant);
  const affiliate = p.purchase_url || p.affiliate_link_shopify || p.affiliate_url || p.affiliate_link_amazon || null;
  const patch: Partial<KitItem> = { catalog_product_id: p.id };
  const hadPath = !!kitItemBuyPath(item);
  if (isStore) { patch.lane = 'store'; patch.variant_id = variant; patch.affiliate_url = null; }
  else if (affiliate && !hadPath) { patch.lane = 'affiliate'; patch.affiliate_url = affiliate; }
  if (p.image && !item.image_url) patch.image_url = p.image;
  if (p.price_usd != null && item.price_usd == null) patch.price_usd = p.price_usd;
  await updateKitItem(accessToken, item.id, patch);
}

/** slug+market of every kit item — one lightweight fetch for overview counts. */
export async function listKitItemCounts(accessToken: string): Promise<Map<string, Partial<Record<KitRegion, number>>>> {
  const res = await fetch(`${rest()}/protocol_kit_items?select=slug,market`, { headers: headers(accessToken) });
  const rows: { slug: string; market: KitRegion }[] = (await handle(res, 'Count kit items')) || [];
  const m = new Map<string, Partial<Record<KitRegion, number>>>();
  for (const r of rows) {
    const cur = m.get(r.slug) || {};
    cur[r.market] = (cur[r.market] || 0) + 1;
    m.set(r.slug, cur);
  }
  return m;
}

/** Clone ONE kit item into a target market, honouring an optional BLOCK rule:
 *  with a substitute defined the substitute PRODUCT is inserted instead — lane
 *  derived the way the mobile app does (numeric shopify_variant_id → store,
 *  else its affiliate/purchase URL → affiliate). Returns what happened. */
export async function cloneKitItem(
  accessToken: string, slug: string, it: KitItem, to: KitRegion, blockRule?: RegionRule,
): Promise<{ outcome: 'copied' | 'substituted' | 'blocked'; detail: string }> {
  const base: Partial<KitItem> = {
    slug, market: to, lane: it.lane, variant_id: it.variant_id, title: it.title,
    price_usd: it.price_usd, image_url: it.image_url, affiliate_url: it.affiliate_url,
    catalog_product_id: it.catalog_product_id, sort: it.sort, sku: it.sku,
    supplier_cost_usd: it.supplier_cost_usd, supplier: it.supplier, commission_pct: it.commission_pct,
  };
  if (blockRule) {
    if (!blockRule.substitute_item_id) return { outcome: 'blocked', detail: it.title || it.id };
    let sub: any = null;
    try {
      const res = await fetch(
        `${rest()}/catalog_products?id=eq.${encodeURIComponent(blockRule.substitute_item_id)}&select=id,name_common,name_brand,price_usd,image_url,shopify_variant_id,purchase_url,affiliate_link_shopify,affiliate_url,affiliate_link_amazon&limit=1`,
        { headers: headers(accessToken) },
      );
      if (res.ok) sub = (await res.json())[0] || null;
    } catch { /* fall through to name-only */ }
    const subName = sub?.name_common || sub?.name_brand || blockRule.substitute_item_id;
    const subVariant = String(sub?.shopify_variant_id || '').trim();
    const subAffiliate = sub?.purchase_url || sub?.affiliate_link_shopify || sub?.affiliate_url || sub?.affiliate_link_amazon || null;
    await createKitItem(accessToken, {
      ...base,
      title: subName,
      catalog_product_id: blockRule.substitute_item_id,
      lane: /^\d+$/.test(subVariant) ? 'store' : 'affiliate',
      variant_id: /^\d+$/.test(subVariant) ? subVariant : null,
      affiliate_url: /^\d+$/.test(subVariant) ? null : subAffiliate,
      price_usd: sub?.price_usd ?? it.price_usd,
      image_url: sub?.image_url ?? null,
      supplier_cost_usd: null, supplier: null, commission_pct: null, // economics don't transfer to a different product
    });
    return { outcome: 'substituted', detail: `${it.title} → ${subName}` };
  }
  await createKitItem(accessToken, base);
  return { outcome: 'copied', detail: it.title || it.id };
}

/** Copy one region's kit items into another region, compliance-aware:
 *  items already present in the target (same title) are left alone; items whose
 *  linked product is BLOCKED in the target region are skipped (or swapped for
 *  the rule's substitute when one is defined). Warn-level rules copy through
 *  (the app shows the warning). Items with no catalog link copy as-is — flagged
 *  in the summary so the admin reviews them manually. */
export async function copyKitRegion(
  accessToken: string, slug: string, from: KitRegion, to: KitRegion, rules: RegionRule[],
): Promise<{ copied: number; skippedBlocked: string[]; substituted: string[]; unlinked: string[] }> {
  const all = await listKitItemsAllRegions(accessToken, slug);
  const src = all.filter((i) => i.market === from);
  const dst = all.filter((i) => i.market === to);
  const dstTitles = new Set(dst.map((i) => (i.title || '').toLowerCase()));
  const dstProducts = new Set(dst.map((i) => i.catalog_product_id).filter(Boolean));
  const blockRules = new Map(rules.filter((r) => r.region === to && r.action === 'block').map((r) => [r.item_id, r]));
  const summary = { copied: 0, skippedBlocked: [] as string[], substituted: [] as string[], unlinked: [] as string[] };
  for (const it of src) {
    // already present in the target? Match by title, by linked product, or — for a
    // blocked item — by its rule's SUBSTITUTE product (a re-run must not insert the
    // substitute twice: the target holds the substitute's title/product, not the source's).
    const rulePeek = it.catalog_product_id ? blockRules.get(it.catalog_product_id) : undefined;
    if (dstTitles.has((it.title || '').toLowerCase())) continue;
    if (it.catalog_product_id && dstProducts.has(it.catalog_product_id)) continue;
    if (rulePeek?.substitute_item_id && dstProducts.has(rulePeek.substitute_item_id)) continue;
    const rule = rulePeek;
    const r = await cloneKitItem(accessToken, slug, it, to, rule);
    if (r.outcome === 'copied') { summary.copied += 1; if (!it.catalog_product_id) summary.unlinked.push(it.title || it.id); }
    else if (r.outcome === 'substituted') summary.substituted.push(r.detail);
    else summary.skippedBlocked.push(r.detail);
  }
  return summary;
}
/** All protocols visible in the admin (id/name/public/source) — for resolving
 *  protocol_kits.protocol_id → a name, and for the "missing a kit" audit. */
export async function listAllProtocolsLite(accessToken: string): Promise<ProtocolLite[]> {
  const res = await fetch(`${rest()}/protocols?select=id,name,is_public,source,image_url&order=name.asc`, { headers: headers(accessToken) });
  return (await handle(res, 'List protocols')) || [];
}

/** Every kit item across every kit and region — the flat master table. */
export async function listAllKitItems(accessToken: string): Promise<KitItem[]> {
  const res = await fetch(`${rest()}/protocol_kit_items?select=${ITEM_COLS}&order=slug.asc,market.asc,sort.asc.nullslast`, { headers: headers(accessToken) });
  return (await handle(res, 'List all kit items')) || [];
}

/** protocol_id → number of protocol_items linked to a catalog product. Feeds
 *  the "which protocols are missing products" audit (a protocol with no kit
 *  items AND no product links has nothing sellable at all). */
export async function listProtocolProductLinkCounts(accessToken: string): Promise<Map<string, number>> {
  const res = await fetch(`${rest()}/protocol_items?select=protocol_id&catalog_product_id=not.is.null&limit=5000`, { headers: headers(accessToken) });
  const rows: { protocol_id: string }[] = (await handle(res, 'Count product links')) || [];
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.protocol_id, (m.get(r.protocol_id) || 0) + 1);
  return m;
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
