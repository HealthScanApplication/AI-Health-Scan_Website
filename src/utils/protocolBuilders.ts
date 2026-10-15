/*
 * Guardian Diet + Fitness builders.
 *
 * Both builders write ordinary `protocols` / `protocol_items` rows so the app, the editor and the
 * PDF read them like any other Protocol. Meals are recipe items, sessions are activity items with
 * their exercises as child items (sets/reps/rest), and each item repeats weekly on its weekday
 * (recurrence_days_of_week, 0 = Sun). Only the builder's own settings (framework, targets, goal,
 * the weekly plan) are kept on the protocol in builder_config / builder_kind.
 *
 * Nutrition is never estimated: catalog recipes use their stored nutrition_per_serving and guide
 * recipes the per-serving values the recipe builder calculated from catalog ingredients.
 */
import { projectId, publicAnonKey } from './supabase/info';
import {
  createProtocol, createProtocolItem, deleteProtocolItem, listProtocolItems, updateProtocol,
  type AdminProtocol, type AdminProtocolItem,
} from './protocolAdmin';
import type { GuideRecipe } from './guidePortal';
import { isBedName, isWakeName } from './sleepWindow';
import { END_SLEEP, START_SLEEP, enforceProtocolRules, isRuleTitle, type RuleIssue, type RuleStep } from './protocolRules';

const rest = () => `https://${projectId}.supabase.co/rest/v1`;
const headers = (accessToken: string, extra: Record<string, string> = {}) => ({
  apikey: publicAnonKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...extra,
});

export type BuilderKind = 'diet' | 'fitness' | 'personal';

/* ── shared week ── */
export const WEEK = [
  { day: 1, short: 'Mon', dow: 1 }, { day: 2, short: 'Tue', dow: 2 }, { day: 3, short: 'Wed', dow: 3 },
  { day: 4, short: 'Thu', dow: 4 }, { day: 5, short: 'Fri', dow: 5 }, { day: 6, short: 'Sat', dow: 6 }, { day: 7, short: 'Sun', dow: 0 },
];

/* ── timing: every item is checked off at a clock time or relative to an anchor ── */
export type Anchor = 'clock' | 'wake' | 'bed';
export interface Timing { anchor: Anchor; time: string; offset: number } // offset minutes: + after wake, − before bed
export const DEFAULT_WAKE = '07:00';
export const DEFAULT_BED = '22:30';
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const toHHMM = (min: number) => { const v = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };
/** The clock time the app shows; anchors resolve against the protocol's wake and bedtime. */
export function resolveTiming(t: Timing, wake = DEFAULT_WAKE, bed = DEFAULT_BED): string {
  if (t.anchor === 'wake') return toHHMM(toMin(wake) + Math.abs(t.offset));
  if (t.anchor === 'bed') return toHHMM(toMin(bed) - Math.abs(t.offset));
  return t.time;
}
export function describeTiming(t: Timing): string {
  if (t.anchor === 'wake') return `${Math.abs(t.offset)} min after waking`;
  if (t.anchor === 'bed') return `${Math.abs(t.offset)} min before bed`;
  return t.time;
}

/* ── diet ── */
export interface MealNutrition { energy_kcal: number; protein_g: number; carbohydrates_g: number; fats_g: number; fiber_g?: number }
export interface MealPick { source: 'catalog' | 'guide'; id: string; name: string; image: string | null; nutrition: MealNutrition | null }
export interface DietFramework { id: string; label: string; protein: number; carbs: number; fat: number; flag: string | null; note: string }

/** Macro splits are % of energy; `flag` is the catalog_recipes.dietary_info key a recipe must have set to true. */
export const DIET_FRAMEWORKS: DietFramework[] = [
  { id: 'balanced', label: 'Balanced', protein: 20, carbs: 50, fat: 30, flag: null, note: 'Whole-food plate, no exclusions.' },
  { id: 'mediterranean', label: 'Mediterranean', protein: 18, carbs: 47, fat: 35, flag: null, note: 'Olive oil, fish, legumes, vegetables, whole grains.' },
  { id: 'vegan', label: 'Vegan', protein: 18, carbs: 55, fat: 27, flag: 'vegan', note: 'Only recipes tagged vegan in the database.' },
  { id: 'vegetarian', label: 'Vegetarian', protein: 18, carbs: 52, fat: 30, flag: 'vegetarian', note: 'No meat or fish.' },
  { id: 'pescatarian', label: 'Pescatarian', protein: 22, carbs: 45, fat: 33, flag: 'pescatarian', note: 'Fish and seafood, no meat.' },
  { id: 'keto', label: 'Keto', protein: 20, carbs: 5, fat: 75, flag: 'keto', note: 'Carbohydrate ≤ 10% of energy per recipe.' },
  { id: 'low_carb', label: 'Low-carb', protein: 25, carbs: 20, fat: 55, flag: 'low_carb', note: 'Carbohydrate ≤ 26% of energy per recipe.' },
  { id: 'high_protein', label: 'High-protein', protein: 35, carbs: 40, fat: 25, flag: null, note: 'Recipes ranked by protein per kcal.' },
  { id: 'gluten_free', label: 'Gluten-free', protein: 20, carbs: 50, fat: 30, flag: 'gluten_free', note: 'Only recipes marked gluten-free.' },
  { id: 'dairy_free', label: 'Dairy-free', protein: 20, carbs: 50, fat: 30, flag: 'dairy_free', note: 'Only recipes marked dairy-free.' },
  { id: 'low_fodmap', label: 'Low-FODMAP', protein: 20, carbs: 48, fat: 32, flag: 'low_fodmap', note: 'Uses the low_fodmap flag; check each recipe until the catalog tags it everywhere.' },
];

