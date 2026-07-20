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
  Pencil, GitMerge, Download, Upload, Repeat, CalendarDays, FileText, ChevronUp, ImageOff, Image as ImageIcon,
} from 'lucide-react';
import { aiGenerateImage } from '../../utils/aiImage';
import { buildProtocolCoverPrompt } from '../../utils/imagePromptBuilder';
import { composeAppIconCoverFile } from '../../utils/appIconCover';
import { generateProtocolPdf } from '../../utils/protocolPdf';
import { toast } from 'sonner';
import {
  CATEGORY_TINTS, categorize, type ProtocolItem as CatItem,
} from '../../config/protocolCategories';
import { PhoneFrame } from '../mockups/PhoneFrame';
import { ProtocolHomeScreen, type HomeItem } from '../mockups/ProtocolHomeScreen';
import { MediaUploadField } from './MediaUploadField';
import { MarkdownField } from './MarkdownField';
import { computeSleepWindow, isWakeName, isBedName } from '../../utils/sleepWindow';
import { descriptiveMealSlot } from '../../protocolDomain/mealSlot';
import {
  listProtocols, listProtocolItems, updateProtocol,
  createProtocolItem, updateProtocolItem, deleteProtocolItem, uploadProtocolImage,
  searchCatalog, getCatalogByIds, linkedKind, linkPatch, updateCatalogImage, CATALOG_CFG,
  updateCatalogFields, deleteCatalogRecord, mergeCatalogRecords, countProtocolRefs, catalogNameCol,
  type AdminProtocol, type AdminProtocolItem, type CatalogKind, type CatalogHit,
} from '../../utils/protocolAdmin';

