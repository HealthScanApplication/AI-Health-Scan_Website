import { afterEach, describe, it, expect, vi } from 'vitest';
import { copyBuilderConfig, customizeProtocolRecipe, privateRecipeFields } from '../protocolCopies';
afterEach(() => vi.unstubAllGlobals());

describe('parent-scoped copies', () => {
  it('editing a child config cannot mutate the source template or another parent copy', () => {
    const original = { plan: { '1:lunch': { name: 'Soup' } }, sessions: [{ exercises: [{ reps: '10' }] }] };
    const a = copyBuilderConfig(original);
    const b = copyBuilderConfig(original);
    a.plan['1:lunch'].name = 'My soup';
    a.sessions[0].exercises[0].reps = '5';
    expect(original.plan['1:lunch'].name).toBe('Soup');
    expect(b.sessions[0].exercises[0].reps).toBe('10');
  });
  it('customising even a published recipe creates a private owner copy', () => {
    const row = privateRecipeFields({ id: 'shared', name_common: 'Soup', is_published: true, created_by_user_id: 'someone', ingredients: [{ name: 'Peas' }] }, 'me', 'private-id');
    expect(row).toMatchObject({ id: 'private-id', name_common: 'Soup', created_by_user_id: 'me', cloned_from_recipe_id: 'shared', is_published: false });
    expect(row).not.toHaveProperty('created_at');
  });
  it('keeps micronutrients stored separately from the ingredient macros', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ id: 'private-guide', ingredients: [{ name: 'Liver', per100: { energy_kcal: 180, protein_g: 10 }, per100_source: { nutrition_per_100g: { energy_kcal: 180, protein_g: 10 }, elements_beneficial: { per_100g: { vitamins: { vitamin_b12_mcg: 3 } } } } }] }), { status: 200 }));
    const recipe = await customizeProtocolRecipe('token','parent','item');
    expect((recipe.ingredients[0] as any).per100.micros?.vitamin_b12_mcg).toBe(3);
    expect((recipe.ingredients[0] as any).per100.protein_g).toBe(10);
  });
});
