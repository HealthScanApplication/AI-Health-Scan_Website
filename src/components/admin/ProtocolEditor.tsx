/*
 * ProtocolEditor — admin tab for editing routines/protocols against the REAL
 * tables (`protocols` + `protocol_items`). The centre of the screen mirrors the
 * mobile app's home-screen day view (steps grouped Morning / Afternoon / Evening
 * with category-tinted tiles), and every step is editable inline.
 *
 * No-JIT note: this project ships a prebuilt static stylesheet, so all styling
 * here is inline — new Tailwind utility classes would render transparent.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Trash2, Loader2, Search, Save, Check, RefreshCw, AlertCircle, CornerDownRight, Eye, EyeOff, Link2, X, ShoppingBag,
  ChevronDown, Package, Leaf, Utensils, Dumbbell, Pill, Moon, Coffee, Apple, GlassWater, Sparkles, Wind, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CATEGORY_TINTS, categorize, type ProtocolItem as CatItem,
} from '../../config/protocolCategories';
import { PhoneFrame } from '../mockups/PhoneFrame';
import { ProtocolHomeScreen, type HomeItem } from '../mockups/ProtocolHomeScreen';
import { MediaUploadField } from './MediaUploadField';
import {
  listProtocols, listProtocolItems, updateProtocol,
  createProtocolItem, updateProtocolItem, deleteProtocolItem, uploadProtocolImage,
  searchCatalog, getCatalogByIds, linkedKind, linkPatch, updateCatalogImage, CATALOG_CFG,
  type AdminProtocol, type AdminProtocolItem, type CatalogKind, type CatalogHit,
} from '../../utils/protocolAdmin';

/* ── palette (neutral admin) ── */
const C = {
  ink: '#111827', sub: '#6B7280', faint: '#9CA3AF', hair: '#E5E7EB',
  panel: '#F9FAFB', paper: '#FFFFFF', accent: '#2563EB', danger: '#DC2626',
  good: '#15803D', goodBg: '#ECFDF5', goodBorder: '#BBF7D0',
};

const PROTO_FIELDS: (keyof AdminProtocol)[] = [
  'name', 'description', 'category', 'type', 'creator', 'source',
  'image_url', 'health_score', 'total_days', 'is_suggested', 'is_active',
  'is_public', 'start_time',
];

const ITEM_TYPES = ['supplement', 'consume', 'recipe', 'activity', 'product'];
const SCOPES = ['none', 'inside', 'outside', 'consume', 'supplement'];
type Kind = 'action' | 'rule_do' | 'rule_dont';
const KIND_TABS: { k: Kind; label: string }[] = [
  { k: 'action', label: 'Timeline' },
  { k: 'rule_do', label: "Do's" },
  { k: 'rule_dont', label: "Don'ts" },
];

// Two-level type taxonomy (category → subtype → backing item_type).
const CATEGORIES = ['consume', 'do', 'sleep', 'supplement'];
const SUBTYPES_BY_CAT: Record<string, string[]> = {
  consume: ['meal', 'drink', 'snack', 'beverage'],
  do: ['hygiene', 'wellness', 'exercise'],
  sleep: ['sleep'],
  supplement: ['supplement'],
};
// sensible default backing when category changes
const DEFAULT_TYPE_BY_CAT: Record<string, string> = {
  consume: 'consume', do: 'activity', sleep: 'activity', supplement: 'supplement',
};

// verb-led naming for "do" steps (Apply Moisturizer, Use …) — non-destructive, swaps the leading verb.
const DO_VERBS = ['Apply', 'Use', 'Take', 'Do', 'Practice', 'Massage', 'Cleanse'];
const VERB_RE = /^(apply|use|take|do|practice|massage|cleanse|perform|complete)\s+/i;

// part-of-day from 'HH:MM:SS' (Morning < 12, Afternoon 12–16, Evening ≥ 17, else Anytime)
function partOfDay(time: string | null): 'Morning' | 'Afternoon' | 'Evening' | 'Anytime' {
  const m = /^(\d{1,2}):/.exec(time || '');
  if (!m) return 'Anytime';
  const h = parseInt(m[1], 10);
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
const POD_ORDER = ['Morning', 'Afternoon', 'Evening', 'Anytime'] as const;
const minutesOf = (t: string | null) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 1e9; };
const isSleepName = (n: string) => /^(end[\s-]?sleep|wake)/i.test((n || '').trim());

/* ── helpers ── */
// DB item_type (5 values) → the simplified union categorize/itemIcon expect.
function catItem(it: AdminProtocolItem): CatItem {
  const t = it.item_type === 'supplement'
    ? 'supplement'
    : it.item_type === 'consume' || it.item_type === 'recipe'
      ? 'consume'
      : 'activity';
  return { name: it.display_name || 'Untitled step', item_type: t as CatItem['item_type'], meta: toMeta(it.scheduled_time) };
}
// 'HH:MM:SS' → 'H:MM' for display
function toMeta(t: string | null): string {
  if (!t) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return '';
  return `${parseInt(m[1], 10)}:${m[2]}`;
}
// 'HH:MM:SS' → 'HH:MM' for <input type="time">
function toTimeInput(t: string | null): string {
  if (!t) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}
