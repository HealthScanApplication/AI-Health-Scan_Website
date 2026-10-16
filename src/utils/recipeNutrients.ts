/*
 * Recipe micronutrients, essential-nutrient tiers and hazards, from catalog data only.
 *
 * Ingredient rows store nutrients under several key spellings (elements_beneficial.per_100g.{minerals,
 * vitamins,amino_acids,fatty_acids,antioxidants,digestive,functional} and USDA nutrition_per_100g:
 * `selenium_ug` vs `selenium_mcg`, `thiamin_mg` vs `thiamine_mg`, `vitamin_a_iu` …). They are folded onto
 * one canonical key per nutrient here, with a daily value, so a recipe can show % of daily value per serving.
 *
 * Tiers:
 *   15  core nutrients most diets fall short on;
 *   30  the 15 plus the remaining vitamins and trace minerals with an adult daily value;
 *   90  the versioned Wallach historical core90 identities, enriched from matching catalog rows.
 *       Core15 / Extended30 remain app-defined convenience subsets, not Wallach-attributed lists.
 */
import { projectId, publicAnonKey } from './supabase/info';
import wallach from '../config/wallachEssential90.json';

export type Tier = 15 | 30 | 90;
export interface NutrientDef { key: string; label: string; unit: string; dv: number | null; tier: Tier; aliases: string[]; scale?: Record<string, number>; elementId?: string; catalogBacked?: boolean; safety?: string }

// unit conversions from an alias to the canonical unit (value × factor)
// IU → mcg RAE: 0.3 for retinol, 0.05 for dietary beta-carotene. Ingredient rows in IU are mostly plants
// (spinach 9377 IU → 469 mcg RAE, the USDA value), so the conservative carotene factor is used.
const IU_A_TO_MCG_RAE = 0.05;
const IU_D_TO_MCG = 0.025;

