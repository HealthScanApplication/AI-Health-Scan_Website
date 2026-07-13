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
 * commission % for non-ROUTINE³ items. Footer totals per region: sell /
 * cost / margin / est. affiliate commission.
 *
 * "Copy region → region" clones missing items compliance-aware (skips blocked,
 * inserts rule substitutes with the mobile app's store/affiliate lane logic).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Copy as CopyIcon, ExternalLink, Loader2, Plus, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listKitItemsAllRegions, createKitItem, updateKitItem, deleteKitItem, updateKit, updateKitProtocol,
  copyKitRegion, cloneKitItem, searchProductsLite, kitItemFieldsFromProduct, listProtocolBuyableProducts,
  linkKitItemToProduct, kitItemBuyPath, listFxRates, itemMarginPct, itemSellUsd, fmtMoney, convertKitRegionPrices,
  REGION_CURRENCY, CURRENCY_SYMBOL, fetchKitAiSuggestions, playbookSuggestionCards, type KitSuggestionCard,
  REGIONS, REGION_FLAG, type ProtocolKit, type KitItem, type RegionRule, type KitRegion, type ProductHit,
  type ProtocolLite, type ProtocolSuggestion,
} from '../../utils/kitsAdmin';
import { Link2 } from 'lucide-react';

// standard admin control classes (adminTheme.css) — ONE size for inputs/buttons
const inputCls = 'sb-input w-full';
const miniInput = 'sb-input w-full';
const btnCls = 'sb-btn';

const fmt = (n: number | null | undefined) => (n == null ? '—' : `$${Number(n).toFixed(2)}`);
const rowKeyOf = (it: KitItem) => it.catalog_product_id || (it.title || '').toLowerCase().trim() || it.id;

function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** labeled field — a persistent caption above the control so a filled value
 *  (a supplier name, a bare variant id) is never ambiguous */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      {children}
    </label>
  );
}