export const MEAL_SLOTS = [
  { id: 'breakfast', label: 'Breakfast', time: '08:00', share: 0.25 },
  { id: 'lunch', label: 'Lunch', time: '12:30', share: 0.35 },
  { id: 'snack', label: 'Snack', time: '15:30', share: 0.1 },
  { id: 'dinner', label: 'Dinner', time: '18:30', share: 0.3 },
];

export interface DietConfig {
  framework: string;
  kcal: number;
  protein: number; carbs: number; fat: number; // % of energy
  slots: string[];
  plan: Record<string, MealPick | null>; // key `${day}:${slot}`
  timing?: Record<string, Timing>;         // per meal slot; default = the slot's clock time
  rules?: string[];                        // the week's Meal group checklist (framework do's)
  mealRules?: Record<string, string[]>;    // do-checklist under every meal of that slot
}

export const FRAMEWORK_RULES: Record<string, string[]> = {
  mediterranean: ['Cook with extra-virgin olive oil', 'Eat fish twice this week', 'Fill half the plate with vegetables'],
  vegan: ['Take vitamin B12 as advised', 'Include a legume at lunch or dinner'],
  keto: ['Keep carbohydrate under 20–50 g a day', 'Salt food to taste and drink water'],
  low_carb: ['Choose vegetables over bread, pasta and rice'],
  high_protein: ['Include a protein source at every meal'],
  low_fodmap: ['Avoid onion and garlic', 'Check labels for high-FODMAP sweeteners'],
  gluten_free: ['Check labels for hidden gluten'],
};
export const mealTiming = (cfg: DietConfig, slotId: string): Timing => cfg.timing?.[slotId] || { anchor: 'clock', time: MEAL_SLOTS.find((s) => s.id === slotId)?.time || '12:00', offset: 0 };

export function macroGrams(cfg: Pick<DietConfig, 'kcal' | 'protein' | 'carbs' | 'fat'>) {
  return { energy_kcal: cfg.kcal, protein_g: Math.round(cfg.kcal * cfg.protein / 100 / 4), carbohydrates_g: Math.round(cfg.kcal * cfg.carbs / 100 / 4), fats_g: Math.round(cfg.kcal * cfg.fat / 100 / 9) };
}

const n = (v: unknown) => { const x = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN; return Number.isFinite(x) ? x : 0; };
export function toMealNutrition(raw: any): MealNutrition | null {
  if (!raw || typeof raw !== 'object') return null;
  const kcal = n(raw.energy_kcal) || n(raw.calories);
  if (!kcal) return null;
  return { energy_kcal: kcal, protein_g: n(raw.protein_g), carbohydrates_g: n(raw.carbohydrates_g), fats_g: n(raw.fats_g ?? raw.fat_g), fiber_g: n(raw.fiber_g) };
}

export function sumNutrition(picks: (MealPick | null | undefined)[]): MealNutrition {
  const out: MealNutrition = { energy_kcal: 0, protein_g: 0, carbohydrates_g: 0, fats_g: 0, fiber_g: 0 };
  for (const p of picks) if (p?.nutrition) for (const k of Object.keys(out) as (keyof MealNutrition)[]) out[k] = (out[k] || 0) + (p.nutrition[k] || 0);
  return out;
}

export function guideRecipeToPick(recipe: GuideRecipe): MealPick {
  return { source: 'guide', id: recipe.id, name: recipe.title, image: recipe.image_url || null, nutrition: toMealNutrition(recipe.nutrition_per_serving) };
}

/** Catalog recipes with stored per-serving nutrition that fit the framework, sized for the slot's kcal budget. */
export async function searchDietRecipes(accessToken: string, opts: { framework: DietFramework; query?: string; kcalTarget?: number; limit?: number }): Promise<MealPick[]> {
  const params = [
    'select=id,name_common,image_url,nutrition_per_serving,dietary_info,health_score',
    'nutrition_per_serving=not.is.null',
    'or=(is_group.is.null,is_group.eq.false)',
    'order=health_score.desc.nullslast',
    `limit=${opts.query ? 40 : 160}`,
  ];
  if (opts.framework.flag) params.push(`dietary_info->>${opts.framework.flag}=eq.true`);
  const q = opts.query?.replace(/[%,()*]/g, ' ').trim();
  if (q) params.push(`name_common=ilike.*${encodeURIComponent(q)}*`);
  const res = await fetch(`${rest()}/catalog_recipes?${params.join('&')}`, { headers: headers(accessToken) });
  if (!res.ok) throw new Error(`Recipe search failed (${res.status})`);
  const rows = (await res.json()) as any[];
  let picks = rows.map((r) => ({ source: 'catalog' as const, id: r.id, name: r.name_common || 'Recipe', image: r.image_url || null, nutrition: toMealNutrition(r.nutrition_per_serving) }))
    .filter((p) => p.nutrition);
  if (opts.kcalTarget) {
    const t = opts.kcalTarget;
    const fit = (p: MealPick) => Math.abs((p.nutrition!.energy_kcal - t) / t) - (opts.framework.id === 'high_protein' ? p.nutrition!.protein_g * 4 / p.nutrition!.energy_kcal : 0);
    picks = picks.sort((a, b) => fit(a) - fit(b));
  }
  return picks.slice(0, opts.limit || 12);
}

