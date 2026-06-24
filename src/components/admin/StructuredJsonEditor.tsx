import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Generic structured editor for JSON-shaped fields — built for NON-CODERS.
 *
 * Lists of text render as chips, lists of objects render as labelled cards,
 * nested objects render as labelled key/value rows. The expected shape is
 * inferred from the existing value, or (when empty) from the field's example
 * placeholder — so an empty field shows the right friendly editor instead of a
 * raw-JSON example and an "Add Object / Add List" choice.
 *
 * A "Code" toggle still exposes the raw JSON for power users.
 */

interface StructuredJsonEditorProps {
  value: any;
  onChange: (val: any) => void;
  label?: string;
  placeholder?: string;
  fieldType?: string;
}

const humanize = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const singular = (s?: string) => (s ? s.replace(/\s+/g, ' ').trim().replace(/s$/i, '') : 'Entry');

function tryParse(v: any): any {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
  if (typeof v === 'object') return v;
  return null;
}

type Shape =
  | { kind: 'string-array' }
  | { kind: 'object-array'; example: Record<string, any> }
  | { kind: 'object'; example: Record<string, any> }
  | { kind: 'unknown' };

function shapeOf(v: any): Shape {
  if (Array.isArray(v)) {
    if (v.length === 0) return { kind: 'unknown' };
    if (v.every((x) => typeof x === 'string' || typeof x === 'number')) return { kind: 'string-array' };
    if (typeof v[0] === 'object' && v[0] !== null) return { kind: 'object-array', example: v[0] };
    return { kind: 'string-array' };
  }
  if (v && typeof v === 'object') return { kind: 'object', example: v };
  return { kind: 'unknown' };
}

/* ── single scalar editor ── */
function ScalarEditor({ value, onChange, placeholder }: { value: any; onChange: (v: any) => void; placeholder?: string }) {
  if (typeof value === 'boolean') {
    return (
      <button type="button" onClick={() => onChange(!value)}
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {value ? 'Yes' : 'No'}
      </button>
    );
  }
  if (typeof value === 'number') {
    return (
      <input type="number" value={value} onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white" />
    );
  }
  if (typeof value === 'string' && value.length > 80) {
    return (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white min-h-[44px] resize-y" />
    );
  }
  return (
    <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white" />
  );
}

/* ── list of text values → chips ── */
function StringArrayEditor({ items, onChange, placeholder }: { items: any[]; onChange: (v: any[]) => void; placeholder?: string }) {
  const [newItem, setNewItem] = useState('');
  const add = () => { if (newItem.trim()) { onChange([...items, newItem.trim()]); setNewItem(''); } };
  return (
    <div className="space-y-1.5">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-100">
              <input value={String(item)} onChange={(e) => { const u = [...items]; u[idx] = e.target.value; onChange(u); }}
                className="bg-transparent border-0 text-xs p-0 focus:ring-0 text-blue-800" style={{ width: `${Math.max(String(item).length * 7, 32)}px` }} />
              <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))}
                className="text-blue-300 hover:text-red-500 text-sm leading-none" title="Remove">&times;</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder || 'Type and press Enter…'}
          className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white" />
        <button type="button" onClick={add} disabled={!newItem.trim()}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-30 px-2 py-1.5 rounded-md bg-blue-50 border border-blue-200">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </div>
  );
}

/* ── list of objects → labelled cards (one card per entry, one labelled input per field) ── */
function ObjectArrayEditor({ items, onChange, example, itemLabel }: { items: any[]; onChange: (v: any[]) => void; example?: Record<string, any>; itemLabel?: string }) {
  // column set: union of existing keys, else the example's keys
  const keys = items.length
    ? Array.from(new Set(items.flatMap((it) => Object.keys(it || {}))))
    : Object.keys(example || {});
  const blankRow = () => {
    const row: Record<string, any> = {};
    const src = Object.keys(example || {}).length ? example! : (items[0] || {});
    for (const k of (Object.keys(src).length ? Object.keys(src) : keys)) {
      const t = typeof (src as any)[k];
      row[k] = t === 'number' ? 0 : t === 'boolean' ? false : '';
    }
    return row;
  };
  const setCell = (idx: number, k: string, v: any) => { const u = [...items]; u[idx] = { ...u[idx], [k]: v }; onChange(u); };
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50/60 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{singular(itemLabel)} {idx + 1}</span>
            <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))} title="Remove"
              className="text-gray-300 hover:text-red-500 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {keys.map((k) => (
              <label key={k} className="block">
                <span className="block text-[10px] text-gray-500 font-medium mb-0.5">{humanize(k)}</span>
                <ScalarEditor value={item?.[k] ?? ''} onChange={(v) => setCell(idx, k, v)} />
              </label>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, blankRow()])}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1.5 rounded-md bg-blue-50 border border-blue-200">
        <Plus className="w-3 h-3" /> Add {singular(itemLabel).toLowerCase()}
      </button>
    </div>
  );
}

