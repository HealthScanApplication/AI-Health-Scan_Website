/**
 * KitsPanel — admin surface for the REAL "buy this protocol" kits
 * (protocol_kits / protocol_kit_items), which had ZERO admin visibility before
 * this (no tab, no CRUD — only reachable via raw SQL). This is a different
 * feature from the "Packages" tab (hs_packages/package_items), which has no
 * items in any package and is never read by the mobile app; this one IS what
 * ProtocolKitButton.tsx renders as the "Shop the Kit" button.
 *
 * Coverage: 129 protocols total; only ~31 have any kit row, ~10 have a live
 * kit. This panel makes that gap visible and lets an admin fix it: create the
 * 4 region rows for a protocol, edit kit metadata, and manage its line items.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Plus, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listAllKits, listAllProtocolsLite, listKitItemsBySlug, createKit, updateKit, deleteKit,
  createKitItem, updateKitItem, deleteKitItem, createKitAllRegions, kitSlugFor, REGIONS,
  type ProtocolKit, type KitItem, type ProtocolLite, type KitRegion,
} from '../../utils/kitsAdmin';

const inputCls = 'w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900';
const btnCls = 'inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50';

function commitField<T extends Record<string, any>>(save: (patch: Partial<T>) => Promise<void>, key: keyof T) {
  return async (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value;
    try { await save({ [key]: v === '' ? null : v } as Partial<T>); }
    catch (err: any) { toast.error(`Save failed: ${err?.message || err}`); }
  };
}

function KitItemRow({ item, accessToken, onChange, onDelete }: { item: KitItem; accessToken: string; onChange: (patch: Partial<KitItem>) => void; onDelete: () => void }) {
  const [busy, setBusy] = useState(false);
  const save = async (patch: Partial<KitItem>) => {
    setBusy(true);
    try { await updateKitItem(accessToken, item.id, patch); onChange(patch); }
    catch (e: any) { toast.error(`Save failed: ${e?.message || e}`); }
    finally { setBusy(false); }
  };
  return (
    <div className={`grid grid-cols-12 gap-2 items-center rounded-md border border-gray-100 p-2 ${busy ? 'opacity-60' : ''}`}>
      <input className={`${inputCls} col-span-3`} defaultValue={item.title || ''} placeholder="Title" onBlur={commitField<KitItem>(save, 'title')} />
      <select className={`${inputCls} col-span-2`} defaultValue={item.lane || 'store'} onChange={(e) => save({ lane: e.target.value })}>
        <option value="store">Store</option>
        <option value="affiliate">Affiliate</option>
      </select>
      <input className={`${inputCls} col-span-2`} defaultValue={item.variant_id || ''} placeholder="Variant id" onBlur={commitField<KitItem>(save, 'variant_id')} />
      <input className={`${inputCls} col-span-3`} defaultValue={item.affiliate_url || ''} placeholder="Affiliate URL" onBlur={commitField<KitItem>(save, 'affiliate_url')} />
      <input className={`${inputCls} col-span-1`} defaultValue={item.price_usd ?? ''} placeholder="$" onBlur={commitField<KitItem>(save, 'price_usd' as any)} />
      <button onClick={onDelete} title="Remove item" className="col-span-1 flex justify-center text-red-500 hover:text-red-700">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function KitRegionRow({ kit, accessToken, onDeleted }: { kit: ProtocolKit; accessToken: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<KitItem[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [live, setLive] = useState(kit.is_live);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadingItems(true);
    try { setItems(await listKitItemsBySlug(accessToken, kit.items_slug || kit.slug, kit.market)); }
    catch (e: any) { toast.error(`Load items failed: ${e?.message || e}`); setItems([]); }
    finally { setLoadingItems(false); }
  }, [accessToken, kit.items_slug, kit.slug, kit.market]);

  useEffect(() => { if (open && items === null) load(); }, [open, items, load]);

  const toggleLive = async () => {
    const next = !live; setLive(next); setBusy(true);
    try { await updateKit(accessToken, kit.id, { is_live: next }); toast.success(next ? 'Kit is live' : 'Kit hidden'); }
    catch (e: any) { setLive(!next); toast.error(`Update failed: ${e?.message || e}`); }
    finally { setBusy(false); }
  };
  const addItem = async () => {
    try {
      const created = await createKitItem(accessToken, { slug: kit.items_slug || kit.slug, market: kit.market, lane: 'store', title: 'New item', sort: (items?.length || 0) + 1 });
      setItems((it) => [...(it || []), created]);
    } catch (e: any) { toast.error(`Add item failed: ${e?.message || e}`); }
  };
  const removeItem = async (id: string) => {
    try { await deleteKitItem(accessToken, id); setItems((it) => (it || []).filter((i) => i.id !== id)); }
    catch (e: any) { toast.error(`Remove failed: ${e?.message || e}`); }
  };
  const removeKit = async () => {
    if (!window.confirm(`Delete the ${kit.market} kit row for "${kit.title || kit.slug}"? This does not delete its line items.`)) return;
    try { await deleteKit(accessToken, kit.id); onDeleted(); toast.success('Kit region removed'); }
    catch (e: any) { toast.error(`Delete failed: ${e?.message || e}`); }
  };

  const empty = items !== null && items.length === 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-2 p-2">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-gray-500">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className="w-9 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-center text-[11px] font-semibold text-gray-600">{kit.market}</span>
        <input className={`${inputCls} flex-1`} defaultValue={kit.title || ''} placeholder="Kit title" onBlur={commitField<ProtocolKit>((p) => updateKit(accessToken, kit.id, p), 'title')} />
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${items === null ? 'bg-gray-100 text-gray-400' : empty ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
          {items === null ? '…' : `${items.length} item${items.length === 1 ? '' : 's'}`}
        </span>
        <button onClick={toggleLive} disabled={busy} title={live ? 'Live — click to hide' : 'Hidden — click to go live'}
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${live ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {live ? 'Live' : 'Hidden'}
        </button>
        <button onClick={removeKit} title="Delete this region's kit row" className="shrink-0 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-gray-100 p-2">
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} defaultValue={kit.subtitle || ''} placeholder="Subtitle" onBlur={commitField<ProtocolKit>((p) => updateKit(accessToken, kit.id, p), 'subtitle')} />
            <input className={inputCls} defaultValue={kit.cart_url || ''} placeholder="Cart URL (fixed-price bundle)" onBlur={commitField<ProtocolKit>((p) => updateKit(accessToken, kit.id, p), 'cart_url')} />
            <input className={inputCls} defaultValue={kit.partner_label || ''} placeholder="Partner label" onBlur={commitField<ProtocolKit>((p) => updateKit(accessToken, kit.id, p), 'partner_label')} />
            <input className={inputCls} defaultValue={kit.partner_cart_url || ''} placeholder="Partner cart URL" onBlur={commitField<ProtocolKit>((p) => updateKit(accessToken, kit.id, p), 'partner_cart_url')} />
          </div>
          {loadingItems ? (
            <div className="py-3 text-center text-gray-400"><Loader2 size={14} className="mx-auto animate-spin" /></div>
          ) : (
            <div className="space-y-1.5">
              {(items || []).map((it) => (
                <KitItemRow key={it.id} item={it} accessToken={accessToken}
                  onChange={(patch) => setItems((arr) => (arr || []).map((x) => (x.id === it.id ? { ...x, ...patch } : x)))}
                  onDelete={() => removeItem(it.id)} />
              ))}
              {empty && <div className="rounded-md bg-amber-50 border border-amber-100 p-2 text-xs text-amber-700">No items — the app falls back to this protocol's linked catalog products instead of a curated kit.</div>}
              <button onClick={addItem} className={btnCls}><Plus size={12} /> Add item</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function KitsPanel({ accessToken }: { accessToken: string }) {
  const [kits, setKits] = useState<ProtocolKit[] | null>(null);
  const [protocols, setProtocols] = useState<ProtocolLite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, p] = await Promise.all([listAllKits(accessToken), listAllProtocolsLite(accessToken)]);
      setKits(k); setProtocols(p);
    } catch (e: any) { toast.error(`Load failed: ${e?.message || e}`); }
    finally { setLoading(false); }
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);

  const protocolName = useMemo(() => new Map((protocols || []).map((p) => [p.id, p.name])), [protocols]);
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
  const protocolsWithKit = kittedProtocolIds.size;

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
          <p className="text-xs text-gray-500">The real "Shop the Kit" feature the app reads (region-aware, store + affiliate lanes). Different from the Packages tab, which has no items and isn't used by the app.</p>
        </div>
        <button onClick={load} disabled={loading} className={btnCls}><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-gray-500">Protocols</div>
          <div className="text-2xl font-semibold text-gray-900">{protocols?.length ?? '—'}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-gray-500">With a kit</div>
          <div className="text-2xl font-semibold text-gray-900">{protocolsWithKit}</div>
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

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search kits or protocol name…" className={inputCls + ' max-w-sm'} />

      <div className="space-y-4">
        {slugs.map((slug) => {
          const rows = (bySlug.get(slug) || []).slice().sort((a, b) => REGIONS.indexOf(a.market) - REGIONS.indexOf(b.market));
          const name = protocolName.get(rows[0]?.protocol_id) || rows[0]?.title || slug;
          return (
            <div key={slug} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShoppingBag size={13} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">{name}</span>
                <span className="text-xs text-gray-400">/{slug}</span>
              </div>
              {rows.map((k) => <KitRegionRow key={k.id} kit={k} accessToken={accessToken} onDeleted={load} />)}
            </div>
          );
        })}
        {!slugs.length && <div className="py-8 text-center text-sm text-gray-400">No kits match.</div>}
      </div>
    </div>
  );
}

export default KitsPanel;
