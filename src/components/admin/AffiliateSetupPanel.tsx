/**
 * AffiliateSetupPanel — set up the affiliate program + tagged buy-links for every
 * famous-brand product linked from a protocol kit (protocol_kit_items, lane =
 * 'affiliate'). For each brand: a "Sign up" button to the real program (CJ /
 * Impact / Awin / Rakuten / UpPromote / Shopify Collabs / in-house, from the
 * DEV-350 regional sourcing research), and — per product — a field to paste the
 * approved tagged link that writes affiliate_url across all region rows.
 *
 * Distinct from KitMatrix (which edits one kit's items × regions): this is the
 * cross-kit, brand-first view for standing up affiliate monetization. Reads/
 * writes the same protocol_kit_items table the mobile ProtocolKitButton renders.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Link2, Loader2, RefreshCw, Search as SearchIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import { listAllKitItems, updateKitItem, REGION_FLAG, type KitItem, type KitRegion } from '../../utils/kitsAdmin';
import { programFor, brandForTitle } from './affiliatePrograms';

const inputCls = 'sb-input';
const btnCls = 'sb-btn';

type ProductGroup = { key: string; title: string; rows: KitItem[]; urls: string[]; markets: KitRegion[] };
type BrandGroup = { brand: string; products: ProductGroup[]; kits: string[]; total: number };

const KIT_LABEL: Record<string, string> = {
  'self-heal-by-design': 'Self Heal', 'cold-flu-support': 'Cold & Flu', 'gut-healing': 'Gut Healing',
  'liver-gallbladder-cleanse': 'Liver Cleanse', 'liver-gallbladder-flush': 'Liver Flush',
  'parasite-cleanse': 'Parasite', 'matthew-walker-sleep-protocol': 'Sleep', 'longevity': 'Longevity',
  '5-phase-life-reset': '5-Phase', 'glass-skin': 'Glass Skin',
};
const kitLabel = (s: string) => KIT_LABEL[s] || s;

function groupByBrand(items: KitItem[]): BrandGroup[] {
  const affiliate = items.filter((i) => i.lane === 'affiliate');
  const brands = new Map<string, KitItem[]>();
  for (const it of affiliate) {
    const b = brandForTitle(it.title);
    if (!brands.has(b)) brands.set(b, []);
    brands.get(b)!.push(it);
  }
  const out: BrandGroup[] = [];
  for (const [brand, rows] of brands) {
    // group a brand's rows into distinct products by variant_id (falls back to title)
    const products = new Map<string, KitItem[]>();
    for (const r of rows) {
      const k = r.variant_id || (r.title || '').toLowerCase().trim() || r.id;
      if (!products.has(k)) products.set(k, []);
      products.get(k)!.push(r);
    }
    const pgroups: ProductGroup[] = [...products.entries()].map(([key, prows]) => ({
      key,
      title: prows[0].title || key,
      rows: prows,
      urls: [...new Set(prows.map((p) => p.affiliate_url).filter(Boolean) as string[])],
      markets: [...new Set(prows.map((p) => p.market))],
    }));
    const kits = [...new Set(rows.map((r) => r.slug))];
    out.push({ brand, products: pgroups.sort((a, b) => a.title.localeCompare(b.title)), kits, total: rows.length });
  }
  // programs first, then alphabetical
  return out.sort((a, b) => {
    const pa = programFor(a.brand).hasProgram ? 0 : 1;
    const pb = programFor(b.brand).hasProgram ? 0 : 1;
    return pa - pb || a.brand.localeCompare(b.brand);
  });
}

function ProductRow({ pg, accessToken, onSaved }: { pg: ProductGroup; accessToken: string; onSaved: (url: string) => void }) {
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const apply = async () => {
    const url = val.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) { toast.error('Enter a full URL starting with http(s)://'); return; }
    setSaving(true);
    try {
      await Promise.all(pg.rows.map((r) => updateKitItem(accessToken, r.id, { affiliate_url: url })));
      setDone(true);
      toast.success(`Updated ${pg.rows.length} link${pg.rows.length === 1 ? '' : 's'} for ${pg.title}`);
      onSaved(url);
      setTimeout(() => setDone(false), 2000);
    } catch (e: any) {
      toast.error(`Save failed: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50/60 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-gray-800">{pg.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-gray-500">
            {pg.markets.map((m) => (<span key={m} title={m}>{REGION_FLAG[m]}</span>))}
            {pg.urls.map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="ml-1 max-w-[220px] truncate font-mono text-teal-700 hover:underline">{u.replace(/^https?:\/\//, '')}</a>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        <input
          className={inputCls + ' flex-1 text-[12px]'}
          placeholder="Paste approved tagged link…"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') apply(); }}
        />
        <button className={btnCls + ' whitespace-nowrap text-[12px]'} onClick={apply} disabled={saving || !val.trim()}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5 text-green-600" /> : `Apply · ${pg.rows.length}`}
        </button>
      </div>
    </div>
  );
}

/** One product row in the table view: brand · product · program · a paste-link
 *  field that writes affiliate_url across all its region rows. Needs-setup rows
 *  (no link yet) float to the top so the gaps are obvious and one click away. */
