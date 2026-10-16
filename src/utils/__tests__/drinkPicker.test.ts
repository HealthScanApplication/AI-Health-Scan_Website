import { afterEach, expect, it, vi } from 'vitest';
import { DIET_FRAMEWORKS, guideRecipeToPick, isDrinkPick, searchDietRecipes } from '../protocolBuilders';

afterEach(() => vi.unstubAllGlobals());

it('filters drink searches in the database before the result limit and retains drink identity', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    const query = new URL(url).searchParams;
    expect(query.get('and')).toBe('(or(is_group.is.null,is_group.eq.false),or(category.ilike.drink,category.ilike.beverage))');
    expect(query.get('is_published')).toBe('eq.true');
    expect(query.get('select')).toContain('category');
    return Response.json([{ id: 'water', name_common: 'Water', category: 'Drink', nutrition_per_serving: { energy_kcal: 0 } }]);
  });
  const results = await searchDietRecipes('token', { framework: DIET_FRAMEWORKS[0], drinksOnly: true, limit: 1 });
  expect(results).toHaveLength(1);
  expect(isDrinkPick(results[0])).toBe(true);
});

it('uses explicit recipe classification, not drink words in meal names', () => {
  const own = (meal_slot: string, title: string) => guideRecipeToPick({ id: 'private', meal_slot, title } as any);
  expect(isDrinkPick(own('drink', 'Homemade infusion'))).toBe(true);
  expect(isDrinkPick(own('dessert', 'Watermelon cake'))).toBe(false);
  expect(isDrinkPick(own('any', 'Water'))).toBe(false);
  expect(isDrinkPick({ ...own('drink', 'Spring Water'), category: 'Beverage' })).toBe(true);
});
