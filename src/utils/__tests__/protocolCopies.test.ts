import { describe, it, expect } from 'vitest';
import { copyBuilderConfig, privateRecipeFields } from '../protocolCopies';

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
});
