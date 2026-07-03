/**
 * CatalogQADashboard (DEV-318) — surfaces the catalog data-quality checks
 * (catalogQaChecks.ts, the TS port of the DEV-323 staging SQL) as an actionable,
 * non-engineer-readable view: counts per check + drill-down to offending rows.
 *
 * Read-only: it fetches catalog rows and computes the checks client-side
 * (catalog is ~1k recipes). Fixes still happen in the existing admin edit/merge
 * flows — each offender row shows its id so an admin can jump to it. Wiring a
 * direct "edit/merge" jump into SimplifiedAdminPanel is a follow-up.
 */

import React, { useState, useCallback } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import {
  duplicateRecipeNames,
  recipeCompleteness,
  mealSlotMismatch,
  imageCoverage,
  genericDescriptions,
  riskBadgeSanity,
  placeholderImages,
  type QaRecipe,
  type QaImageRow,
  type QaCheck,
} from '../../utils/catalogQaChecks';

type ImageCoverage = ReturnType<typeof imageCoverage>;

// Supabase caps a select at 1000 rows; page through everything.
async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
  const sb = getSupabaseClient();
  const out: T[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

function tallyByRecipe(rows: { recipe_id?: string | null }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    if (!r.recipe_id) continue;
    m.set(r.recipe_id, (m.get(r.recipe_id) ?? 0) + 1);
  }
  return m;
}

const SEVERITY_STYLE: Record<QaCheck['severity'], string> = {
  high: 'border-red-300 bg-red-50',
  medium: 'border-amber-300 bg-amber-50',
  low: 'border-gray-200 bg-gray-50',
};

export function CatalogQADashboard({
  onOpenInAdmin,
}: {
  /** Jump to a catalog item in the admin editor (pre-fills its search). */
  onOpenInAdmin?: (searchTerm: string) => void;
} = {}): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [checks, setChecks] = useState<QaCheck[]>([]);
  const [coverage, setCoverage] = useState<ImageCoverage[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const recipeCols =
        'id,name_common,meal_slot,image_url,description,instructions,servings,nutrition_per_serving,nutrition_per_100g,health_score,elements_hazardous,tags';
      // One broken source degrades to a warning instead of killing the whole run.
      const warnings: string[] = [];
      const safe = <T,>(p: Promise<T[]>, label: string) =>
        p.catch((e: any) => { warnings.push(`${label}: ${e?.message || e}`); return [] as T[]; });
      const [recipes, recIngs, recEls, activities, ingredients, products] = await Promise.all([
        safe(fetchAll<QaRecipe>('catalog_recipes', recipeCols), 'catalog_recipes'),
        safe(fetchAll<{ recipe_id: string }>('catalog_recipe_ingredients', 'recipe_id'), 'catalog_recipe_ingredients'),
        safe(fetchAll<{ recipe_id: string }>('catalog_recipe_elements', 'recipe_id'), 'catalog_recipe_elements'),
        // catalog_activities has `name`, not `name_common` (a name_common select 400s)
        safe(fetchAll<QaImageRow>('catalog_activities', 'id,name,image_url'), 'catalog_activities'),
        safe(fetchAll<QaImageRow>('catalog_ingredients', 'id,name_common,image_url'), 'catalog_ingredients'),
        safe(fetchAll<QaImageRow>('catalog_products', 'id,name_common,image_url'), 'catalog_products'),
      ]);
      setError(warnings.length ? `Some sources failed: ${warnings.join(' · ')}` : null);

      const ingCount = tallyByRecipe(recIngs);
      const elCount = tallyByRecipe(recEls);

      // imageCoverage rows use `name`; catalog rows expose name_common.
      const asImageRows = (rows: QaImageRow[]) => rows.map((r) => ({ id: r.id, name: (r as any).name_common ?? r.name, image_url: r.image_url }));

      setChecks([
        duplicateRecipeNames(recipes),
        recipeCompleteness(recipes, ingCount),
        mealSlotMismatch(recipes),
        genericDescriptions(recipes),
        riskBadgeSanity(recipes, elCount),
        placeholderImages(recipes),
      ]);
      setCoverage([
        imageCoverage('recipes', asImageRows(recipes as any)),
        imageCoverage('activities', asImageRows(activities)),
        imageCoverage('ingredients', asImageRows(ingredients)),
        imageCoverage('products', asImageRows(products)),
      ]);
      setRanAt(new Date().toLocaleString());
    } catch (e: any) {
      setError(e?.message || 'Failed to run checks');
    } finally {
      setLoading(false);
    }
  }, []);

  const totalIssues = checks.reduce((n, c) => n + c.count, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Catalog Data-Quality</h2>
          <p className="text-sm text-gray-500">
            {ranAt
              ? `Last run: ${ranAt} · ${totalIssues} issue${totalIssues === 1 ? '' : 's'} across ${checks.length} checks`
              : 'Catalog health checks. Read-only — open an item in the editor to fix it.'}
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Running…' : ranAt ? 'Re-run checks' : 'Run data-quality checks'}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Image coverage by table */}
      {coverage.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {coverage.map((c) => (
            <div key={c.table} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">{c.table} images</div>
              <div className="text-2xl font-semibold text-gray-900">{c.pct}%</div>
              <div className="text-xs text-gray-500">{c.missing} missing / {c.total}</div>
            </div>
          ))}
        </div>
      )}

      {/* Check cards */}
      {checks.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setOpen(open === c.key ? null : c.key)}
              className={`rounded-lg border p-3 text-left ${SEVERITY_STYLE[c.severity]} ${open === c.key ? 'ring-2 ring-gray-400' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{c.label}</span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-sm font-semibold text-gray-900">{c.count}</span>
              </div>
              <div className="mt-1 text-xs text-gray-600">{c.fix}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">
                {c.severity} priority · tap to view {c.count} {c.count === 1 ? 'item' : 'items'}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Drill-down for the open check */}
      {open && (() => {
        const c = checks.find((x) => x.key === open);
        if (!c) return null;
        return (
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-2">
              <div className="text-sm font-medium text-gray-800">{c.label} — {c.count} {c.count === 1 ? 'item' : 'items'}</div>
              <div className="mt-0.5 text-xs text-gray-500">What to fix: {c.fix}</div>
            </div>
            <div className="max-h-96 overflow-auto">
              {c.offenders.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No issues 🎉</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {c.offenders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{o.name}</td>
                        <td className="px-4 py-2 text-gray-600">{o.detail}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {onOpenInAdmin && (
                            <button
                              type="button"
                              onClick={() => onOpenInAdmin(o.name && o.name !== '(unnamed)' ? o.name : o.id)}
                              className="mr-2 rounded bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
                            >
                              Open in Admin →
                            </button>
                          )}
                          <code
                            className="cursor-pointer rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
                            title="Copy ID"
                            onClick={() => { try { void navigator.clipboard?.writeText(o.id); } catch { /* noop */ } }}
                          >
                            {o.id}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default CatalogQADashboard;
