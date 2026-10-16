/*
 * Diet planner auto-fill: a week of meals that never repeats a recipe within a day (and at most twice a week),
 * puts only slot-appropriate recipes in each slot, ranks by health score and essential-nutrient coverage
 * (filling each day's gaps first), penalises hazards, and stays near the kcal and protein targets.
 *
 * Nutrients and hazards come from the junction records: catalog_recipe_ingredients (recipe → ingredient,
 * amount_g, retention_factor) × each ingredient's elements_beneficial / nutrition_per_100g / elements_hazardous.
 * The planning functions are pure (planWeek, slotFit, …); loadCandidates does the reads.
 */
import { projectId, publicAnonKey } from './supabase/info';
import { canonicalMicros, coverage, ingredientHazards, nutrientsForTier, recipeHazards, type NutrientDef, type RecipeHazard, type Tier } from './recipeNutrients';
import { DIET_FRAMEWORKS, MEAL_SLOTS, WEEK, nameSlotHint, toMealNutrition, mealIsFasting, type DietConfig, type DietFramework, type MealPick } from './protocolBuilders';
import type { GuideRecipe } from './guidePortal';

export interface Candidate extends MealPick {
  healthScore: number | null;
  mealSlot: string | null;
  tags: string[];
  micros: Record<string, number>;   // per serving, canonical keys
  hazards: RecipeHazard[];          // per serving
  ingredientIds: string[];
}

/* ── slot fit ── */
const DESSERT = /\b(cake|cupcake|cookie|biscuit|brownie|muffin|pudding|ice cream|gelato|sorbet|tart|cheesecake|donut|doughnut|fudge|candy|sweets?|frosting|trifle|mousse|pastry|croissant|cinnamon roll|churros?|dessert)\b/i;
const DRINK = /\b(shake|milkshake|smoothie|latte|cappuccino|mocha|frapp\w*|juice|lemonade|cocktail|soda|tea|coffee|hot chocolate|drink|kombucha|kefir drink)\b/i;
const SAUCE = /\b(sauce|dip|dressing|condiment|spread|gravy|salsa|pesto|chutney|relish|marinade|seasoning|stock|broth base)\b/i;
const BREAKFASTY = /\b(porridge|oats?|oatmeal|overnight oats|granola|muesli|bircher|pancakes?|waffles?|crepes?|omelet+e?|scrambled|eggs? on|french toast|toast|yog(h)?urt|chia|smoothie bowl|breakfast|frittata|shakshuka|congee)\b/i;
const NOT_MEAL_SLOTS = new Set(['beverage', 'drink', 'dessert', 'side', 'appetizer', 'condiment', 'sauce']);

/**
 * How well a recipe suits a slot, 0–1; null = never put it there (cake or a shake as a main meal, a "Lunch Bowl"
 * at breakfast, a sauce anywhere). Snacks are looser: fruit, smoothies and small sweet things are allowed.
 */
export function slotFit(c: Pick<Candidate, 'name' | 'mealSlot' | 'tags'>, slotId: string): number | null {
  const text = `${c.name} ${(c.tags || []).join(' ')}`;
  const ms = (c.mealSlot || '').toLowerCase();
  if (SAUCE.test(c.name) || ms === 'condiment' || ms === 'sauce') return null;
  const hint = nameSlotHint(c.name);
  if (hint && hint !== slotId) return null;
  if (slotId === 'snack') {
    if (ms === 'snack') return 1;
    if (DESSERT.test(text) || ms === 'dessert') return 0.4;
    if (DRINK.test(c.name) || ms === 'beverage' || ms === 'side' || ms === 'appetizer') return 0.7;
    return ['breakfast', 'lunch', 'dinner'].includes(ms) ? 0.3 : 0.6;
  }
  // Main meals: no desserts, drinks or sides.
  if (NOT_MEAL_SLOTS.has(ms) || DESSERT.test(text) || (DRINK.test(c.name) && !/\bbowl\b/i.test(c.name))) return null;
  const breakfasty = BREAKFASTY.test(c.name) || ms === 'breakfast';
  if (slotId === 'breakfast') return breakfasty ? 1 : 0.15; // mains (poutine, curry) only when nothing breakfast-like fits
  if (ms === 'breakfast' || /\bbreakfast\b/i.test(c.name)) return null;
  if (breakfasty) return 0.25;
  if (ms === slotId) return 1;
  return ms === 'lunch' || ms === 'dinner' ? 0.8 : 0.7;
}

