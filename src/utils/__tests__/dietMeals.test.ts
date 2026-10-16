import { it, expect } from 'vitest';
import { planMealItems, reviewDiet, saveDietProtocol, sumNutrition, toMealNutrition, type DietConfig, type MealPick } from '../protocolBuilders';
import { vi } from 'vitest';

const water: MealPick = { id: 'water-recipe', source: 'catalog', name: 'Water', image: null, nutrition: { energy_kcal: 0, protein_g: 0, carbohydrates_g: 0, fats_g: 0 }, servings: 2 };
const config: DietConfig = { framework: 'balanced', kcal: 2000, protein: 20, carbs: 50, fat: 30, slots: ['breakfast'], plan: {}, drinks: { breakfast: [] }, drinkPlan: { '1:breakfast': [water] } };

it('retains zero-calorie recipes and distinguishes absent macros from recorded zero', () => {
  expect(toMealNutrition({ energy_kcal: 0, protein_g: 0 })).toMatchObject({ energy_kcal: 0, recorded: ['energy_kcal', 'protein_g'] });
  expect(toMealNutrition({})).toBeNull();
});
it('multiplies stored macros by selected servings', () => {
  expect(sumNutrition([{ ...water, servings: 1.5, nutrition: { energy_kcal: 100, protein_g: 10, carbohydrates_g: 5, fats_g: 2 } }])).toMatchObject({ energy_kcal: 150, protein_g: 15, carbohydrates_g: 7.5, fats_g: 3 });
});
it('creates a recipe-linked drink-only meal slot and retains serving quantity', () => {
  const plans = planMealItems(config);
  expect(plans).toHaveLength(1);
  expect(plans[0].children).toEqual([expect.objectContaining({ role: 'drink', recipeId: 'water-recipe', servings: 2 })]);
});
it('preserves text-only drinks in existing saved plans without assigning invented IDs', () => {
  const plans = planMealItems({ ...config, plan: { '1:breakfast': { ...water, name: 'Oats' } }, drinkPlan: {}, drinks: { breakfast: ['Green tea'] } });
  expect(plans[0].children[1]).toMatchObject({ role: 'drink', title: 'Green tea', recipeId: null });
});
it('flags selected drink conflicts against meal rules', () => {
  const review = reviewDiet({ ...config, drinkPlan: { '1:breakfast': [{ ...water, name: 'Coffee' }] }, rules: ['Avoid caffeine'] });
  expect(review.conflicts.some((c) => c.item === 'Coffee')).toBe(true);
});
it('blocks invalid serving quantities before writing anything', async () => {
  vi.stubGlobal('fetch', () => { throw Error('Unexpected network call before serving validation'); });
  try { await expect(saveDietProtocol('token','owner',null,'Bad serving',{ ...config, drinkPlan: { '1:breakfast': [{ ...water, servings: -2 }] } })).rejects.toThrow(/serving/i); }
  finally { vi.unstubAllGlobals(); }
});
it('saves a linked drink and its servings, and retains the complete reloadable builder configuration', async () => {
  const writes: any[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    if (init?.method === 'POST' || init?.method === 'PATCH') writes.push({ url, ...body });
    return Response.json(url.includes('/rpc/') ? null : init?.method === 'POST' || init?.method === 'PATCH' ? [{ id: 'qa-protocol', user_id: 'owner', ...body }] : []);
  });
  try {
    await saveDietProtocol('token','owner',null,'Water plan',config);
    expect(writes).toEqual(expect.arrayContaining([expect.objectContaining({ catalog_recipe_id: 'water-recipe', subtype: 'drink', amount: 2, amount_unit: 'serving' }), expect.objectContaining({ builder_config: config })]));
  } finally { vi.unstubAllGlobals(); }
});
