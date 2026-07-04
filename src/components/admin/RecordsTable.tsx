/**
 * RecordsTable (DEV-345) — Supabase-table-editor-style grid for editing MANY
 * records fast. Unlike the card list (client-side, first 1000 rows only), this
 * view talks to PostgREST directly with SERVER-SIDE search, sort and paging —
 * so all 12k+ production products are reachable — and edits inline:
 *
 *   • click a cell → edit → Enter/blur commits (Esc cancels), saved through the
 *     same edge endpoint as the card editor (admin/catalog/update)
 *   • select rows → bulk-apply one field's value to all of them
 *
 * Column sets are validated against BOTH environments (a bad column 400s the
 * whole PostgREST select — keep them in sync with the real schemas).
 * Styling comes from the .sb-table layer in adminTheme.css (light/dark aware).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

type ColType = 'text' | 'number' | 'image' | 'ro';
interface Col { key: string; label: string; type?: ColType; w?: number }
interface TableCfg { cols: Col[]; searchCols: string[] }

const PAGE = 100;

// Validated column sets per table (staging + prod, 2026-07-04).
const TABLE_CFG: Record<string, TableCfg> = {
  catalog_elements: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name_common', label: 'Name' }, { key: 'category', label: 'Category', w: 130 }, { key: 'health_role', label: 'Health role', w: 130 }], searchCols: ['name_common'] },
  catalog_ingredients: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name_common', label: 'Name' }, { key: 'category', label: 'Category', w: 150 }, { key: 'processing_type', label: 'Processing', w: 120 }], searchCols: ['name_common'] },
  catalog_recipes: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name_common', label: 'Name' }, { key: 'meal_slot', label: 'Meal slot', w: 110 }, { key: 'health_score', label: 'Score', type: 'number', w: 70 }, { key: 'prep_time', label: 'Prep', w: 80 }], searchCols: ['name_common'] },
  catalog_products: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name_common', label: 'Name' }, { key: 'name_brand', label: 'Brand', w: 150 }, { key: 'category', label: 'Category', w: 160 }, { key: 'health_score', label: 'Score', type: 'number', w: 70 }], searchCols: ['name_common', 'name_brand'] },
  catalog_activities: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category', w: 150 }], searchCols: ['name'] },
  catalog_equipment: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category', w: 150 }], searchCols: ['name'] },
  catalog_cooking_methods: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category', w: 150 }], searchCols: ['name'] },
  catalog_symptoms: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category', w: 130 }, { key: 'body_system', label: 'Body system', w: 130 }, { key: 'severity', label: 'Severity', w: 90 }], searchCols: ['name'] },
  hs_supplements: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }, { key: 'region', label: 'Region', w: 90 }], searchCols: ['name'] },
  hs_products: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }, { key: 'region', label: 'Region', w: 90 }], searchCols: ['name'] },
  hs_tests: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category', w: 130 }], searchCols: ['name'] },
  hs_services: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }], searchCols: ['name'] },
  hs_experts: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }], searchCols: ['name'] },
  hs_packages: { cols: [{ key: 'image_url', label: '', type: 'image', w: 44 }, { key: 'name', label: 'Name' }], searchCols: ['name'] },
};

export function tableSupported(table?: string | null): boolean {
  return !!table && !!TABLE_CFG[table];
}

const rest = () => `https://${projectId}.supabase.co/rest/v1`;

export function RecordsTable({ table, accessToken, initialSearch }: { table: string; accessToken: string; initialSearch?: string }) {
  const cfg = TABLE_CFG[table];
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState(initialSearch || '');
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: cfg?.searchCols[0] || 'id', dir: 'asc' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; col: string } | null>(null);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [failedCells, setFailedCells] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulkCol, setBulkCol] = useState('');
  const [bulkVal, setBulkVal] = useState('');
  const [bulkBusy, setBulkBusy] = useState<{ done: number; total: number } | null>(null);
  const editRef = useRef<HTMLInputElement | null>(null);
  const qDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editableCols = useMemo(() => (cfg?.cols || []).filter((c) => !c.type || c.type === 'text' || c.type === 'number'), [cfg]);

  const load = useCallback(async (pageArg: number, qArg: string, sortArg: { col: string; dir: 'asc' | 'desc' }) => {
    if (!cfg) return;
    setLoading(true); setErr(null);
    try {
      const selectCols = ['id', ...cfg.cols.map((c) => c.key)].join(',');
      let url = `${rest()}/${table}?select=${selectCols}&limit=${PAGE}&offset=${pageArg * PAGE}`
        + `&order=${sortArg.col}.${sortArg.dir}.nullslast`;
      const term = qArg.trim();
      if (term) url += `&or=(${cfg.searchCols.map((c) => `${c}.ilike.*${encodeURIComponent(term)}*`).join(',')})`;
      const doFetch = () => fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, apikey: publicAnonKey, Prefer: 'count=exact' } });
      let res = await doFetch();
      // one retry: cold connections intermittently 500 with a statement timeout
      if (!res.ok) res = await doFetch();
      if (!res.ok) throw new Error(`${res.status} ${await res.text().then((t) => t.slice(0, 120))}`);
      const range = res.headers.get('content-range'); // "0-99/12263"
      setTotal(range?.includes('/') ? parseInt(range.split('/')[1], 10) || 0 : null);
      setRows(await res.json());
    } catch (e: any) {
      setErr(e?.message || String(e)); setRows([]); setTotal(null);
    } finally { setLoading(false); }
  }, [table, accessToken, cfg]);

  // reload on table change / page / sort; debounce search
  useEffect(() => { setPage(0); setSel(new Set()); setQ(initialSearch || ''); }, [table]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page, q, sort); }, [table, page, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (qDebounce.current) clearTimeout(qDebounce.current);
    qDebounce.current = setTimeout(() => { setPage(0); load(0, q, sort); }, 350);
    return () => { if (qDebounce.current) clearTimeout(qDebounce.current); };
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { editRef.current?.focus(); editRef.current?.select(); }, [editing]);

  async function saveCell(id: string, col: Col, raw: string): Promise<boolean> {
    const row = rows.find((r) => r.id === id);
    const value: any = raw === '' ? null : col.type === 'number' ? Number(raw) : raw;
    if (col.type === 'number' && raw !== '' && Number.isNaN(value)) { toast.error('Not a number'); return false; }
    if (row && (row[col.key] ?? '') === (value ?? '')) return true; // no-op
    setSavingRow(id);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/update`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, updates: { [col.key]: value } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [col.key]: value } : r)));
      setFailedCells((f) => { const n = new Set(f); n.delete(`${id}:${col.key}`); return n; });
      return true;
    } catch (e: any) {
      setFailedCells((f) => new Set(f).add(`${id}:${col.key}`));
      toast.error(`Save failed: ${e?.message || e}`);
      return false;
    } finally { setSavingRow(null); }
  }

  async function applyBulk() {
    const col = editableCols.find((c) => c.key === bulkCol);
    if (!col || !sel.size) return;
    if (!window.confirm(`Set ${col.label || col.key} = "${bulkVal}" on ${sel.size} record(s)?`)) return;
    setBulkBusy({ done: 0, total: sel.size });
    let ok = 0, fail = 0;
    for (const id of sel) {
      (await saveCell(id, col, bulkVal)) ? ok++ : fail++;
      setBulkBusy({ done: ok + fail, total: sel.size });
    }
    setBulkBusy(null);
    toast[fail ? 'warning' : 'success'](`${ok} updated${fail ? `, ${fail} failed` : ''}`);
  }

  if (!cfg) return <div className="p-4 text-sm text-gray-500">Table view isn’t available for this tab.</div>;

  const pages = total != null ? Math.max(1, Math.ceil(total / PAGE)) : null;
  const allOnPage = rows.length > 0 && rows.every((r) => sel.has(r.id));

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* toolbar: search · count · pager · refresh */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.searchCols.join('/')}…`}
            className="w-64 rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-sm text-gray-900"
          />
        </div>
        <span className="text-xs text-gray-500">
          {loading ? 'Loading…' : total != null ? `${total ? page * PAGE + 1 : 0}–${page * PAGE + rows.length} of ${total.toLocaleString()}` : ''}
        </span>
        <span className="flex-1" />
        <button type="button" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}
          className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={14} /></button>
        <span className="text-xs text-gray-500">{page + 1}{pages ? ` / ${pages}` : ''}</span>
        <button type="button" disabled={loading || (pages != null && page + 1 >= pages)} onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={14} /></button>
        <button type="button" disabled={loading} onClick={() => load(page, q, sort)}
          className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {/* bulk bar */}
      {sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2 text-sm">
          <span className="font-medium text-gray-700">{sel.size} selected</span>
          <select value={bulkCol} onChange={(e) => setBulkCol(e.target.value)} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900">
            <option value="">Set field…</option>
            {editableCols.map((c) => <option key={c.key} value={c.key}>{c.label || c.key}</option>)}
          </select>
          <input value={bulkVal} onChange={(e) => setBulkVal(e.target.value)} placeholder="Value (empty = clear)"
            className="w-52 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900" />
          <button type="button" disabled={!bulkCol || !!bulkBusy} onClick={applyBulk}
            className="rounded-md bg-gray-900 px-3 py-1 text-sm font-medium text-white disabled:opacity-50">
            {bulkBusy ? `Applying ${bulkBusy.done}/${bulkBusy.total}…` : `Apply to ${sel.size}`}
          </button>
          <button type="button" onClick={() => setSel(new Set())} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"><X size={12} /> Clear</button>
        </div>
      )}

      {err && <div className="border-b border-red-300 bg-red-50 p-2 text-sm text-red-700">{err}</div>}

      <div className="overflow-auto" style={{ maxHeight: '65vh' }}>
        <table className="sb-table">
          <thead>
            <tr>
              <th style={{ width: 34, cursor: 'default' }}>
                <input type="checkbox" checked={allOnPage} onChange={() =>
                  setSel((s) => { const n = new Set(s); rows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id))); return n; })} />
              </th>
              <th style={{ width: 150 }} onClick={() => setSort((s) => ({ col: 'id', dir: s.col === 'id' && s.dir === 'asc' ? 'desc' : 'asc' }))}>id</th>
              {cfg.cols.map((c) => (
                <th key={c.key} style={c.w ? { width: c.w } : undefined}
                  onClick={() => c.type !== 'image' && setSort((s) => ({ col: c.key, dir: s.col === c.key && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                  <span className="inline-flex items-center gap-1">
                    {c.label || (c.type === 'image' ? '🖼' : c.key)}
                    {sort.col === c.key && (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={savingRow === r.id ? { opacity: 0.6 } : undefined}>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={sel.has(r.id)} onChange={() =>
                    setSel((s) => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })} />
                </td>
                <td>
                  <span className="sb-cell sb-cell-ro" title="Copy id" style={{ cursor: 'copy' }}
                    onClick={() => { try { void navigator.clipboard?.writeText(r.id); toast.success('id copied'); } catch { /* noop */ } }}>
                    <Copy size={10} style={{ display: 'inline', marginRight: 5, verticalAlign: '-1px' }} />{r.id}
                  </span>
                </td>
                {cfg.cols.map((c) => {
                  const cellKey = `${r.id}:${c.key}`;
                  if (c.type === 'image') {
                    return (
                      <td key={c.key} style={{ textAlign: 'center' }}>
                        {r[c.key]
                          ? <img src={r[c.key]} alt="" style={{ width: 26, height: 26, borderRadius: 5, objectFit: 'cover', display: 'inline-block', verticalAlign: 'middle' }} />
                          : <span style={{ color: 'var(--sb-text-faint)', fontSize: 10 }}>—</span>}
                      </td>
                    );
                  }
                  const isEditing = editing?.id === r.id && editing.col === c.key;
                  return (
                    <td key={c.key} className={failedCells.has(cellKey) ? 'sb-savefail' : ''}>
                      {isEditing ? (
                        <input
                          ref={editRef} defaultValue={r[c.key] ?? ''} className="sb-cell-input"
                          onBlur={(e) => { setEditing(null); void saveCell(r.id, c, e.target.value); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') { (e.target as HTMLInputElement).value = r[c.key] ?? ''; setEditing(null); }
                          }}
                        />
                      ) : (
                        <span className="sb-cell" title={String(r[c.key] ?? '')} onClick={() => setEditing({ id: r.id, col: c.key })}>
                          {r[c.key] ?? <span style={{ color: 'var(--sb-text-faint)' }}>—</span>}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr><td colSpan={cfg.cols.length + 2} style={{ textAlign: 'center', padding: 24, color: 'var(--sb-text-faint)' }}>No records</td></tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-4 text-center"><Loader2 size={16} className="mx-auto animate-spin text-gray-400" /></div>}
      </div>
    </div>
  );
}

export default RecordsTable;