/* ── scoring ── */
const HAZARD_WEIGHT = { high: 1, moderate: 0.4, low: 0.1, trace: 0 } as const;
/** Hazard penalty per serving: high 1, moderate 0.4, low 0.1 (half for hazards the catalog has not assessed). */
export function hazardPenalty(hazards: RecipeHazard[]): number {
  return hazards.reduce((sum, h) => sum + HAZARD_WEIGHT[h.level] * (h.assessed ? 1 : 0.5), 0);
}

/** Share of the tier's daily values met (each nutrient capped at 100%), 0–1. */
export function coverageScore(micros: Record<string, number>, macros: { protein_g?: number; fiber_g?: number }, defs: NutrientDef[]): number {
  const withDv = defs.filter((d) => d.dv);
  if (!withDv.length) return 0;
  const amount = (d: NutrientDef) => d.key === 'protein_g' ? macros.protein_g || 0 : d.key === 'fiber_g' ? macros.fiber_g || 0 : micros[d.key] || 0;
  return withDv.reduce((sum, d) => sum + Math.min(1, amount(d) / d.dv!), 0) / withDv.length;
}

interface DayTotals { micros: Record<string, number>; kcal: number; protein: number; fiber: number }
const emptyDay = (): DayTotals => ({ micros: {}, kcal: 0, protein: 0, fiber: 0 });
function addTo(day: DayTotals, c: Candidate): DayTotals {
  const micros = { ...day.micros };
  for (const [k, v] of Object.entries(c.micros)) micros[k] = (micros[k] || 0) + v;
  return { micros, kcal: day.kcal + (c.nutrition?.energy_kcal || 0), protein: day.protein + (c.nutrition?.protein_g || 0), fiber: day.fiber + (c.nutrition?.fiber_g || 0) };
}
const dayCoverage = (d: DayTotals, defs: NutrientDef[]) => coverageScore(d.micros, { protein_g: d.protein, fiber_g: d.fiber }, defs);

export interface ScoreParts { total: number; health: number; gain: number; kcalFit: number; slot: number; hazard: number }
/**
 * A candidate's score for a slot on a day: health score, the coverage it adds to the day (gaps first),
 * how close it lands to the slot's kcal share, slot fit, minus hazards.
 */
export function scoreFor(c: Candidate, slotId: string, day: DayTotals, defs: NutrientDef[], slotKcal: number): ScoreParts | null {
  const slot = slotFit(c, slotId);
  if (slot == null || !c.nutrition || c.nutrition.energy_kcal <= 0) return null;
  const health = (c.healthScore ?? 55) / 100;
  const gain = Math.max(0, dayCoverage(addTo(day, c), defs) - dayCoverage(day, defs)); // 0–~0.5
  const kcalFit = Math.max(0, 1 - Math.abs(c.nutrition.energy_kcal - slotKcal) / slotKcal);
  const hazard = hazardPenalty(c.hazards);
  const total = 0.7 * health + 1.6 * gain + 0.35 * kcalFit + 0.7 * slot - 0.12 * hazard - (health < 0.4 ? 0.5 : 0);
  return { total, health, gain, kcalFit, slot, hazard };
}

export interface DayReport { day: number; kcal: number; protein: number; coverage: number; gaps: NutrientDef[]; hazards: string[] }
export interface PlanResult { plan: DietConfig['plan']; days: DayReport[]; ideas: RecipeIdea[] }

/**
 * Fill the week. Greedy per day (slots in meal order), every pick checked against: not already used that day,
 * used at most `maxPerWeek` times, slot fit; then one swap pass per day toward the kcal/protein targets.
 * Existing (Guardian-chosen) cells are kept.
 */