export const NUTRIENTS: NutrientDef[] = [
  // ── core 15 ──
  { key: 'protein_g', label: 'Protein', unit: 'g', dv: 50, tier: 15, aliases: ['protein_g'] },
  { key: 'fiber_g', label: 'Fibre', unit: 'g', dv: 28, tier: 15, aliases: ['fiber_g', 'fibre_g'] },
  { key: 'vitamin_d_mcg', label: 'Vitamin D', unit: 'mcg', dv: 20, tier: 15, aliases: ['vitamin_d_mcg', 'vitamin_d3_mcg', 'vitamin_d_ug', 'vitamin_d_iu'], scale: { vitamin_d_iu: IU_D_TO_MCG } },
  { key: 'vitamin_b12_mcg', label: 'Vitamin B12', unit: 'mcg', dv: 2.4, tier: 15, aliases: ['vitamin_b12_mcg', 'vitamin_b12_ug'] },
  { key: 'folate_mcg', label: 'Folate (B9)', unit: 'mcg', dv: 400, tier: 15, aliases: ['folate_mcg', 'folate_ug', 'vitamin_b9_mcg'] },
  { key: 'vitamin_a_mcg', label: 'Vitamin A', unit: 'mcg', dv: 900, tier: 15, aliases: ['vitamin_a_mcg', 'vitamin_a_rae_ug', 'vitamin_a_iu'], scale: { vitamin_a_iu: IU_A_TO_MCG_RAE } },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', dv: 90, tier: 15, aliases: ['vitamin_c_mg'] },
  { key: 'vitamin_k_mcg', label: 'Vitamin K', unit: 'mcg', dv: 120, tier: 15, aliases: ['vitamin_k_mcg', 'vitamin_k1_mcg', 'vitamin_k2_mcg', 'vitamin_k_ug'] },
  { key: 'iron_mg', label: 'Iron', unit: 'mg', dv: 18, tier: 15, aliases: ['iron_mg'] },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', dv: 1300, tier: 15, aliases: ['calcium_mg'] },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg', dv: 420, tier: 15, aliases: ['magnesium_mg'] },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg', dv: 11, tier: 15, aliases: ['zinc_mg'] },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg', dv: 4700, tier: 15, aliases: ['potassium_mg'] },
  { key: 'iodine_mcg', label: 'Iodine', unit: 'mcg', dv: 150, tier: 15, aliases: ['iodine_mcg', 'iodine_ug'] },
  { key: 'omega_3_g', label: 'Omega-3', unit: 'g', dv: 1.6, tier: 15, aliases: ['omega_3_g', 'omega3_total_g', 'omega_3_mg'], scale: { omega_3_mg: 0.001 } },
  // ── to 30 ──
  { key: 'vitamin_e_mg', label: 'Vitamin E', unit: 'mg', dv: 15, tier: 30, aliases: ['vitamin_e_mg'] },
  { key: 'thiamine_mg', label: 'Thiamine (B1)', unit: 'mg', dv: 1.2, tier: 30, aliases: ['thiamine_mg', 'thiamin_mg', 'vitamin_b1_mg'] },
  { key: 'riboflavin_mg', label: 'Riboflavin (B2)', unit: 'mg', dv: 1.3, tier: 30, aliases: ['riboflavin_mg', 'vitamin_b2_mg'] },
  { key: 'niacin_mg', label: 'Niacin (B3)', unit: 'mg', dv: 16, tier: 30, aliases: ['niacin_mg', 'vitamin_b3_mg'] },
  { key: 'pantothenic_acid_mg', label: 'Pantothenic acid (B5)', unit: 'mg', dv: 5, tier: 30, aliases: ['pantothenic_acid_mg', 'vitamin_b5_mg'] },
  { key: 'vitamin_b6_mg', label: 'Vitamin B6', unit: 'mg', dv: 1.7, tier: 30, aliases: ['vitamin_b6_mg', 'pyridoxine_mg'] },
  { key: 'biotin_mcg', label: 'Biotin (B7)', unit: 'mcg', dv: 30, tier: 30, aliases: ['biotin_mcg', 'biotin_ug'] },
  { key: 'choline_mg', label: 'Choline', unit: 'mg', dv: 550, tier: 30, aliases: ['choline_mg'] },
  { key: 'phosphorus_mg', label: 'Phosphorus', unit: 'mg', dv: 1250, tier: 30, aliases: ['phosphorus_mg'] },
  { key: 'selenium_mcg', label: 'Selenium', unit: 'mcg', dv: 55, tier: 30, aliases: ['selenium_mcg', 'selenium_ug', 'selenium_mcgs'] },
  { key: 'copper_mg', label: 'Copper', unit: 'mg', dv: 0.9, tier: 30, aliases: ['copper_mg'] },
  { key: 'manganese_mg', label: 'Manganese', unit: 'mg', dv: 2.3, tier: 30, aliases: ['manganese_mg'] },
  { key: 'chromium_mcg', label: 'Chromium', unit: 'mcg', dv: 35, tier: 30, aliases: ['chromium_mcg', 'chromium_mcgs'] },
  { key: 'molybdenum_mcg', label: 'Molybdenum', unit: 'mcg', dv: 45, tier: 30, aliases: ['molybdenum_mcg', 'molybdenum_mcgs'] },
  { key: 'omega_6_g', label: 'Omega-6', unit: 'g', dv: 17, tier: 30, aliases: ['omega_6_g'] },
  // ── to 90 (static part: the essential amino acids, fatty acids and fibres the ingredient data carries) ──
  { key: 'histidine_g', label: 'Histidine', unit: 'g', dv: 0.7, tier: 90, aliases: ['histidine_g'] },
  { key: 'isoleucine_g', label: 'Isoleucine', unit: 'g', dv: 1.4, tier: 90, aliases: ['isoleucine_g'] },
  { key: 'leucine_g', label: 'Leucine', unit: 'g', dv: 2.7, tier: 90, aliases: ['leucine_g'] },
  { key: 'lysine_g', label: 'Lysine', unit: 'g', dv: 2.1, tier: 90, aliases: ['lysine_g'] },
  { key: 'methionine_g', label: 'Methionine', unit: 'g', dv: 1.05, tier: 90, aliases: ['methionine_g'] },
  { key: 'phenylalanine_g', label: 'Phenylalanine', unit: 'g', dv: 1.75, tier: 90, aliases: ['phenylalanine_g'] },
  { key: 'threonine_g', label: 'Threonine', unit: 'g', dv: 1.05, tier: 90, aliases: ['threonine_g'] },
  { key: 'tryptophan_g', label: 'Tryptophan', unit: 'g', dv: 0.28, tier: 90, aliases: ['tryptophan_g'] },
  { key: 'valine_g', label: 'Valine', unit: 'g', dv: 1.82, tier: 90, aliases: ['valine_g'] },
  { key: 'monounsaturated_g', label: 'Monounsaturated fat', unit: 'g', dv: 20, tier: 90, aliases: ['monounsaturated_g'] },
  { key: 'polyunsaturated_g', label: 'Polyunsaturated fat', unit: 'g', dv: 17, tier: 90, aliases: ['polyunsaturated_g'] },
  { key: 'soluble_fiber_g', label: 'Soluble fibre', unit: 'g', dv: null, tier: 90, aliases: ['soluble_fiber_g'] },
  { key: 'insoluble_fiber_g', label: 'Insoluble fibre', unit: 'g', dv: null, tier: 90, aliases: ['insoluble_fiber_g'] },
  { key: 'beta_carotene_mg', label: 'Beta-carotene', unit: 'mg', dv: null, tier: 90, aliases: ['beta_carotene_mg'] },
  { key: 'lutein_mg', label: 'Lutein', unit: 'mg', dv: null, tier: 90, aliases: ['lutein_mg'] },
  { key: 'lycopene_mg', label: 'Lycopene', unit: 'mg', dv: null, tier: 90, aliases: ['lycopene_mg'] },
  { key: 'coq10_mg', label: 'CoQ10', unit: 'mg', dv: null, tier: 90, aliases: ['coq10_mg'] },
  { key: 'dha_g', label: 'DHA', unit: 'g', dv: 0.25, tier: 90, aliases: ['dha_g', 'dha_mg'], scale: { dha_mg: 0.001 } },
  { key: 'epa_g', label: 'EPA', unit: 'g', dv: 0.25, tier: 90, aliases: ['epa_g', 'epa_mg'], scale: { epa_mg: 0.001 } },
];

