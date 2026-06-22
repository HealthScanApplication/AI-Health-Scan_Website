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
  Plus, Trash2, Loader2, Search, Save, Check, RefreshCw, AlertCircle, CornerDownRight,
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
  type AdminProtocol, type AdminProtocolItem,
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
function toHomeItems(items: AdminProtocolItem[]): HomeItem[] {
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
      children: childrenByParent.get(it.id),
    }));
}

/* ── live preview — the exact app home screen, fed the saved steps ── */
function PhonePreview({ name, items }: { name: string; items: AdminProtocolItem[] }) {
  return (
    <PhoneFrame width={300} screenBg="#FFFFFF">
      <ProtocolHomeScreen protocolName={name} items={toHomeItems(items)} />
    </PhoneFrame>
  );
}

/* ── small field primitives ── */
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'block' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: 13, color: C.ink, border: '1px solid ' + C.hair, borderRadius: 8, background: C.paper, outline: 'none', boxSizing: 'border-box' };

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

  async function loadItems(id: string) {
    setLoadingItems(true);
    try {
      const rows = await listProtocolItems(accessToken, id);
      setItems(rows);
      baseline.current = new Map(rows.map((r) => [r.id, { ...r }]));
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

  /* ── inline row renderers (closures over items/handlers) ── */
  function ChildRow({ k }: { k: AdminProtocolItem }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CornerDownRight size={13} color={C.faint} style={{ flexShrink: 0 }} />
        <input
          value={k.display_name || ''}
          onChange={(e) => editItemLocal(k.id, { display_name: e.target.value })}
          onBlur={() => commitItem(k.id, ['display_name'])}
          style={{ ...inputStyle, flex: 1, fontSize: 12 }}
        />
        <button onClick={() => removeItem(k)} disabled={busyItem === k.id} title="Delete detail"
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.danger, padding: 5, flexShrink: 0, display: 'inline-flex' }}>
          {busyItem === k.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    );
  }

  function ItemRow({ it }: { it: AdminProtocolItem }) {
    const isRule = it.kind !== 'action';
    const kids = items.filter((x) => x.parent_protocol_item_id === it.id);
    const tint = CATEGORY_TINTS[categorize(catItem(it))];
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 10, border: '1px solid ' + C.hair, background: busyItem === it.id ? C.panel : C.paper }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: it.kind === 'rule_dont' ? C.danger : tint.fg, flexShrink: 0 }} />
          <input
            value={it.display_name || ''}
            onChange={(e) => editItemLocal(it.id, { display_name: e.target.value })}
            onBlur={() => commitItem(it.id, ['display_name'])}
            style={{ ...inputStyle, flex: 1, minWidth: 100 }}
          />
          {!isRule ? (
            <>
              <input type="time" value={toTimeInput(it.scheduled_time)}
                onChange={(e) => editItemLocal(it.id, { scheduled_time: e.target.value ? `${e.target.value}:00` : null })}
                onBlur={() => commitItem(it.id, ['scheduled_time'])}
                style={{ ...inputStyle, width: 100, flexShrink: 0 }} />
              <select value={it.item_type || 'activity'}
                onChange={(e) => editItemLocal(it.id, { item_type: e.target.value })}
                onBlur={() => commitItem(it.id, ['item_type'])}
                style={{ ...inputStyle, width: 108, flexShrink: 0 }}>
                {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </>
          ) : (
            <select value={it.scope || 'none'}
              onChange={(e) => editItemLocal(it.id, { scope: e.target.value === 'none' ? null : e.target.value })}
              onBlur={() => commitItem(it.id, ['scope'])}
              style={{ ...inputStyle, width: 116, flexShrink: 0 }}>
              {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button onClick={() => addItem((it.kind as Kind) || 'action', it.id)} title="Add detail / sub-item"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.sub, padding: 6, flexShrink: 0, display: 'inline-flex' }}>
            <CornerDownRight size={15} />
          </button>
          <button onClick={() => removeItem(it)} disabled={busyItem === it.id} title="Delete"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.danger, padding: 6, flexShrink: 0, display: 'inline-flex' }}>
            {busyItem === it.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
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
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Untitled'}</div>
                <div style={{ fontSize: 11, color: C.faint, marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {p.is_suggested && <span style={{ color: C.accent, fontWeight: 600 }}>Suggested</span>}
                  {p.category && <span>{p.category}</span>}
                </div>
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
                  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{tops.map((it) => <ItemRow key={it.id} it={it} />)}</div>;
                })()}
              </div>
            </div>

            {/* live mobile preview */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'sticky', top: 12 }}>
              <PhonePreview name={form.name || selected.name} items={items} />
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