/** Fill every empty day × slot with the best-fitting recipe, preferring variety (no repeat within 3 days). */
export async function autoFillDiet(accessToken: string, cfg: DietConfig, guideRecipes: GuideRecipe[]): Promise<Record<string, MealPick | null>> {
  const framework = DIET_FRAMEWORKS.find((f) => f.id === cfg.framework) || DIET_FRAMEWORKS[0];
  const plan = { ...cfg.plan };
  const slots = MEAL_SLOTS.filter((s) => cfg.slots.includes(s.id));
  const shareTotal = slots.reduce((sum, s) => sum + s.share, 0) || 1;
  const own = guideRecipes.map(guideRecipeToPick).filter((p) => p.nutrition);
  for (const slot of slots) {
    const target = cfg.kcal * slot.share / shareTotal;
    const pool = [...own.filter((p) => Math.abs(p.nutrition!.energy_kcal - target) / target < 0.35), ...await searchDietRecipes(accessToken, { framework, kcalTarget: target, limit: 21 })];
    if (!pool.length) continue;
    WEEK.forEach(({ day }, index) => {
      const key = `${day}:${slot.id}`;
      if (plan[key]) return;
      const recent = new Set([1, 2, 3].map((back) => plan[`${day - back}:${slot.id}`]?.id).filter(Boolean));
      plan[key] = pool.find((p, i) => i >= index % pool.length && !recent.has(p.id)) || pool.find((p) => !recent.has(p.id)) || pool[0];
    });
  }
  return plan;
}

/* ── fitness ── */
export interface ActivityPick { id: string; name: string; image: string | null; category: string | null; minutes: number | null }
export interface ExercisePick extends ActivityPick { sets: number | null; reps: string | null; rest_seconds: number | null }
export interface FitnessSession { day: number; time: string; anchor?: Anchor; offset?: number; rules?: string[]; title: string; minutes: number; intensity: 'low' | 'moderate' | 'high'; exercises: ExercisePick[] }
export interface FitnessConfig { goal: string; level: 'beginner' | 'intermediate' | 'advanced'; minutes: number; sessions: FitnessSession[]; rules?: string[] }
export const sessionTiming = (s: FitnessSession): Timing => ({ anchor: s.anchor || 'clock', time: s.time, offset: s.offset || 0 });

type Template = { title: string; categories: string[]; terms: string[]; intensity: FitnessSession['intensity'] };
export interface FitnessGoal { id: string; label: string; note: string; days: number[]; pattern: Template[] }

const STRENGTH_UPPER: Template = { title: 'Train upper body', categories: ['Strength', 'Gym', 'Calisthenics'], terms: ['push', 'press', 'row', 'pull'], intensity: 'moderate' };
const STRENGTH_LOWER: Template = { title: 'Train lower body', categories: ['Strength', 'Gym', 'Calisthenics'], terms: ['squat', 'lunge', 'deadlift', 'bridge'], intensity: 'moderate' };
const FULL_BODY: Template = { title: 'Train full body', categories: ['Strength', 'Gym', 'Calisthenics'], terms: ['squat', 'push', 'row', 'plank'], intensity: 'moderate' };
const CARDIO: Template = { title: 'Do steady cardio', categories: ['Cardio', 'Sports'], terms: ['walk', 'run', 'cycl', 'swim'], intensity: 'moderate' };
const HIIT: Template = { title: 'Do intervals', categories: ['Hiit', 'Cardio', 'Calisthenics'], terms: ['burpee', 'climber', 'jump', 'sprint'], intensity: 'high' };
const MOBILITY: Template = { title: 'Practise mobility', categories: ['Stretch', 'Recovery', 'Yoga'], terms: ['hip', 'hamstring', 'shoulder', 'spine'], intensity: 'low' };

/** Weekly splits per goal; days are WEEK.day numbers (1 = Mon). */
export const FITNESS_GOALS: FitnessGoal[] = [
  { id: 'weight_loss', label: 'Weight loss', note: 'Strength to keep muscle plus regular cardio for energy use.', days: [1, 2, 4, 5, 6], pattern: [FULL_BODY, CARDIO, FULL_BODY, HIIT, CARDIO] },
  { id: 'muscle_gain', label: 'Muscle gain', note: 'Upper/lower split with progressive load and recovery days.', days: [1, 2, 4, 5], pattern: [STRENGTH_UPPER, STRENGTH_LOWER, STRENGTH_UPPER, STRENGTH_LOWER] },
  { id: 'endurance', label: 'Endurance', note: 'Mostly easy aerobic volume, one interval day, one strength day.', days: [1, 3, 4, 6], pattern: [CARDIO, HIIT, FULL_BODY, { ...CARDIO, title: 'Do a long easy session' }] },
  { id: 'mobility', label: 'Mobility', note: 'Daily short mobility with gentle strength twice a week.', days: [1, 2, 3, 4, 5, 6], pattern: [MOBILITY, FULL_BODY, MOBILITY, MOBILITY, FULL_BODY, MOBILITY] },
  { id: 'general', label: 'General fitness', note: 'Balanced week: strength, cardio and mobility.', days: [1, 3, 5], pattern: [FULL_BODY, CARDIO, MOBILITY] },
];