export function planWeek(cfg: DietConfig, candidates: Candidate[], tier: Tier, opts: { maxPerWeek?: number; tolerance?: number; nutrientDefs?: NutrientDef[] } = {}): Omit<PlanResult, 'ideas'> {
  const maxPerWeek = opts.maxPerWeek ?? 2;
  const tol = opts.tolerance ?? 0.1;
  const defs = opts.nutrientDefs || nutrientsForTier(tier);
  const slots = MEAL_SLOTS.filter((s) => cfg.slots.includes(s.id));
  const share = slots.reduce((sum, s) => sum + s.share, 0) || 1;
  const proteinTarget = cfg.kcal * cfg.protein / 100 / 4;
  const plan: DietConfig['plan'] = { ...cfg.plan };
  const weekCount = new Map<string, number>();
  for (const p of Object.values(plan)) if (p) weekCount.set(p.id, (weekCount.get(p.id) || 0) + 1);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const asCandidate = (p: MealPick | null | undefined): Candidate | null => (p ? byId.get(p.id) || { ...p, healthScore: null, mealSlot: null, tags: [], micros: {}, hazards: [], ingredientIds: [] } : null);
  const days: DayReport[] = [];
  // Variety: never the same recipe on consecutive days, and a second use in the week costs a little.
  const dayOf = new Map<string, number[]>();
  for (const [k, p] of Object.entries(plan)) if (p) dayOf.set(p.id, [...(dayOf.get(p.id) || []), Number(k.split(':')[0])]);
  const blocked = (id: string, day: number) => (weekCount.get(id) || 0) >= maxPerWeek || (dayOf.get(id) || []).some((d) => Math.abs(d - day) === 1);
  const use = (id: string, day: number, delta: 1 | -1) => {
    weekCount.set(id, (weekCount.get(id) || 0) + delta);
    dayOf.set(id, delta > 0 ? [...(dayOf.get(id) || []), day] : (dayOf.get(id) || []).filter((d, i, a) => i !== a.indexOf(day)));
  };

  for (const { day } of WEEK) {
    let totals = emptyDay();
    const usedToday = new Set<string>();
    for (const s of slots) { const c = asCandidate(plan[`${day}:${s.id}`]); if (c) { totals = addTo(totals, c); usedToday.add(c.id); } }
    for (const s of slots) {
      const key = `${day}:${s.id}`;
      if (plan[key] || mealIsFasting(cfg,day,s.id)) continue;
      const slotKcal = cfg.kcal * s.share / share;
      let best: { c: Candidate; score: number } | null = null;
      for (const c of candidates) {
        if (usedToday.has(c.id) || blocked(c.id, day)) continue;
        const sc = scoreFor(c, s.id, totals, defs, slotKcal);
        const total = sc ? sc.total - 0.2 * (weekCount.get(c.id) || 0) : 0;
        if (sc && (!best || total > best.score)) best = { c, score: total };
      }
      if (!best) continue;
      plan[key] = toPick(best.c);
      usedToday.add(best.c.id); use(best.c.id, day, 1);
      totals = addTo(totals, best.c);
    }
    // Swap pass: if the day misses kcal or protein by more than the tolerance, replace the slot whose swap helps most.
    const off = (t: DayTotals) => Math.abs(t.kcal - cfg.kcal) / cfg.kcal + Math.max(0, proteinTarget - t.protein) / proteinTarget;
    for (let pass = 0; pass < 2 && (Math.abs(totals.kcal - cfg.kcal) / cfg.kcal > tol || totals.protein < proteinTarget * (1 - tol)); pass++) {
      let bestSwap: { key: string; c: Candidate; totals: DayTotals; gain: number } | null = null;
      for (const s of slots) {
        const key = `${day}:${s.id}`;
        const cur = asCandidate(plan[key]);
        if (!cur || cfg.plan[key] || mealIsFasting(cfg,day,s.id)) continue; // never replace a Guardian's own pick
        const without = slots.reduce((t, x) => { const c = x.id === s.id ? null : asCandidate(plan[`${day}:${x.id}`]); return c ? addTo(t, c) : t; }, emptyDay());
        for (const c of candidates) {
          if (c.id === cur.id || usedToday.has(c.id) || blocked(c.id, day) || slotFit(c, s.id) == null || !c.nutrition || (c.healthScore ?? 55) < 40) continue;
          const next = addTo(without, c);
          const gain = off(totals) - off(next) + 0.3 * (dayCoverage(next, defs) - dayCoverage(totals, defs));
          if (gain > 0.02 && (!bestSwap || gain > bestSwap.gain)) bestSwap = { key, c, totals: next, gain };
        }
      }
      if (!bestSwap) break;
      const old = plan[bestSwap.key]!;
      usedToday.delete(old.id); use(old.id, day, -1);
      plan[bestSwap.key] = toPick(bestSwap.c);
      usedToday.add(bestSwap.c.id); use(bestSwap.c.id, day, 1);
      totals = bestSwap.totals;
    }
    days.push(dayReport(day, slots.map((s) => asCandidate(plan[`${day}:${s.id}`])).filter(Boolean) as Candidate[], defs));
  }
  return { plan, days };
}

