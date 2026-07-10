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
import { Download, ExternalLink } from 'lucide-react';
import { REGIONS, kitItemBuyPath, type KitItem, type ProtocolKit, type ProtocolLite, type KitRegion, type RegionRule } from '../../utils/kitsAdmin';

const sel = 'rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900';

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

export function KitsMasterTable({ items, kits, protocols, rules, itemCounts, productLinkCounts, onOpenKit }: {
  items: KitItem[]; kits: ProtocolKit[]; protocols: ProtocolLite[]; rules: RegionRule[];
  itemCounts: Map<string, Partial<Record<KitRegion, number>>>;
  productLinkCounts: Map<string, number>;
  /** open the kit's edit modal (KitsPanel's detail modal hosts KitMatrix + ProtocolReassign) */
  onOpenKit?: (slug: string) => void;
}) {
  const [fRegion, setFRegion] = useState('');
  const [fLane, setFLane] = useState('');
  const [fLinked, setFLinked] = useState('');
  const [fBuy, setFBuy] = useState('');
  const [fText, setFText] = useState('');

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
    const head = ['region', 'kit', 'protocol', 'product', 'lane', 'buy_path', 'published_shopify', 'linked_product_id', 'supplier', 'store_url', 'cost_usd', 'sell_usd', 'margin_pct', 'commission_pct', 'affiliate_url', 'variant_id', 'kit_live', 'region_rule'];
    const lines = rows.map((i) => {
      const kit = kitBySlugMarket.get(`${i.slug}:${i.market}`);
      const rule = ruleFor(i);
      // 'supplier' stays the RAW db field — blank means "supplier unknown, go fill it in",
      // which is the whole point of this export; the channel lives in buy_path/store_url.
      return [i.market, i.slug, kit ? protoName.get(kit.protocol_id) || '' : '', i.title, i.lane, kitItemBuyPath(i) || 'none',
        kitItemBuyPath(i) === 'store' ? 'yes' : (i.lane === 'store' ? (kit?.partner_cart_url ? 'partner' : 'NO') : ''), i.catalog_product_id || '',
        i.supplier || '', itemStoreUrl(i) || '', i.supplier_cost_usd ?? '', i.price_usd ?? '', i.margin_pct ?? '', i.commission_pct ?? '',
        i.affiliate_url || '', i.variant_id || '', kit?.is_live ? 'live' : 'hidden', rule ? `${rule.action}: ${rule.reason || ''}` : ''].map(esc).join(',');
    });
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kit-items-master.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* protocol product-coverage audit */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="text-xs uppercase tracking-wide text-red-600">Nothing to sell</div>
          <div className="text-2xl font-semibold text-red-600">{coverage.nothing.length}</div>
          <div className="text-[11px] text-red-600">no kit items AND no product-linked steps</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs uppercase tracking-wide text-amber-700">Fallback only</div>
          <div className="text-2xl font-semibold text-amber-700">{coverage.fallbackOnly.length}</div>
          <div className="text-[11px] text-amber-700">no curated kit — app sells the protocol's linked products</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs uppercase tracking-wide text-emerald-700">Curated kit</div>
          <div className="text-2xl font-semibold text-emerald-700">{coverage.curated.length}</div>
          <div className="text-[11px] text-emerald-700">has kit items</div>
        </div>
      </div>
      {coverage.nothing.length > 0 && (
        <details className="rounded-lg border border-red-200 bg-white">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-red-600">Protocols with nothing to sell ({coverage.nothing.length}) — need products linked or a kit built</summary>
          <div className="max-h-56 overflow-auto border-t border-red-100 px-3 py-2 text-sm text-gray-700">
            {coverage.nothing.map((a) => <div key={a.p.id} className="py-0.5">{a.p.name}</div>)}
          </div>
        </details>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={fRegion} onChange={(e) => setFRegion(e.target.value)} className={sel}>
          <option value="">All regions</option>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={fLane} onChange={(e) => setFLane(e.target.value)} className={sel}>
          <option value="">All lanes</option>
          <option value="store">store</option>
          <option value="affiliate">affiliate</option>
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
        <input value={fText} onChange={(e) => setFText(e.target.value)} placeholder="Filter product / kit / supplier / protocol…" className={sel + ' w-72'} />
        <span className="text-xs text-gray-500">{rows.length} rows</span>
        <span className="flex-1" />
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
          <Download size={12} /> CSV
        </button>
      </div>

      {/* master table */}
      <div className="overflow-auto rounded-lg border border-gray-200" style={{ maxHeight: '62vh' }}>
        <table className="sb-table">
          <thead>
            <tr>
              <th style={{ width: 46 }}>Region</th>
              <th>Kit</th>
              <th>Protocol</th>
              <th>Product</th>
              <th style={{ width: 60 }}>Lane</th>
              <th style={{ width: 72 }}>Buy path</th>
              <th style={{ width: 78 }} title="Has a real Shopify variant — i.e. published on the HealthScan Shopify store (Supliful/HS)">Published</th>
              <th style={{ width: 64 }}>Linked</th>
              <th>Supplier</th>
              <th title="Partner affiliate link — opens the partner storefront">Affiliate</th>
              <th style={{ width: 64 }}>Cost</th>
              <th style={{ width: 64 }}>Sell</th>
              <th style={{ width: 64 }}>Margin</th>
              <th style={{ width: 64 }}>Comm.</th>
              <th style={{ width: 56 }}>Live</th>
              <th style={{ width: 70 }}>Rule</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => {
              const kit = kitBySlugMarket.get(`${i.slug}:${i.market}`);
              const kitImg = kit?.image_url || (kit ? protoImage.get(kit.protocol_id) : null) || null;
              const pImg = kit ? protoImage.get(kit.protocol_id) || null : null;
              const rule = ruleFor(i);
              const buyPath = kitItemBuyPath(i);
              const storeUrl = itemStoreUrl(i);
              // favicon keys on buyPath — the SAME discriminant as the href — so the icon
              // can never claim Shopify while the link opens a partner site (or vice versa)
              const fav = faviconFor(buyPath === 'store' ? `${SHOPIFY_ADMIN}/` : i.affiliate_url);
              const partnerCart = i.lane === 'store' && buyPath !== 'store' ? kit?.partner_cart_url || null : null;
              const openKit = onOpenKit ? () => onOpenKit(i.slug) : undefined;
              const linkBtn = { display: 'flex', alignItems: 'center', gap: 6, width: '100%', cursor: openKit ? 'pointer' : 'text', background: 'none', border: 'none', textAlign: 'left' as const, font: 'inherit', color: openKit ? 'var(--sb-brand-strong)' : 'inherit' };
              return (
                <tr key={i.id}>
                  <td><span className="sb-cell sb-cell-ro">{i.market}</span></td>
                  <td>
                    <button onClick={openKit} className="sb-cell" title={`Open /${i.slug} — edit items, prices, image, protocol`} style={linkBtn}>
                      <Thumb src={kitImg} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.slug}</span>
                    </button>
                  </td>
                  <td>
                    <button onClick={openKit} className="sb-cell" title="Open the kit modal (re-point the protocol from there)" style={linkBtn}>
                      <Thumb src={pImg} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{kit ? protoName.get(kit.protocol_id) || '—' : '—'}</span>
                    </button>
                  </td>
                  <td>
                    <span className="sb-cell" title={i.title || ''}>
                      {i.image_url && <img src={i.image_url} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', display: 'inline-block', verticalAlign: '-4px', marginRight: 6 }} />}
                      {i.title || '(untitled)'}
                    </span>
                  </td>
                  <td><span className="sb-cell">{i.lane}</span></td>
                  <td><span className="sb-cell" style={{ color: buyPath ? 'var(--sb-brand-strong)' : '#d97706', fontWeight: buyPath ? 400 : 600 }}>{buyPath || 'NONE'}</span></td>
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
                  <td><span className="sb-cell" style={{ color: i.catalog_product_id ? 'var(--sb-brand-strong)' : '#d97706' }}>{i.catalog_product_id ? 'yes' : 'NO'}</span></td>
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
                  <td>
                    {i.affiliate_url
                      ? <a className="sb-cell" href={i.affiliate_url} target="_blank" rel="noopener noreferrer" title={i.affiliate_url}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sb-brand-strong)', cursor: 'pointer' }}>
                          <ExternalLink size={11} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{hostOf(i.affiliate_url) || 'link'}</span>
                        </a>
                      : <span className="sb-cell">—</span>}
                  </td>
                  <td><span className="sb-cell">{i.supplier_cost_usd != null ? `$${i.supplier_cost_usd}` : '—'}</span></td>
                  <td><span className="sb-cell">{i.price_usd != null ? `$${i.price_usd}` : '—'}</span></td>
                  <td><span className="sb-cell">{i.margin_pct != null ? `${i.margin_pct}%` : '—'}</span></td>
                  <td><span className="sb-cell">{i.commission_pct != null ? `${i.commission_pct}%` : '—'}</span></td>
                  <td><span className="sb-cell">{kit?.is_live ? 'live' : 'hidden'}</span></td>
                  <td><span className="sb-cell" title={rule?.reason || ''} style={rule ? { color: rule.action === 'block' ? '#dc2626' : '#d97706', fontWeight: 600 } : undefined}>{rule ? rule.action : '—'}</span></td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={16} style={{ textAlign: 'center', padding: 20, color: 'var(--sb-text-faint)' }}>No rows match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default KitsMasterTable;