const LEVEL = { beginner: { sets: 2, reps: '10', rest: 90, exercises: 3 }, intermediate: { sets: 3, reps: '8–12', rest: 75, exercises: 4 }, advanced: { sets: 4, reps: '6–10', rest: 60, exercises: 5 } };

export async function searchActivities(accessToken: string, opts: { query?: string; categories?: string[]; limit?: number }): Promise<ActivityPick[]> {
  const params = ['select=id,name,image_url,primary_image_url,category,default_duration_min', 'or=(is_group.is.null,is_group.eq.false)', `limit=${opts.limit || 12}`, 'order=health_score.desc.nullslast'];
  if (opts.categories?.length) params.push(`category=in.(${opts.categories.map((c) => `"${c}"`).join(',')})`);
  const q = opts.query?.replace(/[%,()*]/g, ' ').trim();
  if (q) params.push(`name=ilike.*${encodeURIComponent(q)}*`);
  const res = await fetch(`${rest()}/catalog_activities?${params.join('&')}`, { headers: headers(accessToken) });
  if (!res.ok) throw new Error(`Activity search failed (${res.status})`);
  return ((await res.json()) as any[]).map((r) => ({ id: r.id, name: r.name, image: r.image_url || r.primary_image_url || null, category: r.category, minutes: r.default_duration_min ?? null }));
}

/** Build the goal's weekly split, filling each session with catalog exercises that match its pattern. */
export async function draftFitnessWeek(accessToken: string, goalId: string, level: FitnessConfig['level'], minutes: number): Promise<FitnessSession[]> {
  const goal = FITNESS_GOALS.find((g) => g.id === goalId) || FITNESS_GOALS[0];
  const dose = LEVEL[level];
  const used = new Set<string>();
  const sessions: FitnessSession[] = [];
  for (const [index, day] of goal.days.entries()) {
    const t = goal.pattern[index % goal.pattern.length];
    const exercises: ExercisePick[] = [];
    for (const term of t.terms) {
      if (exercises.length >= dose.exercises) break;
      const hits = await searchActivities(accessToken, { query: term, categories: t.categories, limit: 6 }).catch(() => []);
      const hit = hits.find((h) => !used.has(h.id) && !exercises.some((e) => e.id === h.id)) || hits.find((h) => !exercises.some((e) => e.id === h.id));
      if (!hit) continue;
      used.add(hit.id);
      const timed = /cardio|sports|stretch|recovery|yoga/i.test(hit.category || '');
      exercises.push({ ...hit, sets: timed ? null : dose.sets, reps: timed ? null : dose.reps, rest_seconds: timed ? null : dose.rest, minutes: timed ? Math.round(minutes / Math.max(1, t.terms.length / 2)) : null });
    }
    sessions.push({ day, time: '07:00', anchor: 'wake', offset: 30, rules: t.intensity === 'low' ? [] : ['Warm up for 5 minutes'], title: t.title, minutes, intensity: level === 'beginner' && t.intensity === 'high' ? 'moderate' : t.intensity, exercises });
  }
  return sessions;
}

/* ── saving ── */
const hhmmss = (t: string) => (t.length === 5 ? `${t}:00` : t);
const weekly = (day: number) => ({ recurrence_type: 'weekly', recurrence_days_of_week: [WEEK.find((w) => w.day === day)?.dow ?? 1] });

async function clearItems(accessToken: string, protocolId: string) {
  const items = await listProtocolItems(accessToken, protocolId);
  // Children first so no parent is deleted under a live child.
  for (const it of [...items].sort((a, b) => Number(!!b.parent_protocol_item_id) - Number(!!a.parent_protocol_item_id))) await deleteProtocolItem(accessToken, it.id);
}

/** Store builder settings; older databases without the columns still get the items (settings live in memory only). */
async function saveBuilderMeta(accessToken: string, id: string, patch: Record<string, unknown>): Promise<boolean> {
  try { await updateProtocol(accessToken, id, patch as Partial<AdminProtocol>); return true; } catch (error) {
    if (/builder_|source_protocol_ids|42703|PGRST204/.test(String((error as Error).message))) return false;
    throw error;
  }
}