export function dayReport(day: number, meals: Candidate[], defs: NutrientDef[]): DayReport {
  const t = meals.reduce(addTo, emptyDay());
  const cov = defs.map(def => { const amount = def.key === 'protein_g' ? t.protein : def.key === 'fiber_g' ? t.fiber : t.micros[def.key]; return { def, pct: amount != null && def.dv ? amount / def.dv * 100 : null }; });
  return {
    day, kcal: Math.round(t.kcal), protein: Math.round(t.protein), coverage: Math.round(dayCoverage(t, defs) * 100),
    gaps: cov.filter((c) => c.def.dv && (c.pct ?? 0) < 50).map((c) => c.def),
    hazards: [...new Set(meals.flatMap((m) => m.hazards.filter((h) => h.level === 'high' && h.assessed).map((h) => h.label)))],
  };
}

export function toPick(c: Candidate): MealPick {
  return { source: c.source, id: c.id, name: c.name, image: c.image, nutrition: c.nutrition, healthScore: c.healthScore,
    hazardFlags: c.hazards.filter((h) => h.level === 'high' || h.level === 'moderate').slice(0, 3).map((h) => ({ label: h.label, level: h.level })) };
}

/* ── recipe ideas for gaps the catalog cannot fill ── */
export interface IdeaIngredient { id: string; name: string; per100: Record<string, number>; kcal100: number; hazards: RecipeHazard[] | ReturnType<typeof ingredientHazards>; animal: 'none' | 'dairy_egg' | 'fish' | 'meat' }
export interface RecipeIdea { title: string; ingredients: string[]; covers: string[]; brief: string }

const animalOf = (id: string, name: string): IdeaIngredient['animal'] => {
  const s = `${id} ${name}`.toLowerCase();
  if (/dairy|milk|cheese|yog|butter|egg/.test(s) && /animal|dairy|egg|cheese|milk/.test(s)) return 'dairy_egg';
  if (/fish|salmon|tuna|sardine|mackerel|shrimp|prawn|seafood|cod|anchov/.test(s)) return 'fish';
  if (/^animal_|beef|pork|lamb|chicken|turkey|liver|bacon|ham\b|veal|duck/.test(s)) return 'meat';
  return 'none';
};
const allowedFor = (f: DietFramework, a: IdeaIngredient['animal']) =>
  f.id === 'vegan' ? a === 'none' : f.id === 'vegetarian' ? a === 'none' || a === 'dairy_egg' : f.id === 'pescatarian' ? a !== 'meat' : true;

/**
 * Ingredients that best cover the missing nutrients per 100 kcal, with the fewest hazards, grouped into a few
 * recipe ideas (3–4 ingredients each). Each idea carries an AI brief for the recipe builder.
 */
