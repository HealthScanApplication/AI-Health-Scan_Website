/**
 * catalogQaChecks — catalog data-quality checks for the admin QA dashboard (DEV-318).
 *
 * This is the TS port of the staging diagnostic SQL
 * (mobile repo: supabase/queries/dev323_catalog_data_quality_checks.sql, DEV-323).
 * Keep the two in lockstep — same contracts, one in SQL for ad-hoc staging runs,
 * one in TS so the dashboard surfaces the SAME checks visually.
 *
 * Every function is PURE (operates on already-fetched rows) so it's unit-testable
 * and free of a Supabase dependency; the dashboard does the fetching and passes
 * data in.
 */

export type QaRecipe = {
  id: string;
  name_common?: string | null;
  meal_slot?: string | null;
  image_url?: string | null;
  description?: string | null;
  instructions?: unknown; // jsonb array of steps
  servings?: number | null;
  nutrition_per_serving?: any;
  nutrition_per_100g?: any;
  health_score?: number | null;
  elements_hazardous?: unknown; // jsonb array
  tags?: string[] | null;
};

export type QaImageRow = { id: string; name?: string | null; image_url?: string | null };

export type QaOffender = { id: string; name: string; detail: string };

export type QaCheck = {
  key: string;
  label: string;
  /** Higher = more launch-critical. */
  severity: 'high' | 'medium' | 'low';
  count: number;
  offenders: QaOffender[];
};

const norm = (s?: string | null): string => (s ?? '').trim().toLowerCase();
const nm = (r: QaRecipe): string => (r.name_common ?? '').trim() || '(unnamed)';
const jsonbLen = (v: unknown): number => (Array.isArray(v) ? v.length : 0);

const isEmptyNutrition = (r: QaRecipe): boolean => {
  const a = r.nutrition_per_serving;
  const b = r.nutrition_per_100g;
  const empty = (v: any) => v == null || (typeof v === 'object' && Object.keys(v).length === 0);
  return empty(a) && empty(b);
};

// Mirrors the DEV-323 dessert/drink/snack regex used for meal-slot mismatch.
const NON_MEAL_NAME_RE =
  /(cake|\bpie\b|cookie|brownie|ice ?cream|dessert|pudding|smoothie|\blatte\b|\bjuice\b|\btea\b|\bcoffee\b|cocktail|milkshake)/i;
const NON_MEAL_TAGS = ['dessert', 'beverage', 'drink', 'snack'];
const SLOT_ONLY_NAME_RE =
  /^(meal|breakfast|lunch|dinner|snack|dessert|beverage|side|appetizer|anytime)$|^(anti-?inflammatory|healthy|balanced)\s+(meal|breakfast|lunch|dinner)$/i;
const MAIN_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);

// Generic / templated description phrasings (DEV-316 — the class DEV-205 missed).
const GENERIC_DESC_RE =
  /(commonly enjoyed|various cuisines|is a dish |a popular dish|enjoyed in many|delicious and nutritious)/i;

// Placeholder / non-canonical image URL markers (DEV-315).
const PLACEHOLDER_IMG_RE = /(placeholder|no-image|no_image|default|missing)/i;

/** 1. Duplicate visible recipe names (DEV-312). */
export function duplicateRecipeNames(recipes: QaRecipe[]): QaCheck {
  const byName = new Map<string, QaRecipe[]>();
  for (const r of recipes) {
    const k = norm(r.name_common);
    if (!k) continue;
    (byName.get(k) ?? byName.set(k, []).get(k)!).push(r);
  }
  const offenders: QaOffender[] = [];
  for (const [, group] of byName) {
    if (group.length > 1) {
      offenders.push({
        id: group[0].id,
        name: nm(group[0]),
        detail: `${group.length} records share this name (ids: ${group.map((g) => g.id).join(', ')})`,
      });
    }
  }
  return { key: 'duplicate_names', label: 'Duplicate recipe names', severity: 'high', count: offenders.length, offenders };
}

/** 2. Recipe completeness — ingredients/steps/servings/nutrition/score (DEV-314). */
export function recipeCompleteness(recipes: QaRecipe[], ingredientCount: Map<string, number>): QaCheck {
  const offenders: QaOffender[] = [];
  for (const r of recipes) {
    const ings = ingredientCount.get(r.id) ?? 0;
    const gaps: string[] = [];
    if (ings < 2) gaps.push(`${ings} ingredient${ings === 1 ? '' : 's'}`);
    if (jsonbLen(r.instructions) === 0) gaps.push('no steps');
    if (r.servings == null) gaps.push('no servings');
    if (isEmptyNutrition(r)) gaps.push('no nutrition');
    if (r.health_score == null || r.health_score === 0) gaps.push('no health score');
    if (gaps.length) offenders.push({ id: r.id, name: nm(r), detail: gaps.join(' · ') });
  }
  // Worst (most gaps) first.
  offenders.sort((a, b) => b.detail.split('·').length - a.detail.split('·').length);
  return { key: 'incomplete', label: 'Incomplete recipes', severity: 'high', count: offenders.length, offenders };
}

