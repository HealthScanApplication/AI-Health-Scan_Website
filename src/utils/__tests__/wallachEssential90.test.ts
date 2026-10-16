import { expect, it, vi } from 'vitest';
import { loadEssential90, nutrientsForTier, gaps, coverage, filtersToBrief } from '../recipeNutrients';

it('renders exactly the historical core 90 without macro, fatty-acid-form or phytonutrient duplicates', () => {
  const defs = nutrientsForTier(90);
  expect(defs).toHaveLength(90);
  expect(new Set(defs.map(d => d.key)).size).toBe(90);
  expect(defs.some(d => ['protein_g','fiber_g','dha_g','epa_g','coq10_mg','lycopene_mg','monounsaturated_g','amygdalin_mg'].includes(d.key))).toBe(false);
  expect(defs.find(d => d.key === 'flavonoids_mg')?.label).toContain('Flavonoids');
  expect(defs.find(d => d.key === 'silica_mg')?.label).toBe('Silica');
});

it('never turns historical-only membership into a recipe enrichment instruction', () => {
  const brief = filtersToBrief({ diets: [], useIngredients: [], avoidIngredients: [], boost: ['arsenic_mcg','beryllium_mcg','iron_mg'], limit: [] });
  expect(brief).not.toContain('Arsenic');
  expect(brief).not.toContain('Beryllium');
  expect(brief).toContain('Iron');
});

it('allows historical membership without changing hazard status or recommending hazardous/unknown-target substances', async () => {
  vi.stubGlobal('fetch', async () => Response.json([
    { id: 'arsenic', name_common: 'Arsenic', category: 'Hazardous', is_beneficial: false, essential_90: 'true', nutrient_key: 'arsenic_ppb', daily_value_amount: 100, daily_value_unit: 'mg' },
    { id: 'calcium_propionate', name_common: 'Calcium Propionate', category: 'Hazardous', essential_90: 'true', nutrient_key: 'calcium_mg' },
    { id: 'menaquinone_vitamin_k2', name_common: 'Vitamin K2', category: 'Beneficial', essential_90: 'true', nutrient_key: 'vitamin_k2_mcg' },
  ]));
  try {
    const defs = await loadEssential90();
    expect(nutrientsForTier(90,defs)).toHaveLength(90);
    expect(defs.find(d => d.key === 'arsenic_mcg')?.dv).toBeNull();
    expect(defs.some(d => d.label === 'Calcium Propionate')).toBe(false);
    expect(defs.some(d => d.label === 'Vitamin K2')).toBe(false);
    const wanted = gaps(coverage({}, {}, 90,defs));
    expect(wanted.some(d => d.key === 'arsenic_mcg')).toBe(false);
    expect(wanted.some(d => d.key === 'calcium_mg')).toBe(true);
  } finally { vi.unstubAllGlobals(); }
});
