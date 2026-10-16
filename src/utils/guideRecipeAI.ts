import { getSupabaseClient } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';
import { canonicalMicros, ingredientHazards, recipeHazards, type HazardPer100 } from './recipeNutrients';

/**
 * AI recipe builder for Guardians.
 *
 * The model only drafts recipes (names, amounts, method). Every ingredient is then matched to a
 * ROUTINE³ catalog ingredient, and nutrition is CALCULATED here from that ingredient's per-100 g
 * database values × the gram amount, never taken from the model. Field names mirror
 * catalog_recipes / catalog_ingredients.nutrition_per_100g so the mobile app reads them the same way.
 */

export const MACRO_KEYS = ['energy_kcal', 'protein_g', 'carbohydrates_g', 'fats_g', 'fiber_g', 'sugar_g', 'saturated_fat_g'] as const;
export type MacroKey = typeof MACRO_KEYS[number];
export type Nutrition = Partial<Record<MacroKey, number>> & { micros?: Record<string, number>; hazards?: HazardPer100[]; allergens?: string[] };

/** Key micronutrients shown in the builder, in display order (keys from elements_beneficial.per_100g). */
export const KEY_MICROS: Array<[string, string]> = [
  ['iron_mg', 'Iron'], ['calcium_mg', 'Calcium'], ['magnesium_mg', 'Magnesium'], ['potassium_mg', 'Potassium'],
  ['zinc_mg', 'Zinc'], ['sodium_mg', 'Sodium'], ['vitamin_c_mg', 'Vitamin C'], ['vitamin_a_mcg', 'Vitamin A'],
  ['vitamin_e_mg', 'Vitamin E'], ['vitamin_k_mcg', 'Vitamin K'], ['folate_mcg', 'Folate'], ['vitamin_b12_mcg', 'Vitamin B12'],
];

export interface CatalogIngredient {
  id: string;
  name_common: string;
  image_url: string | null;
  piece_weight_g: number | null;
  piece_label: string | null;
  per100: Nutrition | null;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  grams: number;
  preparation?: string;
  ingredient_id: string | null;
  catalog_name: string | null;
  image_url?: string | null;
  piece_weight_g?: number | null;
  piece_label?: string | null;
  per100: Nutrition | null;
}

export interface RecipeDraft {
  title: string;
  description: string;
  meal_slot: string;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
  ingredients: RecipeIngredient[];
  instructions: string[];
  image_url: string | null;
}