/* ── shared item rules + review (protocolRules.ts is the single checker; conflicts are flagged, never auto-resolved) ── */
export interface RuleList { dos: string[]; donts: string[] }
/** "Avoid added sugar" / "No coffee after 2pm" → don't ("Added sugar"); anything else → do. Uses the shared isRuleTitle. */
export function splitRules(lines: string[]): RuleList {
  const out: RuleList = { dos: [], donts: [] };
  for (const raw of lines.map((x) => x.trim()).filter(Boolean)) {
    if (isRuleTitle(raw)) out.donts.push(raw.replace(/^(avoid|no|skip|don'?t|do not|cut out|cut)\s+/i, '').replace(/^./, (c) => c.toUpperCase()));
    else out.dos.push(raw);
  }
  return out;
}

export interface Conflict { rule: string; item: string; where: string; reason: string }
export interface ReviewNote { where: string; message: string }
export interface CheckedStep extends RuleStep { key: string }
export interface Review { steps: Record<string, CheckedStep>; notes: ReviewNote[]; conflicts: Conflict[]; weekRules: RuleList }

// Interim subject tags for flagging only. Replace with the shared resolveConflicts once it is approved and built.
const SUBJECTS: { tag: string; rule: RegExp; item: RegExp }[] = [
  { tag: 'sugar', rule: /sugar|sweet/i, item: /sugar|honey|syrup|cake|cookie|biscuit|candy|chocolate|dessert|brownie|jam|caramel/i },
  { tag: 'caffeine', rule: /caffeine|coffee/i, item: /coffee|espresso|latte|cappuccino|\btea\b|matcha|cola|energy drink/i },
  { tag: 'alcohol', rule: /alcohol|wine|beer/i, item: /wine|beer|cocktail|spirit|liqueur|gin|vodka|rum/i },
  { tag: 'meat', rule: /\bmeat|red meat|pork|beef/i, item: /beef|pork|lamb|bacon|ham|sausage|chicken|turkey|veal|mince|steak|faggot/i },
  { tag: 'dairy', rule: /dairy|milk|cheese/i, item: /milk|cheese|yog(h)?urt|cream|butter|paneer|kefir/i },
  { tag: 'gluten', rule: /gluten|wheat|bread/i, item: /bread|baguette|pasta|wheat|couscous|bulgur|pizza|wrap|bagel|cake/i },
  { tag: 'fried food', rule: /fried|deep[- ]fr/i, item: /fried|nugget|chips|fries|tempura|crispy/i },
  { tag: 'processed food', rule: /processed|ultra[- ]processed|fast food/i, item: /nugget|sausage|bacon|ham|crisps|instant/i },
];
const DAYS_RE: [RegExp, number][] = [[/\bmon(day)?s?\b/i, 1], [/\btue(s(day)?)?s?\b/i, 2], [/\bwed(nesday)?s?\b/i, 3], [/\bthu(rs(day)?)?s?\b/i, 4], [/\bfri(day)?s?\b/i, 5], [/\bsat(urday)?s?\b/i, 6], [/\bsun(day)?s?\b/i, 7]];

/** A don't (or a "rest on Sunday" do) that an item in the same plan breaks. Flags only — the Guardian decides. */
export function findConflicts(rules: { text: string; scope: string; isDont: boolean }[], items: { title: string; where: string; day?: number; kind: 'meal' | 'session' | 'item' }[]): Conflict[] {
  const out: Conflict[] = [];
  for (const rule of rules) {
    if (rule.isDont) for (const subject of SUBJECTS) {
      if (!subject.rule.test(rule.text)) continue;
      for (const it of items) if (subject.item.test(it.title)) out.push({ rule: `Avoid ${rule.text.replace(/^avoid\s+/i, '').replace(/^./, (c) => c.toLowerCase())}`, item: it.title, where: it.where, reason: `${it.title} may contain ${subject.tag} (${rule.scope})` });
    }
    if (/\b(rest|recover|no (training|exercise|workout))\b/i.test(rule.text)) {
      const days = DAYS_RE.filter(([re]) => re.test(rule.text)).map(([, d]) => d);
      for (const it of items) if (it.kind === 'session' && it.day && days.includes(it.day)) out.push({ rule: rule.text, item: it.title, where: it.where, reason: `${it.title} is scheduled on a rest day` });
    }
  }
  return out.filter((c, i) => out.findIndex((x) => x.rule === c.rule && x.item === c.item && x.where === c.where) === i);
}

const ruleRows = (list: RuleList, scope: string) => [...list.dos.map((text) => ({ text, scope, isDont: false })), ...list.donts.map((text) => ({ text, scope, isDont: true }))];
const notesOf = (steps: CheckedStep[], where: (s: CheckedStep) => string): ReviewNote[] =>
  steps.flatMap((s) => (s.issues || []).map((i: RuleIssue) => ({ where: where(s), message: i.code === 'renamed' ? `${i.message} → “${s.title}”` : i.message })));

/** Every diet meal through the shared checker: dish name, a time, rule children; plus flagged contradictions. */
export function reviewDiet(cfg: DietConfig): Review {
  const slots = MEAL_SLOTS.filter((x) => cfg.slots.includes(x.id));
  const steps: CheckedStep[] = [];
  for (const { day } of WEEK) for (const slot of slots) {
    const pick = cfg.plan[`${day}:${slot.id}`];
    if (!pick) continue;
    const t = mealTiming(cfg, slot.id);
    const rules = splitRules(cfg.mealRules?.[slot.id] || []);
    steps.push({ key: `${day}:${slot.id}`, title: pick.name, group: 'meal', time: resolveTiming(t), notes: '', dos: rules.dos, donts: rules.donts, windowKey: String(day), link: { kind: 'food', query: pick.name } });
  }
  const checked = enforceProtocolRules(steps);
  const label = (s: CheckedStep) => { const [d, slot] = s.key.split(':'); return `${WEEK.find((w) => w.day === Number(d))?.short} ${MEAL_SLOTS.find((m) => m.id === slot)?.label}`; };
  const weekRules = splitRules(cfg.rules || []);
  const items = checked.map((s) => ({ title: s.title, where: label(s), day: Number(s.key.split(':')[0]), kind: 'meal' as const }));
  const conflicts = [
    ...findConflicts(ruleRows(weekRules, 'week Meal checklist'), items),
    ...slots.flatMap((slot) => findConflicts(ruleRows(splitRules(cfg.mealRules?.[slot.id] || []), `${slot.label} checklist`), items.filter((i) => i.where.endsWith(slot.label)))),
  ];
  return { steps: Object.fromEntries(checked.map((s) => [s.key, s])), notes: notesOf(checked, label), conflicts, weekRules };
}

/** Every fitness session through the shared checker: verb + noun title, a time, rule children; plus flagged contradictions. */
export function reviewFitness(cfg: FitnessConfig): Review {
  const steps: CheckedStep[] = cfg.sessions.map((s, i) => {
    const rules = splitRules(s.rules || []);
    const anchor = s.anchor === 'wake' ? 'wake' : s.anchor === 'bed' ? 'bedtime' : null;
    return { key: String(i), title: s.title, group: 'fitness', time: anchor ? null : s.time, anchor, offsetMinutes: anchor ? (s.offset || 0) : null, durationMinutes: s.minutes, notes: '', dos: rules.dos, donts: rules.donts, windowKey: String(s.day), link: s.exercises[0] ? { kind: 'activity', query: s.exercises[0].name } : null };
  });
  const checked = enforceProtocolRules(steps);
  const label = (s: CheckedStep) => { const session = cfg.sessions[Number(s.key)]; return `${WEEK.find((w) => w.day === session.day)?.short} ${session.title}`; };
  const weekRules = splitRules(cfg.rules || []);
  const items = cfg.sessions.flatMap((s) => [{ title: s.title, where: WEEK.find((w) => w.day === s.day)!.short, day: s.day, kind: 'session' as const }, ...s.exercises.map((e) => ({ title: e.name, where: `${WEEK.find((w) => w.day === s.day)!.short} ${s.title}`, day: s.day, kind: 'item' as const }))]);
  const conflicts = [
    ...findConflicts(ruleRows(weekRules, 'week Fitness checklist'), items),
    ...cfg.sessions.flatMap((s) => findConflicts(ruleRows(splitRules(s.rules || []), `${s.title} checklist`), items.filter((i) => i.day === s.day))),
  ];
  return { steps: Object.fromEntries(checked.map((s) => [s.key, s])), notes: notesOf(checked, label), conflicts, weekRules };
}

/** Combine review: the chosen protocols' top-level steps through the checker (notes only, nothing rewritten) plus rule-vs-item conflicts across protocols. */
export function reviewCombined(itemsByProtocol: { name: string; items: AdminProtocolItem[] }[]): { notes: ReviewNote[]; conflicts: Conflict[] } {
  const groupOf = (it: AdminProtocolItem) => it.category === 'sleep' ? 'sleep' : it.category === 'consume' ? 'meal' : it.subtype === 'exercise' ? 'fitness' : it.category || 'do';
  const steps: CheckedStep[] = itemsByProtocol.flatMap(({ name, items }) => items.filter((it) => !it.parent_protocol_item_id && it.kind === 'action').map((it) => ({
    key: `${name}|${it.id}`, title: it.display_name || '', group: groupOf(it), time: it.scheduled_time?.slice(0, 5) || null, notes: '', dos: [], donts: [], windowKey: name,
  })));
  // Sleep is checked across the combined plan (one window) so duplicate wake/bed items show up.
  const checked = enforceProtocolRules(steps.map((s) => s.group === 'sleep' ? { ...s, windowKey: 'all' } : s));
  const notes = notesOf(checked, (s) => s.key.split('|')[0]);
  const rules = itemsByProtocol.flatMap(({ name, items }) => items.filter((it) => it.kind === 'rule_dont' || it.kind === 'rule_do').map((it) => ({ text: it.display_name || '', scope: name, isDont: it.kind === 'rule_dont' || isRuleTitle(it.display_name || '') })));
  const actions = itemsByProtocol.flatMap(({ name, items }) => items.filter((it) => it.kind === 'action').map((it) => ({ title: it.display_name || '', where: name, day: it.recurrence_days_of_week?.length === 1 ? (WEEK.find((w) => w.dow === it.recurrence_days_of_week![0])?.day) : undefined, kind: (it.subtype === 'exercise' && !it.parent_protocol_item_id ? 'session' : it.category === 'consume' ? 'meal' : 'item') as 'session' | 'meal' | 'item' })));
  return { notes, conflicts: findConflicts(rules, actions) };
}

/** Do's as checkable rule_do items: under a parent item (its do-checklist) or top-level in a group (that group's checklist). */
async function addRules(accessToken: string, protocolId: string, rules: string[] | RuleList | undefined, opts: { parentId?: string | null; group?: string | null; category: string; days?: number[]; next: () => number }) {
  const list = Array.isArray(rules) || !rules ? splitRules(rules || []) : rules;
  const all = [...list.dos.map((t) => ['rule_do', t]), ...list.donts.map((t) => ['rule_dont', t])];
  for (const [kind, rule] of all) await createProtocolItem(accessToken, {
    protocol_id: protocolId, display_name: rule, kind, item_type: 'activity', category: opts.category, subtype: null,
    parent_protocol_item_id: opts.parentId || null, group_name: opts.parentId ? null : opts.group || null, scheduled_time: null, day_number: 1,
    sort_order: opts.next() , has_children: false, enabled: true, hidden: false, notes: '',
    ...(opts.days ? { recurrence_type: 'weekly', recurrence_days_of_week: opts.days } : { recurrence_type: 'daily' }),
  } as Partial<AdminProtocolItem>);
}

/** Run the item writes; on failure the error carries the protocol id so a retry updates the same protocol. */
async function withProtocol<T>(protocol: AdminProtocol, work: () => Promise<T>): Promise<T> {
  try { return await work(); } catch (error) { throw Object.assign(error as Error, { protocolId: protocol.id }); }
}

async function ensureProtocol(accessToken: string, ownerId: string, existingId: string | null, name: string, extra: Partial<AdminProtocol>) {
  if (existingId) return updateProtocol(accessToken, existingId, { name, ...extra });
  return createProtocol(accessToken, { user_id: ownerId, name, total_days: 7, ...extra });
}

export async function saveDietProtocol(accessToken: string, ownerId: string, existingId: string | null, name: string, cfg: DietConfig) {
  const framework = DIET_FRAMEWORKS.find((f) => f.id === cfg.framework) || DIET_FRAMEWORKS[0];
  const t = macroGrams(cfg);
  const protocol = await ensureProtocol(accessToken, ownerId, existingId, name, { category: 'Nutrition', description: `${framework.label} · ${t.energy_kcal} kcal/day · P ${t.protein_g} g · C ${t.carbohydrates_g} g · F ${t.fats_g} g` });
  return withProtocol(protocol, async () => {
  await clearItems(accessToken, protocol.id);
  const review = reviewDiet(cfg);
  let order = 0;
  for (const { day } of WEEK) for (const slot of MEAL_SLOTS.filter((s) => cfg.slots.includes(s.id))) {
    const pick = cfg.plan[`${day}:${slot.id}`];
    const step = review.steps[`${day}:${slot.id}`];
    if (!pick || !step) continue;
    const nut = pick.nutrition;
    const timing = mealTiming(cfg, slot.id);
    const slotRules = { dos: step.dos, donts: step.donts };
    const meal = await createProtocolItem(accessToken, {
      protocol_id: protocol.id, display_name: step.title, kind: 'action', item_type: 'recipe', category: 'consume', subtype: 'meal',
      group_name: slot.label, scheduled_time: hhmmss(step.time || resolveTiming(timing)), day_number: 1, sort_order: order++, enabled: true, hidden: false, has_children: slotRules.dos.length + slotRules.donts.length > 0,
      catalog_recipe_id: pick.source === 'catalog' ? pick.id : null, media_image_url: pick.image,
      notes: nut ? `${Math.round(nut.energy_kcal)} kcal · P ${Math.round(nut.protein_g)} g · C ${Math.round(nut.carbohydrates_g)} g · F ${Math.round(nut.fats_g)} g per serving${pick.source === 'guide' ? ' · Guardian recipe' : ''}${timing.anchor !== 'clock' ? ` · ${describeTiming(timing)}` : ''}` : '',
      ...weekly(day),
    } as Partial<AdminProtocolItem>);
    await addRules(accessToken, protocol.id, slotRules, { parentId: meal.id, category: 'consume', days: weekly(day).recurrence_days_of_week, next: () => order++ });
  }
  await addRules(accessToken, protocol.id, review.weekRules, { group: 'Meal', category: 'consume', next: () => order++ });
  const saved = await saveBuilderMeta(accessToken, protocol.id, { builder_kind: 'diet', builder_config: cfg });
  return { protocol, metaSaved: saved };
  });
}

export async function saveFitnessProtocol(accessToken: string, ownerId: string, existingId: string | null, name: string, cfg: FitnessConfig) {
  const goal = FITNESS_GOALS.find((g) => g.id === cfg.goal) || FITNESS_GOALS[0];
  const protocol = await ensureProtocol(accessToken, ownerId, existingId, name, { category: 'Fitness', description: `${goal.label} · ${cfg.level} · ${cfg.sessions.length} sessions/week` });
  return withProtocol(protocol, async () => {
  await clearItems(accessToken, protocol.id);
  const review = reviewFitness(cfg);
  let order = 0;
  for (const [index, s] of cfg.sessions.map((x, i) => [i, x] as const).sort((a, b) => a[1].day - b[1].day)) {
    const step = review.steps[String(index)];
    const parent = await createProtocolItem(accessToken, {
      protocol_id: protocol.id, display_name: step?.title || s.title, kind: 'action', item_type: 'activity', category: 'do', subtype: 'exercise',
      scheduled_time: hhmmss(step?.time || resolveTiming(sessionTiming(s))), duration_minutes: s.minutes, intensity: s.intensity, day_number: 1, sort_order: order++,
      catalog_activity_id: s.exercises[0]?.id || null, media_image_url: s.exercises[0]?.image || null,
      has_children: s.exercises.length > 0 || !!(step?.dos.length || step?.donts.length), enabled: true, hidden: false,
      notes: [s.anchor && s.anchor !== 'clock' ? describeTiming(sessionTiming(s)) : '', s.exercises.map((e) => e.name).join(' · ')].filter(Boolean).join(' · '), ...weekly(s.day),
    } as Partial<AdminProtocolItem>);
    for (const e of s.exercises) await createProtocolItem(accessToken, {
      protocol_id: protocol.id, parent_protocol_item_id: parent.id, display_name: e.name, kind: 'action', item_type: 'activity', category: 'do', subtype: 'exercise',
      catalog_activity_id: e.id, sets: e.sets, reps: e.reps ? parseInt(e.reps, 10) || null : null, reps_display: e.reps, rest_seconds: e.rest_seconds,
      duration_minutes: e.minutes, day_number: 1, sort_order: order++, has_children: false, enabled: true, hidden: false, notes: '', ...weekly(s.day),
    } as Partial<AdminProtocolItem>);
    await addRules(accessToken, protocol.id, step ? { dos: step.dos, donts: step.donts } : s.rules, { parentId: parent.id, category: 'do', days: weekly(s.day).recurrence_days_of_week, next: () => order++ });
  }
  await addRules(accessToken, protocol.id, review.weekRules, { group: 'Fitness', category: 'do', next: () => order++ });
  const saved = await saveBuilderMeta(accessToken, protocol.id, { builder_kind: 'fitness', builder_config: cfg });
  return { protocol, metaSaved: saved };
  });
}

/* ── combine ── */
export interface Clash { day: string; time: string; names: string[] }

/** Items that start at the same time on the same weekday across the chosen protocols. */
export function findClashes(itemsByProtocol: AdminProtocolItem[][]): Clash[] {
  const slots = new Map<string, string[]>();
  for (const items of itemsByProtocol) for (const it of items) {
    if (it.parent_protocol_item_id || !it.scheduled_time) continue;
    const days = it.recurrence_type === 'weekly' && it.recurrence_days_of_week?.length ? it.recurrence_days_of_week : [0, 1, 2, 3, 4, 5, 6];
    for (const d of days) {
      const key = `${d}|${it.scheduled_time.slice(0, 5)}`;
      slots.set(key, [...(slots.get(key) || []), it.display_name || 'Step']);
    }
  }
  return [...slots.entries()].filter(([, names]) => names.length > 1)
    .map(([key, names]) => { const [d, time] = key.split('|'); return { day: WEEK.find((w) => w.dow === Number(d))!.short, time, names }; })
    .sort((a, b) => WEEK.findIndex((w) => w.short === a.day) - WEEK.findIndex((w) => w.short === b.day) || a.time.localeCompare(b.time));
}

const COPY_SKIP = new Set(['id', 'protocol_id', 'parent_protocol_item_id', 'created_at', 'updated_at']);

/** One personal Protocol that holds a copy of every chosen protocol's steps (children keep their parent). */
export async function combineProtocols(accessToken: string, ownerId: string, person: { name: string; lead_id?: string | null }, sources: AdminProtocol[]) {
  const protocol = await createProtocol(accessToken, {
    user_id: ownerId, name: `${person.name} · Personal Protocol`, category: 'Health', total_days: Math.max(7, ...sources.map((s) => s.total_days || 7)),
    description: `Combined from ${sources.map((s) => s.name).join(' + ')}`,
  });
  let order = 0;
  // One sleep pair: the first protocol's Start/End sleep wins; later ones (and their rules) are skipped.
  const sleepRole = (it: AdminProtocolItem) => it.parent_protocol_item_id || it.kind !== 'action' ? null
    : isWakeName(it.display_name || '') ? 'wake' : (it.category === 'sleep' || isBedName(it.display_name || '')) ? 'bed' : null;
  const haveSleep = new Set<string>();
  for (const source of sources) {
    const items = await listProtocolItems(accessToken, source.id);
    const idMap = new Map<string, string>();
    const skipped = new Set<string>();
    const parentsFirst = [...items].sort((a, b) => Number(!!a.parent_protocol_item_id) - Number(!!b.parent_protocol_item_id));
    const sourceRoles = new Set(items.map(sleepRole).filter(Boolean) as string[]);
    for (const it of parentsFirst) {
      const role = sleepRole(it);
      if (role && haveSleep.has(role)) { skipped.add(it.id); continue; }
      if (it.parent_protocol_item_id && skipped.has(it.parent_protocol_item_id)) { skipped.add(it.id); continue; }
      const copy: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(it)) if (!COPY_SKIP.has(k)) copy[k] = v;
      const created = await createProtocolItem(accessToken, {
        ...copy, protocol_id: protocol.id,
        parent_protocol_item_id: it.parent_protocol_item_id ? idMap.get(it.parent_protocol_item_id) || null : null,
        sort_order: order++, // unique per protocol (idx_protocol_items_no_dupes includes sort_order)
      } as Partial<AdminProtocolItem>);
      idMap.set(it.id, created.id);
    }
    sourceRoles.forEach((role) => haveSleep.add(role));
  }
  const sleepItem = (name: string, time: string) => createProtocolItem(accessToken, {
    protocol_id: protocol.id, display_name: name, kind: 'action', item_type: 'activity', category: 'sleep', subtype: 'sleep', scheduled_time: hhmmss(time),
    day_number: 1, sort_order: order++, has_children: false, enabled: true, hidden: false, notes: '', recurrence_type: 'daily',
  } as Partial<AdminProtocolItem>);
  if (!haveSleep.has('wake')) await sleepItem(END_SLEEP, DEFAULT_WAKE);
  if (!haveSleep.has('bed')) await sleepItem(START_SLEEP, DEFAULT_BED);
  const metaSaved = await saveBuilderMeta(accessToken, protocol.id, { builder_kind: 'personal', builder_config: { person }, source_protocol_ids: sources.map((s) => s.id) });
  return { protocol, metaSaved };
}

/** The builder settings of the owner's protocols (empty when the columns are not on this database yet). */
export async function listBuilderMeta(accessToken: string, ownerId: string): Promise<Record<string, { builder_kind: BuilderKind | null; builder_config: any }>> {
  const res = await fetch(`${rest()}/protocols?user_id=eq.${ownerId}&builder_kind=not.is.null&select=id,builder_kind,builder_config`, { headers: headers(accessToken) });
  if (!res.ok) return {};
  return Object.fromEntries(((await res.json()) as any[]).map((r) => [r.id, { builder_kind: r.builder_kind, builder_config: r.builder_config }]));
}