export function KitMatrix({ slug, kits, rules, accessToken, protocolName, protocols, onKitsChanged, onOpenProduct }: {
  slug: string; kits: ProtocolKit[]; rules: RegionRule[]; accessToken: string;
  protocolName: string; protocols: ProtocolLite[]; onKitsChanged: () => void;
  /** open a linked catalog product in the record modal */
  onOpenProduct?: (catalogProductId: string | null, title?: string) => void;
}) {
  const [items, setItems] = useState<KitItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState<KitRegion>('US');
  const [copyTo, setCopyTo] = useState<KitRegion>('EU');
  const [copying, setCopying] = useState(false);
  const [busyCell, setBusyCell] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ProtocolSuggestion[] | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const kitByMarket = useMemo(() => new Map(kits.map((k) => [k.market, k])), [kits]);
  const markets = REGIONS.filter((r) => kitByMarket.has(r));
  const protocolId = kits[0]?.protocol_id;

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listKitItemsAllRegions(accessToken, slug)); }
    catch (e: any) { toast.error(`Load kit items failed: ${e?.message || e}`); setItems([]); }
    finally { setLoading(false); }
  }, [accessToken, slug]);
  useEffect(() => { load(); }, [load]);
  // FX (fx_rates table) — converts region-local sell prices to USD for margin math
  const [fx, setFx] = useState<Record<string, number>>({ USD: 1 });
  useEffect(() => { listFxRates(accessToken).then(setFx).catch(() => {}); }, [accessToken]);
  // products the PROTOCOL mentions — candidates to link into the kit
  useEffect(() => {
    if (!protocolId) { setSuggestions([]); return; }
    listProtocolBuyableProducts(accessToken, protocolId).then(setSuggestions).catch(() => setSuggestions([]));
  }, [accessToken, protocolId]);

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
  // row ordering: manual (the kit's `sort` field — what mobile renders) or a
  // computed order-by; drag-to-reorder is only live in manual mode
  const [orderBy, setOrderBy] = useState<'manual' | 'name' | 'price' | 'margin'>('manual');
  const rowKeys = useMemo(() => {
    const entries = [...byRow.entries()];
    const firstOf = (cells: Partial<Record<KitRegion, KitItem>>) => cells.US || Object.values(cells).find(Boolean)!;
    const sortOf = (cells: Partial<Record<KitRegion, KitItem>>) => Math.min(...Object.values(cells).map((i) => i?.sort ?? 9999));
    const cmp: Record<typeof orderBy, (a: Partial<Record<KitRegion, KitItem>>, b: Partial<Record<KitRegion, KitItem>>) => number> = {
      manual: (a, b) => sortOf(a) - sortOf(b),
      name: (a, b) => (firstOf(a).title || '').localeCompare(firstOf(b).title || ''),
      price: (a, b) => (Number(firstOf(b).price_usd) || 0) - (Number(firstOf(a).price_usd) || 0),
      margin: (a, b) => (itemMarginPct(firstOf(b), fx) ?? -1) - (itemMarginPct(firstOf(a), fx) ?? -1),
    };
    return entries.sort((a, b) => cmp[orderBy](a[1], b[1])).map(([k]) => k);
  }, [byRow, orderBy, fx]);

  // drag-to-reorder (manual mode): persists `sort` on every region cell so the
  // mobile app's item order follows
  const [dragRk, setDragRk] = useState<string | null>(null);
  const dropOn = async (targetRk: string) => {
    if (!dragRk || dragRk === targetRk || orderBy !== 'manual') { setDragRk(null); return; }
    const order = rowKeys.filter((k) => k !== dragRk);
    order.splice(order.indexOf(targetRk) + (rowKeys.indexOf(dragRk) < rowKeys.indexOf(targetRk) ? 1 : 0), 0, dragRk);
    setDragRk(null);
    const patches: Array<{ id: string; sort: number }> = [];
    order.forEach((rk, idx) => {
      for (const it of Object.values(byRow.get(rk) || {})) {
        if (it && it.sort !== idx * 10) { patches.push({ id: it.id, sort: idx * 10 }); patchLocal(it.id, { sort: idx * 10 }); }
      }
    });
    try { for (const p of patches) await updateKitItem(accessToken, p.id, { sort: p.sort }); }
    catch (e: any) { toast.error(`Reorder failed: ${e?.message || e}`); await load(); }
  };

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

  /** Add a picked catalog product as a kit item — to one market ("a special
   *  product in a region", e.g. AU-only coconut oil) or to every region the kit
   *  has, skipping regions where the product is BLOCKED. */
  const addProduct = async (p: ProductHit, market: KitRegion, allRegions: boolean) => {
    const targets = allRegions ? markets : [market];
    let added = 0; const skipped: string[] = [];
    for (const m of targets) {
      const rule = rules.find((r) => r.region === m && r.item_id === p.id && r.action === 'block');
      if (rule) { skipped.push(`${m} (${rule.reason || 'blocked'})`); continue; }
      try {
        const created = await createKitItem(accessToken, {
          slug, market: m, ...kitItemFieldsFromProduct(p),
          sort: ((items || []).filter((i) => i.market === m).length || 0) + 1,
        });
        setItems((arr) => [...(arr || []), created]);
        added += 1;
      } catch (e: any) { toast.error(`Add to ${m} failed: ${e?.message || e}`); }
    }
    if (added) toast.success(`Added "${p.name}" to ${added} region${added === 1 ? '' : 's'}${skipped.length ? ` — skipped ${skipped.join(', ')}` : ''}`);
    else if (skipped.length) toast.warning(`Not added — blocked in ${skipped.join(', ')}`);
  };
  const addBlank = async (market: KitRegion) => {
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
  // link a whole row (all its region items) to a chosen catalog product
  const linkRow = async (cells: Partial<Record<KitRegion, KitItem>>, p: ProductHit) => {
    const targets = Object.values(cells).filter(Boolean) as KitItem[];
    setBusyCell(`link:${rowKeyOf(targets[0])}`);
    try {
      for (const it of targets) await linkKitItemToProduct(accessToken, it, p);
      await load();
      toast.success(`Linked ${targets.length} region item${targets.length === 1 ? '' : 's'} to "${p.name}"`);
    } catch (e: any) { toast.error(`Link failed: ${e?.message || e}`); }
    finally { setBusyCell(null); }
  };

  // products the protocol references but the kit hasn't linked yet
  const linkedProductIds = useMemo(() => new Set((items || []).map((i) => i.catalog_product_id).filter(Boolean)), [items]);
  const unlinkedSuggestions = useMemo(() => (suggestions || []).filter((s) => !linkedProductIds.has(s.id)), [suggestions, linkedProductIds]);
  const linkSuggestion = async (s: ProtocolSuggestion) => {
    setLinkingId(s.id);
    try { await addProduct(s, markets[0], true); await load(); }
    finally { setLinkingId(null); }
  };
  const linkAllSuggestions = async () => {
    if (!unlinkedSuggestions.length) return;
    if (!window.confirm(`Link all ${unlinkedSuggestions.length} product(s) this protocol mentions into the kit (every region, skipping any that are blocked)?`)) return;
    setLinkingId('__all__');
    try { for (const s of unlinkedSuggestions) await addProduct(s, markets[0], true); await load(); }
    finally { setLinkingId(null); }
  };

  // per-region economics — sell/commission are region-local; sellUsd converts
  // via fx so margin vs USD supplier costs stays honest
  const totals = useMemo(() => {
    const t: Partial<Record<KitRegion, { sell: number; sellUsd: number; cost: number; costMissing: number; commission: number }>> = {};
    for (const r of markets) {
      const list = (items || []).filter((i) => i.market === r);
      const store = list.filter((i) => i.lane === 'store');
      const aff = list.filter((i) => i.lane === 'affiliate');
      const rate = fx[REGION_CURRENCY[r]] ?? 1;
      const sell = store.reduce((s, i) => s + (Number(i.price_usd) || 0), 0);
      t[r] = {
        sell,
        sellUsd: sell * rate,
        cost: store.reduce((s, i) => s + (Number(i.supplier_cost_usd) || 0), 0),
        costMissing: store.filter((i) => i.supplier_cost_usd == null).length,
        commission: aff.reduce((s, i) => s + ((Number(i.price_usd) || 0) * (Number(i.commission_pct) || 0)) / 100, 0),
      };
    }
    return t;
  }, [items, markets, fx]);

  /** re-derive one region's prices from the US column (retail x.99 rounding) */
  const convertRegion = async (to: KitRegion) => {
    if (to === 'US') return;
    const cur = REGION_CURRENCY[to];
    const def = (1 / (fx[cur] || 1)).toFixed(2);
    const raw = window.prompt(`US$ → ${cur} rate (${cur} per 1 USD).\nEvery ${to} item priced like its US sibling gets US price × rate, rounded to x.99.`, def);
    if (raw == null) return;
    const rate = Number(raw);
    if (!Number.isFinite(rate) || rate <= 0) { toast.error('Not a valid rate'); return; }
    setBusyCell(`convert:${to}`);
    try {
      const n = await convertKitRegionPrices(accessToken, slug, to as Exclude<KitRegion, 'US'>, rate);
      toast.success(`${to}: ${n} price(s) set from US × ${rate}`);
      await load();
    } catch (e: any) { toast.error(`Convert failed: ${e?.message || e}`); }
    finally { setBusyCell(null); }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* header: kit settings + copy-region toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-2">
        <button onClick={() => setSettingsOpen((o) => !o)} className={btnCls} title="Kit settings (title, partner, cart URLs, live per region)">
          <Settings2 size={12} /> Settings
        </button>
        <span className="flex-1" />
        <span className="text-xs text-gray-500">Copy</span>
        <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value as KitRegion)} className="sb-select">
          {REGIONS.map((r) => <option key={r} value={r}>{REGION_FLAG[r]} {r}</option>)}
        </select>
        <span className="text-xs text-gray-400">→</span>
        <select value={copyTo} onChange={(e) => setCopyTo(e.target.value as KitRegion)} className="sb-select">
          {REGIONS.map((r) => <option key={r} value={r}>{REGION_FLAG[r]} {r}</option>)}
        </select>
        <button onClick={runCopyRegion} disabled={copying} className={btnCls}>
          {copying ? <Loader2 size={12} className="animate-spin" /> : <CopyIcon size={12} />} Copy region
        </button>
      </div>

      {settingsOpen && (
        <div className="space-y-2 border-b border-gray-100 bg-gray-50 p-2">
          <ProtocolReassign slug={slug} protocolId={protocolId} protocols={protocols} accessToken={accessToken} onChanged={onKitsChanged} />
          {markets.map((m) => {
            const k = kitByMarket.get(m)!;
            return (
              <div key={k.id} className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-1 rounded bg-gray-200 px-1.5 py-0.5 text-center text-[11px] font-semibold text-gray-700">{REGION_FLAG[m]} {m}</span>
                <input className={`${miniInput} col-span-2`} defaultValue={k.title || ''} placeholder="Title" onBlur={(e) => updateKit(accessToken, k.id, { title: e.target.value || null }).catch((err) => toast.error(String(err)))} />
                <input className={`${miniInput} col-span-2`} defaultValue={k.partner_label || ''} placeholder="Partner (e.g. Tre Lune)" onBlur={(e) => updateKit(accessToken, k.id, { partner_label: e.target.value || null }).catch((err) => toast.error(String(err)))} />
                <input className={`${miniInput} col-span-2`} defaultValue={k.partner_cart_url || ''} placeholder="Partner cart URL" onBlur={(e) => updateKit(accessToken, k.id, { partner_cart_url: e.target.value || null }).catch((err) => toast.error(String(err)))} />
                <input className={`${miniInput} col-span-2`} defaultValue={k.cart_url || ''} placeholder="Bundle cart URL" onBlur={(e) => updateKit(accessToken, k.id, { cart_url: e.target.value || null }).catch((err) => toast.error(String(err)))} />
                <input className={`${miniInput} col-span-2`} defaultValue={k.image_url || ''} placeholder="Kit image URL (falls back to protocol)" onBlur={(e) => updateKit(accessToken, k.id, { image_url: e.target.value || null }).catch((err) => toast.error(String(err)))} />
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

      {/* suggested from protocol — products the protocol mentions but the kit hasn't linked */}
      {unlinkedSuggestions.length > 0 && (
        <div className="border-b border-gray-100 bg-emerald-50 p-2">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-emerald-800">
              This protocol mentions {unlinkedSuggestions.length} product{unlinkedSuggestions.length === 1 ? '' : 's'} not in the kit — link them in
            </span>
            <button onClick={linkAllSuggestions} disabled={linkingId === '__all__'}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700">
              {linkingId === '__all__' ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Link all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unlinkedSuggestions.map((s) => {
              const isStore = /^\d+$/.test(String(s.shopify_variant_id || ''));
              return (
                <button key={s.id} onClick={() => linkSuggestion(s)} disabled={!!linkingId}
                  title={`Mentioned ${s.mentions}× · links to every region (skips blocked)`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:border-emerald-400">
                  {linkingId === s.id ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} className="text-emerald-600" />}
                  {s.image && <img src={s.image} alt="" className="h-4 w-4 rounded object-cover" />}
                  <span className="max-w-48 truncate">{s.protocolTitle}</span>
                  {s.mentions > 1 && <span className="rounded bg-emerald-50 px-1 text-[9px] font-semibold text-emerald-700">{s.mentions}×</span>}
                  <span className={`rounded px-1 text-[9px] font-bold ${isStore ? 'bg-gray-900 text-white' : 'bg-purple-50 text-purple-600 border border-purple-300'}`}>{isStore ? 'S' : 'A'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* sourcing suggestions: deterministic playbook cards + optional AI pass */}
      <AiSuggestions items={items || []} slug={slug} accessToken={accessToken} onApplied={load} />

      {/* matrix */}
      {loading && items === null ? (
        <div className="p-6 text-center text-gray-400"><Loader2 size={16} className="mx-auto animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 760 }}>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                <th className="px-2 py-1.5 text-left font-medium" style={{ minWidth: 220 }}>
                  <span className="inline-flex items-center gap-1.5">
                    Item
                    <select value={orderBy} onChange={(e) => setOrderBy(e.target.value as typeof orderBy)}
                      className="rounded border border-gray-300 bg-transparent px-1 py-0 text-[10px] font-normal text-gray-500"
                      title="Row order. 'manual' is the kit's saved order (what the app shows) — drag the ≡ handle to change it.">
                      <option value="manual">manual ≡</option>
                      <option value="name">name A–Z</option>
                      <option value="price">price ↓</option>
                      <option value="margin">margin ↓</option>
                    </select>
                  </span>
                </th>
                {markets.map((m) => {
                  const k = kitByMarket.get(m)!;
                  return (
                    <th key={m} className="px-2 py-1.5 text-left font-medium" style={{ minWidth: 120 }}>
                      <span className="inline-flex items-center gap-1.5">
                        {REGION_FLAG[m]} {m}
                        <span className="text-[10px] font-normal text-gray-400">{CURRENCY_SYMBOL[REGION_CURRENCY[m]]}</span>
                        <span className={`rounded-full px-1.5 text-[10px] font-semibold ${k.is_live ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>{k.is_live ? 'live' : 'hidden'}</span>
                        {m !== 'US' && (
                          <button onClick={() => convertRegion(m)} disabled={busyCell === `convert:${m}`}
                            className="rounded border border-gray-300 px-1 text-[10px] font-semibold text-gray-500 hover:bg-gray-100"
                            title={`Set every ${m} price from the US price × FX rate (retail x.99 rounding)`}>
                            {busyCell === `convert:${m}` ? <Loader2 size={9} className="inline animate-spin" /> : <>$→{CURRENCY_SYMBOL[REGION_CURRENCY[m]]}</>}
                          </button>
                        )}
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
                    commit={commit} cloneCell={cloneCell} removeItem={removeItem}
                    accessToken={accessToken} onLinkRow={linkRow} fx={fx} onOpenProduct={onOpenProduct}
                    draggable={orderBy === 'manual'} isDragging={dragRk === rk}
                    onDragStart={() => setDragRk(rk)} onDragEnd={() => setDragRk(null)} onDropRow={() => dropOn(rk)} />
                );
              })}
              {/* footer: per-region economics */}
              <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs">
                <td className="px-2 py-2 font-semibold text-gray-600">Economics (store lane)</td>
                {markets.map((m) => {
                  const t = totals[m]!;
                  const cur = REGION_CURRENCY[m];
                  // sell is region-local; costs are USD — margin uses the fx-converted sell
                  const margin = t.sellUsd > 0 && t.cost > 0 ? Math.round(((t.sellUsd - t.cost) / t.sellUsd) * 1000) / 10 : null;
                  return (
                    <td key={m} className="px-2 py-2 align-top">
                      <div className="text-gray-800">Sell {fmtMoney(t.sell, cur)}{cur !== 'USD' && t.sell > 0 && <span className="text-[10px] text-gray-400"> ≈ {fmtMoney(t.sellUsd, 'USD')}</span>}</div>
                      <div className="text-gray-500">Cost {t.cost > 0 ? fmtMoney(t.cost, 'USD') : '—'}{t.costMissing > 0 && <span className="text-amber-600"> ({t.costMissing} no cost)</span>}</div>
                      <div className={margin != null ? 'font-semibold text-emerald-700' : 'text-gray-400'}>Margin {margin != null ? `${margin}%` : '—'}</div>
                      {t.commission > 0 && <div className="text-gray-500">Aff. est. {fmtMoney(t.commission, cur)}</div>}
                      <AddProductPicker market={m} accessToken={accessToken} onPick={addProduct} onBlank={() => addBlank(m)} />
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

function FragmentRow({ rk, cells, first, markets, isOpen, onToggle, ruleFor, busyCell, commit, cloneCell, removeItem, accessToken, onLinkRow, fx, onOpenProduct, draggable, isDragging, onDragStart, onDragEnd, onDropRow }: {
  rk: string; cells: Partial<Record<KitRegion, KitItem>>; first: KitItem; markets: KitRegion[]; isOpen: boolean;
  fx: Record<string, number>;
  onToggle: () => void; ruleFor: (pid: string | null, r: KitRegion) => RegionRule | undefined; busyCell: string | null;
  commit: (it: KitItem, patch: Partial<KitItem>) => Promise<void>;
  cloneCell: (source: KitItem, to: KitRegion) => Promise<void>;
  removeItem: (it: KitItem) => Promise<void>;
  accessToken: string; onLinkRow: (cells: Partial<Record<KitRegion, KitItem>>, p: ProductHit) => Promise<void>;
  onOpenProduct?: (catalogProductId: string | null, title?: string) => void;
  draggable: boolean; isDragging: boolean;
  onDragStart: () => void; onDragEnd: () => void; onDropRow: () => void;
}) {
  const linked = !!first.catalog_product_id;
  const buyPath = kitItemBuyPath(first); // store | affiliate | null — same product across regions
  return (
    <>
      <tr className={`border-b border-gray-100 hover:bg-gray-50 ${isDragging ? 'opacity-40' : ''}`}
        onDragOver={(e) => e.preventDefault()} onDrop={onDropRow}>
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span draggable={draggable} onDragStart={onDragStart} onDragEnd={onDragEnd}
              title={draggable ? 'Drag to reorder — saves the kit order the app shows' : 'Switch order to "manual" to drag'}
              className={`select-none text-gray-300 ${draggable ? 'cursor-grab hover:text-gray-500' : 'cursor-not-allowed opacity-40'}`}>≡</span>
            <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
              {isOpen ? <ChevronDown size={12} className="shrink-0 text-gray-400" /> : <ChevronRight size={12} className="shrink-0 text-gray-400" />}
              {first.image_url
                ? <img src={first.image_url} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
                : <span className="h-6 w-6 shrink-0 rounded bg-gray-100" />}
              <span className="truncate text-gray-800" title={first.title || ''}>{first.title || '(untitled)'}</span>
              {/* consistent status chips on every row */}
              {!buyPath && <span title="No buy path — needs a Shopify variant (store) or an affiliate URL to be sellable" className="shrink-0 rounded bg-amber-50 px-1 text-[9px] font-bold text-amber-700 border border-amber-200">NO BUY PATH</span>}
            </button>
            {/* linked → open the catalog product record; unlinked → link picker */}
            {linked && onOpenProduct ? (
              <button onClick={() => onOpenProduct(first.catalog_product_id!)}
                title={`Open the linked product record (${first.catalog_product_id})`}
                className="inline-flex shrink-0 items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100">
                <ExternalLink size={10} /> open
              </button>
            ) : null}
            <RowLinkPicker linked={linked} busy={busyCell === `link:${rk}`} accessToken={accessToken} onPick={(p) => onLinkRow(cells, p)} />
          </div>
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
                <span className="text-[10px] text-gray-400">{CURRENCY_SYMBOL[it.currency || REGION_CURRENCY[m]] || it.currency}</span>
                <input defaultValue={it.price_usd ?? ''} placeholder="0.00" title="Sale price (region currency)"
                  className="w-16 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs"
                  onBlur={(e) => { const v = num(e.target.value); if (v !== it.price_usd) commit(it, { price_usd: v }); }} />
                <span title={it.lane === 'store' ? 'ROUTINE³ store (Shopify variant)' : 'Affiliate / external link'}
                  className={`rounded px-1 text-[10px] font-bold ${it.lane === 'store' ? 'bg-gray-900 text-white' : 'bg-purple-50 text-purple-600 border border-purple-300'}`}>
                  {it.lane === 'store' ? 'S' : 'A'}
                </span>
                {rule && (
                  <span title={`${rule.reason || ''}${rule.substitute_item_id ? ` (substitute defined)` : ''}`}
                    className={`rounded px-1 text-[9px] font-bold ${rule.action === 'block' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {rule.action === 'block' ? 'BLOCK' : 'WARN'}
                  </span>
                )}
              </div>
              {/* cost + margin, per region, without expanding the row */}
              <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                <span title="Supplier cost (always USD)">cost $</span>
                <input defaultValue={it.supplier_cost_usd ?? ''} placeholder="—" title="Supplier cost (USD)"
                  className="w-12 rounded border border-gray-200 bg-white px-1 py-0 text-[10px] text-gray-700"
                  onBlur={(e) => { const v = num(e.target.value); if (v !== it.supplier_cost_usd) commit(it, { supplier_cost_usd: v }); }} />
                {(() => { const mp = itemMarginPct(it, fx); return mp != null
                  ? <span title={`Margin: sell ${fmtMoney(it.price_usd, it.currency)} → USD via FX (${fmtMoney(itemSellUsd(it, fx), 'USD')}) − cost ${fmtMoney(it.supplier_cost_usd, 'USD')}`}
                      className={`font-semibold ${mp >= 40 ? 'text-emerald-700' : mp >= 20 ? 'text-amber-600' : 'text-red-600'}`}>{mp}% m</span>
                  : <span title="Enter a supplier cost to see the margin">— m</span>; })()}
              </div>
            </td>
          );
        })}
      </tr>
      {isOpen && (
        <tr className="border-b border-gray-100 bg-gray-50">
          <td className="px-2 py-2 align-top text-[11px] text-gray-500">
            Economics & sourcing per region
            <div className="mt-1 text-[10px] text-gray-400">Sell prices are region-local; supplier costs are USD. Margin converts sell → USD via fx_rates.</div>
          </td>
          {markets.map((m) => {
            const it = cells[m];
            if (!it) return <td key={m} className="px-2 py-2 align-top text-xs text-gray-300">—</td>;
            return (
              <td key={m} className="px-2 py-2 align-top">
                <div className="space-y-1.5">
                  <Field label="Supplier cost (USD/unit)">
                    <input defaultValue={it.supplier_cost_usd ?? ''} placeholder="0.00" className={miniInput}
                      onBlur={(e) => { const v = num(e.target.value); if (v !== it.supplier_cost_usd) commit(it, { supplier_cost_usd: v }); }} />
                  </Field>
                  <Field label="Supplier">
                    <input defaultValue={it.supplier ?? ''} placeholder="Supliful, Tre Lune…" className={miniInput}
                      onBlur={(e) => commit(it, { supplier: e.target.value || null })} />
                  </Field>
                  {it.lane === 'affiliate' && (
                    <Field label="Affiliate commission %">
                      <input defaultValue={it.commission_pct ?? ''} placeholder="e.g. 15" className={miniInput}
                        onBlur={(e) => { const v = num(e.target.value); if (v !== it.commission_pct) commit(it, { commission_pct: v }); }} />
                    </Field>
                  )}
                  <Field label={it.lane === 'store' ? 'Shopify variant ID' : 'Affiliate URL'}>
                    <input defaultValue={it.lane === 'store' ? (it.variant_id ?? '') : (it.affiliate_url ?? '')}
                      placeholder={it.lane === 'store' ? '5791129…' : 'https://…'} className={miniInput}
                      onBlur={(e) => commit(it, it.lane === 'store' ? { variant_id: e.target.value || null } : { affiliate_url: e.target.value || null })} />
                  </Field>
                  <div className="flex items-end justify-between gap-1">
                    <Field label="Sold via">
                      <select defaultValue={it.lane} className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px]"
                        title="Our store = we sell & fulfil on Shopify. Partner link = we link out to the brand for commission."
                        onChange={(e) => commit(it, { lane: e.target.value })}>
                        <option value="store">Our store (Shopify)</option>
                        <option value="affiliate">Partner link (external)</option>
                      </select>
                    </Field>
                    <button onClick={() => removeItem(it)} className="mb-0.5 text-red-400 hover:text-red-600" title={`Remove from ${m}`}><Trash2 size={12} /></button>
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

/** Change which protocol a kit is displayed under (updates protocol_id on all
 *  region rows; slug + items stay put). Typeahead over the protocol list. */
function ProtocolReassign({ slug, protocolId, protocols, accessToken, onChanged }: {
  slug: string; protocolId?: string; protocols: ProtocolLite[]; accessToken: string; onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const current = protocols.find((p) => p.id === protocolId);
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return protocols.filter((p) => p.name.toLowerCase().includes(t)).slice(0, 8);
  }, [q, protocols]);
  const pick = async (p: ProtocolLite) => {
    setBusy(true);
    try { await updateKitProtocol(accessToken, slug, p.id); toast.success(`Kit re-linked to "${p.name}"`); setEditing(false); setQ(''); onChanged(); }
    catch (e: any) { toast.error(`Re-link failed: ${e?.message || e}`); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Linked protocol</span>
      {!editing ? (
        <>
          <span className="text-sm font-medium text-gray-800">{current?.name || protocolId || '—'}</span>
          <button onClick={() => setEditing(true)} className="text-[11px] text-gray-500 underline hover:text-gray-800">change</button>
        </>
      ) : (
        <div className="relative flex-1">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search protocols…"
            className="w-full rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-900"
            onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setQ(''); } }} />
          {hits.length > 0 && (
            <div className="absolute z-30 mt-1 w-72 rounded-md border border-gray-200 bg-white shadow-md">
              {hits.map((p) => (
                <button key={p.id} onClick={() => pick(p)} disabled={busy} className="block w-full truncate px-2 py-1 text-left text-xs hover:bg-gray-50">{p.name}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** "+ add product" per region: catalog typeahead (e.g. type "coconut oil"),
 *  pick a product → it lands LINKED (legality badges + compliant copy work),
 *  either in this region only or across all the kit's regions. */
/** Per-row "link to catalog product" — search the catalog and attach the product
 *  to every region's item in this row (store lane if it has a Shopify variant,
 *  else affiliate). "linked" just recolours the chip; you can always re-link. */
function RowLinkPicker({ linked, busy, accessToken, onPick }: {
  linked: boolean; busy: boolean; accessToken: string; onPick: (p: ProductHit) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [searching, setSearching] = useState(false);
  const run = (term: string) => {
    setQ(term);
    if (!term.trim()) { setHits([]); return; }
    setSearching(true);
    searchProductsLite(accessToken, term, 6).then(setHits).catch(() => setHits([])).finally(() => setSearching(false));
  };
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen((o) => !o)} disabled={busy}
        title={linked ? 'Linked to a catalog product — click to re-link' : 'Link this item to a catalog product (Shopify store or affiliate)'}
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${linked ? 'text-emerald-700 hover:bg-emerald-50' : 'text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100'}`}>
        {busy ? <Loader2 size={10} className="animate-spin" /> : <Link2 size={10} />}
        {linked ? 'linked' : 'link'}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-md">
          <input autoFocus value={q} onChange={(e) => run(e.target.value)} placeholder="Search catalog products…"
            className="w-full rounded-t-md border-b border-gray-100 px-2 py-1.5 text-xs text-gray-900"
            onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQ(''); setHits([]); } }} />
          {searching && <div className="p-2 text-center text-gray-400"><Loader2 size={12} className="mx-auto animate-spin" /></div>}
          {hits.map((h) => {
            const isStore = /^\d+$/.test(String(h.shopify_variant_id || ''));
            return (
              <button key={h.id} onClick={() => { setOpen(false); setQ(''); setHits([]); onPick(h); }}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-gray-50">
                {h.image ? <img src={h.image} alt="" className="h-5 w-5 rounded object-cover" /> : <span className="h-5 w-5 rounded bg-gray-100" />}
                <span className="min-w-0 flex-1 truncate text-gray-800">{h.name}</span>
                <span className={`shrink-0 rounded px-1 text-[9px] font-bold ${isStore ? 'bg-gray-900 text-white' : 'bg-purple-50 text-purple-600 border border-purple-300'}`}>{isStore ? 'S' : 'A'}</span>
              </button>
            );
          })}
          {!searching && q.trim() && !hits.length && <div className="p-2 text-center text-[11px] text-gray-400">No products match</div>}
        </div>
      )}
    </div>
  );
}

function AddProductPicker({ market, accessToken, onPick, onBlank }: {
  market: KitRegion; accessToken: string;
  onPick: (p: ProductHit, market: KitRegion, allRegions: boolean) => Promise<void>;
  onBlank: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [allRegions, setAllRegions] = useState(false);

  const run = (term: string) => {
    setQ(term);
    if (!term.trim()) { setHits([]); return; }
    setSearching(true);
    searchProductsLite(accessToken, term, 6).then(setHits).catch(() => setHits([])).finally(() => setSearching(false));
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800">
        <Plus size={10} /> add product
      </button>
    );
  }
  return (
    <div className="relative mt-1">
      <input autoFocus value={q} onChange={(e) => run(e.target.value)} placeholder="Search products…"
        className="w-full rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-900"
        onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQ(''); setHits([]); } }} />
      <div className="absolute z-20 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-md">
        {searching && <div className="p-2 text-center text-gray-400"><Loader2 size={12} className="mx-auto animate-spin" /></div>}
        {hits.map((h) => (
          <button key={h.id} onClick={async () => { setOpen(false); setQ(''); setHits([]); await onPick(h, market, allRegions); }}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-gray-50">
            {h.image ? <img src={h.image} alt="" className="h-5 w-5 rounded object-cover" /> : <span className="h-5 w-5 rounded bg-gray-100" />}
            <span className="min-w-0 flex-1 truncate text-gray-800">{h.name}</span>
            {h.price_usd != null && <span className="shrink-0 text-gray-500">${h.price_usd}</span>}
            <span className={`shrink-0 rounded px-1 text-[9px] font-bold ${/^\d+$/.test(String(h.shopify_variant_id || '')) ? 'bg-gray-900 text-white' : 'bg-purple-50 text-purple-600 border border-purple-300'}`}>
              {/^\d+$/.test(String(h.shopify_variant_id || '')) ? 'S' : 'A'}
            </span>
          </button>
        ))}
        {!searching && q.trim() && !hits.length && <div className="p-2 text-center text-[11px] text-gray-400">No products match</div>}
        <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1.5">
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <input type="checkbox" checked={allRegions} onChange={(e) => setAllRegions(e.target.checked)} />
            all regions (skips blocked)
          </label>
          <button onClick={() => { setOpen(false); onBlank(); }} className="text-[10px] text-gray-400 hover:text-gray-700">custom item</button>
        </div>
      </div>
    </div>
  );
}

/* ── sourcing suggestion cards ──
   Deterministic playbook cards (no supplier / no buy path / missing commission)
   render immediately; "✨ AI suggestions" adds an LLM pass over the kit via the
   edge endpoint (organic & third-party-tested upgrades, dropship setups,
   affiliate programs). "Apply supplier" PATCHes it onto the matching items. */
const CARD_STYLE: Record<string, { bg: string; border: string; label: string }> = {
  quality: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.35)', label: 'QUALITY' },
  dropship: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.35)', label: 'DROPSHIP' },
  supplier: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.35)', label: 'SUPPLIER' },
  affiliate: { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.35)', label: 'AFFILIATE' },
  pricing: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.35)', label: 'PRICING' },
};

function AiSuggestions({ items, slug, accessToken, onApplied }: {
  items: KitItem[]; slug: string; accessToken: string; onApplied: () => Promise<void>;
}) {
  const [aiCards, setAiCards] = useState<KitSuggestionCard[] | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const playbook = useMemo(() => playbookSuggestionCards(items), [items]);
  const cards = [...playbook, ...(aiCards || [])];

  const runAi = async () => {
    setAiBusy(true);
    try {
      const { cards: got, provider } = await fetchKitAiSuggestions(accessToken, slug);
      setAiCards(got);
      toast.success(got.length ? `${got.length} AI suggestion(s) (${provider})` : 'AI found nothing to add');
    } catch (e: any) { toast.error(e?.message || 'AI suggestions failed'); }
    finally { setAiBusy(false); }
  };

  /** set card.action.supplier on the matching items (by title, else every
   *  store item without a supplier) — never overwrites an existing supplier */
  const applySupplier = async (card: KitSuggestionCard) => {
    if (card.action?.kind !== 'set_supplier') return;
    const norm = (s: string | null | undefined) => (s || '').toLowerCase().trim();
    const targets = items.filter((i) => !i.supplier && (card.item_title ? norm(i.title) === norm(card.item_title) : i.lane === 'store'));
    if (!targets.length) { toast.info('No unset items to apply this to'); return; }
    setApplying(card.title);
    try {
      for (const t of targets) await updateKitItem(accessToken, t.id, { supplier: card.action.supplier });
      toast.success(`Supplier "${card.action.supplier}" set on ${targets.length} item(s)`);
      await onApplied();
    } catch (e: any) { toast.error(`Apply failed: ${e?.message || e}`); }
    finally { setApplying(null); }
  };

  if (!items.length) return null;
  return (
    <div className="border-b border-gray-100 p-2">
      <div className="flex items-center gap-2">
        <button onClick={() => setCollapsed((c) => !c)} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          Sourcing suggestions
          {cards.length > 0 && <span className="rounded-full bg-gray-200 px-1.5 text-[10px] text-gray-600">{cards.length}</span>}
        </button>
        <span className="flex-1" />
        <button onClick={runAi} disabled={aiBusy} className={btnCls} title="Ask the AI for kit-specific quality (organic / third-party-tested), dropship and affiliate suggestions">
          {aiBusy ? <Loader2 size={12} className="animate-spin" /> : <>✨</>} AI suggestions
        </button>
      </div>
      {!collapsed && cards.length > 0 && (
        <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {cards.map((card, idx) => {
            const s = CARD_STYLE[card.type] || CARD_STYLE.supplier;
            return (
              <div key={`${card.source}-${idx}`} className="rounded-md p-2 text-xs" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="flex items-center gap-1.5">
                  <span className="rounded px-1 text-[9px] font-bold tracking-wide" style={{ border: `1px solid ${s.border}` }}>{s.label}</span>
                  {card.source === 'ai' && <span className="text-[9px] text-gray-400">✨ AI{card.confidence ? ` · ${card.confidence}` : ''}</span>}
                  {card.item_title && <span className="truncate text-[10px] text-gray-500" title={card.item_title}>{card.item_title}</span>}
                </div>
                <div className="mt-1 font-semibold text-gray-800">{card.title}</div>
                <div className="mt-0.5 text-gray-600">{card.detail}</div>
                {card.action?.kind === 'set_supplier' && (
                  <button onClick={() => applySupplier(card)} disabled={applying === card.title}
                    className="mt-1.5 inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-50">
                    {applying === card.title ? <Loader2 size={9} className="animate-spin" /> : <Plus size={9} />}
                    Apply supplier "{card.action.supplier}"
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!collapsed && cards.length === 0 && (
        <div className="mt-1 text-[11px] text-gray-400">All items have suppliers, buy paths and commissions — run ✨ AI for quality & program ideas.</div>
      )}
    </div>
  );
}

export default KitMatrix;