/* ── nested object → labelled key/value rows ── */
function ObjectEditor({ data, onChange, depth = 0 }: { data: Record<string, any>; onChange: (v: any) => void; depth?: number }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const keys = Object.keys(data);
  const updateKey = (key: string, val: any) => onChange({ ...data, [key]: val });
  const removeKey = (key: string) => { const next = { ...data }; delete next[key]; onChange(next); };

  return (
    <div className={`space-y-1.5 ${depth > 0 ? 'pl-3 border-l-2 border-gray-100' : ''}`}>
      {keys.map((key) => {
        const val = data[key];
        const isArray = Array.isArray(val);
        const isStringArray = isArray && val.every((v: any) => typeof v === 'string' || typeof v === 'number');
        const isObjArray = isArray && val.length > 0 && typeof val[0] === 'object';
        const isObj = !isArray && typeof val === 'object' && val !== null;
        const isCollapsed = collapsed[key];

        if (isObj || (isArray && !isStringArray)) {
          return (
            <div key={key} className="rounded-lg border border-gray-200 overflow-hidden">
              <button type="button" onClick={() => setCollapsed({ ...collapsed, [key]: !isCollapsed })}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100">
                <span className="text-xs font-semibold text-gray-600">{humanize(key)}{isArray && <span className="ml-1 font-normal text-gray-400">({val.length})</span>}</span>
                {isCollapsed ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronUp className="w-3 h-3 text-gray-400" />}
              </button>
              {!isCollapsed && (
                <div className="px-2.5 py-2 bg-white">
                  {isObjArray ? <ObjectArrayEditor items={val} onChange={(v) => updateKey(key, v)} itemLabel={key} />
                    : isArray ? <StringArrayEditor items={val} onChange={(v) => updateKey(key, v)} />
                      : <ObjectEditor data={val} onChange={(v) => updateKey(key, v)} depth={depth + 1} />}
                </div>
              )}
            </div>
          );
        }
        return (
          <div key={key} className="flex items-center gap-2 px-0.5">
            <label className="text-xs text-gray-500 font-medium min-w-[110px] truncate" title={key}>{humanize(key)}</label>
            <div className="flex-1">
              {isStringArray ? <StringArrayEditor items={val} onChange={(v) => updateKey(key, v)} /> : <ScalarEditor value={val} onChange={(v) => updateKey(key, v)} />}
            </div>
            <button type="button" onClick={() => removeKey(key)} title="Remove" className="text-gray-200 hover:text-red-500 p-0.5 rounded hover:bg-red-50 flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
          </div>
        );
      })}
    </div>
  );
}

export default function StructuredJsonEditor({ value, onChange, label, placeholder, fieldType }: StructuredJsonEditorProps) {
  const [showRaw, setShowRaw] = useState(false);

  const parsed = useMemo(() => tryParse(value), [value]);
  const example = useMemo(() => tryParse(placeholder), [placeholder]);

  // current shape from the live value; fall back to the example's shape when empty
  const valueEmpty = parsed === null
    || (Array.isArray(parsed) && parsed.length === 0)
    || (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0);
  const shape: Shape = useMemo(() => {
    const s = valueEmpty ? { kind: 'unknown' as const } : shapeOf(parsed);
    if (s.kind !== 'unknown') return s;
    if (example != null) return shapeOf(example);
    return { kind: 'unknown' };
  }, [parsed, example, valueEmpty]);

  const arr: any[] = Array.isArray(parsed) ? parsed : [];
  const obj: Record<string, any> = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
          <button type="button" onClick={() => setShowRaw(!showRaw)}
            className="text-[9px] text-gray-400 hover:text-gray-600 font-medium px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100">
            {showRaw ? 'Done' : 'Code'}
          </button>
        </div>
      )}

      {showRaw ? (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value ?? null, null, 2)}
          onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); } }}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 font-mono bg-gray-50 min-h-[120px] resize-y"
          placeholder={placeholder}
        />
      ) : (
        <div className="border border-gray-200 rounded-xl bg-white p-2.5">
          {shape.kind === 'string-array' && (
            <StringArrayEditor items={arr} onChange={onChange} placeholder="Type and press Enter…" />
          )}
          {shape.kind === 'object-array' && (
            <ObjectArrayEditor items={arr} onChange={onChange} example={shape.example} itemLabel={label} />
          )}
          {shape.kind === 'object' && (
            Object.keys(obj).length > 0
              ? <ObjectEditor data={obj} onChange={onChange} />
              : <SeedObject example={shape.example} onChange={onChange} />
          )}
          {shape.kind === 'unknown' && (
            // no value and no example to infer from — default to a simple text list, the most common case
            <StringArrayEditor items={arr} onChange={onChange} placeholder="Type and press Enter…" />
          )}
        </div>
      )}
    </div>
  );
}

// empty object field: one button that seeds the example's keys with blank values
function SeedObject({ example, onChange }: { example: Record<string, any>; onChange: (v: any) => void }) {
  const seed = () => {
    const row: Record<string, any> = {};
    for (const [k, v] of Object.entries(example || {})) row[k] = typeof v === 'number' ? 0 : typeof v === 'boolean' ? false : '';
    onChange(Object.keys(row).length ? row : {});
  };
  const fields = Object.keys(example || {});
  return (
    <div className="text-center py-3">
      <button type="button" onClick={seed} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-md bg-blue-50 border border-blue-200">
        <Plus className="w-3 h-3" /> Add details
      </button>
      {fields.length > 0 && <p className="text-[10px] text-gray-400 mt-1.5">Fields: {fields.map(humanize).join(', ')}</p>}
    </div>
  );
}