/** 3. Meal-slot correctness — "lunch suggests lunch" + slot-only names (DEV-313/326). */
export function mealSlotMismatch(recipes: QaRecipe[]): QaCheck {
  const offenders: QaOffender[] = [];
  for (const r of recipes) {
    const slot = norm(r.meal_slot);
    const name = r.name_common ?? '';
    const tags = r.tags ?? [];
    if (SLOT_ONLY_NAME_RE.test(name.trim())) {
      offenders.push({ id: r.id, name: nm(r), detail: `name is a slot/category, not a dish (slot: ${slot || '—'})` });
      continue;
    }
    if (MAIN_SLOTS.has(slot) && (NON_MEAL_NAME_RE.test(name) || tags.some((t) => NON_MEAL_TAGS.includes(norm(t))))) {
      offenders.push({ id: r.id, name: nm(r), detail: `slotted "${slot}" but looks like a dessert/drink/snack` });
    }
  }
  return { key: 'slot_mismatch', label: 'Meal-slot mismatch (lunch-not-lunch)', severity: 'medium', count: offenders.length, offenders };
}

/** 4. Image coverage for any catalog table (recipes/activities/ingredients/products) (DEV-315). */
export function imageCoverage(
  table: string,
  rows: QaImageRow[],
): { table: string; total: number; missing: number; pct: number; offenders: QaOffender[] } {
  const offenders: QaOffender[] = [];
  for (const row of rows) {
    if (!row.image_url || row.image_url.trim() === '') {
      offenders.push({ id: row.id, name: (row.name ?? '').trim() || '(unnamed)', detail: 'missing image_url' });
    }
  }
  const total = rows.length;
  const missing = offenders.length;
  const pct = total > 0 ? Math.round((1000 * (total - missing)) / total) / 10 : 0;
  return { table, total, missing, pct, offenders };
}

/** 5. Missing / generic descriptions (DEV-316). */
export function genericDescriptions(recipes: QaRecipe[]): QaCheck {
  const offenders: QaOffender[] = [];
  for (const r of recipes) {
    const d = (r.description ?? '').trim();
    if (!d || d.length < 40) {
      offenders.push({ id: r.id, name: nm(r), detail: d ? `too short (${d.length} chars)` : 'no description' });
    } else if (GENERIC_DESC_RE.test(d)) {
      offenders.push({ id: r.id, name: nm(r), detail: `generic/templated: "${d.slice(0, 60)}…"` });
    }
  }
  return { key: 'generic_desc', label: 'Missing / generic descriptions', severity: 'medium', count: offenders.length, offenders };
}

/** 6. Risk/benefit badge sanity — junction drift + near-duplicate divergence (DEV-317). */
export function riskBadgeSanity(recipes: QaRecipe[], elementCount: Map<string, number>): QaCheck {
  const offenders: QaOffender[] = [];

  // 6a. Badge jsonb says hazards but the element junction is empty (drift).
  for (const r of recipes) {
    const badge = jsonbLen(r.elements_hazardous);
    const junction = elementCount.get(r.id) ?? 0;
    if (badge > 0 && junction === 0) {
      offenders.push({ id: r.id, name: nm(r), detail: `${badge} risk badge(s) but 0 element-junction rows` });
    }
  }

  // 6b. Near-duplicate divergence: same normalized name, risk count differs by >2.
  const byName = new Map<string, QaRecipe[]>();
  for (const r of recipes) {
    const k = norm(r.name_common);
    if (!k) continue;
    (byName.get(k) ?? byName.set(k, []).get(k)!).push(r);
  }
  for (const [, group] of byName) {
    if (group.length < 2) continue;
    const counts = group.map((g) => jsonbLen(g.elements_hazardous));
    const spread = Math.max(...counts) - Math.min(...counts);
    if (spread > 2) {
      offenders.push({
        id: group[0].id,
        name: nm(group[0]),
        detail: `near-duplicate risk counts diverge by ${spread} (min ${Math.min(...counts)}, max ${Math.max(...counts)})`,
      });
    }
  }
  return { key: 'risk_sanity', label: 'Risk/benefit badge sanity', severity: 'medium', count: offenders.length, offenders };
}

/** 7. Placeholder / malformed image URLs (DEV-315). */
export function placeholderImages(recipes: QaRecipe[]): QaCheck {
  const offenders: QaOffender[] = [];
  for (const r of recipes) {
    const url = (r.image_url ?? '').trim();
    if (!url) continue; // missing handled by imageCoverage
    if (PLACEHOLDER_IMG_RE.test(url) || !/^https:\/\//i.test(url)) {
      offenders.push({ id: r.id, name: nm(r), detail: `placeholder/malformed: ${url.slice(0, 60)}` });
    }
  }
  return { key: 'bad_images', label: 'Placeholder / malformed images', severity: 'medium', count: offenders.length, offenders };
}
