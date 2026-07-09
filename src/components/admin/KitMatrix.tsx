/**
 * KitMatrix — one protocol kit as an items × regions grid (US/EU/UK/AU).
 *
 * Regions genuinely differ for legal reasons (verified in data: the melatonin
 * "Sleep Support" is US-only; NMN is absent from EU/UK/AU longevity kits), so
 * the matrix is the primary view: every row is an item identity
 * (catalog_product_id, falling back to title), every column a market. Cells
 * show sell price + lane and a BLOCK/WARN badge when a catalog_region_rules
 * row hits the item's linked product in that column's region.
 *
 * Economics per item (expand a row): supplier cost → generated margin_pct
 * (read-only — DB computes it), supplier name (e.g. 'Tre Lune'), affiliate
 * commission % for non-HealthScan items. Footer totals per region: sell /
 * cost / margin / est. affiliate commission.
 *
 * "Copy region → region" clones missing items compliance-aware (skips blocked,
 * inserts rule substitutes with the mobile app's store/affiliate lane logic).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Copy as CopyIcon, Loader2, Plus, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listKitItemsAllRegions, createKitItem, updateKitItem, deleteKitItem, updateKit,
  copyKitRegion, cloneKitItem, REGIONS, type ProtocolKit, type KitItem, type RegionRule, type KitRegion,
} from '../../utils/kitsAdmin';

const inputCls = 'w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900';
const miniInput = 'w-full rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-900';
const btnCls = 'inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50';

const fmt = (n: number | null | undefined) => (n == null ? '—' : `$${Number(n).toFixed(2)}`);
const rowKeyOf = (it: KitItem) => it.catalog_product_id || (it.title || '').toLowerCase().trim() || it.id;

function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function KitMatrix({ slug, kits, rules, accessToken, protocolName, onKitsChanged }: {
  slug: string; kits: ProtocolKit[]; rules: RegionRule[]; accessToken: string;
  protocolName: string; onKitsChanged: () => void;
}) {
  const [items, setItems] = useState<KitItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState<KitRegion>('US');
  const [copyTo, setCopyTo] = useState<KitRegion>('EU');
  const [copying, setCopying] = useState(false);
  const [busyCell, setBusyCell] = useState<string | null>(null);

  const kitByMarket = useMemo(() => new Map(kits.map((k) => [k.market, k])), [kits]);
  const markets = REGIONS.filter((r) => kitByMarket.has(r));

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listKitItemsAllRegions(accessToken, slug)); }
    catch (e: any) { toast.error(`Load kit items failed: ${e?.message || e}`); setItems([]); }
    finally { setLoading(false); }
  }, [accessToken, slug]);
  useEffect(() => { load(); }, [load]);

  const byRow = useMemo(() => {
    const m = new Map<string, Partial<Record<KitRegion, KitItem>>>();
    for (const it of items || []) {
      const k = rowKeyOf(it);
      const cur = m.get(k) || {};
      cur[it.market] = it;
      m.set(k, cur);
    }
    return m;
  }, [items]);
  const rowKeys = useMemo(() => {
    // preserve source sort order: order rows by the min sort across markets
    const entries = [...byRow.entries()];
    const sortOf = (cells: Partial<Record<KitRegion, KitItem>>) => Math.min(...Object.values(cells).map((i) => i?.sort ?? 9999));
    return entries.sort((a, b) => sortOf(a[1]) - sortOf(b[1])).map(([k]) => k);
  }, [byRow]);

  const ruleFor = useCallback((productId: string | null, region: KitRegion): RegionRule | undefined => {
    if (!productId) return undefined;
    return rules.find((r) => r.region === region && r.item_id === productId);
  }, [rules]);

  const patchLocal = (id: string, patch: Partial<KitItem>) =>
    setItems((arr) => (arr || []).map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const commit = async (it: KitItem, patch: Partial<KitItem>) => {
    setBusyCell(it.id);
    try {
      await updateKitItem(accessToken, it.id, patch);
      // margin_pct is DB-generated — refetch the row's economics after cost/price edits
      patchLocal(it.id, patch);
      if ('price_usd' in patch || 'supplier_cost_usd' in patch) await load();
    } catch (e: any) { toast.error(`Save failed: ${e?.message || e}`); }
    finally { setBusyCell(null); }
  };

  /** Clone one item into a market, honouring block/substitute rules (shared cloneKitItem). */
  const cloneCell = async (source: KitItem, to: KitRegion) => {
    const rule = ruleFor(source.catalog_product_id, to);
    const blockRule = rule?.action === 'block' ? rule : undefined;
    if (blockRule && !blockRule.substitute_item_id) {
      toast.error(`Blocked in ${to}: ${blockRule.reason || 'regional restriction'}`);
      return;
    }
    setBusyCell(`${rowKeyOf(source)}:${to}`);
    try {
      const r = await cloneKitItem(accessToken, slug, source, to, blockRule);
      toast.success(r.outcome === 'substituted' ? `Substituted: ${r.detail}` : `Copied "${r.detail}" to ${to}`);
      await load();
    } catch (e: any) { toast.error(`Copy failed: ${e?.message || e}`); }
    finally { setBusyCell(null); }
  };

  const runCopyRegion = async () => {
    if (copyFrom === copyTo) { toast.error('Pick two different regions'); return; }
    const srcCount = (items || []).filter((i) => i.market === copyFrom).length;
    if (!window.confirm(
      `Copy ${copyFrom} → ${copyTo} for "${protocolName}"?\n\n${srcCount} source item(s). Items already in ${copyTo} (same title) are kept as-is; items whose product is BLOCKED in ${copyTo} are skipped or replaced by the rule's substitute.`,
    )) return;
    setCopying(true);
    try {
      const s = await copyKitRegion(accessToken, slug, copyFrom, copyTo, rules);
      const bits = [`${s.copied} copied`];
      if (s.substituted.length) bits.push(`${s.substituted.length} substituted (${s.substituted.join('; ')})`);
      if (s.skippedBlocked.length) bits.push(`${s.skippedBlocked.length} blocked & skipped (${s.skippedBlocked.join(', ')})`);
      if (s.unlinked.length) bits.push(`${s.unlinked.length} have no product link — review legality manually`);
      toast[s.skippedBlocked.length || s.unlinked.length ? 'warning' : 'success'](bits.join(' · '), { duration: 9000 });
      await load();
    } catch (e: any) { toast.error(`Copy failed: ${e?.message || e}`); }
    finally { setCopying(false); }
  };

  const addItem = async (market: KitRegion) => {
    try {
      const created = await createKitItem(accessToken, { slug, market, lane: 'store', title: 'New item', sort: ((items || []).filter((i) => i.market === market).length || 0) + 1 });
      setItems((arr) => [...(arr || []), created]);
      setExpanded(rowKeyOf(created));
    } catch (e: any) { toast.error(`Add failed: ${e?.message || e}`); }
  };
  const removeItem = async (it: KitItem) => {
    if (!window.confirm(`Remove "${it.title}" from the ${it.market} kit?`)) return;
    try { await deleteKitItem(accessToken, it.id); setItems((arr) => (arr || []).filter((x) => x.id !== it.id)); }
    catch (e: any) { toast.error(`Remove failed: ${e?.message || e}`); }
  };

  // per-region economics
  const totals = useMemo(() => {
    const t: Partial<Record<KitRegion, { sell: number; cost: number; costMissing: number; commission: number }>> = {};
    for (const r of markets) {
      const list = (items || []).filter((i) => i.market === r);
      const store = list.filter((i) => i.lane === 'store');
      const aff = list.filter((i) => i.lane === 'affiliate');
      t[r] = {
        sell: store.reduce((s, i) => s + (Number(i.price_usd) || 0), 0),
        cost: store.reduce((s, i) => s + (Number(i.supplier_cost_usd) || 0), 0),
        costMissing: store.filter((i) => i.supplier_cost_usd == null).length,
        commission: aff.reduce((s, i) => s + ((Number(i.price_usd) || 0) * (Number(i.commission_pct) || 0)) / 100, 0),
      };
    }
    return t;
  }, [items, markets]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* header: kit settings + copy-region toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-2">
        <button onClick={() => setSettingsOpen((o) => !o)} className={btnCls} title="Kit settings (title, partner, cart URLs, live per region)">
          <Settings2 size={12} /> Settings
        </button>
        <span className="flex-1" />
        <span className="text-xs text-gray-500">Copy</span>
        <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value as KitRegion)} className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs">
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <span className="text-xs text-gray-400">→</span>
        <select value={copyTo} onChange={(e) => setCopyTo(e.target.value as KitRegion)} className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs">
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button onClick={runCopyRegion} disabled={copying} className={btnCls}>
          {copying ? <Loader2 size={12} className="animate-spin" /> : <CopyIcon size={12} />} Copy region
        </button>
      </div>

      {settingsOpen && (
        <div className="space-y-2 border-b border-gray-100 bg-gray-50 p-2">
          {markets.map((m) => {
            const k = kitByMarket.get(m)!;
            return (
              <div key={k.id} className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-1 rounded bg-gray-200 px-1.5 py-0.5 text-center text-[11px] font-semibold text-gray-700">{m}</span>
                <input className={`${miniInput} col-span-3`} defaultValue={k.title || ''} placeholder="Title" onBlur={(e) => updateKit(accessToken, k.id, { title: e.target.value || null }).catch((err) => toast.error(String(err)))} />
                <input className={`${miniInput} col-span-2`} defaultValue={k.partner_label || ''} placeholder="Partner (e.g. Tre Lune)" onBlur={(e) => updateKit(accessToken, k.id, { partner_label: e.target.value || null }).catch((err) => toast.error(String(err)))} />
                <input className={`${miniInput} col-span-3`} defaultValue={k.partner_cart_url || ''} placeholder="Partner cart URL" onBlur={(e) => updateKit(accessToken, k.id, { partner_cart_url: e.target.value || null }).catch((err) => toast.error(String(err)))} />
                <input className={`${miniInput} col-span-2`} defaultValue={k.cart_url || ''} placeholder="Bundle cart URL" onBlur={(e) => updateKit(accessToken, k.id, { cart_url: e.target.value || null }).catch((err) => toast.error(String(err)))} />
                <button
                  onClick={async () => {
                    try { await updateKit(accessToken, k.id, { is_live: !k.is_live }); onKitsChanged(); }
                    catch (e: any) { toast.error(String(e?.message || e)); }
                  }}
                  className={`col-span-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${k.is_live ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {k.is_live ? 'Live' : 'Hidden'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* matrix */}
      {loading && items === null ? (
        <div className="p-6 text-center text-gray-400"><Loader2 size={16} className="mx-auto animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 760 }}>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                <th className="px-2 py-1.5 text-left font-medium" style={{ minWidth: 220 }}>Item</th>
                {markets.map((m) => {
                  const k = kitByMarket.get(m)!;
                  return (
                    <th key={m} className="px-2 py-1.5 text-left font-medium" style={{ minWidth: 120 }}>
                      <span className="inline-flex items-center gap-1.5">
                        {m}
                        <span className={`rounded-full px-1.5 text-[10px] font-semibold ${k.is_live ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>{k.is_live ? 'live' : 'hidden'}</span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rowKeys.map((rk) => {
                const cells = byRow.get(rk)!;
                const first = markets.map((m) => cells[m]).find(Boolean)!;
                const isOpen = expanded === rk;
                return (
                  <FragmentRow key={rk} rk={rk} cells={cells} first={first} markets={markets} isOpen={isOpen}
                    onToggle={() => setExpanded(isOpen ? null : rk)} ruleFor={ruleFor} busyCell={busyCell}
                    commit={commit} cloneCell={cloneCell} removeItem={removeItem} />
                );
              })}
              {/* footer: per-region economics */}
              <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs">
                <td className="px-2 py-2 font-semibold text-gray-600">Economics (store lane)</td>
                {markets.map((m) => {
                  const t = totals[m]!;
                  const margin = t.sell > 0 && t.cost > 0 ? Math.round(((t.sell - t.cost) / t.sell) * 1000) / 10 : null;
                  return (
                    <td key={m} className="px-2 py-2 align-top">
                      <div className="text-gray-800">Sell {fmt(t.sell)}</div>
                      <div className="text-gray-500">Cost {t.cost > 0 ? fmt(t.cost) : '—'}{t.costMissing > 0 && <span className="text-amber-600"> ({t.costMissing} no cost)</span>}</div>
                      <div className={margin != null ? 'font-semibold text-emerald-700' : 'text-gray-400'}>Margin {margin != null ? `${margin}%` : '—'}</div>
                      {t.commission > 0 && <div className="text-gray-500">Aff. est. {fmt(t.commission)}</div>}
                      <button onClick={() => addItem(m)} className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800"><Plus size={10} /> add item</button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FragmentRow({ rk, cells, first, markets, isOpen, onToggle, ruleFor, busyCell, commit, cloneCell, removeItem }: {
  rk: string; cells: Partial<Record<KitRegion, KitItem>>; first: KitItem; markets: KitRegion[]; isOpen: boolean;
  onToggle: () => void; ruleFor: (pid: string | null, r: KitRegion) => RegionRule | undefined; busyCell: string | null;
  commit: (it: KitItem, patch: Partial<KitItem>) => Promise<void>;
  cloneCell: (source: KitItem, to: KitRegion) => Promise<void>;
  removeItem: (it: KitItem) => Promise<void>;
}) {
  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-2 py-1.5">
          <button onClick={onToggle} className="flex w-full items-center gap-1.5 text-left">
            {isOpen ? <ChevronDown size={12} className="shrink-0 text-gray-400" /> : <ChevronRight size={12} className="shrink-0 text-gray-400" />}
            {first.image_url && <img src={first.image_url} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />}
            <span className="truncate text-gray-800" title={first.title || ''}>{first.title || '(untitled)'}</span>
            {!first.catalog_product_id && <span title="No catalog product link — region legality can't be checked automatically" className="shrink-0 text-[10px] text-amber-600">unlinked</span>}
          </button>
        </td>
        {markets.map((m) => {
          const it = cells[m];
          const rule = ruleFor(first.catalog_product_id, m);
          if (!it) {
            const src = markets.map((mm) => cells[mm]).find(Boolean)!;
            const blockedNoSub = rule?.action === 'block' && !rule.substitute_item_id;
            return (
              <td key={m} className="px-2 py-1.5">
                {blockedNoSub ? (
                  <span title={rule?.reason || ''} className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 border border-red-200">BLOCKED</span>
                ) : (
                  <button onClick={() => cloneCell(src, m)} disabled={busyCell === `${rk}:${m}`}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700"
                    title={rule?.substitute_item_id ? `Blocked here — will insert the rule's substitute` : `Copy from ${src.market}`}>
                    {busyCell === `${rk}:${m}` ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                    {rule?.substitute_item_id ? 'substitute' : `from ${src.market}`}
                  </button>
                )}
              </td>
            );
          }
          return (
            <td key={m} className={`px-2 py-1.5 ${busyCell === it.id ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-1.5">
                <input defaultValue={it.price_usd ?? ''} placeholder="$"
                  className="w-16 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs"
                  onBlur={(e) => { const v = num(e.target.value); if (v !== it.price_usd) commit(it, { price_usd: v }); }} />
                <span title={it.lane === 'store' ? 'HealthScan store (Shopify variant)' : 'Affiliate / external link'}
                  className={`rounded px-1 text-[10px] font-bold ${it.lane === 'store' ? 'bg-gray-900 text-white' : 'bg-purple-50 text-purple-600 border border-purple-300'}`}>
                  {it.lane === 'store' ? 'S' : 'A'}
                </span>
                {it.margin_pct != null && <span className="text-[10px] text-emerald-700">{it.margin_pct}%</span>}
                {rule && (
                  <span title={`${rule.reason || ''}${rule.substitute_item_id ? ` (substitute defined)` : ''}`}
                    className={`rounded px-1 text-[9px] font-bold ${rule.action === 'block' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {rule.action === 'block' ? 'BLOCK' : 'WARN'}
                  </span>
                )}
              </div>
            </td>
          );
        })}
      </tr>
      {isOpen && (
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <td className="px-2 py-2 align-top text-[11px] text-gray-500">
            Economics & sourcing per region
            <div className="mt-1 text-[10px] text-gray-400">Margin is computed by the database from sell − cost.</div>
          </td>
          {markets.map((m) => {
            const it = cells[m];
            if (!it) return <td key={m} className="px-2 py-2 align-top text-xs text-gray-300">—</td>;
            return (
              <td key={m} className="px-2 py-2 align-top">
                <div className="space-y-1">
                  <input defaultValue={it.supplier_cost_usd ?? ''} placeholder="Supplier cost $" className={miniInput}
                    onBlur={(e) => { const v = num(e.target.value); if (v !== it.supplier_cost_usd) commit(it, { supplier_cost_usd: v }); }} />
                  <input defaultValue={it.supplier ?? ''} placeholder="Supplier (Tre Lune…)" className={miniInput}
                    onBlur={(e) => commit(it, { supplier: e.target.value || null })} />
                  {it.lane === 'affiliate' && (
                    <input defaultValue={it.commission_pct ?? ''} placeholder="Commission %" className={miniInput}
                      onBlur={(e) => { const v = num(e.target.value); if (v !== it.commission_pct) commit(it, { commission_pct: v }); }} />
                  )}
                  <input defaultValue={it.lane === 'store' ? (it.variant_id ?? '') : (it.affiliate_url ?? '')}
                    placeholder={it.lane === 'store' ? 'Shopify variant id' : 'Affiliate URL'} className={miniInput}
                    onBlur={(e) => commit(it, it.lane === 'store' ? { variant_id: e.target.value || null } : { affiliate_url: e.target.value || null })} />
                  <div className="flex items-center justify-between">
                    <select defaultValue={it.lane} className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px]"
                      onChange={(e) => commit(it, { lane: e.target.value })}>
                      <option value="store">store</option>
                      <option value="affiliate">affiliate</option>
                    </select>
                    <button onClick={() => removeItem(it)} className="text-red-400 hover:text-red-600" title={`Remove from ${m}`}><Trash2 size={12} /></button>
                  </div>
                </div>
              </td>
            );
          })}
        </tr>
      )}
    </>
  );
}

export default KitMatrix;