const num = (value: unknown) => {
  const n = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/** Per-100 g nutrition from a catalog ingredient row (USDA-backed nutrition_per_100g first, elements_beneficial second). */
export function per100FromRow(row: any): Nutrition | null {
  const n = row?.nutrition_per_100g || {};
  const eb = row?.elements_beneficial?.per_100g || {};
  const m = eb.macronutrients || {};
  const out: Nutrition = {
    energy_kcal: num(n.energy_kcal) ?? num(eb.calories) ?? num(row?.calories_per_100g),
    protein_g: num(n.protein_g) ?? num(m.protein_g),
    carbohydrates_g: num(n.carbohydrates_g) ?? num(m.carbohydrates_g),
    fats_g: num(n.fats_g) ?? num(m.fat_g),
    fiber_g: num(n.fiber_g) ?? num(m.fiber_g),
    sugar_g: num(n.sugar_g) ?? num(m.sugars_g),
    saturated_fat_g: num(n.saturated_fat_g),
  };
  // Every micronutrient the row carries (all elements_beneficial groups + USDA gaps), on canonical keys.
  const micros = canonicalMicros(row);
  if (Object.keys(micros).length) out.micros = micros;
  const hazards = ingredientHazards(row);
  if (hazards.length) out.hazards = hazards;
  if (Array.isArray(row?.allergens) && row.allergens.length) out.allergens = row.allergens.map(String);
  return MACRO_KEYS.some((key) => out[key] != null) ? out : null;
}

const INGREDIENT_COLUMNS = 'id,name_common,image_url,piece_weight_g,piece_label,nutrition_per_100g,elements_beneficial,elements_hazardous,allergens,calories_per_100g';
const toCatalog = (row: any): CatalogIngredient => ({ id: row.id, name_common: row.name_common, image_url: row.image_url, piece_weight_g: num(row.piece_weight_g) ?? null, piece_label: row.piece_label, per100: per100FromRow(row) });

/** Search catalog ingredients by name (the column is name_common; `name` does not exist). */
export async function searchCatalogIngredients(term: string, limit = 12): Promise<CatalogIngredient[]> {
  const clean = term.replace(/[%,()]/g, ' ').trim();
  if (clean.length < 2) return [];
  const { data, error } = await getSupabaseClient().from('catalog_ingredients').select(INGREDIENT_COLUMNS).ilike('name_common', `%${clean}%`).limit(40);
  if (error) throw error;
  return rank(clean, (data || []).map(toCatalog)).slice(0, limit);
}

function rank(term: string, rows: CatalogIngredient[]) {
  const t = term.toLowerCase();
  const score = (row: CatalogIngredient) => {
    const name = row.name_common.toLowerCase();
    let s = name === t ? 100 : name.startsWith(t) ? 60 : new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(name) ? 40 : 10;
    if (row.per100) s += 30;
    return s - name.length / 10;
  };
  return [...rows].sort((a, b) => score(b) - score(a));
}

/** Best catalog match for a drafted ingredient: full name, then progressively shorter tails ("rolled oats" → "oats"). */
export async function matchCatalogIngredient(name: string, search?: string): Promise<CatalogIngredient | null> {
  const words = (search || name).toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const singular = (phrase: string) => phrase.split(' ').map((w) => w.replace(/(ies)$/, 'y').replace(/(oes|ches|shes)$/, (m) => m.slice(0, -2)).replace(/([^s])s$/, '$1')).join(' ');
  const full = search || name;
  // Whole phrase (and its singular) before shorter tails, so "chia seeds" finds "Chia Seed", not "Seeds".
  const tries = [full, singular(full), ...words.map((_, i) => words.slice(i).join(' ')).slice(1).flatMap((t) => [t, singular(t)]), words[0]];
  for (const term of [...new Set(tries)].filter((t) => t.length >= 3)) {
    const hits = await searchCatalogIngredients(term, 1).catch(() => []);
    if (hits[0]) return hits[0];
  }
  return null;
}

const UNIT_GRAMS: Record<string, number> = { g: 1, ml: 1, kg: 1000, l: 1000, tsp: 5, tbsp: 15, cup: 240, oz: 28.35, lb: 453.6, pinch: 0.5 };
export const UNITS = ['g', 'ml', 'tsp', 'tbsp', 'cup', 'piece', 'pinch'];

/** Grams for an amount: exact for weight/volume units, catalog piece weight for pieces, else the draft's estimate. */
export function gramsFor(amount: number, unit: string, catalog: Partial<Pick<CatalogIngredient, 'piece_weight_g' | 'piece_label'>> | null, fallback: number) {
  const u = unit.toLowerCase();
  const piece = catalog?.piece_weight_g ? Number(catalog.piece_weight_g) : 0;
  // The catalog's own piece weight wins for pieces and for its labelled measure (Spinach: "cup raw" = 30 g).
  if (piece && (u === 'piece' || (catalog?.piece_label || '').toLowerCase().split(/\s+/)[0] === u)) return Math.round(amount * piece * 10) / 10;
  // A cup of leaves is not 240 g: for volume measures of solids trust the draft's weight estimate.
  if (u === 'cup' && fallback > 0) return fallback;
  if (UNIT_GRAMS[u] != null) return Math.round(amount * UNIT_GRAMS[u] * 10) / 10;
  return fallback > 0 ? fallback : 0;
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/** Sum database nutrition across ingredients for the whole recipe and per serving. */
export function computeNutrition(ingredients: RecipeIngredient[], servings: number) {
  const total: Nutrition = {};
  const micros: Record<string, number> = {};
  let weight = 0, matched = 0, microMatched = 0;
  for (const item of ingredients) {
    weight += item.grams || 0;
    if (!item.per100 || !item.grams) continue;
    matched += 1;
    const scale = item.grams / 100;
    for (const key of MACRO_KEYS) { const v = item.per100[key]; if (v != null) total[key] = (total[key] || 0) + v * scale; }
    if (item.per100.micros) microMatched += 1;
    for (const [key, v] of Object.entries(item.per100.micros || {})) micros[key] = (micros[key] || 0) + v * scale;
  }
  if (Object.keys(micros).length) total.micros = micros;
  const per = Math.max(1, servings || 1);
  const scaleBy = (n: Nutrition, f: number): Nutrition => {
    const out: Nutrition = {};
    for (const key of MACRO_KEYS) if (n[key] != null) out[key] = round(n[key]! * f, key === 'energy_kcal' ? 0 : 1);
    if (n.micros) out.micros = Object.fromEntries(Object.entries(n.micros).map(([k, v]) => [k, round(v * f, 2)]));
    return out;
  };
  const hazards = recipeHazards(ingredients.map((i) => ({ name: i.catalog_name || i.name, grams: i.grams, hazards: i.per100?.hazards })), per);
  const allergens = [...new Set(ingredients.flatMap((i) => i.per100?.allergens || []))];
  return { total: scaleBy(total, 1), perServing: scaleBy(total, 1 / per), hazards, allergens, totalWeight: round(weight, 0), servingWeight: round(weight / per, 0), matched, microMatched, count: ingredients.length };
}

/** Ask the edge function for 1+ drafts, then match every ingredient to the catalog. */
export async function buildRecipesWithAI(accessToken: string, input: { message: string; count: number; mealSlot?: string; sourceUrls?: string[]; imageUrls?: string[] }): Promise<{ summary: string; recipes: RecipeDraft[] }> {
  const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/guides/build-recipes`, {
    method: 'POST',
    headers: { apikey: publicAnonKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `Recipe builder failed (${res.status})`);
  const recipes = await Promise.all((payload.recipes || []).map(async (draft: any): Promise<RecipeDraft> => {
    const ingredients = await Promise.all((draft.ingredients || []).map(async (item: any): Promise<RecipeIngredient> => {
      const match = await matchCatalogIngredient(String(item.name || ''), item.search ? String(item.search) : undefined);
      const amount = num(item.amount) ?? 0;
      const unit = String(item.unit || 'g');
      return { name: String(item.name || ''), amount, unit, preparation: item.preparation || undefined, grams: gramsFor(amount, unit, match, num(item.grams) ?? 0), ingredient_id: match?.id ?? null, catalog_name: match?.name_common ?? null, image_url: match?.image_url ?? null, piece_weight_g: match?.piece_weight_g ?? null, piece_label: match?.piece_label ?? null, per100: match?.per100 ?? null };
    }));
    const hero = ingredients.find((item) => item.image_url)?.image_url ?? null;
    return { title: String(draft.title || 'Untitled recipe'), description: String(draft.description || ''), meal_slot: String(draft.meal_slot || input.mealSlot || 'any'), servings: Math.max(1, num(draft.servings) ?? 2), prep_time: num(draft.prep_time) ?? null, cook_time: num(draft.cook_time) ?? null, ingredients, instructions: (draft.instructions || []).map(String), image_url: input.imageUrls?.[0] || hero };
  }));
  return { summary: String(payload.summary || ''), recipes };
}