/** Source-versioned historical collection; no inferred membership from names or flags. */
export const WALLACH_MEMBERS = (['minerals','vitamins','amino_acids','fatty_acids'] as const).flatMap(group =>
  wallach[group].map(([id,label,key]) => ({ id,label,key,group })));
export const APP_ESSENTIAL_90: Array<[number,string,string]> = WALLACH_MEMBERS.map((m,i) => [i+1,m.label,m.key]);

const ALIAS = new Map<string, NutrientDef>();
const MASS_UNITS: Record<string,number> = { g: 1, mg: .001, mcg: .000001, ug: .000001 };
for (const n of NUTRIENTS) {
  const match = /^(.*)_(g|mg|mcg|ug)$/.exec(n.key);
  if (!match) continue;
  for (const [u,factor] of Object.entries(MASS_UNITS)) {
    const alias = `${match[1]}_${u}`;
    if (!n.aliases.includes(alias)) n.aliases.push(alias);
    n.scale = { ...n.scale, [alias]: factor / MASS_UNITS[n.unit] };
  }
}
for (const n of NUTRIENTS) for (const a of n.aliases) ALIAS.set(a, n);

const WALLACH_DEFS: NutrientDef[] = WALLACH_MEMBERS.map(m => {
  const known = NUTRIENTS.find(n => n.key === m.key);
  const unit = m.key.split('_').pop()!;
  const base = m.key.replace(/_(g|mg|mcg)$/,'');
  const aliases = known?.aliases || [...Object.keys(MASS_UNITS).map(u => `${base}_${u}`), `${base}_mcgs`];
  const scale = known?.scale || { ...Object.fromEntries(Object.entries(MASS_UNITS).map(([u,f]) => [`${base}_${u}`,f / MASS_UNITS[unit]])), [`${base}_mcgs`]: MASS_UNITS.mcg / MASS_UNITS[unit] };
  return { ...known, key: m.key, label: m.label, elementId: m.id, unit, dv: known?.dv ?? null, tier: known?.tier || 90, aliases, scale, catalogBacked: false };
});
for (const n of WALLACH_DEFS) for (const a of n.aliases) if (!ALIAS.has(a)) ALIAS.set(a,n);

/** Catalog metadata for15/30; fixed historical identity membership for90, online and offline. */
export const nutrientsForTier = (tier: Tier, extra: NutrientDef[] = []) => {
  if (tier < 90) return NUTRIENTS.filter((n) => n.tier <= tier).map(n => extra.find(e => e.key === n.key) || n);
  return WALLACH_DEFS.map(n => extra.find(e => e.key === n.key && e.elementId === n.elementId) || n);
};
export const nutrientByKey = (key: string) => ALIAS.get(key) || NUTRIENTS.find((n) => n.key === key) || null;

const num = (v: unknown) => { const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN; return Number.isFinite(n) ? n : null; };

