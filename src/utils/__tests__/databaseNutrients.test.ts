import { expect, it, vi } from 'vitest';
import { canonicalMicros, loadEssential90, nutrientsForTier } from '../recipeNutrients';

it('uses catalog metadata in the 15/30 subsets, converts daily-value units and keeps unquantified essentials', async () => {
  vi.stubGlobal('fetch', async () => Response.json([
    { id: 'calcium', name_common: 'Calcium • Ca', nutrient_key: 'calcium_mg', category: 'Beneficial', essential_90: 'true', daily_value_amount: '1000', daily_value_unit: 'mg' },
    { id: 'copper', name_common: 'Copper • Cu', nutrient_key: 'copper_mg', category: 'Beneficial', essential_90: 'true', daily_value_amount: '900', daily_value_unit: 'mcg' },
    { id: 'inositol', name_common: 'Inositol', nutrient_key: 'inositol_g', category: 'Beneficial', essential_90: 'true', daily_value_amount: '1', daily_value_unit: 'mg' },
    { id: 'toxin', name_common: 'Toxin', nutrient_key: 'toxin_mg', category: 'Hazardous', essential_90: 'true', daily_value_amount: '100', daily_value_unit: 'mg' },
    { id: 'k2', name_common: 'Vitamin K2', nutrient_key: 'vitamin_k2_mcg', category: 'Beneficial', daily_value_amount: 75, daily_value_unit: 'mcg' },
    { id: 'k', name_common: 'Vitamin K', nutrient_key: 'vitamin_k_mcg', category: 'Beneficial', daily_value_amount: 120, daily_value_unit: 'mcg' },
    { id: 'histidine', name_common: 'Histidine', nutrient_key: 'histidine_mg', category: 'Beneficial', daily_value_amount: 620, daily_value_unit: 'mg' },
  ]));
  try {
    const defs = await loadEssential90();
    expect(nutrientsForTier(15,defs).find(d => d.key === 'calcium_mg')?.dv).toBe(1000);
    expect(nutrientsForTier(30,defs).find(d => d.key === 'copper_mg')?.dv).toBeCloseTo(0.9);
    expect(nutrientsForTier(90,defs).find(d => d.key === 'inositol_mg')?.dv).toBeNull();
    expect(defs.some(d => d.key === 'toxin_mg')).toBe(false);
    expect(nutrientsForTier(15,defs).find(d => d.key === 'vitamin_k_mcg')?.dv).toBe(120);
    expect(nutrientsForTier(90,defs).find(d => d.key === 'histidine_g')?.dv).toBeCloseTo(.62);
    expect(canonicalMicros({ nutrition_per_100g: { histidine_mg: 620 } }).histidine_g).toBeCloseTo(.62);
  } finally { vi.unstubAllGlobals(); }
});