export function ideasForGaps(gaps: NutrientDef[], pool: IdeaIngredient[], framework: DietFramework, count = 3): RecipeIdea[] {
  const targets = gaps.filter((g) => g.dv).slice(0, 12);
  if (!targets.length) return [];
  const value = (i: IdeaIngredient, g: NutrientDef) => Math.min(1, (i.per100[g.key] || 0) / g.dv!) / Math.max(0.3, i.kcal100 / 100);
  // Garnishes (herbs, spices, seaweed sheets, powders) score high per kcal but are eaten by the gram: not a recipe base.
  const GARNISH = /\b(leaves?|herbs?|spice|seasoning|nori|kombu|dulse|kelp|powder|extract|salt|pepper|vinegar|sauce|oil|essence|zest|flakes)\b/i;
  const ranked = pool.filter((i) => allowedFor(framework, i.animal) && i.kcal100 >= 20 && !GARNISH.test(i.name))
    .map((i) => ({ i, score: targets.reduce((s, g) => s + value(i, g), 0) - 0.5 * hazardPenalty(i.hazards as RecipeHazard[]) }))
    .filter((x) => x.score > 0.05).sort((a, b) => b.score - a.score);
  const ideas: RecipeIdea[] = [];
  const used = new Set<string>();
  for (let n = 0; n < count; n++) {
    const picks: IdeaIngredient[] = [];
    const covered = new Set<string>();
    for (const { i } of ranked) {
      if (picks.length >= 4) break;
      if (used.has(i.id) || picks.some((p) => p.name.split(' ')[0] === i.name.split(' ')[0])) continue;
      const adds = targets.filter((g) => !covered.has(g.key) && value(i, g) > 0.15);
      if (!adds.length && picks.length) continue;
      picks.push(i); adds.forEach((g) => covered.add(g.key));
    }
    if (picks.length < 2) break;
    picks.forEach((p) => used.add(p.id));
    const covers = targets.filter((g) => covered.has(g.key)).map((g) => g.label);
    const names = picks.map((p) => p.name);
    const tidy = (n: string) => n.replace(/\b(fresh|raw|whole|dried|cooked|boiled)\b/gi, '').replace(/\s+/g, ' ').trim();
    const mains = [...picks].sort((a, b) => b.kcal100 - a.kcal100).slice(0, 2).map((p) => tidy(p.name));
    ideas.push({
      title: `${mains.join(' & ')} ${/lentil|bean|chickpea|pea\b/i.test(mains.join(' ')) ? 'stew' : 'bowl'}`,
      ingredients: names, covers,
      brief: `Create a ${framework.label.toLowerCase()} recipe built around ${names.join(', ')}. It should be rich in ${covers.join(', ')}. Keep it simple, under 30 minutes, whole-food ingredients.`,
    });
  }
  return ideas;
}

