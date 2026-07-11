/**
 * KitsMasterTable — the flat operations view over EVERY kit item:
 * one row per product per region, with the columns the sourcing work needs —
 * region, kit, lane (store/affiliate), product, dropship supplier, linked-or-
 * not, cost / sell / margin / commission, live state. Filterable by region,
 * lane, linked and text; exports CSV for spreadsheet work with suppliers.
 *
 * Also hosts the protocol product-coverage audit: protocols where we have
 * NOTHING to sell (no kit items and no product-linked steps) vs. fallback-only.
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Download, ExternalLink, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  REGIONS, REGION_FLAG, kitItemBuyPath, kitItemFieldsFromProduct, createKitItem, updateKitItem,
  fmtMoney, itemMarginPct, itemSellUsd, listFxRates,
  type KitItem, type ProtocolKit, type ProtocolLite, type KitRegion, type RegionRule, type ProtocolSuggestion,
} from '../../utils/kitsAdmin';
import { useEffect } from 'react';

const sel = 'sb-select';

/* HealthScan's Shopify admin (DEV-354/DEV-416) — store-lane rows deep-link here */
const SHOPIFY_ADMIN = 'https://admin.shopify.com/store/healthscan';

const hostOf = (url: string | null): string | null => {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
};
/** Supplier favicon via the domain of wherever this row actually sells. */
const faviconFor = (url: string | null): string | null => {
  const h = hostOf(url);
  return h ? `https://www.google.com/s2/favicons?domain=${h}&sz=32` : null;
};
/** Where "the store" is for this row: affiliate rows → the partner storefront;
 *  store rows with a real Shopify variant → our Shopify admin (search by title). */
const itemStoreUrl = (i: KitItem): string | null => {
  if (kitItemBuyPath(i) === 'store') return `${SHOPIFY_ADMIN}/products?query=${encodeURIComponent(i.title || i.sku || '')}`;
  return i.affiliate_url || null;
};
/** Label matches the href (itemStoreUrl) — both key on buy path, not lane,
 *  so a mislaned row can't show a Shopify label linking to a partner site. */
const supplierLabel = (i: KitItem): string => {
  if (i.supplier) return i.supplier;
  if (kitItemBuyPath(i) === 'store') return 'HealthScan store';
  return hostOf(i.affiliate_url) || '—';
};