// admin protocol_items → the shared home-screen item shape.
// Only timeline actions (not rules) appear on the app home screen; each item's
// child descriptions ride along as a faded checklist (like the real app).
function toHomeItems(items: AdminProtocolItem[], linkImages?: Map<string, string>): HomeItem[] {
  const childrenByParent = new Map<string, string[]>();
  for (const it of items) {
    if (it.parent_protocol_item_id) {
      const arr = childrenByParent.get(it.parent_protocol_item_id) || [];
      arr.push(it.display_name || 'Detail');
      childrenByParent.set(it.parent_protocol_item_id, arr);
    }
  }
  return items
    .filter((it) => (it.kind === null || it.kind === 'action') && !it.parent_protocol_item_id)
    .map((it) => ({
      display_name: it.display_name || 'Untitled step',
      item_type: it.item_type || undefined,
      kind: it.kind,
      scope: it.scope,
      time: it.scheduled_time,
      duration_minutes: it.duration_minutes,
      group_name: it.group_name,
      image_url: linkImages?.get(it.id) || null,
      children: childrenByParent.get(it.id),
    }));
}

/* ── live preview — the exact app home screen, fed the saved steps ── */
function PhonePreview({ name, items, imageUrl, linkImages }: { name: string; items: AdminProtocolItem[]; imageUrl?: string | null; linkImages?: Map<string, string> }) {
  return (
    <PhoneFrame width={300} screenBg="#FFFFFF">
      <ProtocolHomeScreen protocolName={name} items={toHomeItems(items, linkImages)} imageUrl={imageUrl} />
    </PhoneFrame>
  );
}

/* ── small field primitives ── */
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'block' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: 13, color: C.ink, border: '1px solid ' + C.hair, borderRadius: 8, background: C.paper, outline: 'none', boxSizing: 'border-box' };

/* ── clean icon+label dropdown (native <select> can't show icons) ── */
interface Opt { value: string; label: string; Icon?: any; color?: string }
// "What is it?" — the primary type of an item.
const TYPE_OPTS: Opt[] = [
  { value: 'recipe', label: 'Recipe', Icon: Utensils, color: '#388E3C' },
  { value: 'ingredient', label: 'Ingredient', Icon: Leaf, color: '#43A047' },
  { value: 'product', label: 'Product', Icon: Package, color: '#6B7280' },
  { value: 'activity', label: 'Activity', Icon: Dumbbell, color: '#D45B0A' },
  { value: 'supplement', label: 'Supplement', Icon: Pill, color: '#0097A7' },
  { value: 'sleep', label: 'Sleep', Icon: Moon, color: '#5C6B7A' },
];
// secondary sub-type, keyed by the stored `category` the primary maps to.
const SUB_OPTS: Record<string, Opt[]> = {
  consume: [
    { value: 'meal', label: 'Meal', Icon: Utensils, color: '#388E3C' },
    { value: 'drink', label: 'Drink', Icon: Coffee, color: '#795548' },
    { value: 'snack', label: 'Snack', Icon: Apple, color: '#E64A19' },
    { value: 'beverage', label: 'Beverage', Icon: GlassWater, color: '#039BE5' },
  ],
  do: [
    { value: 'hygiene', label: 'Hygiene', Icon: Sparkles, color: '#D8638E' },
    { value: 'wellness', label: 'Wellness', Icon: Wind, color: '#26A69A' },
    { value: 'exercise', label: 'Exercise', Icon: Activity, color: '#43A047' },
  ],
  sleep: [{ value: 'sleep', label: 'Sleep', Icon: Moon, color: '#5C6B7A' }],
  supplement: [{ value: 'supplement', label: 'Supplement', Icon: Pill, color: '#0097A7' }],
};
// primary type → stored fields (category drives the app; do = "Activity" in the UI)
const TYPE_TO_DATA: Record<string, { category: string; item_type: string }> = {
  recipe: { category: 'consume', item_type: 'recipe' },
  ingredient: { category: 'consume', item_type: 'consume' },
  product: { category: 'consume', item_type: 'product' },
  activity: { category: 'do', item_type: 'activity' },
  supplement: { category: 'supplement', item_type: 'supplement' },
  sleep: { category: 'sleep', item_type: 'activity' },
};
function primaryTypeOf(it: AdminProtocolItem): string {
  if (it.category === 'do') return 'activity';
  if (it.category === 'sleep') return 'sleep';
  if (it.category === 'supplement') return 'supplement';
  if (it.item_type === 'recipe') return 'recipe';
  if (it.item_type === 'product') return 'product';
  return 'ingredient'; // consume default
}

const VERB_OPTS: Opt[] = [{ value: '', label: '+ verb' }, ...DO_VERBS.map((v) => ({ value: v, label: v }))];
const SCOPE_OPTS: Opt[] = SCOPES.map((s) => ({ value: s, label: s }));