/* ── loading (junction records) ── */
const rest = () => `https://${projectId}.supabase.co/rest/v1`;
const get = async (accessToken: string, path: string) => {
  const res = await fetch(`${rest()}/${path}`, { headers: { apikey: publicAnonKey, Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Catalog read failed (${res.status})`);
  return res.json();
};
const chunks = <T,>(list: T[], n: number) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));
// Ids are encoded: some catalog ids carry characters (#, &, spaces) that otherwise break the query string.
const inList = (ids: string[]) => `in.(${ids.map((id) => encodeURIComponent(`"${id.replace(/"/g, '')}"`)).join(',')})`;
const per100Kcal = (row: any) => Number(row?.nutrition_per_100g?.energy_kcal ?? row?.elements_beneficial?.per_100g?.calories ?? 0) || 0;

const cache = new Map<string, Promise<{ candidates: Candidate[]; pool: IdeaIngredient[] }>>();

/**
 * Catalog recipes for a framework (stored nutrition, not fast food), with per-serving micronutrients and hazards
 * built from catalog_recipe_ingredients × ingredient data. Cached per framework for the page's life.
 */
export function loadCandidates(accessToken: string, framework: DietFramework, onProgress?: (msg: string) => void) {
  const key = framework.id;
  if (!cache.has(key)) cache.set(key, (async () => {
    onProgress?.('Loading recipes…');
    const params = ['is_published=eq.true', 'select=id,name_common,image_url,nutrition_per_serving,health_score,meal_slot,tags,servings', 'nutrition_per_serving=not.is.null',
      'is_group=not.is.true', `tags=not.cs.${encodeURIComponent('{"fast food"}')}`, 'order=health_score.desc.nullslast', 'limit=600'];
    if (framework.flag) params.push(`dietary_info->>${framework.flag}=eq.true`);
    const recipes = (await get(accessToken, `catalog_recipes?${params.join('&')}`)) as any[];
    onProgress?.(`Reading ingredients for ${recipes.length} recipes…`);
    const junction: any[] = [];
    for (const ids of chunks(recipes.map((r) => r.id), 60)) junction.push(...await get(accessToken, `catalog_recipe_ingredients?select=recipe_id,ingredient_id,amount_g,retention_factor&recipe_id=${inList(ids)}&limit=2000`));
    const ingredientIds = [...new Set(junction.map((j) => j.ingredient_id).filter(Boolean))] as string[];
    onProgress?.(`Reading nutrients and hazards for ${ingredientIds.length} ingredients…`);
    const ingredients = new Map<string, any>();
    for (const ids of chunks(ingredientIds, 60)) for (const row of await get(accessToken, `catalog_ingredients?select=id,name_common,nutrition_per_100g,elements_beneficial,elements_hazardous&id=${inList(ids)}`)) ingredients.set(row.id, row);
    const byRecipe = new Map<string, any[]>();
    for (const j of junction) byRecipe.set(j.recipe_id, [...(byRecipe.get(j.recipe_id) || []), j]);
    const candidates = recipes.map((r): Candidate => {
      const servings = Math.max(1, Number(r.servings) || 1);
      const rows = byRecipe.get(r.id) || [];
      const micros: Record<string, number> = {};
      const items: Array<{ name: string; grams: number; hazards: ReturnType<typeof ingredientHazards> }> = [];
      for (const j of rows) {
        const ing = ingredients.get(j.ingredient_id);
        const grams = (Number(j.amount_g) || 0) * (Number(j.retention_factor) || 1);
        if (!ing || !grams) continue;
        for (const [k, v] of Object.entries(canonicalMicros(ing))) micros[k] = (micros[k] || 0) + v * grams / 100 / servings;
        items.push({ name: ing.name_common, grams, hazards: ingredientHazards(ing) });
      }
      return {
        source: 'catalog', id: r.id, name: r.name_common || 'Recipe', image: r.image_url || null, nutrition: toMealNutrition(r.nutrition_per_serving),
        healthScore: typeof r.health_score === 'number' ? r.health_score : null, mealSlot: r.meal_slot || null, tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
        micros, hazards: recipeHazards(items, servings), ingredientIds: rows.map((j) => j.ingredient_id),
      };
    }).filter((c) => c.nutrition);
    const pool: IdeaIngredient[] = [...ingredients.values()].map((row) => ({ id: row.id, name: row.name_common, per100: canonicalMicros(row), kcal100: per100Kcal(row), hazards: ingredientHazards(row), animal: animalOf(row.id, row.name_common || '') }));
    return { candidates, pool };
  })().catch((e) => { cache.delete(key); throw e; }));
  return cache.get(key)!;
}

/** Guardian recipes as candidates (nutrition from their saved per-serving values; micros from saved ingredient data). */
export function guideCandidates(recipes: GuideRecipe[]): Candidate[] {
  return recipes.map((r) => {
    const servings = Math.max(1, Number(r.servings) || 1);
    const micros: Record<string, number> = {};
    for (const i of (r.ingredients || []) as any[]) for (const [k, v] of Object.entries(i?.per100?.micros || {})) micros[k] = (micros[k] || 0) + (v as number) * (Number(i.grams) || 0) / 100 / servings;
    return { source: 'guide' as const, id: r.id, name: r.title, image: r.image_url || null, nutrition: toMealNutrition(r.nutrition_per_serving), healthScore: null, mealSlot: r.meal_slot, tags: [], micros, hazards: [], ingredientIds: [] };
  }).filter((c) => c.nutrition);
}

/** Auto-fill entry point for the planner. */
export async function smartFill(accessToken: string, cfg: DietConfig, guideRecipes: GuideRecipe[], tier: Tier, onProgress?: (msg: string) => void, catalogNutrients: NutrientDef[] = []): Promise<PlanResult> {
  const framework = DIET_FRAMEWORKS.find((f) => f.id === cfg.framework) || DIET_FRAMEWORKS[0];
  const { candidates, pool } = await loadCandidates(accessToken, framework, onProgress);
  onProgress?.('Choosing the week…');
  const result = planWeek(cfg, [...guideCandidates(guideRecipes), ...candidates], tier, { nutrientDefs: nutrientsForTier(tier,catalogNutrients) });
  // Gaps most days share become recipe ideas.
  const counts = new Map<string, { def: NutrientDef; n: number }>();
  for (const d of result.days) for (const g of d.gaps) counts.set(g.key, { def: g, n: (counts.get(g.key)?.n || 0) + 1 });
  const common = [...counts.values()].filter((x) => x.n >= 3).sort((a, b) => b.n - a.n).map((x) => x.def);
  return { ...result, ideas: ideasForGaps(common, pool, framework) };
}