function AffiliateTableRow({ brand, pg, accessToken, onSaved }: { brand: string; pg: ProductGroup; accessToken: string; onSaved: (url: string) => void }) {
  const prog = programFor(brand);
  const has = pg.urls.length > 0;
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  const apply = async () => {
    const url = val.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) { toast.error('Enter a full URL starting with http(s)://'); return; }
    setSaving(true);
    try {
      await Promise.all(pg.rows.map((r) => updateKitItem(accessToken, r.id, { affiliate_url: url })));
      toast.success(`Updated ${pg.rows.length} link${pg.rows.length === 1 ? '' : 's'} for ${pg.title}`);
      onSaved(url); setVal('');
    } catch (e: any) { toast.error(`Save failed: ${e?.message || e}`); }
    finally { setSaving(false); }
  };
  return (
    <tr>
      <td><span className="sb-cell" title={brand}>{brand}</span></td>
      <td><span className="sb-cell" title={pg.title}>{pg.title}</span></td>
      <td>
        <span className="sb-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {prog.commission || (prog.hasProgram ? prog.network : '—')}
          {prog.signupUrl && <a href={prog.signupUrl} target="_blank" rel="noopener noreferrer" title={`Sign up: ${prog.network}`} style={{ color: 'var(--sb-brand-strong)' }}><ExternalLink size={11} /></a>}
        </span>
      </td>
      <td><span className="sb-cell sb-cell-ro">{pg.markets.map((m) => REGION_FLAG[m]).join(' ')}</span></td>
      <td>
        <span className="sb-cell" style={{ padding: '4px 6px' }}>
          {has
            ? <a href={pg.urls[0]} target="_blank" rel="noopener noreferrer" title={pg.urls[0]} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sb-brand-strong)', overflow: 'hidden', textOverflow: 'ellipsis' }}><Check size={12} style={{ flexShrink: 0 }} /> linked</a>
            : <span style={{ display: 'flex', gap: 6 }}>
                <input className="sb-input" style={{ flex: 1, height: 26, fontSize: 12 }} placeholder="Paste approved tagged link…" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} />
                <button className="sb-btn sb-btn-sm" onClick={apply} disabled={saving || !val.trim()} title={`Write affiliate_url to ${pg.rows.length} region row(s)`}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Apply · ${pg.rows.length}`}
                </button>
              </span>}
        </span>
      </td>
    </tr>
  );
}

/** Table of every affiliate product, needs-setup first. */
function AffiliateTable({ brands, accessToken, onSaved }: { brands: BrandGroup[]; accessToken: string; onSaved: (brandKey: string, productKey: string, url: string) => void }) {
  const rows = useMemo(() => {
    const flat: { brand: string; pg: ProductGroup }[] = [];
    for (const b of brands) for (const pg of b.products) flat.push({ brand: b.brand, pg });
    // needs-setup (no link) first, then by brand → product
    return flat.sort((a, b) => (a.pg.urls.length ? 1 : 0) - (b.pg.urls.length ? 1 : 0) || a.brand.localeCompare(b.brand) || a.pg.title.localeCompare(b.pg.title));
  }, [brands]);
  const missing = rows.filter((r) => !r.pg.urls.length).length;
  return (
    <div className="overflow-auto rounded-lg border border-gray-200" style={{ maxHeight: '64vh' }}>
      <table className="sb-table">
        <thead>
          <tr>
            <th style={{ width: 150 }}>Brand</th>
            <th>Product</th>
            <th style={{ width: 200 }}>Program / commission</th>
            <th style={{ width: 90 }}>Regions</th>
            <th style={{ minWidth: 280 }}>Affiliate link {missing > 0 && <span style={{ color: '#d97706' }}>· {missing} to set up</span>}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ brand, pg }) => (
            <AffiliateTableRow key={`${brand}:${pg.key}`} brand={brand} pg={pg} accessToken={accessToken} onSaved={(url) => onSaved(brand, pg.key, url)} />
          ))}
          {!rows.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--sb-text-faint)' }}>No affiliate products.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function AffiliateSetupPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<KitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('table');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await listAllKitItems(accessToken)); }
    catch (e: any) { setError(e?.message || String(e)); }
    finally { setLoading(false); }
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);

  const brands = useMemo(() => groupByBrand(items), [items]);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? brands.filter((b) => b.brand.toLowerCase().includes(t) || b.products.some((p) => p.title.toLowerCase().includes(t))) : brands;
  }, [brands, q]);

  const withProgram = brands.filter((b) => programFor(b.brand).hasProgram).length;
  const totalProducts = brands.reduce((n, b) => n + b.products.length, 0);

  const onSaved = (brandKey: string, productKey: string, url: string) => {
    setItems((prev) => prev.map((i) => {
      const k = i.variant_id || (i.title || '').toLowerCase().trim() || i.id;
      return (i.lane === 'affiliate' && brandForTitle(i.title) === brandKey && k === productKey) ? { ...i, affiliate_url: url } : i;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Link2 className="h-5 w-5 text-teal-600" /> Affiliate Setup
          </h2>
          <p className="mt-0.5 max-w-2xl text-[13px] text-gray-500">
            Sign up for each brand&rsquo;s program, then paste your approved tagged link per product — it writes <code className="rounded bg-gray-100 px-1 font-mono text-[11px]">affiliate_url</code> across all region rows. {brands.length} brands · {totalProducts} products · {withProgram} with a network program.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="sb-subtabs">
            <button className={`sb-subtab${view === 'table' ? ' sb-subtab-active' : ''}`} onClick={() => setView('table')}>Needs setup</button>
            <button className={`sb-subtab${view === 'cards' ? ' sb-subtab-active' : ''}`} onClick={() => setView('cards')}>By brand</button>
          </div>
          <button className={btnCls} onClick={load} disabled={loading}>
            <RefreshCw className={'h-4 w-4' + (loading ? ' animate-spin' : '')} /> Refresh
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input className={inputCls + ' pl-8'} placeholder="Filter brands or products…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && <div className="flex items-center gap-2 py-8 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading affiliate products…</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">Couldn&rsquo;t load kit items: {error}</div>}

      {!loading && !error && view === 'table' && (
        <AffiliateTable brands={filtered} accessToken={accessToken} onSaved={onSaved} />
      )}

      {!loading && !error && view === 'cards' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((bg) => {
            const prog = programFor(bg.brand);
            return (
              <section key={bg.brand} className="sb-card flex flex-col gap-2.5 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13.5px] font-semibold text-gray-900">{bg.brand}</h3>
                  <span className={'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ' + (prog.hasProgram ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700')}>
                    {prog.hasProgram ? 'Program' : 'Amazon / manual'}
                  </span>
                </div>
                <p className="text-[11.5px] text-gray-500">
                  {prog.network}{prog.commission ? <span className="ml-1 font-medium text-gray-700">· {prog.commission}</span> : null}
                </p>
                <div className="flex flex-wrap gap-1">
                  {bg.kits.map((k) => (<span key={k} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{kitLabel(k)}</span>))}
                </div>
                <a className={btnCls + ' sb-btn-sm justify-center'} href={prog.signupUrl || 'https://affiliate-program.amazon.com/signup'} target="_blank" rel="noopener noreferrer">
                  {prog.hasProgram ? 'Sign up for program' : 'Join via Amazon'} <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <div className="mt-1 flex flex-col gap-1.5">
                  {bg.products.map((pg) => (
                    <ProductRow key={pg.key} pg={pg} accessToken={accessToken} onSaved={(url) => onSaved(bg.brand, pg.key, url)} />
                  ))}
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && <div className="col-span-full py-8 text-center text-gray-500">No brands match &ldquo;{q}&rdquo;.</div>}
        </div>
      )}
    </div>
  );
}

export default AffiliateSetupPanel;