function IconSelect({ value, options, onChange, width = 132, placeholder }: { value: string; options: Opt[]; onChange: (v: string) => void; width?: number; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <div style={{ position: 'relative', width, flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 8px', fontSize: 12.5, color: C.ink, border: '1px solid ' + C.hair, borderRadius: 8, background: C.paper, cursor: 'pointer', boxSizing: 'border-box' }}>
        {cur?.Icon && <cur.Icon size={14} color={cur.color || C.sub} style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur?.label || placeholder || '—'}</span>
        <ChevronDown size={13} color={C.faint} style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', zIndex: 41, background: '#fff', border: '1px solid ' + C.hair, borderRadius: 8, boxShadow: '0 10px 28px -10px rgba(0,0,0,0.3)', padding: 4, maxHeight: 260, overflowY: 'auto' }}>
            {options.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', border: 'none', background: o.value === value ? '#EEF4FF' : 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, color: C.ink, textAlign: 'left' }}>
                {o.Icon && <o.Icon size={15} color={o.color || C.sub} style={{ flexShrink: 0 }} />}
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

/* ── main editor ── */
export function ProtocolEditor({ accessToken }: { accessToken: string }) {
  const [protocols, setProtocols] = useState<AdminProtocol[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [items, setItems] = useState<AdminProtocolItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [form, setForm] = useState<Partial<AdminProtocol>>({});
  const [savingProtocol, setSavingProtocol] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [kindTab, setKindTab] = useState<Kind>('action');
  // catalog linking
  const [linkInfo, setLinkInfo] = useState<Map<string, CatalogHit & { kind: CatalogKind }>>(new Map());
  const [linkerItemId, setLinkerItemId] = useState<string | null>(null);
  const [linkKind, setLinkKind] = useState<CatalogKind>('recipe');
  const [linkQuery, setLinkQuery] = useState('');
  const [linkResults, setLinkResults] = useState<CatalogHit[]>([]);
  const [linkBusy, setLinkBusy] = useState(false);
  const [viewRec, setViewRec] = useState<(CatalogHit & { kind: CatalogKind; itemId: string }) | null>(null);

  // last-saved snapshot of items, to decide whether an inline edit needs a write
  const baseline = useRef<Map<string, AdminProtocolItem>>(new Map());

  const selected = protocols.find((p) => p.id === selectedId) || null;

  async function loadList(keepSelection = false) {
    setLoadingList(true); setListError(null);
    try {
      const rows = await listProtocols(accessToken);
      setProtocols(rows);
      if (rows.length && (!keepSelection || !rows.some((r) => r.id === selectedId))) {
        setSelectedId((cur) => (cur && rows.some((r) => r.id === cur) ? cur : rows[0].id));
      }
    } catch (e: any) {
      setListError(e?.message || String(e));
    } finally {
      setLoadingList(false);
    }
  }
  useEffect(() => { loadList(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // resolve linked catalog records (name + image) for display + preview thumbnails
  async function resolveLinks(rows: AdminProtocolItem[]) {
    const groups: Record<CatalogKind, { itemId: string; cid: string }[]> = { recipe: [], ingredient: [], product: [], activity: [], supplement: [] };
    for (const it of rows) {
      const k = linkedKind(it);
      if (k) groups[k].push({ itemId: it.id, cid: (it as any)[CATALOG_CFG[k].fk] });
    }
    const map = new Map<string, CatalogHit & { kind: CatalogKind }>();
    await Promise.all((Object.keys(groups) as CatalogKind[]).map(async (k) => {
      const ids = [...new Set(groups[k].map((g) => g.cid).filter(Boolean))];
      if (!ids.length) return;
      try {
        const hits = await getCatalogByIds(accessToken, k, ids);
        const byCid = new Map(hits.map((h) => [h.id, h]));
        for (const g of groups[k]) { const h = byCid.get(g.cid); if (h) map.set(g.itemId, { ...h, kind: k }); }
      } catch { /* ignore */ }
    }));
    setLinkInfo(map);
  }

  async function loadItems(id: string) {
    setLoadingItems(true);
    try {
      const rows = await listProtocolItems(accessToken, id);
      setItems(rows);
      baseline.current = new Map(rows.map((r) => [r.id, { ...r }]));
      resolveLinks(rows);
    } catch (e: any) {
      toast.error(`Failed to load steps: ${e?.message || e}`);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }
  useEffect(() => {
    if (!selectedId) return;
    const p = protocols.find((x) => x.id === selectedId);
    if (p) setForm({ ...p });
    loadItems(selectedId);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedId]);

  const dirty = useMemo(() => {
    if (!selected) return false;
    return PROTO_FIELDS.some((f) => (form as any)[f] !== (selected as any)[f]);
  }, [form, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return protocols;
    return protocols.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.creator || '').toLowerCase().includes(q));
  }, [protocols, query]);

  function setField<K extends keyof AdminProtocol>(key: K, value: AdminProtocol[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProtocol() {
    if (!selected) return;
    const patch: Partial<AdminProtocol> = {};
    for (const f of PROTO_FIELDS) {
      if ((form as any)[f] !== (selected as any)[f]) (patch as any)[f] = (form as any)[f];
    }
    if (Object.keys(patch).length === 0) return;
    setSavingProtocol(true);
    try {
      const updated = await updateProtocol(accessToken, selected.id, patch);
      setProtocols((ps) => ps.map((p) => (p.id === selected.id ? { ...p, ...updated } : p)));
      toast.success('Protocol saved');
    } catch (e: any) {
      toast.error(`Save failed: ${e?.message || e}`);
    } finally {
      setSavingProtocol(false);
    }
  }

  // inline step edit → local update now, write on blur if changed
  function editItemLocal(id: string, patch: Partial<AdminProtocolItem>) {
    setItems((its) => its.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  async function commitItem(id: string, fields: (keyof AdminProtocolItem)[]) {
    const cur = items.find((it) => it.id === id);
    const base = baseline.current.get(id);
    if (!cur || !base) return;
    const patch: Partial<AdminProtocolItem> = {};
    for (const f of fields) if ((cur as any)[f] !== (base as any)[f]) (patch as any)[f] = (cur as any)[f];
    if (Object.keys(patch).length === 0) return;
    setBusyItem(id);
    try {
      const updated = await updateProtocolItem(accessToken, id, patch);
      baseline.current.set(id, { ...cur, ...updated });
      toast.success('Step updated');
    } catch (e: any) {
      // revert to last-saved on failure
      setItems((its) => its.map((it) => (it.id === id ? { ...base } : it)));
      toast.error(`Update failed: ${e?.message || e}`);
    } finally {
      setBusyItem(null);
    }
  }

  async function addItem(kind: Kind, parentId?: string) {
    if (!selected) return;
    setAdding(true);
    const isRule = kind !== 'action';
    const maxSort = items.reduce((m, it) => Math.max(m, it.sort_order || 0), 0);
    try {
      const created = await createProtocolItem(accessToken, {
        protocol_id: selected.id,
        display_name: parentId ? 'New detail' : kind === 'rule_dont' ? 'New avoidance' : isRule ? 'New do' : 'New step',
        item_type: 'activity',
        kind,
        scope: isRule ? 'outside' : null,
        scheduled_time: isRule || parentId ? null : '08:00:00',
        day_number: 1,
        sort_order: maxSort + 1,
        parent_protocol_item_id: parentId || null,
        category: kind === 'action' ? 'do' : null,
        subtype: kind === 'action' ? 'wellness' : null,
        hidden: false,
      });
      setItems((its) => [...its, created]);
      baseline.current.set(created.id, { ...created });
      toast.success('Added');
    } catch (e: any) {
      toast.error(`Add failed: ${e?.message || e}`);
    } finally {
      setAdding(false);
    }
  }

  async function removeItem(it: AdminProtocolItem) {
    const kids = items.filter((x) => x.parent_protocol_item_id === it.id);
    const msg = kids.length
      ? `Delete "${it.display_name || 'Untitled'}" and its ${kids.length} sub-item(s)? This cannot be undone.`
      : `Delete "${it.display_name || 'Untitled'}"? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    setBusyItem(it.id);
    try {
      // delete children first (referential integrity), then the parent
      for (const k of kids) await deleteProtocolItem(accessToken, k.id);
      await deleteProtocolItem(accessToken, it.id);
      const removed = new Set([it.id, ...kids.map((k) => k.id)]);
      setItems((its) => its.filter((x) => !removed.has(x.id)));
      removed.forEach((id) => baseline.current.delete(id));
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(`Delete failed: ${e?.message || e}`);
    } finally {
      setBusyItem(null);
    }
  }

  // change category → reset subtype + backing item_type sensibly, commit all three
  function changeCategory(id: string, cat: string) {
    const sub = (SUBTYPES_BY_CAT[cat] || [])[0] || null;
    editItemLocal(id, { category: cat, subtype: sub, item_type: DEFAULT_TYPE_BY_CAT[cat] || 'activity' });
  }
  // optimistic field write that survives React's async state (used by the icon dropdowns)
  async function commitField(it: AdminProtocolItem, patch: Partial<AdminProtocolItem>) {
    const prev = items.find((x) => x.id === it.id) || it;
    editItemLocal(it.id, patch);
    setBusyItem(it.id);
    try {
      await updateProtocolItem(accessToken, it.id, patch);
      baseline.current.set(it.id, { ...prev, ...patch });
    } catch (e: any) {
      editItemLocal(it.id, prev);
      toast.error(`Update failed: ${e?.message || e}`);
    } finally { setBusyItem(null); }
  }
  // primary "what is it?" → category + item_type + a valid subtype
  function setPrimaryType(it: AdminProtocolItem, t: string) {
    const d = TYPE_TO_DATA[t]; if (!d) return;
    const subs = SUB_OPTS[d.category] || [];
    commitField(it, { category: d.category, item_type: d.item_type, subtype: subs[0]?.value || null });
  }
  async function toggleHidden(it: AdminProtocolItem) {
    editItemLocal(it.id, { hidden: !it.hidden });
    // commit on the next tick (editItemLocal is async state) — re-read from a patch
    setBusyItem(it.id);
    try {
      const updated = await updateProtocolItem(accessToken, it.id, { hidden: !it.hidden });
      baseline.current.set(it.id, { ...(items.find((x) => x.id === it.id) || it), ...updated });
      toast.success(updated.hidden ? 'Hidden from day view' : 'Visible');
    } catch (e: any) {
      editItemLocal(it.id, { hidden: it.hidden });
      toast.error(`Update failed: ${e?.message || e}`);
    } finally {
      setBusyItem(null);
    }
  }

  // swap/prepend the leading verb on a "do" step name
  async function setVerb(it: AdminProtocolItem, verb: string) {
    const base = (it.display_name || '').replace(VERB_RE, '').trim();
    const name = `${verb} ${base}`.trim();
    if (name === it.display_name) return;
    editItemLocal(it.id, { display_name: name });
    setBusyItem(it.id);
    try {
      await updateProtocolItem(accessToken, it.id, { display_name: name });
      baseline.current.set(it.id, { ...(items.find((x) => x.id === it.id) || it), display_name: name });
    } catch (e: any) {
      editItemLocal(it.id, { display_name: it.display_name });
      toast.error(`Update failed: ${e?.message || e}`);
    } finally { setBusyItem(null); }
  }

  /* ── catalog linking ── */
  function defaultKind(it: AdminProtocolItem): CatalogKind {
    // mirror the item's primary "what is it?" type
    const t = primaryTypeOf(it);
    if (t === 'recipe') return 'recipe';
    if (t === 'product') return 'product';
    if (t === 'supplement') return 'supplement';
    if (t === 'activity') return it.subtype === 'exercise' ? 'activity' : 'product';
    return 'ingredient'; // ingredient (and sleep) default to the ingredient catalog
  }
  async function runSearch(kind: CatalogKind, q: string) {
    setLinkBusy(true);
    try { setLinkResults(await searchCatalog(accessToken, kind, q, 10)); }
    catch { setLinkResults([]); }
    finally { setLinkBusy(false); }
  }
  function openLinker(it: AdminProtocolItem) {
    const k = linkedKind(it) || defaultKind(it);
    setLinkerItemId(it.id); setLinkKind(k); setLinkQuery(it.display_name || '');
    runSearch(k, it.display_name || '');
  }
  async function linkItemTo(it: AdminProtocolItem, kind: CatalogKind, hit: CatalogHit) {
    const patch = linkPatch(kind, hit.id);
    editItemLocal(it.id, patch);
    setBusyItem(it.id);
    try {
      await updateProtocolItem(accessToken, it.id, patch);
      baseline.current.set(it.id, { ...(items.find((x) => x.id === it.id) || it), ...patch });
      setLinkInfo((m) => new Map(m).set(it.id, { ...hit, kind }));
      setLinkerItemId(null);
      toast.success(`Linked ${kind}`);
    } catch (e: any) {
      const base = baseline.current.get(it.id); if (base) editItemLocal(it.id, base);
      toast.error(`Link failed: ${e?.message || e}`);
    } finally { setBusyItem(null); }
  }
  async function unlinkItem(it: AdminProtocolItem) {
    const patch = linkPatch(null, null);
    editItemLocal(it.id, patch);
    setBusyItem(it.id);
    try {
      await updateProtocolItem(accessToken, it.id, patch);
      baseline.current.set(it.id, { ...(items.find((x) => x.id === it.id) || it), ...patch });
      setLinkInfo((m) => { const n = new Map(m); n.delete(it.id); return n; });
      toast.success('Unlinked');
    } catch (e: any) { toast.error(`Unlink failed: ${e?.message || e}`); }
    finally { setBusyItem(null); }
  }
  // add a "suggested product to buy" as a product-linked child, then open its product search
  async function addProductChild(parentId: string) {
    if (!selected) return;
    setAdding(true);
    const maxSort = items.reduce((m, it) => Math.max(m, it.sort_order || 0), 0);
    try {
      const created = await createProtocolItem(accessToken, {
        protocol_id: selected.id,
        display_name: 'Suggested product',
        item_type: 'product',
        kind: 'action',
        parent_protocol_item_id: parentId,
        sort_order: maxSort + 1,
      });
      setItems((its) => [...its, created]);
      baseline.current.set(created.id, { ...created });
      setLinkerItemId(created.id); setLinkKind('product'); setLinkQuery(''); runSearch('product', '');
      toast.success('Pick a product to suggest');
    } catch (e: any) { toast.error(`Add failed: ${e?.message || e}`); }
    finally { setAdding(false); }
  }
  // upload an image straight onto the linked catalog record (fills the data gap inline)
  async function uploadLinkedImage(file: File) {
    if (!viewRec) return;
    setLinkBusy(true);
    try {
      const url = await uploadProtocolImage(accessToken, file);
      await updateCatalogImage(accessToken, viewRec.kind, viewRec.id, url);
      setLinkInfo((m) => { const n = new Map(m); const e = n.get(viewRec.itemId); if (e) n.set(viewRec.itemId, { ...e, image: url }); return n; });
      setViewRec((v) => (v ? { ...v, image: url } : v));
      toast.success('Image saved to the record');
    } catch (e: any) {
      toast.error(`Upload failed: ${e?.message || e}`);
    } finally { setLinkBusy(false); }
  }
  const linkBtnStyle: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: C.sub, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 4px' };
  const thumb = (img: string | null) => (
    <span style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: C.panel, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Link2 size={13} color={C.faint} />}
    </span>
  );
  function CatalogLinker({ it }: { it: AdminProtocolItem }) {
    const link = linkInfo.get(it.id);
    const open = linkerItemId === it.id;
    return (
      <div style={{ marginTop: 6, marginLeft: 14, paddingLeft: 10, borderLeft: '2px dashed ' + C.hair }}>
        {link ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={() => link && setViewRec({ ...link, itemId: it.id })} title="View / add image" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex' }}>
              {thumb(link.image)}
            </button>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{link.name}</span>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{link.kind}</span>
            {link.kind === 'product' && (link.price != null || link.buyUrl) && (
              <span style={{ fontSize: 10.5, fontWeight: 600, color: C.good, whiteSpace: 'nowrap' }}>
                {link.price != null ? `$${link.price}` : ''}{link.buyUrl ? (link.price != null ? ' · Buy ↗' : 'Buy ↗') : ''}
              </span>
            )}
            <button onClick={() => openLinker(it)} style={linkBtnStyle}>change</button>
            <button onClick={() => unlinkItem(it)} title="Unlink" style={{ ...linkBtnStyle, color: C.danger }}><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => openLinker(it)} style={{ ...linkBtnStyle, color: C.accent }}><Link2 size={12} /> Link {defaultKind(it)}…</button>
        )}
        {open && (
          <div style={{ marginTop: 6, padding: 8, border: '1px solid ' + C.hair, borderRadius: 8, background: '#fff' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <select value={linkKind} onChange={(e) => { const k = e.target.value as CatalogKind; setLinkKind(k); runSearch(k, linkQuery); }} style={{ ...inputStyle, width: 112 }}>
                {(['recipe', 'ingredient', 'product', 'activity', 'supplement'] as CatalogKind[]).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <input value={linkQuery} onChange={(e) => { setLinkQuery(e.target.value); runSearch(linkKind, e.target.value); }} placeholder="Search catalog…" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => setLinkerItemId(null)} style={{ ...linkBtnStyle }}>close</button>
            </div>
            {linkBusy ? (
              <div style={{ padding: 12, textAlign: 'center', color: C.faint }}><Loader2 size={16} className="animate-spin" style={{ display: 'inline' }} /></div>
            ) : linkResults.length === 0 ? (
              <div style={{ fontSize: 12, color: C.faint, padding: 8, textAlign: 'center' }}>No matches</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                {linkResults.map((h) => (
                  <button key={h.id} onClick={() => linkItemTo(it, linkKind, h)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, border: '1px solid ' + C.hair, borderRadius: 6, background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                    {thumb(h.image)}
                    <span style={{ fontSize: 12.5, color: C.ink, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── inline row renderers (closures over items/handlers) ── */
  function ChildRow({ k }: { k: AdminProtocolItem }) {
    const isProduct = k.item_type === 'product' || !!linkedKind(k);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isProduct
            ? <ShoppingBag size={13} color={C.accent} style={{ flexShrink: 0 }} />
            : <CornerDownRight size={13} color={C.faint} style={{ flexShrink: 0 }} />}
          <input
            value={k.display_name || ''}
            onChange={(e) => editItemLocal(k.id, { display_name: e.target.value })}
            onBlur={() => commitItem(k.id, ['display_name'])}
            style={{ ...inputStyle, flex: 1, fontSize: 12 }}
          />
          <button onClick={() => removeItem(k)} disabled={busyItem === k.id} title="Delete"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.danger, padding: 5, flexShrink: 0, display: 'inline-flex' }}>
            {busyItem === k.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
        {isProduct && <CatalogLinker it={k} />}
      </div>
    );
  }

  function ItemRow({ it, num }: { it: AdminProtocolItem; num?: number }) {
    const isRule = it.kind !== 'action';
    const kids = items.filter((x) => x.parent_protocol_item_id === it.id);
    const cat = it.category || 'do';
    const subOpts2 = SUB_OPTS[cat] || [];
    const curVerb = DO_VERBS.find((v) => new RegExp('^' + v + '\\b', 'i').test((it.display_name || '').trim())) || '';
    const iconBtn: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'inline-flex' };
    return (
      <div style={{ opacity: it.hidden ? 0.55 : 1, padding: 8, borderRadius: 10, border: '1px solid ' + C.hair, background: busyItem === it.id ? C.panel : C.paper }}>
        {/* one horizontal row — # · img · name · time · type · sub · verb · actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: it.kind === 'rule_dont' ? '#FEE2E2' : '#EEF4FF', color: it.kind === 'rule_dont' ? C.danger : C.accent }}>{num ?? '·'}</span>
          {(() => {
            const lk = linkInfo.get(it.id);
            return lk?.image ? (
              <button type="button" onClick={() => setViewRec({ ...lk, itemId: it.id })} title={`View / edit ${lk.kind}: ${lk.name}`}
                style={{ width: 30, height: 30, borderRadius: 7, overflow: 'hidden', border: '1px solid ' + C.hair, padding: 0, cursor: 'pointer', flexShrink: 0, background: C.panel }}>
                <img src={lk.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ) : null;
          })()}
          <input
            value={it.display_name || ''}
            onChange={(e) => editItemLocal(it.id, { display_name: e.target.value })}
            onBlur={() => commitItem(it.id, ['display_name'])}
            style={{ ...inputStyle, flex: 1, minWidth: 90, textDecoration: it.hidden ? 'line-through' : 'none' }}
          />
          {!isRule && (
            <input type="time" value={toTimeInput(it.scheduled_time)}
              onChange={(e) => editItemLocal(it.id, { scheduled_time: e.target.value ? `${e.target.value}:00` : null })}
              onBlur={() => commitItem(it.id, ['scheduled_time'])}
              style={{ ...inputStyle, width: 86, flexShrink: 0, padding: '7px 6px' }} />
          )}
          {!isRule ? (
            <>
              <IconSelect value={primaryTypeOf(it)} options={TYPE_OPTS} onChange={(t) => setPrimaryType(it, t)} width={124} />
              {subOpts2.length > 1 && (
                <IconSelect value={it.subtype || subOpts2[0].value} options={subOpts2} onChange={(s) => commitField(it, { subtype: s })} width={112} />
              )}
              {cat === 'do' && (
                <IconSelect value={curVerb} options={VERB_OPTS} onChange={(v) => setVerb(it, v)} width={92} placeholder="+ verb" />
              )}
            </>
          ) : (
            <IconSelect value={it.scope || 'none'} options={SCOPE_OPTS} onChange={(s) => commitField(it, { scope: s === 'none' ? null : s })} width={120} />
          )}
          <button onClick={() => toggleHidden(it)} disabled={busyItem === it.id} title={it.hidden ? 'Show in day view' : 'Hide from day view'} style={{ ...iconBtn, color: it.hidden ? C.faint : C.sub }}>
            {it.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button onClick={() => addItem((it.kind as Kind) || 'action', it.id)} title="Add detail / sub-item" style={{ ...iconBtn, color: C.sub }}>
            <CornerDownRight size={15} />
          </button>
          {it.kind === 'action' && (
            <button onClick={() => addProductChild(it.id)} title="Suggest a product to buy" style={{ ...iconBtn, color: C.accent }}>
              <ShoppingBag size={15} />
            </button>
          )}
          <button onClick={() => removeItem(it)} disabled={busyItem === it.id} title="Delete" style={{ ...iconBtn, color: C.danger }}>
            {busyItem === it.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
        {it.kind === 'action' && <CatalogLinker it={it} />}
        {kids.length > 0 && (
          <div style={{ marginTop: 6, marginLeft: 14, paddingLeft: 10, borderLeft: '2px solid ' + C.hair, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {kids.map((k) => <ChildRow key={k.id} k={k} />)}
          </div>
        )}
      </div>
    );
  }

  /* ── render ── */
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', minHeight: 560 }}>
      {/* linked-record lightbox (view / re-link) */}
      {viewRec && (
        <div onClick={() => setViewRec(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 420, width: '100%', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)' }}>
            {viewRec.image
              ? <img src={viewRec.image} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block', background: C.panel }} />
              : <div style={{ height: 160, background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.faint, fontSize: 13 }}>{linkBusy ? <Loader2 size={20} className="animate-spin" /> : 'No image on this record yet'}</div>}
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{viewRec.kind}{viewRec.price != null ? ` · $${viewRec.price}` : ''}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 2 }}>{viewRec.name}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: linkBusy ? 'default' : 'pointer', border: '1px solid ' + C.accent, background: C.accent, color: '#fff' }}>
                  {linkBusy ? 'Uploading…' : viewRec.image ? 'Replace image' : 'Upload image'}
                  <input type="file" accept="image/*" disabled={linkBusy} style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (f) uploadLinkedImage(f); }} />
                </label>
                <button onClick={() => { const it = items.find((x) => x.id === viewRec.itemId); setViewRec(null); if (it) openLinker(it); }}
                  style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + C.hair, background: '#fff', color: C.sub }}>Change link</button>
                {viewRec.buyUrl && <a href={viewRec.buyUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, border: '1px solid ' + C.hair, color: C.good, textDecoration: 'none' }}>Buy ↗</a>}
                <button onClick={() => setViewRec(null)} style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + C.hair, background: '#fff', color: C.sub }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── protocol list ── */}
      <div style={{ width: 260, flexShrink: 0, border: '1px solid ' + C.hair, borderRadius: 12, background: C.paper, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 720 }}>
        <div style={{ padding: 10, borderBottom: '1px solid ' + C.hair }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color={C.faint} style={{ position: 'absolute', left: 9, top: 9 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search protocols…"
              style={{ ...inputStyle, paddingLeft: 28 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: C.faint }}>{filtered.length} of {protocols.length}</span>
            <button onClick={() => loadList(true)} title="Refresh" style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.sub, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loadingList && (
            <div style={{ padding: 24, textAlign: 'center', color: C.faint }}>
              <Loader2 size={18} className="animate-spin" style={{ display: 'inline' }} /> Loading…
            </div>
          )}
          {listError && (
            <div style={{ padding: 14, color: C.danger, fontSize: 12, display: 'flex', gap: 6 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {listError}
            </div>
          )}
          {!loadingList && !listError && filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: C.faint, fontSize: 12 }}>No protocols found</div>
          )}
          {filtered.map((p) => {
            const on = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px', cursor: 'pointer',
                  border: 'none', borderBottom: '1px solid ' + C.hair,
                  background: on ? '#EEF4FF' : 'transparent',
                  borderLeft: `3px solid ${on ? C.accent : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: C.panel, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 14, fontWeight: 700, color: C.faint }}>{(p.name || '?').charAt(0)}</span>}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Untitled'}</div>
                  <div style={{ fontSize: 11, color: C.faint, marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                    {p.is_suggested && <span style={{ color: C.accent, fontWeight: 600 }}>Suggested</span>}
                    {p.category && <span>{p.category}</span>}
                  </div>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── editor + preview ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selected ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.faint, border: '1px dashed ' + C.hair, borderRadius: 12 }}>
            Select a protocol to edit.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
            {/* fields + steps */}
            <div style={{ flex: '1 1 420px', minWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* protocol fields */}
              <div style={{ border: '1px solid ' + C.hair, borderRadius: 12, background: C.paper, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>Protocol details</h3>
                  <button
                    onClick={saveProtocol}
                    disabled={!dirty || savingProtocol}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                      padding: '7px 14px', borderRadius: 8, cursor: dirty && !savingProtocol ? 'pointer' : 'default',
                      border: '1px solid ' + (dirty ? C.accent : C.hair),
                      background: dirty ? C.accent : C.panel, color: dirty ? '#fff' : C.faint,
                      opacity: savingProtocol ? 0.7 : 1,
                    }}
                  >
                    {savingProtocol ? <Loader2 size={14} className="animate-spin" /> : dirty ? <Save size={14} /> : <Check size={14} />}
                    {savingProtocol ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Name"><input style={inputStyle} value={form.name || ''} onChange={(e) => setField('name', e.target.value)} /></Field>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Description">
                      <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }} value={form.description || ''} onChange={(e) => setField('description', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Category"><input style={inputStyle} value={form.category || ''} onChange={(e) => setField('category', e.target.value)} /></Field>
                  <Field label="Type"><input style={inputStyle} value={form.type || ''} onChange={(e) => setField('type', e.target.value)} /></Field>
                  <Field label="Creator"><input style={inputStyle} value={form.creator || ''} onChange={(e) => setField('creator', e.target.value)} /></Field>
                  <Field label="Source"><input style={inputStyle} value={form.source || ''} onChange={(e) => setField('source', e.target.value)} /></Field>
                  <Field label="Health score"><input type="number" style={inputStyle} value={form.health_score ?? ''} onChange={(e) => setField('health_score', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                  <Field label="Total days"><input type="number" style={inputStyle} value={form.total_days ?? ''} onChange={(e) => setField('total_days', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <MediaUploadField
                      label="Protocol image"
                      mediaType="image"
                      value={form.image_url || ''}
                      onChange={(url) => setField('image_url', url)}
                      onUpload={(file) => uploadProtocolImage(accessToken, file)}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 2 }}>
                    {([['is_suggested', 'Suggested'], ['is_active', 'Active'], ['is_public', 'Public']] as const).map(([key, lbl]) => (
                      <label key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.ink, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!(form as any)[key]} onChange={(e) => setField(key as keyof AdminProtocol, e.target.checked as any)} />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* items editor — Timeline / Do's / Don'ts, each with child details */}
              <div style={{ border: '1px solid ' + C.hair, borderRadius: 12, background: C.paper, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {KIND_TABS.map(({ k, label }) => {
                      const on = kindTab === k;
                      const count = items.filter((i) => i.kind === k && !i.parent_protocol_item_id).length;
                      return (
                        <button key={k} onClick={() => setKindTab(k)}
                          style={{ fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + (on ? C.accent : C.hair), background: on ? '#EEF4FF' : '#fff', color: on ? C.accent : C.sub }}>
                          {label} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => addItem(kindTab)}
                    disabled={adding}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + C.accent, background: '#fff', color: C.accent }}
                  >
                    {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add {kindTab === 'action' ? 'step' : kindTab === 'rule_do' ? 'do' : "don't"}
                  </button>
                </div>
                {loadingItems ? (
                  <div style={{ padding: 24, textAlign: 'center', color: C.faint }}><Loader2 size={18} className="animate-spin" style={{ display: 'inline' }} /></div>
                ) : (() => {
                  const tops = items.filter((i) => i.kind === kindTab && !i.parent_protocol_item_id);
                  if (!tops.length) return <div style={{ padding: 24, textAlign: 'center', color: C.faint, fontSize: 13 }}>Nothing here yet — add the first one.</div>;

                  // group helper
                  const group = (list: AdminProtocolItem[], keyOf: (i: AdminProtocolItem) => string) => {
                    const m = new Map<string, AdminProtocolItem[]>();
                    for (const it of list) { const k = keyOf(it); if (!m.has(k)) m.set(k, []); m.get(k)!.push(it); }
                    return m;
                  };
                  // timeline order = sleep-end first, then by time; numbers every item 1..N
                  const sorted = [...tops].sort((a, b) => {
                    const as = isSleepName(a.display_name || '') ? -1 : 0, bs = isSleepName(b.display_name || '') ? -1 : 0;
                    if (as !== bs) return as - bs;
                    return minutesOf(a.scheduled_time) - minutesOf(b.scheduled_time);
                  });
                  const ordered = kindTab === 'action' ? sorted : tops;
                  const stepNo = new Map<string, number>(ordered.map((it, i) => [it.id, i + 1]));
                  const podHeader = (t: string) => (
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.sub, margin: '2px 0 6px' }}>{t}</div>
                  );
                  const groupCard = (label: string, list: AdminProtocolItem[]) => (
                    <div key={label} style={{ border: '1px solid ' + C.hair, borderRadius: 10, padding: 8, background: C.panel }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 6, paddingLeft: 2 }}>{label}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{list.map((it) => <ItemRow key={it.id} it={it} num={stepNo.get(it.id)} />)}</div>
                    </div>
                  );

                  if (kindTab !== 'action') {
                    // rules grouped by scope
                    const byScope = group(tops, (i) => i.scope || 'general');
                    return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[...byScope.entries()].map(([s, list]) => groupCard(s, list))}</div>;
                  }

                  const byPod = group(sorted, (i) => partOfDay(i.scheduled_time));
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {POD_ORDER.filter((p) => byPod.has(p)).map((pod) => {
                        const byGroup = group(byPod.get(pod)!, (i) => i.group_name || 'Ungrouped');
                        return (
                          <div key={pod}>
                            {podHeader(pod)}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {[...byGroup.entries()].map(([g, list]) => groupCard(g, list))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* live mobile preview */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'sticky', top: 12 }}>
              <PhonePreview
                name={form.name || selected.name}
                items={items}
                imageUrl={form.image_url || selected.image_url}
                linkImages={new Map([...linkInfo].filter(([, v]) => v.image).map(([id, v]) => [id, v.image as string]))}
              />
              <p style={{ fontSize: 11, fontStyle: 'italic', color: C.faint, margin: 0, textAlign: 'center', maxWidth: 280 }}>
                Live preview — the home screen as it appears in the mobile app.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