/**
 * Every micronutrient an ingredient row carries, per 100 g, on canonical keys. Curated elements_beneficial wins;
 * USDA nutrition_per_100g fills gaps. Unknown keys are kept as they are, so nothing measured is dropped.
 */
export function canonicalMicros(row: any): Record<string, number> {
  const out: Record<string, number> = {};
  const put = (rawKey: string, value: unknown, fillOnly: boolean) => {
    const v = num(value);
    if (v == null || v === 0) return;
    const def = ALIAS.get(rawKey);
    if (def && ['protein_g', 'fiber_g'].includes(def.key)) return; // macros come from the macro block
    const key = def?.key || rawKey;
    const scaled = v * (def?.scale?.[rawKey] ?? 1);
    if (fillOnly && out[key] != null) return;
    // two aliases of one nutrient in the same block (K1 + K2): add them
    out[key] = fillOnly ? scaled : (out[key] || 0) + scaled;
  };
  const eb = row?.elements_beneficial?.per_100g || {};
  for (const [group, values] of Object.entries(eb)) {
    if (group === 'macronutrients' || !values || typeof values !== 'object') continue;
    for (const [k, v] of Object.entries(values as Record<string, unknown>)) put(k, v, false);
  }
  const usda = row?.nutrition_per_100g || {};
  const MACRO = /^(energy_k(cal|j)|calories|fats?_g|protein_g|carbs?_g|carbohydrates_g|sugars?_g|fiber_g|water_g|saturated_fat_g|ash_g|alcohol_g|salt_g|trans_fat_g)$/;
  for (const [k, v] of Object.entries(usda)) if (!MACRO.test(k)) put(k, v, true);
  return out;
}

/* ── hazards ── */
export type HazardLevel = 'trace' | 'low' | 'moderate' | 'high';
export interface HazardPer100 { key: string; label: string; per100: number | null; level: HazardLevel; likelihood: number | null; reason: string; assessed: boolean }
const LEVELS: HazardLevel[] = ['trace', 'low', 'moderate', 'high'];
// 'unknown' (not yet assessed) ranks with trace so it never outranks a measured hazard.
const levelOf = (v: unknown): HazardLevel => (LEVELS.includes(String(v).toLowerCase() as HazardLevel) ? String(v).toLowerCase() as HazardLevel : 'trace');
const prettify = (k: string) => k.replace(/_/g, ' ').replace(/\b(mg|mcg|ug|g|ppm|ppb)$/i, '').trim().replace(/^./, (c) => c.toUpperCase());

/** Hazards an ingredient row carries (elements_hazardous), per 100 g. */
export function ingredientHazards(row: any): HazardPer100[] {
  const h = row?.elements_hazardous;
  if (!h || typeof h !== 'object' || Array.isArray(h)) return [];
  return Object.entries(h).filter(([, v]) => v && typeof v === 'object').map(([key, v]: [string, any]) => ({
    key, label: prettify(key), per100: num(v.per_100g), level: levelOf(v.level), likelihood: num(v.likelihood),
    reason: String(v.reason || ''), assessed: v.assessment_status === 'assessed_present' || v.needs_curation === false,
  }));
}

export interface RecipeHazard { key: string; label: string; total: number | null; perServing: number | null; level: HazardLevel; sources: string[]; reasons: string[]; assessed: boolean }

/** Sum hazards over a recipe's ingredients by grams; the worst level wins and every source ingredient is listed. */
export function recipeHazards(items: Array<{ name: string; grams: number; hazards?: HazardPer100[] | null }>, servings: number): RecipeHazard[] {
  const map = new Map<string, RecipeHazard>();
  for (const it of items) for (const hz of it.hazards || []) {
    const cur = map.get(hz.key) || { key: hz.key, label: hz.label, total: null, perServing: null, level: 'trace' as HazardLevel, sources: [], reasons: [], assessed: false };
    if (hz.per100 != null && it.grams) cur.total = (cur.total || 0) + hz.per100 * it.grams / 100;
    if (LEVELS.indexOf(hz.level) > LEVELS.indexOf(cur.level)) cur.level = hz.level;
    if (!cur.sources.includes(it.name)) cur.sources.push(it.name);
    if (hz.reason && !cur.reasons.includes(hz.reason)) cur.reasons.push(hz.reason);
    cur.assessed = cur.assessed || hz.assessed;
    map.set(hz.key, cur);
  }
  const per = Math.max(1, servings || 1);
  return [...map.values()].map((h) => ({ ...h, total: h.total == null ? null : Math.round(h.total * 1000) / 1000, perServing: h.total == null ? null : Math.round(h.total / per * 1000) / 1000 }))
    .sort((a, b) => LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level) || Number(b.assessed) - Number(a.assessed) || a.label.localeCompare(b.label));
}