/** tiny square thumbnail with a theme-safe placeholder */
function Thumb({ src, size = 20 }: { src: string | null | undefined; size?: number }) {
  return src
    ? <img src={src} alt="" loading="lazy" style={{ width: size, height: size, borderRadius: 4, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--sb-border)' }} />
    : <span style={{ width: size, height: size, borderRadius: 4, background: 'var(--sb-hover)', flexShrink: 0, display: 'inline-block', border: '1px solid var(--sb-border)' }} />;
}

/** a protocol-mentioned product that is NOT in this kit region yet */
interface MissingRow { key: string; slug: string; market: KitRegion; kit: ProtocolKit; product: ProtocolSuggestion }

type SortKey = 'region' | 'kit' | 'protocol' | 'product' | 'supplier' | 'cost' | 'sell' | 'margin';
/** clickable header cell: click cycles asc → desc → default grouping */
function SortTh({ k, sortCol, onSort, children, style, title }: {
  k: SortKey; sortCol: { key: SortKey; dir: 1 | -1 } | null; onSort: (k: SortKey) => void;
  children: React.ReactNode; style?: React.CSSProperties; title?: string;
}) {
  const active = sortCol?.key === k;
  return (
    <th style={{ ...style, cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(k)}
      title={title || 'Click to sort (again to flip, third click restores kit grouping)'}>
      <span style={active ? { color: 'var(--sb-brand-strong)' } : undefined}>
        {children}{active ? (sortCol!.dir === 1 ? ' ↑' : ' ↓') : ''}
      </span>
    </th>
  );
}

export function KitsMasterTable({ items, kits, protocols, rules, itemCounts, productLinkCounts, mentions, accessToken, onOpenKit, onOpenProtocol, onOpenProduct, onItemsChanged }: {
  items: KitItem[]; kits: ProtocolKit[]; protocols: ProtocolLite[]; rules: RegionRule[];
  itemCounts: Map<string, Partial<Record<KitRegion, number>>>;
  productLinkCounts: Map<string, number>;
  /** protocol_id → products its steps link to (bulk) — drives the MISSING rows */
  mentions?: Map<string, ProtocolSuggestion[]>;
  accessToken?: string;
  /** open the kit's edit modal (KitsPanel's detail modal hosts KitMatrix + ProtocolReassign) */
  onOpenKit?: (slug: string) => void;
  /** open the protocol itself in the Protocols editor */
  onOpenProtocol?: (protocolId: string) => void;
  /** open a catalog product in the record modal (linked items + missing rows) */
  /** open the product to edit: with an id → the catalog record modal; without
   *  (unlinked kit item) → the Products tab pre-searched by title */
  onOpenProduct?: (catalogProductId: string | null, title?: string) => void;
  /** refresh the master items after an add */
  onItemsChanged?: () => void;
}) {
  const [fRegion, setFRegion] = useState('');
  const [fLane, setFLane] = useState('');
  const [fLinked, setFLinked] = useState('');
  const [fBuy, setFBuy] = useState('');
  const [fText, setFText] = useState('');
  // FX for margin display — sell prices are region-local, costs are USD
  const [fx, setFx] = useState<Record<string, number>>({ USD: 1 });
  useEffect(() => { if (accessToken) listFxRates(accessToken).then(setFx).catch(() => {}); }, [accessToken]);

  const protoName = useMemo(() => new Map(protocols.map((p) => [p.id, p.name])), [protocols]);
  const protoImage = useMemo(() => new Map(protocols.map((p) => [p.id, p.image_url])), [protocols]);
  const kitBySlugMarket = useMemo(() => new Map(kits.map((k) => [`${k.slug}:${k.market}`, k])), [kits]);

  const rows = useMemo(() => items.filter((i) => {
    if (fRegion && i.market !== fRegion) return false;
    if (fLane && i.lane !== fLane) return false;
    if (fLinked === 'yes' && !i.catalog_product_id) return false;
    if (fLinked === 'no' && i.catalog_product_id) return false;
    if (fBuy === 'yes' && !kitItemBuyPath(i)) return false;
    if (fBuy === 'no' && kitItemBuyPath(i)) return false;
    if (fText.trim()) {
      const t = fText.trim().toLowerCase();
      const kit = kitBySlugMarket.get(`${i.slug}:${i.market}`);
      const proto = kit ? protoName.get(kit.protocol_id) || '' : '';
      if (![i.title, i.slug, i.supplier, proto].some((v) => (v || '').toLowerCase().includes(t))) return false;
    }
    return true;
  }), [items, fRegion, fLane, fLinked, fBuy, fText, kitBySlugMarket, protoName]);

  /* ── MISSING rows: products the protocol's steps link to that are NOT in the
     kit for that region. Matched out by catalog_product_id AND by a loose
     title match (so a same-named but not-yet-linked kit item doesn't get
     double-reported). Actionable: "+ Add" creates the kit item, linked. ── */
  const missingAll = useMemo<MissingRow[]>(() => {
    if (!mentions?.size) return [];
    const norm = (s: string | null | undefined) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const idx = new Map<string, { ids: Set<string>; titles: string[] }>();
    for (const i of items) {
      const k = `${i.slug}:${i.market}`;
      const e = idx.get(k) || { ids: new Set<string>(), titles: [] };
      if (i.catalog_product_id) e.ids.add(i.catalog_product_id);
      const t = norm(i.title); if (t) e.titles.push(t);
      idx.set(k, e);
    }
    const out: MissingRow[] = [];
    for (const kit of kits) {
      const sugg = mentions.get(kit.protocol_id);
      if (!sugg?.length) continue;
      const e = idx.get(`${kit.slug}:${kit.market}`) || { ids: new Set<string>(), titles: [] };
      for (const p of sugg) {
        if (e.ids.has(p.id)) continue;
        const pn = norm(p.name);
        if (pn && e.titles.some((t) => t.includes(pn) || pn.includes(t))) continue;
        out.push({ key: `${kit.slug}:${kit.market}:${p.id}`, slug: kit.slug, market: kit.market, kit, product: p });
      }
    }
    return out;
  }, [mentions, items, kits]);

  const missingRows = useMemo(() => {
    // missing rows only make sense with the item-level filters at rest
    if ((fLane && fLane !== 'missing') || fLinked || fBuy) return [];
    return missingAll.filter((m) => {
      if (fRegion && m.market !== fRegion) return false;
      if (fText.trim()) {
        const t = fText.trim().toLowerCase();
        const proto = protoName.get(m.kit.protocol_id) || '';
        if (![m.product.name, m.slug, proto].some((v) => (v || '').toLowerCase().includes(t))) return false;
      }
      return true;
    });
  }, [missingAll, fRegion, fLane, fLinked, fBuy, fText, protoName]);

  // column sort (click a header): null = the default kit/region grouping
  const [sortCol, setSortCol] = useState<null | { key: 'region' | 'kit' | 'protocol' | 'product' | 'supplier' | 'cost' | 'sell' | 'margin'; dir: 1 | -1 }>(null);
  const clickSort = (key: NonNullable<typeof sortCol>['key']) =>
    setSortCol((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));

  // merged display: per kit+region, real items first, then its missing products;
  // an active column sort flattens item rows (missing rows sink to the end)
  const display = useMemo(() => {
    const key = (slug: string, market: KitRegion, missing: 0 | 1, name: string) =>
      `${slug}\u0000${REGIONS.indexOf(market)}\u0000${missing}\u0000${name.toLowerCase()}`;
    const all: Array<{ t: 'item'; i: KitItem; k: string } | { t: 'missing'; m: MissingRow; k: string }> = [
      ...(fLane === 'missing' ? [] : rows).map((i) => ({ t: 'item' as const, i, k: key(i.slug, i.market, 0, i.title || '') })),
      ...missingRows.map((m) => ({ t: 'missing' as const, m, k: key(m.slug, m.market, 1, m.product.name) })),
    ];
    if (!sortCol) return all.sort((a, b) => a.k.localeCompare(b.k));
    const val = (r: (typeof all)[number]): string | number => {
      if (r.t === 'missing') {
        return sortCol.key === 'product' ? r.m.product.name.toLowerCase()
          : sortCol.key === 'kit' ? r.m.slug : sortCol.key === 'region' ? r.m.market
          : sortCol.key === 'protocol' ? (protoName.get(r.m.kit.protocol_id) || '').toLowerCase()
          : sortCol.key === 'sell' ? Number(r.m.product.price_usd) || 0 : '';
      }
      const i = r.i;
      switch (sortCol.key) {
        case 'region': return i.market;
        case 'kit': return i.slug;
        case 'protocol': { const kit = kitBySlugMarket.get(`${i.slug}:${i.market}`); return (kit ? protoName.get(kit.protocol_id) || '' : '').toLowerCase(); }
        case 'product': return (i.title || '').toLowerCase();
        case 'supplier': return (i.supplier || '').toLowerCase();
        case 'cost': return Number(i.supplier_cost_usd) || 0;
        case 'sell': return itemSellUsd(i, fx) ?? 0; // fx-normalized so €/£/A$ sort together
        case 'margin': return itemMarginPct(i, fx) ?? -1;
      }
    };
    return all.sort((a, b) => {
      if (a.t !== b.t) return a.t === 'item' ? -1 : 1; // missing rows last while sorting
      const va = val(a), vb = val(b);
      const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return c * sortCol.dir;
    });
  }, [rows, missingRows, fLane, sortCol, protoName, kitBySlugMarket, fx]);

  // which coverage bucket's protocol list is expanded (click a card to toggle)
  const [auditOpen, setAuditOpen] = useState<null | 'nothing' | 'fallbackOnly' | 'curated'>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);

  // ── batch actions: multi-select leaf items → bulk-set affiliate link /
  //    supplier / lane across the selection (build & fix kits fast) ──
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectMany = (ids: string[], on: boolean) => setSelected((s) => { const n = new Set(s); ids.forEach((id) => on ? n.add(id) : n.delete(id)); return n; });
  const bulkUpdate = async (patch: Partial<KitItem>, label: string) => {
    const ids = [...selected];
    if (!ids.length || !accessToken) return;
    setBatchBusy(true);
    try {
      for (const id of ids) await updateKitItem(accessToken, id, patch);
      toast.success(`${label} — ${ids.length} item${ids.length === 1 ? '' : 's'}`);
      setSelected(new Set());
      onItemsChanged?.();
    } catch (e: any) { toast.error(`Batch failed: ${e?.message || e}`); }
    finally { setBatchBusy(false); }
  };
  const batchSetAffiliate = () => {
    const url = window.prompt('Affiliate URL to write to the selected items (also sets lane = affiliate):');
    if (url == null) return;
    if (!/^https?:\/\//i.test(url.trim())) { toast.error('Enter a full http(s):// URL'); return; }
    bulkUpdate({ affiliate_url: url.trim(), lane: 'affiliate' }, 'Set affiliate link');
  };
  const batchSetSupplier = () => {
    const s = window.prompt('Supplier / dropship provider name for the selected items (e.g. Supliful, Suplify EU, Specialist UK):');
    if (s == null) return;
    bulkUpdate({ supplier: s.trim() || null }, 'Set supplier');
  };
  const batchSetLane = (lane: 'store' | 'affiliate') => bulkUpdate({ lane }, `Set lane → ${lane}`);

  // ── tree view: kit (parent) → region → products, all collapsible ──
  const [expandedKits, setExpandedKits] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const toggleKit = (slug: string) => setExpandedKits((s) => { const n = new Set(s); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });
  const toggleRegion = (key: string) => setExpandedRegions((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  // group the filtered+sorted display rows into kit → region → rows (kit order =
  // first appearance; within-region order preserves the active column sort)
  const tree = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, { slug: string; protocolId: string | undefined; name: string; kitImg: string | null; protoImg: string | null; marketsOrder: KitRegion[]; markets: Map<KitRegion, { kit: ProtocolKit | undefined; rows: typeof display }> }>();
    for (const row of display) {
      const slug = row.t === 'item' ? row.i.slug : row.m.slug;
      const market = (row.t === 'item' ? row.i.market : row.m.market) as KitRegion;
      const kit = kitBySlugMarket.get(`${slug}:${market}`) || (row.t === 'missing' ? row.m.kit : undefined);
      const protocolId = kit?.protocol_id;
      if (!map.has(slug)) {
        const anyKit = kits.find((k) => k.slug === slug);
        const img = anyKit?.image_url || (protocolId ? protoImage.get(protocolId) : null) || null;
        map.set(slug, { slug, protocolId, name: (protocolId && protoName.get(protocolId)) || slug, kitImg: img, protoImg: protocolId ? protoImage.get(protocolId) || null : null, marketsOrder: [], markets: new Map() });
        order.push(slug);
      }
      const K = map.get(slug)!;
      if (!K.markets.has(market)) { K.markets.set(market, { kit, rows: [] as any }); K.marketsOrder.push(market); }
      (K.markets.get(market)!.rows as any).push(row);
    }
    return order.map((s) => map.get(s)!);
  }, [display, kits, protoName, protoImage, kitBySlugMarket]);
  const COLS = 14; // leaf columns incl. the select checkbox (Region/Kit/Protocol are the parent rows)
  const addMissing = async (m: MissingRow) => {
    if (!accessToken) return;
    setAddingKey(m.key);
    try {
      await createKitItem(accessToken, { slug: m.slug, market: m.market, sort: 999, ...kitItemFieldsFromProduct(m.product) });
      toast.success(`Added "${m.product.name}" to ${m.slug} · ${m.market}`);
      onItemsChanged?.();
    } catch (e: any) { toast.error(`Add failed: ${e?.message || e}`); }
    finally { setAddingKey(null); }
  };

  const ruleFor = (i: KitItem) => (i.catalog_product_id ? rules.find((r) => r.region === i.market && r.item_id === i.catalog_product_id) : undefined);

  // protocol coverage audit
  const coverage = useMemo(() => {
    const slugItemTotal = (slug: string) => Object.values(itemCounts.get(slug) || {}).reduce((s, n) => s + (n || 0), 0);
    const kitsByProtocol = new Map<string, ProtocolKit[]>();
    for (const k of kits) { const a = kitsByProtocol.get(k.protocol_id) || []; a.push(k); kitsByProtocol.set(k.protocol_id, a); }
    const audit = protocols.filter((p) => p.is_public && p.source === 'system').map((p) => {
      const pKits = kitsByProtocol.get(p.id) || [];
      const kitItems = pKits.length ? slugItemTotal(pKits[0].slug) : 0;
      const productLinks = productLinkCounts.get(p.id) || 0;
      return { p, hasKit: pKits.length > 0, kitItems, productLinks };
    });
    return {
      nothing: audit.filter((a) => a.kitItems === 0 && a.productLinks === 0),
      fallbackOnly: audit.filter((a) => a.kitItems === 0 && a.productLinks > 0),
      curated: audit.filter((a) => a.kitItems > 0),
    };
  }, [protocols, kits, itemCounts, productLinkCounts]);

  const exportCsv = () => {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['region', 'kit', 'protocol', 'product', 'lane', 'buy_path', 'published_shopify', 'linked_product_id', 'supplier', 'store_url', 'cost_usd', 'sell_local', 'currency', 'margin_pct_fx', 'commission_pct', 'affiliate_url', 'variant_id', 'kit_live', 'region_rule'];
    const lines = rows.map((i) => {
      const kit = kitBySlugMarket.get(`${i.slug}:${i.market}`);
      const rule = ruleFor(i);
      // 'supplier' stays the RAW db field — blank means "supplier unknown, go fill it in",
      // which is the whole point of this export; the channel lives in buy_path/store_url.
      return [i.market, i.slug, kit ? protoName.get(kit.protocol_id) || '' : '', i.title, i.lane, kitItemBuyPath(i) || 'none',
        kitItemBuyPath(i) === 'store' ? 'yes' : (i.lane === 'store' ? (kit?.partner_cart_url ? 'partner' : 'NO') : ''), i.catalog_product_id || '',
        i.supplier || '', itemStoreUrl(i) || '', i.supplier_cost_usd ?? '', i.price_usd ?? '', i.currency || 'USD', itemMarginPct(i, fx) ?? '', i.commission_pct ?? '',
        i.affiliate_url || '', i.variant_id || '', kit?.is_live ? 'live' : 'hidden', rule ? `${rule.action}: ${rule.reason || ''}` : ''].map(esc).join(',');
    });
    // protocol-mentioned products missing from the kit — the sourcing to-do list
    const missingLines = missingRows.map((m) => {
      const f = kitItemFieldsFromProduct(m.product);
      const rule = rules.find((r) => r.region === m.market && r.item_id === m.product.id);
      return [m.market, m.slug, protoName.get(m.kit.protocol_id) || '', m.product.name, '', 'NOT_IN_KIT', '', m.product.id,
        '', '', '', m.product.price_usd ?? '', 'USD', '', '',
        f.affiliate_url || '', f.variant_id || '', m.kit.is_live ? 'live' : 'hidden', rule ? `${rule.action}: ${rule.reason || ''}` : ''].map(esc).join(',');
    });
    const blob = new Blob([[head.join(','), ...lines, ...missingLines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kit-items-master.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* protocol product-coverage audit — click a card to open its list; each
          protocol row deep-links into the editor to fix it */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: 'nothing' as const, label: 'Nothing to sell', hint: 'no kit items AND no product-linked steps', tone: 'red', list: coverage.nothing },
          { key: 'fallbackOnly' as const, label: 'Fallback only', hint: "no curated kit — app sells the protocol's linked products", tone: 'amber', list: coverage.fallbackOnly },
          { key: 'curated' as const, label: 'Curated kit', hint: 'has kit items', tone: 'emerald', list: coverage.curated },
        ]).map((c) => {
          const on = auditOpen === c.key;
          const cls = c.tone === 'red' ? 'border-red-200 bg-red-50 text-red-600' : c.tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
          return (
            <button key={c.key} onClick={() => setAuditOpen(on ? null : c.key)}
              className={`rounded-lg border p-3 text-left transition ${cls} ${on ? 'ring-2 ring-offset-1' : 'hover:brightness-95'}`}
              style={on ? { boxShadow: '0 0 0 2px var(--sb-brand)' } : undefined}
              title={`${on ? 'Hide' : 'Show'} the ${c.list.length} protocol(s)`}>
              <div className="flex items-center justify-between text-xs uppercase tracking-wide">{c.label}<span className="text-[10px] normal-case opacity-70">{on ? 'hide ▲' : 'view ▼'}</span></div>
              <div className="text-2xl font-semibold">{c.list.length}</div>
              <div className="text-[11px]">{c.hint}</div>
            </button>
          );
        })}
      </div>
      {auditOpen && (() => {
        const list = coverage[auditOpen];
        const tone = auditOpen === 'nothing' ? 'red' : auditOpen === 'fallbackOnly' ? 'amber' : 'emerald';
        const border = tone === 'red' ? 'border-red-200' : tone === 'amber' ? 'border-amber-200' : 'border-emerald-200';
        return (
          <div className={`rounded-lg border ${border} bg-white`}>
            <div className="flex items-center justify-between px-3 py-2 text-sm font-medium" style={{ borderBottom: '1px solid var(--sb-border)' }}>
              <span>{auditOpen === 'nothing' ? 'Nothing to sell' : auditOpen === 'fallbackOnly' ? 'Fallback only' : 'Curated kit'} — {list.length} protocol(s){auditOpen === 'nothing' ? ' · click one to link products or build a kit' : auditOpen === 'fallbackOnly' ? ' · has linked products; build a curated kit to upsell' : ''}</span>
            </div>
            <div className="max-h-64 overflow-auto p-1.5">
              {list.map((a) => (
                <button key={a.p.id} onClick={onOpenProtocol ? () => onOpenProtocol(a.p.id) : undefined}
                  disabled={!onOpenProtocol}
                  className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-sm hover:bg-[var(--sb-hover)]"
                  style={{ cursor: onOpenProtocol ? 'pointer' : 'default' }}
                  title={onOpenProtocol ? `Open "${a.p.name}" in the Protocols editor` : a.p.name}>
                  <span className="flex items-center gap-2 overflow-hidden">
                    {a.p.image_url && <img src={a.p.image_url} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.p.name}</span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-2 text-[11px] text-gray-400">
                    {a.productLinks > 0 && <span title={`${a.productLinks} product-linked step(s)`}>{a.productLinks} linked</span>}
                    {a.kitItems > 0 && <span title={`${a.kitItems} kit item(s)`}>{a.kitItems} kit</span>}
                    {onOpenProtocol && <span style={{ color: 'var(--sb-brand-strong)' }}>open →</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={fRegion} onChange={(e) => setFRegion(e.target.value)} className={sel}>
          <option value="">All regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{REGION_FLAG[r]} {r}</option>)}
        </select>
        <select value={fLane} onChange={(e) => setFLane(e.target.value)} className={sel}>
          <option value="">All lanes</option>
          <option value="store">store</option>
          <option value="affiliate">affiliate</option>
          <option value="missing">missing (not in kit)</option>
        </select>
        <select value={fLinked} onChange={(e) => setFLinked(e.target.value)} className={sel}>
          <option value="">Linked + unlinked</option>
          <option value="yes">linked only</option>
          <option value="no">unlinked only</option>
        </select>
        <select value={fBuy} onChange={(e) => setFBuy(e.target.value)} className={sel}>
          <option value="">Any buy path</option>
          <option value="yes">sellable only</option>
          <option value="no">NO buy path</option>
        </select>
        <input value={fText} onChange={(e) => setFText(e.target.value)} placeholder="Filter product / kit / supplier / protocol…" className="sb-input w-72" />
        <span className="text-xs text-gray-500">
          {fLane === 'missing' ? `${missingRows.length} missing` : `${rows.length} rows${missingRows.length ? ` + ${missingRows.length} missing` : ''}`}
        </span>
        <span className="flex-1" />
        <button onClick={exportCsv} className="sb-btn">
          <Download size={12} /> CSV
        </button>
      </div>

      {/* batch action bar — appears when leaf items are selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2" style={{ borderColor: 'var(--sb-brand)', background: 'var(--sb-brand-soft)' }}>
          <span className="text-[13px] font-medium">{selected.size} selected</span>
          <span className="text-[11px] text-gray-500">bulk-set across every selected region row:</span>
          <span className="flex-1" />
          {batchBusy && <Loader2 size={13} className="animate-spin" />}
          <button className="sb-btn sb-btn-sm" onClick={batchSetAffiliate} disabled={batchBusy}>Affiliate link…</button>
          <button className="sb-btn sb-btn-sm" onClick={batchSetSupplier} disabled={batchBusy}>Supplier / dropship…</button>
          <button className="sb-btn sb-btn-sm" onClick={() => batchSetLane('store')} disabled={batchBusy}>Lane → store</button>
          <button className="sb-btn sb-btn-sm" onClick={() => batchSetLane('affiliate')} disabled={batchBusy}>Lane → affiliate</button>
          <button className="sb-btn sb-btn-sm" onClick={() => setSelected(new Set())} disabled={batchBusy}>Clear</button>
        </div>
      )}

      {/* master table */}
      <div className="overflow-auto rounded-lg border border-gray-200" style={{ maxHeight: '62vh' }}>
        <table className="sb-table">
          <thead>
            <tr>
              <th style={{ width: 30 }} title="Select rows for batch actions"></th>
              <SortTh k="product" sortCol={sortCol} onSort={clickSort} style={{ minWidth: 220 }}>Product</SortTh>
              <th style={{ width: 52 }} title="Linked to a catalog product? (a key gap signal)">Linked</th>
              <th style={{ width: 74 }} title="Has a real Shopify variant — i.e. published on the HealthScan Shopify store (Supliful/HS)">Publ.</th>
              <th style={{ width: 66 }}>Buy path</th>
              <th style={{ width: 58 }}>Lane</th>
              <SortTh k="supplier" sortCol={sortCol} onSort={clickSort} style={{ maxWidth: 150 }}>Supplier</SortTh>
              <SortTh k="cost" sortCol={sortCol} onSort={clickSort} style={{ width: 56 }}>Cost</SortTh>
              <SortTh k="sell" sortCol={sortCol} onSort={clickSort} style={{ width: 60 }} title="Sorts on the fx-converted USD value, so regions compare fairly">Sell</SortTh>
              <SortTh k="margin" sortCol={sortCol} onSort={clickSort} style={{ width: 60 }}>Margin</SortTh>
              <th style={{ width: 54 }}>Comm.</th>
              <th style={{ width: 60 }} title="Partner affiliate link — opens the partner storefront">Affil.</th>
              <th style={{ width: 50 }}>Live</th>
              <th style={{ width: 58 }}>Rule</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const renderLeaf = (row: (typeof display)[number]) => {
              if (row.t === 'missing') {
                const m = row.m;
                const f = kitItemFieldsFromProduct(m.product);
                const rule = rules.find((r) => r.region === m.market && r.item_id === m.product.id);
                return (
                  <tr key={m.key} style={{ background: 'rgba(245, 158, 11, 0.06)' }}>
                    <td></td>
                    <td style={{ paddingLeft: 24 }}>
                      <button onClick={onOpenProduct ? () => onOpenProduct(m.product.id, m.product.name) : undefined} className="sb-cell"
                        title={`The protocol links this product in ${m.product.mentions} step(s) but it's not in the ${m.market} kit — click to open the product record`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', cursor: onOpenProduct ? 'pointer' : 'text', background: 'none', border: 'none', textAlign: 'left', font: 'inherit', color: onOpenProduct ? 'var(--sb-brand-strong)' : 'inherit' }}>
                        <Thumb src={m.product.image} size={18} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.product.name}</span>
                        <span style={{ flexShrink: 0, borderRadius: 4, padding: '1px 5px', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3, color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.4)', background: 'rgba(245, 158, 11, 0.1)' }}>
                          NOT IN KIT{m.product.mentions > 1 ? ` ×${m.product.mentions}` : ''}
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="sb-cell" style={{ padding: '4px 6px' }}>
                        <button onClick={() => addMissing(m)} disabled={addingKey === m.key || !accessToken} className="sb-btn"
                          title={`Add to the ${m.market} kit as a ${f.lane} item, linked to ${m.product.id}`}
                          style={{ height: 24, padding: '0 8px', fontSize: 11.5 }}>
                          {addingKey === m.key ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Add
                        </button>
                      </span>
                    </td>
                    <td><span className="sb-cell">—</span></td>
                    <td><span className="sb-cell" style={{ color: '#d97706', fontWeight: 600 }}>MISSING</span></td>
                    <td><span className="sb-cell" title="Will arrive linked to the catalog product">→ {f.lane}</span></td>
                    <td>
                      <span className="sb-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {faviconFor(f.affiliate_url || null) && <img src={faviconFor(f.affiliate_url || null)!} alt="" loading="lazy" style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.lane === 'store' ? 'HealthScan store' : hostOf(f.affiliate_url || null) || '—'}</span>
                      </span>
                    </td>
                    <td><span className="sb-cell">—</span></td>
                    <td><span className="sb-cell">{m.product.price_usd != null ? `$${m.product.price_usd}` : '—'}</span></td>
                    <td><span className="sb-cell">—</span></td>
                    <td><span className="sb-cell">—</span></td>
                    <td>
                      {f.affiliate_url
                        ? <a className="sb-cell" href={f.affiliate_url} target="_blank" rel="noopener noreferrer" title={f.affiliate_url}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sb-brand-strong)', cursor: 'pointer' }}>
                            <ExternalLink size={11} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{hostOf(f.affiliate_url) || 'link'}</span>
                          </a>
                        : <span className="sb-cell">—</span>}
                    </td>
                    <td><span className="sb-cell">{m.kit.is_live ? 'live' : 'hidden'}</span></td>
                    <td><span className="sb-cell" title={rule?.reason || ''} style={rule ? { color: rule.action === 'block' ? '#dc2626' : '#d97706', fontWeight: 600 } : undefined}>{rule ? rule.action : '—'}</span></td>
                  </tr>
                );
              }
              const i = row.i;
              const kit = kitBySlugMarket.get(`${i.slug}:${i.market}`);
              const rule = ruleFor(i);
              const buyPath = kitItemBuyPath(i);
              const storeUrl = itemStoreUrl(i);
              // favicon keys on buyPath — the SAME discriminant as the href — so the icon
              // can never claim Shopify while the link opens a partner site (or vice versa)
              const fav = faviconFor(buyPath === 'store' ? `${SHOPIFY_ADMIN}/` : i.affiliate_url);
              const partnerCart = i.lane === 'store' && buyPath !== 'store' ? kit?.partner_cart_url || null : null;
              return (
                <tr key={i.id} style={selected.has(i.id) ? { background: 'var(--sb-brand-soft)' } : undefined}>
                  <td style={{ textAlign: 'center', paddingLeft: 24 }}>
                    <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggleSel(i.id)} style={{ cursor: 'pointer' }} title="Select for batch actions" />
                  </td>
                  <td>
                    {onOpenProduct
                      ? <button onClick={() => onOpenProduct(i.catalog_product_id, i.title || undefined)} className="sb-cell"
                          title={i.catalog_product_id
                            ? `${i.title || ''} — open the linked product record (${i.catalog_product_id})`
                            : `${i.title || ''} — not linked; opens the Products tab searched by name so you can edit or link it`}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', font: 'inherit', color: 'inherit' }}>
                          {i.image_url && <img src={i.image_url} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: i.catalog_product_id ? 'underline dotted' : 'underline dashed', textUnderlineOffset: 3, textDecorationColor: i.catalog_product_id ? undefined : 'var(--sb-text-faint)' }}>{i.title || '(untitled)'}</span>
                        </button>
                      : <span className="sb-cell">{i.title || '(untitled)'}</span>}
                  </td>
                  <td><span className="sb-cell" style={{ color: i.catalog_product_id ? 'var(--sb-brand-strong)' : '#d97706' }}>{i.catalog_product_id ? 'yes' : 'NO'}</span></td>
                  <td>
                    {buyPath === 'store'
                      ? <a className="sb-cell" href={itemStoreUrl(i)!} target="_blank" rel="noopener noreferrer"
                          title="Published — has a Shopify variant. Opens the product in the HealthScan Shopify admin."
                          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sb-brand-strong)', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
                          shopify <ExternalLink size={10} style={{ flexShrink: 0 }} />
                        </a>
                      : partnerCart
                        ? <a className="sb-cell" href={partnerCart} target="_blank" rel="noopener noreferrer"
                            title="Fulfilled via the partner's cart (kit-level partner_cart_url) — intentionally NOT on our Shopify (e.g. Tre Lune AU)"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sb-brand-strong)', textDecoration: 'none', cursor: 'pointer' }}>
                            partner <ExternalLink size={10} style={{ flexShrink: 0 }} />
                          </a>
                        : <span className="sb-cell" title={i.lane === 'store' ? 'Store lane but no Shopify variant — publish it to the HealthScan Shopify (Supliful US / Suplify EU) and set variant_id, or set the kit\'s partner cart URL if it sells via a partner' : 'Affiliate row — sold on the partner store, not ours'}
                            style={i.lane === 'store' ? { color: '#dc2626', fontWeight: 600 } : undefined}>
                            {i.lane === 'store' ? 'NO' : '—'}
                          </span>}
                  </td>
                  <td><span className="sb-cell" style={{ color: buyPath ? 'var(--sb-brand-strong)' : '#d97706', fontWeight: buyPath ? 400 : 600 }}>{buyPath || 'NONE'}</span></td>
                  <td><span className="sb-cell">{i.lane}</span></td>
                  <td>
                    <span className="sb-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {fav && <img src={fav} alt="" loading="lazy" style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} />}
                      {storeUrl
                        ? <a href={storeUrl} target="_blank" rel="noopener noreferrer" title={storeUrl}
                            style={{ color: 'var(--sb-brand-strong)', textDecoration: 'underline', textUnderlineOffset: 2, overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                            {supplierLabel(i)}
                          </a>
                        : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{supplierLabel(i)}</span>}
                    </span>
                  </td>
                  <td><span className="sb-cell">{i.supplier_cost_usd != null ? fmtMoney(i.supplier_cost_usd, 'USD') : '—'}</span></td>
                  <td><span className="sb-cell">{fmtMoney(i.price_usd, i.currency)}</span></td>
                  <td>{(() => { const mp = itemMarginPct(i, fx); return (
                    <span className="sb-cell" title={mp != null ? `(sell→USD via FX − cost) / sell` : 'Set a supplier cost to see margin'}
                      style={mp != null ? { fontWeight: 600, color: mp >= 40 ? 'var(--sb-brand-strong)' : mp >= 20 ? '#d97706' : '#dc2626' } : undefined}>
                      {mp != null ? `${mp}%` : '—'}
                    </span>
                  ); })()}</td>
                  <td><span className="sb-cell">{i.commission_pct != null ? `${i.commission_pct}%` : '—'}</span></td>
                  <td>
                    {i.affiliate_url
                      ? <a className="sb-cell" href={i.affiliate_url} target="_blank" rel="noopener noreferrer" title={i.affiliate_url}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sb-brand-strong)', cursor: 'pointer' }}>
                          <ExternalLink size={11} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{hostOf(i.affiliate_url) || 'link'}</span>
                        </a>
                      : <span className="sb-cell">—</span>}
                  </td>
                  <td><span className="sb-cell">{kit?.is_live ? 'live' : 'hidden'}</span></td>
                  <td><span className="sb-cell" title={rule?.reason || ''} style={rule ? { color: rule.action === 'block' ? '#dc2626' : '#d97706', fontWeight: 600 } : undefined}>{rule ? rule.action : '—'}</span></td>
                </tr>
              );
              }; // end renderLeaf

              const nodes: any[] = [];
              tree.forEach((K, ki) => {
                const kitOpen = expandedKits.has(K.slug);
                const totalProducts = K.marketsOrder.reduce((s, m) => s + K.markets.get(m)!.rows.length, 0);
                const liveCount = K.marketsOrder.filter((m) => K.markets.get(m)!.kit?.is_live).length;
                nodes.push(
                  <tr key={`kit:${K.slug}`} style={{ background: 'var(--sb-panel-soft)', cursor: 'pointer', borderTop: '2px solid var(--sb-border)' }} onClick={() => toggleKit(K.slug)}>
                    <td colSpan={COLS} style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
                        <span style={{ width: 24, textAlign: 'right', color: 'var(--sb-text-faint)', fontVariantNumeric: 'tabular-nums', fontSize: 12, flexShrink: 0 }}>{ki + 1}</span>
                        {kitOpen ? <ChevronDown size={14} className="shrink-0 text-gray-400" /> : <ChevronRight size={14} className="shrink-0 text-gray-400" />}
                        <Thumb src={K.kitImg} size={22} />
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{K.name}</span>
                        <span style={{ color: 'var(--sb-text-faint)', fontSize: 11, flexShrink: 0 }}>/{K.slug}</span>
                        <span style={{ flex: 1 }} />
                        <span style={{ fontSize: 11.5, color: 'var(--sb-text-faint)', flexShrink: 0 }}>{K.marketsOrder.length} region{K.marketsOrder.length !== 1 ? 's' : ''} · {totalProducts} product{totalProducts !== 1 ? 's' : ''} · {liveCount} live</span>
                        {onOpenProtocol && K.protocolId && (
                          <button onClick={(e) => { e.stopPropagation(); onOpenProtocol!(K.protocolId!); }} className="sb-btn sb-btn-sm" style={{ flexShrink: 0 }} title="Open the protocol editor">protocol →</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                if (!kitOpen) return;
                K.marketsOrder.forEach((market) => {
                  const R = K.markets.get(market)!;
                  const rKey = `${K.slug}:${market}`;
                  const regionOpen = expandedRegions.has(rKey);
                  nodes.push(
                    <tr key={`reg:${rKey}`} style={{ cursor: 'pointer' }} onClick={() => toggleRegion(rKey)}>
                      <td colSpan={COLS} style={{ padding: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 40px' }}>
                          {regionOpen ? <ChevronDown size={13} className="shrink-0 text-gray-400" /> : <ChevronRight size={13} className="shrink-0 text-gray-400" />}
                          <span style={{ fontWeight: 500 }}>{REGION_FLAG[market]} {market}</span>
                          <span style={{ flexShrink: 0, borderRadius: 999, padding: '0 7px', fontSize: 10, fontWeight: 600, color: R.kit?.is_live ? 'var(--sb-brand-strong)' : 'var(--sb-text-faint)', background: R.kit?.is_live ? 'var(--sb-brand-soft)' : 'var(--sb-hover)' }}>{R.kit?.is_live ? 'live' : 'hidden'}</span>
                          <span style={{ color: 'var(--sb-text-faint)', fontSize: 11.5 }}>{R.rows.length} item{R.rows.length !== 1 ? 's' : ''}</span>
                          {(() => { const ids = R.rows.filter((r) => r.t === 'item').map((r: any) => r.i.id); const allSel = ids.length > 0 && ids.every((id) => selected.has(id)); return ids.length > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); selectMany(ids, !allSel); }} className="text-[11px]" style={{ color: 'var(--sb-brand-strong)', background: 'none', border: 'none', cursor: 'pointer' }}>{allSel ? 'deselect' : 'select all'}</button>
                          ); })()}
                          <span style={{ flex: 1 }} />
                        </div>
                      </td>
                    </tr>
                  );
                  if (regionOpen) R.rows.forEach((row) => nodes.push(renderLeaf(row)));
                });
              });
              if (!tree.length) nodes.push(<tr key="empty"><td colSpan={COLS} style={{ textAlign: 'center', padding: 20, color: 'var(--sb-text-faint)' }}>No rows match.</td></tr>);
              return nodes;
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default KitsMasterTable;
