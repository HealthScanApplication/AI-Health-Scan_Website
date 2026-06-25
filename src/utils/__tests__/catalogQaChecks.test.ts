import { describe, it, expect } from 'vitest';
import {
  duplicateRecipeNames,
  recipeCompleteness,
  mealSlotMismatch,
  imageCoverage,
  genericDescriptions,
  riskBadgeSanity,
  placeholderImages,
  type QaRecipe,
} from '../catalogQaChecks';

const recipe = (over: Partial<QaRecipe>): QaRecipe => ({
  id: Math.random().toString(36).slice(2),
  name_common: 'Wild Salmon Bowl',
  meal_slot: 'lunch',
  image_url: 'https://cdn.example.com/a.jpg',
  description: 'A genuinely specific, factual description that is well over the forty character minimum length.',
  instructions: [{ step: 'do' }, { step: 'thing' }],
  servings: 2,
  nutrition_per_serving: { calories: 400 },
  health_score: 80,
  elements_hazardous: [],
  tags: [],
  ...over,
});

describe('duplicateRecipeNames (DEV-312)', () => {
  it('flags case/space-insensitive duplicate names, not uniques', () => {
    const out = duplicateRecipeNames([
      recipe({ id: 'a', name_common: 'Apple Pie' }),
      recipe({ id: 'b', name_common: 'apple pie ' }),
      recipe({ id: 'c', name_common: 'Unique Dish' }),
    ]);
    expect(out.count).toBe(1);
    expect(out.offenders[0].detail).toContain('2 records');
  });
});

describe('recipeCompleteness (DEV-314)', () => {
  it('flags <2 ingredients / no steps / no servings / no nutrition / no score', () => {
    const counts = new Map([['ok', 3], ['bad', 1]]);
    const out = recipeCompleteness([
      recipe({ id: 'ok' }),
      recipe({ id: 'bad', instructions: [], servings: null, nutrition_per_serving: null, nutrition_per_100g: null, health_score: 0 }),
    ], counts);
    expect(out.count).toBe(1);
    expect(out.offenders[0].id).toBe('bad');
    expect(out.offenders[0].detail).toContain('no steps');
    expect(out.offenders[0].detail).toContain('no nutrition');
  });
});

describe('mealSlotMismatch (DEV-313/326)', () => {
  it('flags a dessert-looking name in a main slot', () => {
    const out = mealSlotMismatch([recipe({ id: 'x', name_common: 'Chocolate Cake', meal_slot: 'lunch' })]);
    expect(out.offenders.map((o) => o.id)).toContain('x');
  });
  it('flags slot-only names masquerading as dishes', () => {
    const out = mealSlotMismatch([recipe({ id: 'y', name_common: 'Anti-Inflammatory Dinner', meal_slot: 'dinner' })]);
    expect(out.offenders.map((o) => o.id)).toContain('y');
  });
  it('does not flag a real lunch dish', () => {
    const out = mealSlotMismatch([recipe({ id: 'z', name_common: 'Wild Salmon Bowl', meal_slot: 'lunch' })]);
    expect(out.offenders.map((o) => o.id)).not.toContain('z');
  });
});

describe('imageCoverage (DEV-315)', () => {
  it('counts missing images and computes pct', () => {
    const out = imageCoverage('recipes', [
      { id: '1', image_url: 'https://x/a.jpg' },
      { id: '2', image_url: '' },
      { id: '3', image_url: null },
      { id: '4', image_url: 'https://x/b.jpg' },
    ]);
    expect(out.missing).toBe(2);
    expect(out.total).toBe(4);
    expect(out.pct).toBe(50);
  });
});

describe('genericDescriptions (DEV-316)', () => {
  it('flags the "commonly enjoyed" generic class + too-short', () => {
    const out = genericDescriptions([
      recipe({ id: 'g', description: 'Apple pie is a dish commonly enjoyed in various cuisines.' }),
      recipe({ id: 's', description: 'short' }),
      recipe({ id: 'ok' }),
    ]);
    const ids = out.offenders.map((o) => o.id);
    expect(ids).toContain('g');
    expect(ids).toContain('s');
    expect(ids).not.toContain('ok');
  });
});

describe('riskBadgeSanity (DEV-317)', () => {
  it('flags badge-vs-junction drift and near-duplicate divergence', () => {
    const elementCount = new Map([['drift', 0], ['d1', 5], ['d2', 5]]);
    const out = riskBadgeSanity([
      recipe({ id: 'drift', name_common: 'Drifty', elements_hazardous: [1, 2, 3] }), // badge>0, junction 0
      recipe({ id: 'd1', name_common: 'Twin Dish', elements_hazardous: [1, 2, 3, 4, 5, 6, 7, 8] }),
      recipe({ id: 'd2', name_common: 'twin dish', elements_hazardous: [1] }), // spread 7 > 2
    ], elementCount);
    const ids = out.offenders.map((o) => o.id);
    expect(ids).toContain('drift');
    expect(ids).toContain('d1'); // near-dup divergence reported on group head
  });
});

describe('placeholderImages (DEV-315)', () => {
  it('flags placeholder + non-https urls, ignores empty (covered by coverage)', () => {
    const out = placeholderImages([
      recipe({ id: 'p', image_url: 'https://x/placeholder.png' }),
      recipe({ id: 'h', image_url: 'http://x/a.jpg' }),
      recipe({ id: 'e', image_url: '' }),
      recipe({ id: 'ok', image_url: 'https://x/real.jpg' }),
    ]);
    const ids = out.offenders.map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(['p', 'h']));
    expect(ids).not.toContain('e');
    expect(ids).not.toContain('ok');
  });
});