/* ── coverage ── */
export interface Coverage { def: NutrientDef; amount: number | null; pct: number | null }
/** % of daily value per serving for each nutrient of a tier; null = no ingredient data for it. */
export function coverage(micros: Record<string, number> | undefined, macros: { protein_g?: number; fiber_g?: number }, tier: Tier, extra: NutrientDef[] = []): Coverage[] {
  return nutrientsForTier(tier, extra).map((def) => {
    const amount = def.key === 'protein_g' ? macros.protein_g ?? null : def.key === 'fiber_g' ? macros.fiber_g ?? null : micros?.[def.key] ?? null;
    return { def, amount, pct: amount != null && def.dv ? Math.round(amount / def.dv * 100) : null };
  });
}

/** Nutrients of a tier below `threshold` % DV per serving (or not measured): what a gap-filling recipe should bring. */
export const gaps = (cov: Coverage[], threshold = 20) => cov.filter((c) => c.def.dv != null && (c.pct == null || c.pct < threshold)).map((c) => c.def);

/**
 * Enrich the exact historical identity manifest from flagged catalog rows.
 * Historical membership is separate from safety classification and usable intake references.
 */
export async function loadEssential90(): Promise<NutrientDef[]> {
  const url = `https://${projectId}.supabase.co/rest/v1/catalog_elements?select=id,name_common,nutrient_key,daily_value_amount,daily_value_unit,category,essential_90,is_beneficial&essential_90=eq.true&order=id.asc&limit=1000`;
  const res = await fetch(url, { headers: { apikey: publicAnonKey, Authorization: `Bearer ${publicAnonKey}` } });
  if (!res.ok) throw Error('Could not load database nutrient definitions');
  const rows = await res.json();
  return WALLACH_DEFS.map(def => {
    // Exact element identity wins. A chemical form, additive or similarly named
    // element can never acquire historical membership through a shared nutrient key.
    const row = rows.find((r: any) => r.id === def.elementId);
    if (!row) return def;
    const value = num(row.daily_value_amount);
    const from = (row.daily_value_unit || '').replace(/[μµ]g/g,'mcg').replace('ug','mcg').split(' ')[0];
    const eligible = def.dv != null && row.category !== 'Hazardous' && row.is_beneficial !== false;
    const dv = eligible && value && value !== 1 && MASS_UNITS[from] && MASS_UNITS[def.unit] ? value * MASS_UNITS[from] / MASS_UNITS[def.unit] : null;
    return { ...def, dv, catalogBacked: true, safety: row.category };
  });
}

/** The AI brief lines for the builder filters. */
export interface RecipeFilters { diets: string[]; useIngredients: string[]; avoidIngredients: string[]; boost: string[]; limit: string[] }
export function filtersToBrief(f: RecipeFilters): string {
  const lines: string[] = [];
  if (f.diets.length) lines.push(`Diet: every recipe must be ${f.diets.join(' and ')}.`);
  if (f.useIngredients.length) lines.push(`Use these ingredients: ${f.useIngredients.join(', ')}.`);
  if (f.avoidIngredients.length) lines.push(`Never use (or any form of): ${f.avoidIngredients.join(', ')}.`);
  const boost = f.boost.map(nutrientByKey).filter((n): n is NutrientDef => !!n?.dv);
  if (boost.length) lines.push(`Make the recipes rich in: ${boost.map(n => n.label).join(', ')} (choose whole-food ingredients known to be high in them).`);
  if (f.limit.length) lines.push(`Keep these low: ${f.limit.join(', ')}.`);
  return lines.join('\n');
}

/** Ingredients in a draft that break the avoid list (name or catalog match contains an avoided word). */
export function avoidViolations(ingredients: Array<{ name: string; catalog_name?: string | null }>, avoid: string[]): string[] {
  const words = avoid.map((a) => a.trim().toLowerCase()).filter((a) => a.length >= 3);
  return ingredients.filter((i) => words.some((w) => `${i.name} ${i.catalog_name || ''}`.toLowerCase().includes(w))).map((i) => i.catalog_name || i.name);
}
