/**
 * KitsPanel — admin surface for the REAL "buy this protocol" kits
 * (protocol_kits / protocol_kit_items), the tables the mobile app's
 * ProtocolKitButton actually reads (unlike the dead hs_packages/package_items).
 *
 * v2: each kit renders as a KitMatrix — items × regions (US/EU/UK/AU) with
 * legality badges from catalog_region_rules, per-item economics (supplier cost,
 * generated margin, affiliate commission) and compliance-aware region copying.
 * Below the kits, RegionRulesManager edits the block/warn rules themselves
 * (some items are illegal per region: melatonin AU/EU, NMN in the EU, …).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Plus, RefreshCw, Scale, Search as SearchIcon, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listAllKits, listAllProtocolsLite, createKitAllRegions, listRegionRules, createRegionRule, deleteRegionRule,
  resolveItemNames, searchProductsLite, listKitItemCounts, listAllKitItems, listProtocolProductLinkCounts,
  listAllProtocolProductMentions, REGIONS,
  type ProtocolKit, type ProtocolLite, type RegionRule, type KitRegion, type KitItem, type ProtocolSuggestion,
} from '../../utils/kitsAdmin';
import { KitMatrix } from './KitMatrix';
import { KitsMasterTable } from './KitsMasterTable';
import { ProtocolEditor } from './ProtocolEditor';
import { X, LayoutGrid, Table as TableIcon } from 'lucide-react';

// standard admin control classes (adminTheme.css) — ONE size everywhere
const inputCls = 'sb-input';
const btnCls = 'sb-btn';

/* ── region legality rules manager ── */
function RegionRulesManager({ rules, accessToken, onChanged }: { rules: RegionRule[]; accessToken: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [adding, setAdding] = useState(false);
  // add-rule form
  const [region, setRegion] = useState<KitRegion>('EU');
  const [action, setAction] = useState<'block' | 'warn'>('block');
  const [reason, setReason] = useState('');
  const [itemQ, setItemQ] = useState('');
  const [itemHits, setItemHits] = useState<{ id: string; name: string }[]>([]);
  const [itemSel, setItemSel] = useState<{ id: string; name: string } | null>(null);
  const [subQ, setSubQ] = useState('');
  const [subHits, setSubHits] = useState<{ id: string; name: string }[]>([]);
  const [subSel, setSubSel] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const ids = rules.flatMap((r) => [r.item_id, r.substitute_item_id]).filter(Boolean) as string[];
    resolveItemNames(accessToken, ids).then(setNames).catch(() => { /* best effort */ });
  }, [rules, accessToken]);

  const doSearch = (q: string, set: (h: { id: string; name: string }[]) => void) => {
    if (!q.trim()) { set([]); return; }
    searchProductsLite(accessToken, q, 6).then((hits) => set(hits.map((h) => ({ id: h.id, name: h.name })))).catch(() => set([]));
  };

  const addRule = async () => {
    if (!itemSel) { toast.error('Pick the product the rule applies to'); return; }
    setAdding(true);
    try {
      await createRegionRule(accessToken, {
        item_type: 'product', item_id: itemSel.id, region, action,
        reason: reason.trim() || null, substitute_item_id: subSel?.id || null,
      });
      toast.success(`${action.toUpperCase()} rule added for ${itemSel.name} in ${region}`);
      setItemSel(null); setItemQ(''); setSubSel(null); setSubQ(''); setReason('');
      onChanged();
    } catch (e: any) { toast.error(`Add rule failed: ${e?.message || e}`); }
    finally { setAdding(false); }
  };
  const removeRule = async (r: RegionRule) => {
    const nm = names.get(r.item_id) || r.item_id;
    if (!window.confirm(`Delete the ${r.region} ${r.action} rule for "${nm}"? The app will stop ${r.action === 'block' ? 'hiding' : 'warning about'} it there.`)) return;
    try { await deleteRegionRule(accessToken, r.id); onChanged(); }
    catch (e: any) { toast.error(`Delete failed: ${e?.message || e}`); }
  };

  const byRegion = useMemo(() => {
    const m = new Map<string, RegionRule[]>();
    for (const r of rules) { const a = m.get(r.region) || []; a.push(r); m.set(r.region, a); }
    return m;
  }, [rules]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 p-3 text-left">
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        <Scale size={14} className="text-gray-500" />
        <span className="text-sm font-semibold text-gray-900">Region legality rules</span>
        <span className="text-xs text-gray-500">{rules.length} rules — what the app blocks or warns about per region (melatonin, NMN, ashwagandha…)</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-gray-100 p-3">
          {REGIONS.filter((r) => byRegion.has(r)).map((r) => (
            <div key={r}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{r}</div>
              <div className="space-y-1">
                {(byRegion.get(r) || []).map((rule) => (
                  <div key={rule.id} className="flex items-start gap-2 rounded-md border border-gray-100 p-1.5 text-sm">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 text-[10px] font-bold ${rule.action === 'block' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {rule.action.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-800">{names.get(rule.item_id) || rule.item_id}</span>
                      {rule.substitute_item_id && <span className="text-emerald-700"> → {names.get(rule.substitute_item_id) || rule.substitute_item_id}</span>}
                      {rule.reason && <div className="truncate text-xs text-gray-500" title={rule.reason}>{rule.reason}</div>}
                    </div>
                    <button onClick={() => removeRule(rule)} className="shrink-0 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* add rule */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
            <div className="mb-1.5 text-xs font-semibold text-gray-600">Add rule (product-level)</div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={region} onChange={(e) => setRegion(e.target.value as KitRegion)} className={inputCls}>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <select value={action} onChange={(e) => setAction(e.target.value as 'block' | 'warn')} className={inputCls}>
                <option value="block">block</option>
                <option value="warn">warn</option>
              </select>
              <div className="relative">
                {itemSel ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-2 py-1 text-xs text-white">
                    {itemSel.name}
                    <button onClick={() => setItemSel(null)} className="text-gray-300 hover:text-white">×</button>
                  </span>
                ) : (
                  <>
                    <input value={itemQ} onChange={(e) => { setItemQ(e.target.value); doSearch(e.target.value, setItemHits); }}
                      placeholder="Product it applies to…" className={inputCls + ' w-56'} />
                    {itemHits.length > 0 && (
                      <div className="absolute z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-md">
                        {itemHits.map((h) => (
                          <button key={h.id} onClick={() => { setItemSel(h); setItemHits([]); }} className="block w-full truncate px-2 py-1 text-left text-xs hover:bg-gray-50">{h.name}</button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="relative">
                {subSel ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs text-white">
                    → {subSel.name}
                    <button onClick={() => setSubSel(null)} className="text-emerald-100 hover:text-white">×</button>
                  </span>
                ) : (
                  <>
                    <input value={subQ} onChange={(e) => { setSubQ(e.target.value); doSearch(e.target.value, setSubHits); }}
                      placeholder="Substitute (optional)…" className={inputCls + ' w-48'} />
                    {subHits.length > 0 && (
                      <div className="absolute z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-md">
                        {subHits.map((h) => (
                          <button key={h.id} onClick={() => { setSubSel(h); setSubHits([]); }} className="block w-full truncate px-2 py-1 text-left text-xs hover:bg-gray-50">{h.name}</button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown to users)…" className={inputCls + ' flex-1 min-w-40'} />
              <button onClick={addRule} disabled={adding} className={btnCls}>
                {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function KitsPanel({ accessToken, onOpenProtocol, onOpenProduct, onOpenCatalogRecord }: {
  accessToken: string;
  onOpenProtocol?: (protocolId: string) => void;
  onOpenProduct?: (catalogProductId: string | null, title?: string) => void;
  /** open a catalog record from inside the protocol modal (product/recipe/…) */
  onOpenCatalogRecord?: (kind: any, id: string) => void;
}) {
  // protocol opened as a full-editor modal (stays in the kits flow)
  const [protocolModalId, setProtocolModalId] = useState<string | null>(null);
  const [kits, setKits] = useState<ProtocolKit[] | null>(null);
  const [protocols, setProtocols] = useState<ProtocolLite[] | null>(null);
  const [rules, setRules] = useState<RegionRule[]>([]);
  const [counts, setCounts] = useState<Map<string, Partial<Record<KitRegion, number>>>>(new Map());
  const [loading, setLoading] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'master'>('cards');
  const [masterItems, setMasterItems] = useState<KitItem[] | null>(null);
  const [productLinks, setProductLinks] = useState<Map<string, number>>(new Map());
  const [mentions, setMentions] = useState<Map<string, ProtocolSuggestion[]>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, p, r, c] = await Promise.all([listAllKits(accessToken), listAllProtocolsLite(accessToken), listRegionRules(accessToken), listKitItemCounts(accessToken)]);
      setKits(k); setProtocols(p); setRules(r); setCounts(c);
    } catch (e: any) { toast.error(`Load failed: ${e?.message || e}`); }
    finally { setLoading(false); }
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  // master-view data loads on first switch (and refreshes with Refresh / after an add)
  const loadMaster = useCallback(() => {
    Promise.all([listAllKitItems(accessToken), listProtocolProductLinkCounts(accessToken), listAllProtocolProductMentions(accessToken)])
      .then(([mi, pl, me]) => { setMasterItems(mi); setProductLinks(pl); setMentions(me); })
      .catch((e: any) => toast.error(`Master view load failed: ${e?.message || e}`));
  }, [accessToken]);
  useEffect(() => {
    if (view !== 'master') return;
    loadMaster();
  }, [view, loadMaster, kits]);

  const protocolName = useMemo(() => new Map((protocols || []).map((p) => [p.id, p.name])), [protocols]);
  const protocolImage = useMemo(() => new Map((protocols || []).map((p) => [p.id, p.image_url])), [protocols]);
  const bySlug = useMemo(() => {
    const m = new Map<string, ProtocolKit[]>();
    for (const k of kits || []) { const a = m.get(k.slug) || []; a.push(k); m.set(k.slug, a); }
    return m;
  }, [kits]);
  const slugs = useMemo(() => {
    let list = [...bySlug.keys()].sort();
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter((s) => s.includes(term) || (bySlug.get(s) || []).some((k) => (protocolName.get(k.protocol_id) || '').toLowerCase().includes(term)));
    }
    return list;
  }, [bySlug, q, protocolName]);

  const kittedProtocolIds = useMemo(() => new Set((kits || []).map((k) => k.protocol_id)), [kits]);
  const missing = useMemo(
    () => (protocols || []).filter((p) => p.is_public && p.source === 'system' && !kittedProtocolIds.has(p.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [protocols, kittedProtocolIds],
  );
  const liveCount = (kits || []).filter((k) => k.is_live).length;

  const makeKit = async (p: ProtocolLite) => {
    setCreating(p.id);
    try { await createKitAllRegions(accessToken, p.id, p.name); toast.success(`Created 4 region rows for "${p.name}" (hidden by default)`); await load(); }
    catch (e: any) { toast.error(`Create failed: ${e?.message || e}`); }
    finally { setCreating(null); }
  };

  if (loading && kits === null) return <div className="p-6 text-center text-gray-400"><Loader2 size={18} className="mx-auto animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Protocol Kits — buy-this-protocol bundles</h3>
          <p className="text-xs text-gray-500">Items × regions matrix per kit. Badges show what's blocked/warned per region; expand a row for supplier cost, margin and affiliate commission.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('cards')} className={`${btnCls} ${view === 'cards' ? 'bg-gray-100' : ''}`} title="Kit cards">
            <LayoutGrid size={12} /> Kits
          </button>
          <button onClick={() => setView('master')} className={`${btnCls} ${view === 'master' ? 'bg-gray-100' : ''}`} title="Every product × region in one flat table — supplier/margin/linked columns, CSV export">
            <TableIcon size={12} /> Master table
          </button>
          <button onClick={load} disabled={loading} className={btnCls}><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh</button>
        </div>
      </div>

      {view === 'master' ? (
        masterItems ? (
          <KitsMasterTable items={masterItems} kits={kits || []} protocols={protocols || []} rules={rules} itemCounts={counts} productLinkCounts={productLinks}
            mentions={mentions} accessToken={accessToken} onOpenKit={setOpenSlug} onOpenProtocol={setProtocolModalId} onOpenProduct={onOpenProduct} onItemsChanged={loadMaster} />
        ) : (
          <div className="p-6 text-center text-gray-400"><Loader2 size={16} className="mx-auto animate-spin" /></div>
        )
      ) : (<>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-gray-500">Protocols</div>
          <div className="text-2xl font-semibold text-gray-900">{protocols?.length ?? '—'}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-gray-500">With a kit</div>
          <div className="text-2xl font-semibold text-gray-900">{kittedProtocolIds.size}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-gray-500">Live kit rows</div>
          <div className="text-2xl font-semibold text-emerald-600">{liveCount}</div>
        </div>
        <button onClick={() => setShowMissing((s) => !s)} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left hover:bg-amber-100">
          <div className="text-xs uppercase tracking-wide text-amber-700">Missing a kit</div>
          <div className="text-2xl font-semibold text-amber-700">{missing.length}</div>
        </button>
      </div>

      {showMissing && (
        <div className="rounded-lg border border-amber-200 bg-white">
          <div className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Public system protocols with NO kit row in any region — click to create one (hidden by default; add items then flip Live).
          </div>
          <div className="max-h-72 overflow-auto divide-y divide-gray-50">
            {missing.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-1.5">
                <span className="text-sm text-gray-800">{p.name}</span>
                <button onClick={() => makeKit(p)} disabled={creating === p.id} className={btnCls}>
                  {creating === p.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create kit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <RegionRulesManager rules={rules} accessToken={accessToken} onChanged={load} />

      <div className="relative max-w-sm">
        <SearchIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search kits or protocol name…" className={inputCls + ' w-full pl-8'} />
      </div>

      {/* kit overview — one card per kit; click opens the detail modal */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slugs.map((slug) => {
          const rows = (bySlug.get(slug) || []).slice().sort((a, b) => REGIONS.indexOf(a.market) - REGIONS.indexOf(b.market));
          const proto = protocolName.get(rows[0]?.protocol_id) || slug;
          const kitTitle = rows[0]?.title || `${proto} Kit`;
          const slugCounts = counts.get(slug) || {};
          const liveN = rows.filter((r) => r.is_live).length;
          return (
            <button key={slug} onClick={() => setOpenSlug(slug)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                  {(() => {
                    const img = rows[0]?.image_url || protocolImage.get(rows[0]?.protocol_id) || null;
                    return img
                      ? <img src={img} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover border border-gray-200" />
                      : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100"><ShoppingBag size={18} className="text-gray-400" /></span>;
                  })()}
                  <div className="min-w-0">
                    <div className="truncate text-xl font-semibold text-gray-900" title={kitTitle}>{kitTitle}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-600">
                      <span className="truncate" title={proto}>Protocol: {proto}</span>
                    </div>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${liveN ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {liveN ? `${liveN} live` : 'hidden'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {rows.map((r) => (
                  <span key={r.id} title={`${r.market}: ${slugCounts[r.market] || 0} item(s) · ${r.is_live ? 'live' : 'hidden'}`}
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium border ${r.is_live ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                    {r.market}
                    <span className="font-semibold">{slugCounts[r.market] || 0}</span>
                  </span>
                ))}
                {rows[0]?.partner_label && (
                  <span className="rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-600">{rows[0].partner_label}</span>
                )}
              </div>
              {Object.values(slugCounts).every((n) => !n) && (
                <div className="mt-2 text-[11px] text-amber-600">No items yet — the app falls back to the protocol's linked products.</div>
              )}
            </button>
          );
        })}
        {!slugs.length && <div className="py-8 text-center text-sm text-gray-400" style={{ gridColumn: '1 / -1' }}>No kits match.</div>}
      </div>
      </>)}

      {/* kit detail modal */}
      {openSlug && (() => {
        const rows = (bySlug.get(openSlug) || []).slice().sort((a, b) => REGIONS.indexOf(a.market) - REGIONS.indexOf(b.market));
        if (!rows.length) return null;
        const proto = protocolName.get(rows[0].protocol_id) || openSlug;
        const kitTitle = rows[0].title || `${proto} Kit`;
        return (
          <div onClick={() => setOpenSlug(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 16px' }}>
            <div onClick={(e) => e.stopPropagation()} className="w-full rounded-xl bg-white shadow-md" style={{ maxWidth: 1040, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  {(() => {
                    const img = rows[0].image_url || protocolImage.get(rows[0].protocol_id) || null;
                    return img
                      ? <img src={img} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover border border-gray-200" />
                      : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100"><ShoppingBag size={20} className="text-gray-400" /></span>;
                  })()}
                  <div className="min-w-0">
                    <div className="text-xl font-semibold text-gray-900">{kitTitle}</div>
                    <div className="mt-0.5 text-sm text-gray-600">Protocol: <span className="font-medium text-gray-800">{proto}</span> <span className="text-gray-400">· /{openSlug}</span>
                      {rows[0].partner_label && <span className="ml-2 rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-600">{rows[0].partner_label}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setOpenSlug(null)} className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50" title="Close"><X size={15} /></button>
              </div>
              <div className="p-3" style={{ overflowY: 'auto' }}>
                <KitMatrix slug={openSlug} kits={rows} rules={rules} accessToken={accessToken} protocolName={proto} protocols={protocols || []} onKitsChanged={load} onOpenProduct={onOpenProduct} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* protocol opened as a full editor in a dialog — stays in the kits flow */}
      {protocolModalId && (
        <div onClick={() => setProtocolModalId(null)} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '3vh 16px' }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full rounded-xl bg-white shadow-md" style={{ maxWidth: 1180, maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-800">Protocol editor
                <span className="ml-2 text-xs font-normal text-gray-500">{protocolName.get(protocolModalId) || ''}</span>
              </div>
              <button onClick={() => setProtocolModalId(null)} className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50" title="Close"><X size={15} /></button>
            </div>
            <div style={{ overflowY: 'auto' }}>
              <ProtocolEditor accessToken={accessToken} initialProtocolId={protocolModalId} onOpenCatalogRecord={onOpenCatalogRecord} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KitsPanel;
