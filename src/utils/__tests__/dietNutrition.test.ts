import { expect, it, vi } from 'vitest';
import { aggregateDiet, loadDietAnalysis } from '../dietNutrition';
import type { DietConfig, MealPick } from '../protocolBuilders';
const meal: MealPick = { id: 'same', source: 'catalog', name: 'Meal', image: null, servings: 2, nutrition: { energy_kcal: 100, protein_g: 5, carbohydrates_g: 10, fats_g: 3 }, micros: { vitamin_c_mg: 10 }, hazards: [{ key: 'lead_mcg', label: 'Lead', total: 2, perServing: 1, level: 'low', sources: ['Rice'], reasons: [], assessed: true }] };
const drink: MealPick = { id: 'same', source: 'guide', name: 'Drink', image: null, servings: 0.5, nutrition: { energy_kcal: 20, protein_g: 0, carbohydrates_g: 4, fats_g: 0 }, micros: { vitamin_c_mg: 4 }, hazards: [{ ...meal.hazards![0], perServing: null, total: null, level: 'moderate', assessed: false }] };
const config: DietConfig = { framework: 'balanced', kcal: 2000, protein: 20, carbs: 50, fat: 30, slots: ['breakfast'], plan: { '1:breakfast': meal, '2:breakfast': meal }, drinks: { breakfast: [] }, drinkPlan: { '1:breakfast': [drink] } };
it('totals every meal and drink occurrence with servings, including micronutrients and all hazard levels', () => {
  const r = aggregateDiet(config);
  expect(r.week.nutrients.energy_kcal.amount).toBe(410);
  expect(r.week.nutrients.vitamin_c_mg.amount).toBe(42);
  expect(r.days[0].nutrients.energy_kcal.amount).toBe(210);
  expect(r.week.hazards[0]).toMatchObject({ amount: 4, level: 'moderate', unknown: 1, occurrences: 3 });
});
it('keeps missing nutrients unknown and flags legacy drinks instead of reporting complete zero totals', () => {
  const r = aggregateDiet({ ...config, plan: { '1:breakfast': { ...meal, nutrition: null, micros: undefined, hazards: undefined } }, drinkPlan: {}, drinks: { breakfast: ['Water'] } });
  expect(r.days[0].nutrients.energy_kcal).toMatchObject({ amount: null, known: 0 });
  expect(r.days[0].unlinked).toBe(1);
  expect(r.days[0].unassessed).toBe(2);
});
it('loads exact recipe IDs outside auto-fill results, applies zero retention, and preserves private recipe namespaces', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.includes('/catalog_recipes?')) return Response.json([{ id: 'same', servings: 2, nutrition_per_serving: { energy_kcal: 100 } }]);
    if (url.includes('/catalog_recipe_ingredients?')) return Response.json([{ recipe_id: 'same', ingredient_id: 'veg', amount_g: 100, retention_factor: 0 }]);
    if (url.includes('/catalog_ingredients?')) return Response.json([{ id: 'veg', name_common: 'Veg', nutrition_per_100g: { vitamin_c_mg: 100 }, elements_hazardous: {} }]);
    throw Error(url);
  });
  try {
    const result = await loadDietAnalysis('token', [meal, drink], [{ id: 'same', title: 'Drink', servings: 1, nutrition_per_serving: { energy_kcal: 20 }, ingredients: [{ grams: 100, per100: { micros: { vitamin_c_mg: 6 }, hazards: [] } }] } as any]);
    expect(result['catalog:same'].micros.vitamin_c_mg).toBe(0);
    expect(result['guide:same'].micros.vitamin_c_mg).toBe(6);
  } finally { vi.unstubAllGlobals(); }
});
it('preserves measured zero micronutrients and labels incomplete ingredient subtotals', async () => {
  const recipes = [{ id: 'same', servings: 1, nutrition_per_serving: { energy_kcal: 20 }, ingredients: [
    { name: 'Known', grams: 100, per100: { micros: { vitamin_c_mg: 0, calcium_mg: 10 }, hazards: [] } },
    { name: 'Unknown', grams: 100, per100: null },
  ] }] as any;
  const a = await loadDietAnalysis('token',[drink],recipes);
  const r = aggregateDiet({ ...config, plan: {}, drinkPlan: { '1:breakfast': [drink] } },a);
  expect(r.week.nutrients.vitamin_c_mg).toMatchObject({ amount: 0, partial: true });
  expect(r.week.nutrients.calcium_mg).toMatchObject({ amount: 5, partial: true });
});
it('propagates unknown hazard quantities and mixed assessment within a recipe', async () => {
  const hz = { key: 'lead_mcg', label: 'Lead', per100: 2, level: 'low', likelihood: 100, reason: '', assessed: true };
  const recipes = [{ id: 'same', servings: 1, ingredients: [
    { name: 'Measured', grams: 100, per100: { micros: {}, hazards: [hz] } },
    { name: 'Unquantified', grams: 100, per100: { micros: {}, hazards: [{ ...hz, per100: null, assessed: false }] } },
  ] }] as any;
  const a = await loadDietAnalysis('token',[drink],recipes);
  const r = aggregateDiet({ ...config, plan: {}, drinkPlan: { '1:breakfast': [drink] } },a);
  expect(r.week.hazards[0]).toMatchObject({ amount: 1, unknown: 1, assessed: false });
});
it('does not add concentrations or unitless hazards as though they were masses', () => {
  const r = aggregateDiet({ ...config, plan: { '1:breakfast': { ...meal, hazards: [{ ...meal.hazards![0], key: 'lead_ppm' }] } }, drinkPlan: {} });
  expect(r.week.hazards[0].amount).toBeNull();
});
it('keeps nutrient amounts unknown when ingredient weight is missing', async () => {
  const a = await loadDietAnalysis('token', [drink], [{ id: 'same', servings: 1, ingredients: [{ grams: null, per100: { micros: { calcium_mg: 100 }, hazards: [] } }] }] as any);
  expect(a['guide:same'].micros.calcium_mg).toBeUndefined();
});
it('does not round trace hazard quantities to zero', async () => {
  const a = await loadDietAnalysis('token', [drink], [{ id: 'same', servings: 1, ingredients: [{ grams: 100, per100: { micros: {}, hazards: [{ key: 'lead_mg', label: 'Lead', per100: 0.00001, level: 'trace', assessed: true }] } }] }] as any);
  expect(a['guide:same'].hazards[0].perServing).toBeCloseTo(0.00001, 8);
});