/* ── palette (neutral admin) ── */
// Reference the .sb-admin design tokens (adminTheme.css) so the editor — and
// the kit protocol modal — follow light/dark automatically instead of being
// hardcoded light. `accent`/`good` become the Supabase green.
const C = {
  ink: 'var(--sb-text)', sub: 'var(--sb-text-soft)', faint: 'var(--sb-text-faint)', hair: 'var(--sb-border)',
  panel: 'var(--sb-panel-soft)', paper: 'var(--sb-panel)', accent: 'var(--sb-brand-strong)', danger: '#ef4444',
  good: 'var(--sb-brand-strong)', goodBg: 'var(--sb-brand-soft)', goodBorder: 'var(--sb-brand)',
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
const DO_VERBS = [
  'Apply', 'Use', 'Take', 'Do', 'Practice', 'Massage', 'Cleanse', 'Wash', 'Rinse',
  'Exfoliate', 'Moisturize', 'Hydrate', 'Tone', 'Mask', 'Steam', 'Soak', 'Brush',
  'Floss', 'Stretch', 'Roll', 'Foam-roll', 'Meditate', 'Breathe', 'Walk', 'Run',
  'Lift', 'Train', 'Warm-up', 'Cool-down', 'Rest', 'Drink', 'Eat', 'Avoid', 'Limit',
];
// recognise any leading verb (built from DO_VERBS so swapping stays in sync) + a couple of synonyms
const VERB_RE = new RegExp(
  '^(' + DO_VERBS.map((v) => v.toLowerCase().replace('-', '[\\s-]?')).join('|') + '|perform|complete)\\s+',
  'i',
);

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
// Sleep-anchor detection lives in ../../utils/sleepWindow (shared with the mockup
// + mirrored in the mobile widget). `isSleepName` keeps the legacy sort-first rule.
const isSleepName = (n: string) => isWakeName(n);

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
const filterSel: React.CSSProperties = { flex: '1 1 116px', minWidth: 108, padding: '6px 8px', fontSize: 12, color: C.ink, border: '1px solid ' + C.hair, borderRadius: 7, background: C.paper, outline: 'none', cursor: 'pointer' };

/* ── clean icon+label dropdown (native <select> can't show icons) ── */
interface Opt { value: string; label: string; Icon?: any; color?: string }
// "What is it?" — the primary type of an item.
const TYPE_OPTS: Opt[] = [
  { value: 'recipe', label: 'Recipe', Icon: Utensils, color: '#388E3C' },
  { value: 'ingredient', label: 'Ingredient', Icon: Leaf, color: '#43A047' },
  { value: 'product', label: 'Product', Icon: Package, color: '#0891B2' },
  { value: 'activity', label: 'Activity', Icon: Dumbbell, color: '#D45B0A' },
  { value: 'supplement', label: 'Supplement', Icon: Pill, color: '#0097A7' },
  { value: 'sleep', label: 'Sleep', Icon: Moon, color: 'var(--sb-text-soft)' },
];
// One colour language for "what kind of thing is this?" — used on the step's
// item_type badge AND the linked catalog record's kind badge so orange=activity,
// green=meal/food, cyan/blue=buyable (product/supplement) reads at a glance.
// Keys cover both DB item_type values and catalog-link kinds.
const KIND_COLOR: Record<string, string> = {
  activity: '#D45B0A',   // orange  — a thing you DO
  recipe: '#388E3C',     // green   — a meal
  consume: '#2E7D32',    // green   — food/ingredient you eat
  ingredient: '#43A047', // green   — food/ingredient you eat
  product: '#0891B2',    // cyan    — buyable product
  supplement: '#0097A7', // teal    — buyable supplement
  sleep: '#6366F1',      // indigo  — sleep
};
function kindColor(k?: string | null): string {
  return KIND_COLOR[(k || '').toLowerCase()] || 'var(--sb-text-soft)';
}
// Colour-coded chip: tinted fill + border derived from the kind colour.
function kindChip(k?: string | null): React.CSSProperties {
  const c = kindColor(k);
  return {
    color: c,
    background: `color-mix(in srgb, ${c} 13%, transparent)`,
    border: `1px solid color-mix(in srgb, ${c} 34%, transparent)`,
  };
}
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
  sleep: [{ value: 'sleep', label: 'Sleep', Icon: Moon, color: 'var(--sb-text-soft)' }],
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
// Quick-add presets: a new step's type chosen up-front so it is born correctly
// shaped (category / item_type / subtype) instead of the generic activity default.
type AddPreset = { type?: string; group_name?: string; display_name?: string; subtype?: string; scheduled_time?: string };
// Meal-slot quick-adds: a recipe-consume step pre-tagged with a slot group_name +
// slot-appropriate default time, so the slot-aware recipe suggester fires at once.
const MEAL_PRESETS: { label: string; Icon: any; color: string; preset: AddPreset }[] = [
  { label: 'Breakfast', Icon: Utensils, color: '#388E3C', preset: { type: 'recipe', group_name: 'Breakfast', display_name: 'Breakfast', subtype: 'meal', scheduled_time: '07:00:00' } },
  { label: 'Lunch', Icon: Utensils, color: '#388E3C', preset: { type: 'recipe', group_name: 'Lunch', display_name: 'Lunch', subtype: 'meal', scheduled_time: '12:00:00' } },
  { label: 'Dinner', Icon: Utensils, color: '#388E3C', preset: { type: 'recipe', group_name: 'Dinner', display_name: 'Dinner', subtype: 'meal', scheduled_time: '18:00:00' } },
  { label: 'Snack', Icon: Apple, color: '#E64A19', preset: { type: 'recipe', group_name: 'Snack', display_name: 'Snack', subtype: 'snack', scheduled_time: '10:00:00' } },
];
function primaryTypeOf(it: AdminProtocolItem): string {
  // item_type is the source of truth for the definitive types — a supplement or
  // product mis-filed under category 'do' must still read as Supplement/Product,
  // not "Activity" (the old category-first order caused exactly that bug). Only
  // the ambiguous 'activity'/null item_type falls back to category.
  if (it.item_type === 'supplement') return 'supplement';
  if (it.item_type === 'product') return 'product';
  if (it.item_type === 'recipe') return 'recipe';
  if (it.item_type === 'consume') return 'ingredient';
  if (it.category === 'supplement') return 'supplement';
  if (it.category === 'sleep') return 'sleep';
  if (it.category === 'consume') return 'ingredient';
  return 'activity'; // item_type 'activity'/null under category 'do' or none
}

const VERB_OPTS: Opt[] = [{ value: '', label: '+ verb' }, ...DO_VERBS.map((v) => ({ value: v, label: v }))];
// meal-slot group picker for consume items (group_name drives the app's slot cards)
const SLOT_OPTS: Opt[] = [
  { value: 'none', label: 'No slot' },
  { value: 'Breakfast', label: 'Breakfast', Icon: Utensils, color: '#388E3C' },
  { value: 'Lunch', label: 'Lunch', Icon: Utensils, color: '#388E3C' },
  { value: 'Dinner', label: 'Dinner', Icon: Utensils, color: '#388E3C' },
  { value: 'Snack', label: 'Snack', Icon: Apple, color: '#E64A19' },
];
const SCOPE_OPTS: Opt[] = SCOPES.map((s) => ({ value: s, label: s }));
// cadence — maps to protocol_items.recurrence_type (the mobile app's itemShowsOnDate honours these)
const REPEAT_OPTS: Opt[] = [
  { value: 'daily', label: 'Every day', Icon: Repeat, color: '#6B7280' },
  { value: 'weekly', label: 'Days of week', Icon: CalendarDays, color: '#2563EB' },
  { value: 'custom', label: 'Every N days', Icon: RefreshCw, color: '#D45B0A' },
  { value: 'monthly', label: 'Monthly', Icon: CalendarDays, color: '#0097A7' },
  { value: 'one_off', label: 'Once (date)', Icon: CalendarDays, color: '#DC2626' },
];
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; // index = day-of-week (0=Sun), matches mobile recurrence_days_of_week
// catalog link targets — the SAME icon picker as Type (recipe / ingredient / product / activity / supplement)
const LINK_OPTS: Opt[] = [
  { value: 'recipe', label: 'Recipe', Icon: Utensils, color: '#388E3C' },
  { value: 'ingredient', label: 'Ingredient', Icon: Leaf, color: '#43A047' },
  { value: 'product', label: 'Product', Icon: Package, color: '#6B7280' },
  { value: 'activity', label: 'Activity', Icon: Dumbbell, color: '#D45B0A' },
  { value: 'supplement', label: 'Supplement', Icon: Pill, color: '#0097A7' },
];

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
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', zIndex: 41, background: 'var(--sb-panel)', border: '1px solid ' + C.hair, borderRadius: 8, boxShadow: '0 10px 28px -10px rgba(0,0,0,0.3)', padding: 4, maxHeight: 260, overflowY: 'auto' }}>
            {options.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', border: 'none', background: o.value === value ? 'var(--sb-brand-soft)' : 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, color: C.ink, textAlign: 'left' }}>
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
export function ProtocolEditor({ accessToken, onOpenCatalogRecord, initialProtocolId }: {
  accessToken: string;
  onOpenCatalogRecord?: (kind: CatalogKind, id: string) => void;
  /** deep-open a protocol (e.g. clicking a Protocol cell in the Kits master table) */
  initialProtocolId?: string | null;
}) {
  const [protocols, setProtocols] = useState<AdminProtocol[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [fGender, setFGender] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fType, setFType] = useState('');
  const [fNoCover, setFNoCover] = useState(false); // show only protocols missing a cover image
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // deep-open wins over the "first row" default; list-load keeps it (see setSelectedId((cur) => …))
  useEffect(() => { if (initialProtocolId) setSelectedId(initialProtocolId); }, [initialProtocolId]);

  const [items, setItems] = useState<AdminProtocolItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [form, setForm] = useState<Partial<AdminProtocol>>({});
  const [savingProtocol, setSavingProtocol] = useState(false);
  // AI cover generation: aiBusy while generating; coverPrompt is the (optionally
  // edited) prompt — null means "use the global template built from this protocol".
  const [aiBusy, setAiBusy] = useState(false);
  const [coverPrompt, setCoverPrompt] = useState<string | null>(null);
  useEffect(() => { setCoverPrompt(null); }, [selectedId]);
  const [importing, setImporting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [kindTab, setKindTab] = useState<Kind>('action');
  // multi-day protocols (day_number cycles): which cycle day the editor shows
  const [viewDay, setViewDay] = useState(1);
  useEffect(() => { setViewDay(1); }, [selectedId]);
  // catalog linking
  const [linkInfo, setLinkInfo] = useState<Map<string, CatalogHit & { kind: CatalogKind }>>(new Map());
  const [linkerItemId, setLinkerItemId] = useState<string | null>(null);
  const [linkKind, setLinkKind] = useState<CatalogKind>('recipe');
  const [linkQuery, setLinkQuery] = useState('');
  const [linkResults, setLinkResults] = useState<CatalogHit[]>([]);
  const [linkBusy, setLinkBusy] = useState(false);
  const [viewRec, setViewRec] = useState<(CatalogHit & { kind: CatalogKind; itemId: string }) | null>(null);
  // record manager (edit / merge / delete) inside the lightbox
  const [recName, setRecName] = useState('');
  const [recBusy, setRecBusy] = useState(false);
  const [recRefs, setRecRefs] = useState<number | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeQuery, setMergeQuery] = useState('');
  const [mergeResults, setMergeResults] = useState<CatalogHit[]>([]);
  const [mergeBusy, setMergeBusy] = useState(false);

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
  // Populate the form from the list. Depends on `protocols` too: when opened via
  // initialProtocolId (modal), selectedId is set BEFORE the list finishes loading,
  // so the first run misses — re-run when the list arrives. Guard prevents
  // clobbering an already-loaded/edited form for the same protocol.
  useEffect(() => {
    if (!selectedId) return;
    const p = protocols.find((x) => x.id === selectedId);
    if (p) setForm((cur) => (cur.id === selectedId ? cur : { ...p }));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedId, protocols]);
  // load the protocol's steps once per selection (not on every list refresh)
  useEffect(() => { if (selectedId) loadItems(selectedId); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedId]);

  const dirty = useMemo(() => {
    if (!selected) return false;
    return PROTO_FIELDS.some((f) => (form as any)[f] !== (selected as any)[f]);
  }, [form, selected]);
  // switching protocols with unsaved form edits silently discarded them — guard it
  function selectProtocol(id: string) {
    if (id === selectedId) return;
    if (dirty && !window.confirm('You have unsaved protocol changes — discard them and switch?')) return;
    setSelectedId(id);
  }

  // distinct, case-folded filter options drawn from the loaded protocols
  const distinctOf = (key: keyof AdminProtocol) => {
    const seen = new Map<string, string>();
    for (const p of protocols) {
      const v = (p as any)[key];
      if (v == null || v === '') continue;
      const lo = String(v).toLowerCase();
      if (!seen.has(lo)) seen.set(lo, String(v));
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  };
  const categoryOpts = useMemo(() => distinctOf('category'), [protocols]);
  const typeOpts = useMemo(() => distinctOf('type'), [protocols]);
  const filtersActive = !!(fGender || fCategory || fType || query.trim() || fNoCover);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return protocols.filter((p) => {
      if (q && !(
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.creator || '').toLowerCase().includes(q))) return false;
      if (fGender) {
        const g = (p.target_gender || '').toLowerCase();
        if (fGender === 'unspecified' ? g !== '' : g !== fGender) return false;
      }
      if (fCategory && (p.category || '').toLowerCase() !== fCategory.toLowerCase()) return false;
      if (fType && (p.type || '').toLowerCase() !== fType.toLowerCase()) return false;
      if (fNoCover && (p.image_url || '').trim()) return false;
      return true;
    });
  }, [protocols, query, fGender, fCategory, fType, fNoCover]);

  // how many protocols still have no cover image (drives the "Needs cover" chip)
  const missingCovers = useMemo(
    () => protocols.filter((p) => !(p.image_url || '').trim()).length,
    [protocols],
  );

  function setField<K extends keyof AdminProtocol>(key: K, value: AdminProtocol[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // AI cover — the global template, filled from this protocol; editable per-cover.
  const defaultCoverPrompt = useMemo(
    () => buildProtocolCoverPrompt(form),
    [form.name, form.category, form.type],
  );
  const effectiveCoverPrompt = coverPrompt ?? defaultCoverPrompt;

  // Frame any image into the app-icon template (square-in-square + blurred bg)
  // and upload the result. Falls back to the raw URL if canvas framing fails.
  async function frameAndUpload(rawUrl: string): Promise<string> {
    try {
      const file = await composeAppIconCoverFile(rawUrl, `cover-${Date.now()}.png`);
      return await uploadProtocolImage(accessToken, file);
    } catch (e: any) {
      console.warn('App-icon framing failed, using raw image:', e);
      toast.warning('Saved unframed (could not apply app-icon frame to this image)');
      return rawUrl;
    }
  }

  async function generateCover() {
    const prompt = effectiveCoverPrompt.trim();
    if (!prompt) { toast.error('Prompt is empty'); return; }
    setAiBusy(true);
    try {
      toast.info('Generating cover… (~20–40s)');
      const raw = await aiGenerateImage(accessToken, prompt);
      toast.info('Framing as app icon…');
      setField('image_url', await frameAndUpload(raw));
      toast.success('Cover generated — remember to Save');
    } catch (e: any) {
      toast.error(`Generate failed: ${(e?.message || '').slice(0, 120)}`);
    } finally {
      setAiBusy(false);
    }
  }

  // Re-frame the current image (e.g. an uploaded one) into the app-icon template.
  async function frameCurrentCover() {
    const src = (form.image_url || '').trim();
    if (!src) { toast.error('No image to frame yet'); return; }
    setAiBusy(true);
    try {
      toast.info('Framing as app icon…');
      setField('image_url', await frameAndUpload(src));
      toast.success('Framed as app icon — remember to Save');
    } catch (e: any) {
      toast.error(`Framing failed: ${(e?.message || '').slice(0, 120)}`);
    } finally {
      setAiBusy(false);
    }
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

  /* ── export / import (round-trip a protocol as JSON) ── */
  // item columns that round-trip; id/protocol_id/parent are remapped on import, not carried verbatim
  const IMPORT_ITEM_FIELDS: (keyof AdminProtocolItem)[] = [
    'display_name', 'item_type', 'kind', 'scope', 'scheduled_time', 'duration_minutes',
    'group_name', 'day_number', 'sort_order', 'category', 'subtype', 'hidden',
    'catalog_recipe_id', 'catalog_product_id', 'catalog_activity_id', 'catalog_ingredient_id', 'supplement_id',
    'recurrence_type', 'recurrence_days_of_week', 'recurrence_interval_days', 'recurrence_start_date', 'recurrence_end_date', 'scheduled_date',
  ];

  async function downloadPdf() {
    if (!selected) return;
    setPdfBusy(true);
    try {
      await generateProtocolPdf({
        accessToken,
        protocol: { ...selected, ...form } as any,
        items: items as any,
        day: cycleLen > 1 ? viewDay : 1,
      });
      toast.success('PDF downloaded');
    } catch (e: any) {
      toast.error(`PDF failed: ${e?.message || e}`);
    } finally { setPdfBusy(false); }
  }

  function exportProtocol() {
    if (!selected) return;
    const payload = {
      _format: 'healthscan.protocol',
      _version: 1,
      exported_at: new Date().toISOString(),
      protocol: { ...selected, ...form }, // include any unsaved edits in the form
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol-${(selected.name || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${items.length} step(s)`);
  }

  function sanitizeImportItem(fi: any, protocolId: string, parentId: string | null): Partial<AdminProtocolItem> {
    const out: any = { protocol_id: protocolId, parent_protocol_item_id: parentId };
    for (const f of IMPORT_ITEM_FIELDS) if (fi[f] !== undefined) out[f] = fi[f];
    return out;
  }

  async function importProtocol(file: File) {
    setImporting(true);
    try {
      const data = JSON.parse(await file.text());
      const p = data?.protocol;
      const fileItems: any[] = Array.isArray(data?.items) ? data.items : [];
      if (!p || !p.id) throw new Error('Not a valid protocol export (missing protocol.id).');
      const target = protocols.find((x) => x.id === p.id);
      if (!target) throw new Error(`No protocol with id "${p.id}" in this environment. Export from this environment first — creating brand-new protocols on import isn't supported.`);

      const current = await listProtocolItems(accessToken, target.id);
      if (!window.confirm(
        `Import will OVERWRITE “${target.name}”.\n\nIts details and all ${current.length} current step(s) will be replaced with the file’s ${fileItems.length} step(s).\n\nThis cannot be undone. Continue?`,
      )) { setImporting(false); return; }

      // 1) protocol fields (only the editable allowlist — never touch id/user_id/timestamps)
      const patch: any = {};
      for (const f of PROTO_FIELDS) if (p[f] !== undefined) patch[f] = p[f];
      if (Object.keys(patch).length) await updateProtocol(accessToken, target.id, patch);

      // 2) clear existing items (children first for referential integrity)
      for (const it of current.filter((c) => c.parent_protocol_item_id)) await deleteProtocolItem(accessToken, it.id);
      for (const it of current.filter((c) => !c.parent_protocol_item_id)) await deleteProtocolItem(accessToken, it.id);

      // 3) insert file items, remapping ids so parent links survive (any nesting depth)
      const idMap = new Map<string, string>();
      const remaining = [...fileItems];
      let guard = 0;
      while (remaining.length && guard < 5000) {
        guard++;
        const idx = remaining.findIndex((i) => !i.parent_protocol_item_id || idMap.has(i.parent_protocol_item_id));
        const fi = idx >= 0 ? remaining.splice(idx, 1)[0] : remaining.shift(); // orphan → insert flat
        const parentId = fi.parent_protocol_item_id ? idMap.get(fi.parent_protocol_item_id) || null : null;
        const created = await createProtocolItem(accessToken, sanitizeImportItem(fi, target.id, parentId));
        if (fi.id) idMap.set(fi.id, created.id);
      }

      toast.success(`Imported ${fileItems.length} step(s) into “${target.name}”`);
      await loadList(true);
      setSelectedId(target.id);
      await loadItems(target.id);
    } catch (e: any) {
      toast.error(`Import failed: ${e?.message || e}`);
    } finally {
      setImporting(false);
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

  async function addItem(kind: Kind, parentId?: string, preset?: AddPreset) {
    if (!selected) return;
    setAdding(true);
    const isRule = kind !== 'action';
    const maxSort = items.reduce((m, it) => Math.max(m, it.sort_order || 0), 0);
    // A chosen type maps to the right stored category/item_type/subtype up front.
    const td = preset?.type ? TYPE_TO_DATA[preset.type] : null;
    const subs = td ? (SUB_OPTS[td.category] || []) : [];
    try {
      const created = await createProtocolItem(accessToken, {
        protocol_id: selected.id,
        display_name: preset?.display_name
          ?? (parentId ? 'New detail' : kind === 'rule_dont' ? 'New avoidance' : isRule ? 'New do' : 'New step'),
        item_type: td?.item_type ?? 'activity',
        kind,
        scope: isRule ? 'outside' : null,
        scheduled_time: isRule || parentId ? null : (preset?.scheduled_time ?? '08:00:00'),
        day_number: viewDay,
        sort_order: maxSort + 1,
        parent_protocol_item_id: parentId || null,
        group_name: preset?.group_name ?? null,
        category: td ? td.category : (kind === 'action' ? 'do' : null),
        subtype: preset?.subtype ?? (td ? (subs[0]?.value ?? null) : (kind === 'action' ? 'wellness' : null)),
        hidden: false,
      });
      setItems((its) => [...its, created]);
      baseline.current.set(created.id, { ...created });
      // Born as a meal slot? Open the slot-aware recipe suggester straight away.
      if (preset?.group_name && td?.category === 'consume') setTimeout(() => openLinker(created), 0);
      toast.success('Added');
    } catch (e: any) {
      toast.error(`Add failed: ${e?.message || e}`);
    } finally {
      setAdding(false);
    }
  }

  // ── multi-day cycle (mirrors the app: useActiveProtocol's day_number logic) ──
  // An item shows on cycle day D when day_number is null (= every day) or === D.
  const allDayItems = items.filter((it) => (it.kind === 'action' || !it.kind) && !it.parent_protocol_item_id);
  const cycleLen = Math.max(selected?.total_days || 0, ...allDayItems.map((i) => i.day_number || 0), 1);
  const showsOnDay = (it: AdminProtocolItem, d: number) => it.day_number == null || it.day_number === d;
  // the app only cycles when total_days is set — surface + one-click-fix when it isn't
  const totalDaysMissing = cycleLen > 1 && !(selected?.total_days && selected.total_days > 1);
  async function fixTotalDays() {
    if (!selected) return;
    try {
      const updated = await updateProtocol(accessToken, selected.id, { total_days: cycleLen });
      setProtocols((ps) => ps.map((p) => (p.id === selected.id ? { ...p, ...updated } : p)));
      setForm((f) => ({ ...f, total_days: updated.total_days ?? cycleLen }));
      toast.success(`Total days set to ${cycleLen} — the app will now cycle days`);
    } catch (e: any) { toast.error(`Update failed: ${e?.message || e}`); }
  }

  // the SELECTED day's sleep window (wake / bedtime anchors + computed hours) — shared logic.
  const dayItems = allDayItems.filter((it) => cycleLen <= 1 || showsOnDay(it, viewDay));
  const sleepWin = computeSleepWindow(dayItems);
  const wakeItem = sleepWin.wakeItem;
  const bedItem = sleepWin.bedItem;
  // any sleep anchors beyond the one wake + one bedtime are duplicates (e.g. a stray
  // "End Sleep" left next to "Wake at 4am") — offer to clean them up.
  const extraAnchors = dayItems.filter((it) =>
    (isWakeName(it.display_name || '') || isBedName(it.display_name || '')) && it !== wakeItem && it !== bedItem);
  // derive the wake default from the protocol's own FIRST timed step, so the day
  // starts when the routine starts instead of a fixed 6am. (Bedtime stays a real
  // default — the last step is usually an evening activity, not actual bedtime.)
  const timedSteps = dayItems
    .filter((it) => it !== wakeItem && it !== bedItem && it.scheduled_time && minutesOf(it.scheduled_time) < 1e9)
    .sort((a, b) => minutesOf(a.scheduled_time) - minutesOf(b.scheduled_time));
  const derivedWake = timedSteps.length ? toTimeInput(timedSteps[0].scheduled_time) : '';
  // pin wake = first step (links the day's start to the schedule)
  async function linkAnchorsToSchedule() {
    if (derivedWake && !wakeItem) await setAnchor('wake', derivedWake);
  }
  // create or re-time a sleep anchor ("End Sleep" wake / "Start Sleep" bedtime).
  async function setAnchor(which: 'wake' | 'bed', time: string) {
    if (!selected) return;
    const hhmmss = time ? `${time}:00` : null;
    const existing = which === 'wake' ? wakeItem : bedItem;
    setBusyItem(existing?.id || `anchor-${which}`);
    try {
      if (existing) {
        editItemLocal(existing.id, { scheduled_time: hhmmss });
        const updated = await updateProtocolItem(accessToken, existing.id, { scheduled_time: hhmmss });
        baseline.current.set(existing.id, { ...(items.find((x) => x.id === existing.id) || existing), ...updated });
        toast.success(which === 'wake' ? 'Wake time set' : 'Bedtime set');
      } else if (hhmmss) {
        const maxSort = items.reduce((m, it) => Math.max(m, it.sort_order || 0), 0);
        const created = await createProtocolItem(accessToken, {
          protocol_id: selected.id,
          display_name: which === 'wake' ? 'End Sleep' : 'Start Sleep',
          item_type: 'activity', kind: 'action', scheduled_time: hhmmss,
          group_name: 'Sleep', category: 'sleep', subtype: 'sleep',
          day_number: viewDay, sort_order: maxSort + 1, hidden: false,
        });
        setItems((its) => [...its, created]);
        baseline.current.set(created.id, { ...created });
        toast.success(which === 'wake' ? 'Wake anchor added' : 'Bedtime anchor added');
      }
    } catch (e: any) {
      toast.error(`Update failed: ${e?.message || e}`);
    } finally { setBusyItem(null); }
  }
  // delete duplicate sleep anchors, keeping the resolved wake + bedtime
  async function cleanupAnchors() {
    if (!extraAnchors.length) return;
    if (!window.confirm(`Remove ${extraAnchors.length} duplicate sleep anchor(s)?\n\n${extraAnchors.map((a) => `• ${a.display_name} (${toTimeInput(a.scheduled_time) || '—'})`).join('\n')}\n\nKeeps the wake + bedtime shown above.`)) return;
    setBusyItem('anchor-cleanup');
    try {
      for (const it of extraAnchors) await deleteProtocolItem(accessToken, it.id);
      const removed = new Set(extraAnchors.map((it) => it.id));
      setItems((its) => its.filter((x) => !removed.has(x.id)));
      removed.forEach((id) => baseline.current.delete(id));
      toast.success('Cleaned up sleep anchors');
    } catch (e: any) { toast.error(`Cleanup failed: ${e?.message || e}`); }
    finally { setBusyItem(null); }
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
  // reorder a rule within its tab (Do's / Don'ts render in sort_order). Reindexes
  // ALL siblings sequentially so equal/null sort_orders can't stick together.
  async function moveRule(it: AdminProtocolItem, dir: -1 | 1) {
    const sibs = items.filter((x) => x.kind === it.kind && !x.parent_protocol_item_id);
    const idx = sibs.findIndex((x) => x.id === it.id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= sibs.length) return;
    const order = [...sibs];
    order.splice(idx, 1);
    order.splice(j, 0, it);
    const newSort = new Map(order.map((x, i) => [x.id, i + 1]));
    setBusyItem(it.id);
    try {
      await Promise.all(order.filter((x) => x.sort_order !== newSort.get(x.id))
        .map((x) => updateProtocolItem(accessToken, x.id, { sort_order: newSort.get(x.id)! })));
      // mirror the fetch ordering locally (scheduled_time nulls-last, then sort_order)
      setItems((its) => its
        .map((x) => (newSort.has(x.id) ? { ...x, sort_order: newSort.get(x.id)! } : x))
        .sort((a, b) => {
          const ta = a.scheduled_time ? 0 : 1, tb = b.scheduled_time ? 0 : 1;
          if (ta !== tb) return ta - tb;
          if (a.scheduled_time && b.scheduled_time && a.scheduled_time !== b.scheduled_time) return a.scheduled_time < b.scheduled_time ? -1 : 1;
          return (a.sort_order ?? 1e9) - (b.sort_order ?? 1e9);
        }));
    } catch (e: any) { toast.error(`Reorder failed: ${e?.message || e}`); }
    finally { setBusyItem(null); }
  }
  // primary "what is it?" → category + item_type + a valid subtype
  function setPrimaryType(it: AdminProtocolItem, t: string) {
    const d = TYPE_TO_DATA[t]; if (!d) return;
    const subs = SUB_OPTS[d.category] || [];
    commitField(it, { category: d.category, item_type: d.item_type, subtype: subs[0]?.value || null });
  }
  // cadence: set recurrence_type + sensible defaults, clearing the now-irrelevant fields
  function setRecurType(it: AdminProtocolItem, type: string) {
    const patch: Partial<AdminProtocolItem> = {
      recurrence_type: type, recurrence_days_of_week: null, recurrence_interval_days: null, scheduled_date: null,
    };
    if (type === 'weekly') patch.recurrence_days_of_week = it.recurrence_days_of_week?.length ? it.recurrence_days_of_week : [1, 3, 5];
    if (type === 'custom') patch.recurrence_interval_days = it.recurrence_interval_days || 2;
    commitField(it, patch);
  }
  function toggleDow(it: AdminProtocolItem, d: number) {
    const cur = it.recurrence_days_of_week || [];
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort((a, b) => a - b);
    commitField(it, { recurrence_days_of_week: next });
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
  // Meal slot a consume item belongs to (broad/descriptive, e.g. "Nutritious
  // Lunch" → Lunch). Drives slot-aware recipe suggestions instead of blind search.
  function itemMealSlot(it?: AdminProtocolItem | null): string | null {
    return it && it.category === 'consume' ? descriptiveMealSlot(it.group_name) : null;
  }
  async function runSearch(kind: CatalogKind, q: string, it?: AdminProtocolItem) {
    const item = it || items.find((x) => x.id === linkerItemId);
    const slot = kind === 'recipe' ? itemMealSlot(item) : null;
    setLinkBusy(true);
    try { setLinkResults(await searchCatalog(accessToken, kind, q, slot && !q.trim() ? 6 : 10, slot ?? undefined)); }
    catch { setLinkResults([]); }
    finally { setLinkBusy(false); }
  }
  function openLinker(it: AdminProtocolItem) {
    const slot = itemMealSlot(it);
    // A meal-slot item with nothing linked yet opens straight into recipe
    // suggestions (empty query so the ranker, not name-match, drives results).
    const k = linkedKind(it) || (slot ? 'recipe' : defaultKind(it));
    const q = k === 'recipe' && slot ? '' : (it.display_name || '');
    setLinkerItemId(it.id); setLinkKind(k); setLinkQuery(q);
    runSearch(k, q, it);
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

  // open a linked catalog record in its REAL editor (Ingredients / Recipes / … tab).
  // Falls back to the in-panel manager modal when the editor isn't wired (standalone use).
  function openRecord(lk: CatalogHit & { kind: CatalogKind }, itemId: string) {
    if (onOpenCatalogRecord) { onOpenCatalogRecord(lk.kind, lk.id); return; }
    setViewRec({ ...lk, itemId });
  }

  /* ── linked-record manager (edit / merge / delete), driven by the lightbox ── */
  // sync the editor when a different record is opened
  useEffect(() => {
    if (!viewRec) return;
    setRecName(viewRec.name || '');
    setMergeOpen(false); setMergeQuery(''); setMergeResults([]); setRecRefs(null);
    countProtocolRefs(accessToken, viewRec.kind, viewRec.id).then(setRecRefs).catch(() => setRecRefs(null));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [viewRec?.id]);

  async function saveRecName() {
    if (!viewRec) return;
    const name = recName.trim();
    if (!name || name === viewRec.name) return;
    setRecBusy(true);
    try {
      await updateCatalogFields(accessToken, viewRec.kind, viewRec.id, { [catalogNameCol(viewRec.kind)]: name });
      setLinkInfo((m) => { const n = new Map(m); const e = n.get(viewRec.itemId); if (e) n.set(viewRec.itemId, { ...e, name }); return n; });
      setViewRec((v) => (v ? { ...v, name } : v));
      toast.success('Record renamed');
    } catch (e: any) { toast.error(`Rename failed: ${e?.message || e}`); }
    finally { setRecBusy(false); }
  }
  async function runMergeSearch(q: string) {
    if (!viewRec) return;
    setMergeBusy(true);
    try { const hits = await searchCatalog(accessToken, viewRec.kind, q, 10); setMergeResults(hits.filter((h) => h.id !== viewRec.id)); }
    catch { setMergeResults([]); }
    finally { setMergeBusy(false); }
  }
  async function doMerge(dup: CatalogHit) {
    if (!viewRec) return;
    const survivor = viewRec;
    if (!window.confirm(`Merge "${dup.name}" INTO "${survivor.name}"?\n\nEvery protocol link and recipe↔ingredient junction pointing at "${dup.name}" will be re-pointed to "${survivor.name}", then "${dup.name}" will be permanently deleted.\n\nThis cannot be undone.`)) return;
    setMergeBusy(true);
    try {
      const counts = await mergeCatalogRecords(accessToken, survivor.kind, survivor.id, dup.id);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      toast.success(`Merged — re-pointed ${total} reference${total === 1 ? '' : 's'}`);
      setMergeOpen(false); setMergeQuery(''); setMergeResults([]);
      if (selectedId) await loadItems(selectedId);
      countProtocolRefs(accessToken, survivor.kind, survivor.id).then(setRecRefs).catch(() => {});
    } catch (e: any) { toast.error(`Merge failed: ${e?.message || e}`); }
    finally { setMergeBusy(false); }
  }
  async function deleteRecord() {
    if (!viewRec) return;
    const rec = viewRec;
    const others = Math.max(0, (recRefs ?? 1) - 1);
    const warn = others > 0 ? `\n\n⚠ ${others} other protocol item(s) reference this record — they will be left unlinked.` : '';
    if (!window.confirm(`Delete "${rec.name}" (${rec.kind})?\n\nThe link on this item is cleared and the catalog record is permanently deleted.${warn}\n\nThis cannot be undone.`)) return;
    setRecBusy(true);
    try {
      const it = items.find((x) => x.id === rec.itemId);
      if (it) await updateProtocolItem(accessToken, it.id, linkPatch(null, null));
      await deleteCatalogRecord(accessToken, rec.kind, rec.id);
      toast.success('Record deleted');
      setViewRec(null);
      if (selectedId) await loadItems(selectedId);
    } catch (e: any) { toast.error(`Delete failed: ${e?.message || e}`); }
    finally { setRecBusy(false); }
  }

  const linkBtnStyle: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: C.sub, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 4px' };
  const thumb = (img: string | null) => (
    <span style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: C.panel, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Link2 size={13} color={C.faint} />}
    </span>
  );
  // cadence editor — daily / weekly (days) / every N days / monthly / once (date)
  function RepeatRow({ it }: { it: AdminProtocolItem }) {
    const rt = it.recurrence_type || 'daily';
    const mini: React.CSSProperties = { width: 56, padding: '5px 6px', fontSize: 12, border: '1px solid ' + C.hair, borderRadius: 7, color: C.ink, background: C.paper, outline: 'none' };
    return (
      <div style={{ marginTop: 6, marginLeft: 14, paddingLeft: 10, borderLeft: '2px dashed ' + C.hair, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}><Repeat size={12} /> Repeat</span>
        <IconSelect value={rt} options={REPEAT_OPTS} onChange={(t) => setRecurType(it, t)} width={148} />
        {rt === 'weekly' && (
          <div style={{ display: 'flex', gap: 4 }}>
            {DOW.map((lbl, d) => {
              const on = (it.recurrence_days_of_week || []).includes(d);
              return (
                <button key={d} onClick={() => toggleDow(it, d)} title={lbl}
                  style={{ width: 26, height: 26, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + (on ? C.accent : C.hair), background: on ? 'var(--sb-brand-soft)' : 'var(--sb-panel)', color: on ? C.accent : C.sub }}>{lbl[0]}</button>
              );
            })}
          </div>
        )}
        {rt === 'custom' && (
          <span style={{ fontSize: 12, color: C.sub, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            every
            <input type="number" min={1} value={it.recurrence_interval_days ?? 2}
              onChange={(e) => editItemLocal(it.id, { recurrence_interval_days: e.target.value === '' ? null : Math.max(1, parseInt(e.target.value) || 1) })}
              onBlur={() => commitItem(it.id, ['recurrence_interval_days'])} style={mini} />
            days
          </span>
        )}
        {rt === 'one_off' && (
          <input type="date" value={it.scheduled_date || ''}
            onChange={(e) => editItemLocal(it.id, { scheduled_date: e.target.value || null })}
            onBlur={() => commitItem(it.id, ['scheduled_date'])} style={{ ...mini, width: 148 }} />
        )}
        {rt === 'monthly' && <span style={{ fontSize: 11, color: C.faint }}>same day each month</span>}
      </div>
    );
  }
  function CatalogLinker({ it }: { it: AdminProtocolItem }) {
    const link = linkInfo.get(it.id);
    const open = linkerItemId === it.id;
    const slot = itemMealSlot(it);
    const suggesting = open && slot && linkKind === 'recipe' && !linkQuery.trim();
    return (
      <div style={{ marginTop: 6, marginLeft: 14, paddingLeft: 10, borderLeft: '2px dashed ' + C.hair }}>
        {link ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={() => link && openRecord(link, it.id)} title={`Open ${link.kind} record`} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex' }}>
              {thumb(link.image)}
            </button>
            <button type="button" onClick={() => link && openRecord(link, it.id)} title={`Open ${link.kind} record`}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150, textAlign: 'left' }}>{link.name}</button>
            <span style={{ fontSize: 11.5, fontWeight: 700, borderRadius: 4, padding: '2px 5px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', ...kindChip(link.kind) }}>{link.kind}</span>
            {link.kind === 'product' && (link.price != null || link.buyUrl) && (
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.good, whiteSpace: 'nowrap' }}>
                {link.price != null ? `$${link.price}` : ''}{link.buyUrl ? (link.price != null ? ' · Buy ↗' : 'Buy ↗') : ''}
              </span>
            )}
            <button onClick={() => link && setViewRec({ ...link, itemId: it.id })} title="Merge / delete record" style={linkBtnStyle}><GitMerge size={13} /></button>
            <button onClick={() => openLinker(it)} style={linkBtnStyle}>change</button>
            <button onClick={() => unlinkItem(it)} title="Unlink" style={{ ...linkBtnStyle, color: C.danger }}><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => openLinker(it)} style={{ ...linkBtnStyle, color: C.accent }}><Link2 size={12} /> Link {defaultKind(it)}…</button>
        )}
        {open && (
          <div style={{ marginTop: 6, padding: 8, border: '1px solid ' + C.hair, borderRadius: 8, background: 'var(--sb-panel)' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <IconSelect value={linkKind} options={LINK_OPTS} width={132}
                onChange={(k) => { setLinkKind(k as CatalogKind); runSearch(k as CatalogKind, linkQuery, it); }} />
              <input value={linkQuery} onChange={(e) => { setLinkQuery(e.target.value); runSearch(linkKind, e.target.value, it); }}
                placeholder={slot && linkKind === 'recipe' ? `Suggest ${slot} recipes — or type to search…` : 'Search catalog…'} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => setLinkerItemId(null)} style={{ ...linkBtnStyle }}>close</button>
            </div>
            {suggesting && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: C.good, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                <Sparkles size={12} /> Suggested for {slot}
              </div>
            )}
            {linkBusy ? (
              <div style={{ padding: 12, textAlign: 'center', color: C.faint }}><Loader2 size={16} className="animate-spin" style={{ display: 'inline' }} /></div>
            ) : linkResults.length === 0 ? (
              <div style={{ fontSize: 12, color: C.faint, padding: 8, textAlign: 'center' }}>No matches</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                {linkResults.map((h) => (
                  <button key={h.id} onClick={() => linkItemTo(it, linkKind, h)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, border: '1px solid ' + C.hair, borderRadius: 6, background: 'var(--sb-panel)', cursor: 'pointer', textAlign: 'left' }}>
                    {thumb(h.image)}
                    <span style={{ fontSize: 12.5, color: C.ink, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
                    {h.healthScore != null && (
                      <span title="Health score" style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: C.good, background: C.goodBg, border: '1px solid ' + C.goodBorder, borderRadius: 999, padding: '1px 6px' }}>{h.healthScore}</span>
                    )}
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
        {/* horizontal controls — wraps within the column so nothing overhangs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: it.kind === 'rule_dont' ? 'rgba(239,68,68,0.14)' : 'var(--sb-brand-soft)', color: it.kind === 'rule_dont' ? C.danger : C.accent }}>{num ?? '·'}</span>
          {(() => {
            const lk = linkInfo.get(it.id);
            return lk?.image ? (
              <button type="button" onClick={() => openRecord(lk, it.id)} title={`Open ${lk.kind}: ${lk.name}`}
                style={{ width: 30, height: 30, borderRadius: 7, overflow: 'hidden', border: '1px solid ' + C.hair, padding: 0, cursor: 'pointer', flexShrink: 0, background: C.panel }}>
                <img src={lk.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ) : null;
          })()}
          <input
            value={it.display_name || ''}
            onChange={(e) => editItemLocal(it.id, { display_name: e.target.value })}
            onBlur={() => commitItem(it.id, ['display_name'])}
            style={{ ...inputStyle, flex: '1 1 150px', minWidth: 120, width: 'auto', textDecoration: it.hidden ? 'line-through' : 'none' }}
          />
          {!isRule && (
            <input type="time" value={toTimeInput(it.scheduled_time)}
              onChange={(e) => editItemLocal(it.id, { scheduled_time: e.target.value ? `${e.target.value}:00` : null })}
              onBlur={() => commitItem(it.id, ['scheduled_time'])}
              style={{ ...inputStyle, width: 96, flexShrink: 0, padding: '7px 6px' }} />
          )}
          {!isRule ? (
            <>
              <span title={`Stored type: item_type="${it.item_type || 'null'}", category="${it.category || 'none'}". Change it with the dropdown →`}
                style={{ fontSize: 11.5, fontWeight: 700, fontFamily: 'ui-monospace, monospace', borderRadius: 4, padding: '2px 5px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', ...kindChip(it.item_type) }}>
                {it.item_type || '—'}
              </span>
              <IconSelect value={primaryTypeOf(it)} options={TYPE_OPTS} onChange={(t) => setPrimaryType(it, t)} width={116} />
              {subOpts2.length > 1 && (
                <IconSelect value={it.subtype || subOpts2[0].value} options={subOpts2} onChange={(s) => commitField(it, { subtype: s })} width={104} />
              )}
              {cat === 'do' && (
                <IconSelect value={curVerb} options={VERB_OPTS} onChange={(v) => setVerb(it, v)} width={92} placeholder="+ verb" />
              )}
              {cat === 'consume' && (
                <IconSelect value={it.group_name || 'none'} options={SLOT_OPTS} width={104}
                  placeholder={it.group_name || 'No slot'}
                  onChange={(g) => commitField(it, { group_name: g === 'none' ? null : g })} />
              )}
              {cycleLen > 1 && (
                <select value={it.day_number == null ? '' : String(it.day_number)}
                  title="Which cycle day this step belongs to (empty = every day)"
                  onChange={(e) => commitField(it, { day_number: e.target.value === '' ? null : Number(e.target.value) })}
                  style={{ ...inputStyle, width: 88, flexShrink: 0, padding: '7px 4px' }}>
                  <option value="">Every day</option>
                  {Array.from({ length: cycleLen }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d}</option>)}
                </select>
              )}
            </>
          ) : (
            <>
              <IconSelect value={it.scope || 'none'} options={SCOPE_OPTS} onChange={(s) => commitField(it, { scope: s === 'none' ? null : s })} width={116} />
              <button onClick={() => moveRule(it, -1)} disabled={busyItem === it.id} title="Move up" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 3, color: C.sub, flexShrink: 0, display: 'inline-flex' }}>
                <ChevronUp size={14} />
              </button>
              <button onClick={() => moveRule(it, 1)} disabled={busyItem === it.id} title="Move down" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 3, color: C.sub, flexShrink: 0, display: 'inline-flex' }}>
                <ChevronDown size={14} />
              </button>
            </>
          )}
          {/* action icons stay grouped (never split across a wrap) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, marginLeft: 'auto' }}>
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
        </div>
        {it.kind === 'action' && it.category !== 'sleep' && <RepeatRow it={it} />}
        {it.kind === 'action' && it.category !== 'sleep' && <CatalogLinker it={it} />}
        {kids.length > 0 && (
          <div style={{ marginTop: 6, marginLeft: 14, paddingLeft: 10, borderLeft: '2px solid ' + C.hair, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {kids.map((k) => <ChildRow key={k.id} k={k} />)}
          </div>
        )}
      </div>
    );
  }

  // "+ Add step" with a type/meal-slot picker so a new step is born correctly
  // shaped (and meal slots open the recipe suggester immediately). Rules keep the
  // plain button — they have no catalog type.
  function AddStepMenu() {
    const [open, setOpen] = useState(false);
    const addBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + C.accent, background: 'var(--sb-panel)', color: C.accent };
    if (kindTab !== 'action') {
      return (
        <button onClick={() => addItem(kindTab)} disabled={adding} style={addBtn}>
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add {kindTab === 'rule_do' ? 'do' : "don't"}
        </button>
      );
    }
    const hdr: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '7px 8px 3px' };
    const item: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', fontSize: 12.5, color: C.ink, background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left' };
    const pick = (preset?: AddPreset) => { setOpen(false); addItem('action', undefined, preset); };
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen((o) => !o)} disabled={adding} style={addBtn}>
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add step <ChevronDown size={13} />
        </button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 41, width: 220, background: 'var(--sb-panel)', border: '1px solid ' + C.hair, borderRadius: 10, boxShadow: '0 14px 30px -10px rgba(0,0,0,0.3)', padding: 6, maxHeight: 380, overflowY: 'auto' }}>
              <div style={hdr}>Meal slots</div>
              {MEAL_PRESETS.map((m) => (
                <button key={m.label} onClick={() => pick(m.preset)} style={item}>
                  <m.Icon size={14} color={m.color} style={{ flexShrink: 0 }} /> {m.label}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: C.faint }}>{toTimeInput(m.preset.scheduled_time || null)}</span>
                </button>
              ))}
              <div style={hdr}>Add by type</div>
              {TYPE_OPTS.map((t) => (
                <button key={t.value} onClick={() => pick({ type: t.value })} style={item}>
                  {t.Icon && <t.Icon size={14} color={t.color} style={{ flexShrink: 0 }} />} {t.label}
                </button>
              ))}
              <button onClick={() => pick()} style={{ ...item, color: C.sub, marginTop: 2, borderTop: '1px solid ' + C.hair, borderRadius: 0 }}>
                <Plus size={14} style={{ flexShrink: 0 }} /> Blank step
              </button>
            </div>
          </>
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
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--sb-panel)', borderRadius: 14, overflow: 'hidden', maxWidth: 420, width: '100%', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)' }}>
            {viewRec.image
              ? <img src={viewRec.image} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block', background: C.panel }} />
              : <div style={{ height: 160, background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.faint, fontSize: 13 }}>{linkBusy ? <Loader2 size={20} className="animate-spin" /> : 'No image on this record yet'}</div>}
            <div style={{ padding: 16, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {viewRec.kind}{viewRec.price != null ? ` · $${viewRec.price}` : ''}
                  {recRefs != null && <span style={{ marginLeft: 8, color: C.faint, textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>· used by {recRefs} item{recRefs === 1 ? '' : 's'}</span>}
                </div>
                <button onClick={() => setViewRec(null)} title="Close" style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.faint, display: 'inline-flex', padding: 2 }}><X size={18} /></button>
              </div>

              {/* edit name */}
              <div style={{ marginTop: 10 }}>
                <label style={labelStyle}><Pencil size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />Record name</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={recName} onChange={(e) => setRecName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveRecName(); }} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={saveRecName} disabled={recBusy || !recName.trim() || recName.trim() === viewRec.name}
                    style={{ fontSize: 13, fontWeight: 600, padding: '0 14px', borderRadius: 8, cursor: recBusy ? 'default' : 'pointer', border: '1px solid ' + (recName.trim() && recName.trim() !== viewRec.name ? C.accent : C.hair), background: recName.trim() && recName.trim() !== viewRec.name ? C.accent : C.panel, color: recName.trim() && recName.trim() !== viewRec.name ? '#fff' : C.faint, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {recBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                  </button>
                </div>
              </div>

              {/* primary actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: linkBusy ? 'default' : 'pointer', border: '1px solid ' + C.accent, background: C.accent, color: 'var(--sb-panel)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {linkBusy ? 'Uploading…' : viewRec.image ? 'Replace image' : 'Upload image'}
                  <input type="file" accept="image/*" disabled={linkBusy} style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (f) uploadLinkedImage(f); }} />
                </label>
                <button onClick={() => setMergeOpen((o) => { const n = !o; if (n && !mergeResults.length) runMergeSearch(''); return n; })}
                  style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + (mergeOpen ? C.accent : C.hair), background: mergeOpen ? 'var(--sb-brand-soft)' : 'var(--sb-panel)', color: mergeOpen ? C.accent : C.sub, display: 'inline-flex', alignItems: 'center', gap: 6 }}><GitMerge size={14} /> Merge duplicate</button>
                <button onClick={() => { const it = items.find((x) => x.id === viewRec.itemId); setViewRec(null); if (it) openLinker(it); }}
                  style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + C.hair, background: 'var(--sb-panel)', color: C.sub, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Link2 size={14} /> Change link</button>
                {viewRec.buyUrl && <a href={viewRec.buyUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, border: '1px solid ' + C.hair, color: C.good, textDecoration: 'none' }}>Buy ↗</a>}
                <button onClick={deleteRecord} disabled={recBusy}
                  style={{ fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: recBusy ? 'default' : 'pointer', border: '1px solid ' + C.danger, background: 'var(--sb-panel)', color: C.danger, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} /> Delete</button>
              </div>

              {/* merge panel — fold another record of the same kind into this one */}
              {mergeOpen && (
                <div style={{ marginTop: 14, padding: 12, border: '1px solid ' + C.hair, borderRadius: 10, background: C.panel }}>
                  <div style={{ fontSize: 12, color: C.sub, marginBottom: 8, display: 'flex', gap: 6 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1, color: C.accent }} />
                    <span>Pick a duplicate to fold <strong>into “{viewRec.name}”</strong>. Its links + recipe↔ingredient junctions move here, then it’s deleted.</span>
                  </div>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <Search size={14} color={C.faint} style={{ position: 'absolute', left: 9, top: 9 }} />
                    <input value={mergeQuery} onChange={(e) => { setMergeQuery(e.target.value); runMergeSearch(e.target.value); }} placeholder={`Search ${viewRec.kind}s…`} style={{ ...inputStyle, paddingLeft: 28 }} />
                  </div>
                  {mergeBusy ? (
                    <div style={{ padding: 12, textAlign: 'center', color: C.faint }}><Loader2 size={16} className="animate-spin" style={{ display: 'inline' }} /></div>
                  ) : mergeResults.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.faint, padding: 8, textAlign: 'center' }}>No other {viewRec.kind}s found</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                      {mergeResults.map((h) => (
                        <button key={h.id} onClick={() => doMerge(h)} disabled={mergeBusy}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, border: '1px solid ' + C.hair, borderRadius: 6, background: 'var(--sb-panel)', cursor: 'pointer', textAlign: 'left' }}>
                          {thumb(h.image)}
                          <span style={{ fontSize: 12.5, color: C.ink, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, display: 'inline-flex', alignItems: 'center', gap: 3 }}><GitMerge size={12} /> merge in</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
          {/* gender · category · type filters */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <select value={fGender} onChange={(e) => setFGender(e.target.value)} style={filterSel} title="Filter by target gender">
              <option value="">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unspecified">Unspecified</option>
            </select>
            <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} style={filterSel} title="Filter by category">
              <option value="">All categories</option>
              {categoryOpts.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={fType} onChange={(e) => setFType(e.target.value)} style={filterSel} title="Filter by type">
              <option value="">All types</option>
              {typeOpts.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* review-the-rest: jump to protocols still missing a cover image */}
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setFNoCover((v) => !v)}
              title="Show only protocols with no cover image"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                border: '1px solid ' + (fNoCover ? C.accent : C.hair),
                background: fNoCover ? 'var(--sb-brand-soft)' : 'var(--sb-panel)',
                color: fNoCover ? C.accent : (missingCovers ? C.ink : C.faint),
              }}
            >
              <ImageOff size={13} /> Needs cover ({missingCovers})
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: C.faint }}>
              {filtered.length} of {protocols.length}
              {filtersActive && (
                <button onClick={() => { setQuery(''); setFGender(''); setFCategory(''); setFType(''); setFNoCover(false); }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.accent, fontSize: 11, marginLeft: 8, padding: 0 }}>Clear</button>
              )}
            </span>
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
                onClick={() => selectProtocol(p.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px', cursor: 'pointer',
                  border: 'none', borderBottom: '1px solid ' + C.hair,
                  background: on ? 'var(--sb-brand-soft)' : 'transparent',
                  borderLeft: `3px solid ${on ? C.accent : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: C.panel, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 13, fontWeight: 700, color: C.faint }}>{(p.name || '?').charAt(0)}</span>}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>Protocol details</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* export / import round-trip */}
                    <input ref={importInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (f) importProtocol(f); }} />
                    <button onClick={downloadPdf} disabled={pdfBusy} title="Download a printable black-&-white weekly habit tracker PDF (instructions + recipes) to share with users"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: pdfBusy ? 'default' : 'pointer', border: '1px solid ' + C.ink, background: C.ink, color: 'var(--sb-panel)', opacity: pdfBusy ? 0.7 : 1 }}>
                      {pdfBusy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
                    </button>
                    <button onClick={exportProtocol} title="Download this protocol + steps as JSON"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + C.hair, background: 'var(--sb-panel)', color: C.sub }}>
                      <Download size={14} /> Export
                    </button>
                    <button onClick={() => importInputRef.current?.click()} disabled={importing} title="Replace this protocol from an edited JSON export"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: importing ? 'default' : 'pointer', border: '1px solid ' + C.hair, background: 'var(--sb-panel)', color: C.sub, opacity: importing ? 0.7 : 1 }}>
                      {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import
                    </button>
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
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Name"><input style={inputStyle} value={form.name || ''} onChange={(e) => setField('name', e.target.value)} /></Field>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Description">
                      <MarkdownField value={form.description || ''} onChange={(v) => setField('description', v)} minHeight={120} />
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
                    {/* AI cover — one global template: generate a clean emblem, then
                        frame it square-in-square on a blurred copy of itself (app-icon
                        look) via composeAppIconCover. Prompt is prefilled but editable. */}
                    <div style={{ marginTop: 8, border: '1px solid ' + C.goodBorder, background: C.goodBg, borderRadius: 10, padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.good, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <Sparkles size={12} /> AI cover · global template
                        </span>
                        {coverPrompt !== null && (
                          <button type="button" onClick={() => setCoverPrompt(null)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.faint, fontSize: 11, padding: 0 }}>
                            reset to template
                          </button>
                        )}
                      </div>
                      <textarea
                        value={effectiveCoverPrompt}
                        disabled={aiBusy}
                        rows={3}
                        onChange={(e) => setCoverPrompt(e.target.value)}
                        placeholder="Describe the cover to generate…"
                        style={{ width: '100%', fontSize: 12, lineHeight: 1.45, color: C.ink, border: '1px solid ' + C.hair, borderRadius: 8, background: C.paper, padding: '7px 9px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        <button type="button" onClick={generateCover} disabled={aiBusy || !effectiveCoverPrompt.trim()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 8, cursor: aiBusy || !effectiveCoverPrompt.trim() ? 'default' : 'pointer', border: '1px solid ' + C.good, background: C.good, color: '#fff', opacity: aiBusy || !effectiveCoverPrompt.trim() ? 0.6 : 1 }}>
                          {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          {aiBusy ? 'Working…' : (form.image_url ? 'Regenerate cover' : 'Generate cover')}
                        </button>
                        {form.image_url && (
                          <button type="button" onClick={frameCurrentCover} disabled={aiBusy}
                            title="Re-frame the current image into the app-icon template (square-in-square + blurred background)"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: aiBusy ? 'default' : 'pointer', border: '1px solid ' + C.goodBorder, background: 'var(--sb-panel)', color: C.good, opacity: aiBusy ? 0.6 : 1 }}>
                            <ImageIcon size={14} /> Frame as app icon
                          </button>
                        )}
                        <span style={{ fontSize: 11, color: C.faint }}>Square-in-square, blurred background · applied to every cover</span>
                      </div>
                    </div>
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
                      const count = items.filter((i) => i.kind === k && !i.parent_protocol_item_id
                        && (k !== 'action' || cycleLen <= 1 || showsOnDay(i, viewDay))).length;
                      return (
                        <button key={k} onClick={() => setKindTab(k)}
                          style={{ fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + (on ? C.accent : C.hair), background: on ? 'var(--sb-brand-soft)' : 'var(--sb-panel)', color: on ? C.accent : C.sub }}>
                          {label} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <AddStepMenu />
                </div>
                {/* Day strip — one cycle day at a time (like the app's day_number cycling) */}
                {kindTab === 'action' && cycleLen > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.sub }}>
                      <CalendarDays size={13} /> Day
                    </span>
                    {Array.from({ length: cycleLen }, (_, i) => i + 1).map((d) => {
                      const on = viewDay === d;
                      const n = allDayItems.filter((i) => showsOnDay(i, d)).length;
                      return (
                        <button key={d} onClick={() => setViewDay(d)} title={`${n} steps on day ${d}`}
                          style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, fontSize: 12.5, fontWeight: 700, padding: '5px 11px', borderRadius: 999, cursor: 'pointer', border: '1px solid ' + (on ? C.ink : C.hair), background: on ? C.ink : 'var(--sb-panel)', color: on ? '#fff' : C.sub }}>
                          {d}<span style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.65 }}>{n}</span>
                        </button>
                      );
                    })}
                    {totalDaysMissing && (
                      <button onClick={fixTotalDays}
                        title="Items carry day numbers but the protocol has no total_days — without it the app can't cycle and shows every day at once."
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#B45309', padding: '5px 9px', borderRadius: 8, border: '1px solid #FCD34D', background: 'rgba(245,158,11,0.12)', cursor: 'pointer', marginLeft: 4 }}>
                        <AlertCircle size={12} /> App shows all days at once — set total days = {cycleLen}
                      </button>
                    )}
                  </div>
                )}
                {/* Sleep & wake window — book-ends the day for every protocol (like the app) */}
                {kindTab === 'action' && (
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 16px', padding: '10px 12px', marginBottom: 12, borderRadius: 10, border: '1px solid ' + C.hair, background: C.panel }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.sub }}>
                      <Moon size={14} color="#5C6B7A" /> Sleep & wake
                    </span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.sub }}>
                      Wake
                      <input type="time" value={toTimeInput(wakeItem?.scheduled_time || null)} onChange={(e) => setAnchor('wake', e.target.value)}
                        style={{ ...inputStyle, width: 110, padding: '6px 8px' }} />
                      <span style={{ fontSize: 11.5, color: C.faint }}>End&nbsp;Sleep</span>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.sub }}>
                      Bedtime
                      <input type="time" value={toTimeInput(bedItem?.scheduled_time || null)} onChange={(e) => setAnchor('bed', e.target.value)}
                        style={{ ...inputStyle, width: 110, padding: '6px 8px' }} />
                      <span style={{ fontSize: 11.5, color: C.faint }}>Start&nbsp;Sleep</span>
                    </label>
                    {sleepWin.durationLabel && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--sb-text-soft)', padding: '4px 9px', borderRadius: 999, background: 'var(--sb-panel-soft)' }}>
                        <Moon size={12} color="#5C6B7A" /> {sleepWin.durationLabel} sleep
                      </span>
                    )}
                    <span style={{ flex: 1 }} />
                    {extraAnchors.length > 0 ? (
                      <button onClick={cleanupAnchors} disabled={busyItem === 'anchor-cleanup'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: C.danger, padding: '5px 9px', borderRadius: 8, border: '1px solid #FCA5A5', background: 'rgba(239,68,68,0.08)', cursor: 'pointer' }}>
                        {busyItem === 'anchor-cleanup' ? <Loader2 size={12} className="animate-spin" /> : <AlertCircle size={12} />} Remove {extraAnchors.length} duplicate anchor{extraAnchors.length === 1 ? '' : 's'}
                      </button>
                    ) : (!wakeItem && derivedWake) ? (
                      <button onClick={linkAnchorsToSchedule} disabled={!!busyItem}
                        title={`Pin wake (End Sleep) to your first step at ${derivedWake}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: C.accent, padding: '5px 9px', borderRadius: 8, border: '1px solid #BFDBFE', background: 'var(--sb-brand-soft)', cursor: 'pointer' }}>
                        <Link2 size={12} /> Link wake to first step ({derivedWake})
                      </button>
                    ) : (
                      <span style={{ fontSize: 11.5, color: C.faint, maxWidth: 240 }}>
                        {wakeItem || bedItem ? 'Pins the day’s start/end.' : 'Not set — app shows 6:00 AM / 10:00 PM. Set a time to pin it (e.g. 4:00 for Goggins).'}
                      </span>
                    )}
                  </div>
                )}
                {loadingItems ? (
                  <div style={{ padding: 24, textAlign: 'center', color: C.faint }}><Loader2 size={18} className="animate-spin" style={{ display: 'inline' }} /></div>
                ) : (() => {
                  const tops = items.filter((i) => i.kind === kindTab && !i.parent_protocol_item_id
                    && (kindTab !== 'action' || cycleLen <= 1 || showsOnDay(i, viewDay)));
                  if (!tops.length) return <div style={{ padding: 24, textAlign: 'center', color: C.faint, fontSize: 13 }}>Nothing here yet — add the first one.</div>;

                  // group helper
                  const group = (list: AdminProtocolItem[], keyOf: (i: AdminProtocolItem) => string) => {
                    const m = new Map<string, AdminProtocolItem[]>();
                    for (const it of list) { const k = keyOf(it); if (!m.has(k)) m.set(k, []); m.get(k)!.push(it); }
                    return m;
                  };
                  // timeline order: WAKE anchors first, BEDTIME anchors last, everything
                  // else by clock time (so an 08:00 "End Sleep" can't jump ahead of 04:xx).
                  const anchorKey = (it: AdminProtocolItem) => {
                    const n = it.display_name || '';
                    const t = minutesOf(it.scheduled_time);
                    if (isWakeName(n)) return -1e7 + t;
                    if (isBedName(n)) return 1e7 + t;
                    return t;
                  };
                  const sorted = [...tops].sort((a, b) => anchorKey(a) - anchorKey(b));
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
                items={cycleLen > 1
                  ? items.filter((i) => i.parent_protocol_item_id != null || (i.kind && i.kind !== 'action') || showsOnDay(i, viewDay))
                  : items}
                imageUrl={form.image_url || selected.image_url}
                linkImages={new Map([...linkInfo].filter(([, v]) => v.image).map(([id, v]) => [id, v.image as string]))}
              />
              <p style={{ fontSize: 11, fontStyle: 'italic', color: C.faint, margin: 0, textAlign: 'center', maxWidth: 280 }}>
                Live preview — the home screen as it appears in the mobile app{cycleLen > 1 ? ` (day ${viewDay} of ${cycleLen})` : ''}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
