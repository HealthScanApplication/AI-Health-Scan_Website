import { describe, it, expect } from 'vitest';
import { avoidViolations, canonicalMicros, coverage, filtersToBrief, gaps, ingredientHazards, nutrientsForTier, recipeHazards } from '../recipeNutrients';
import { dayNameFor, muscleGroupOf } from '../protocolBuilders';

describe('canonicalMicros', () => {
  it('reads every elements_beneficial group and folds key spellings onto one nutrient', () => {
    const micros = canonicalMicros({
      elements_beneficial: { per_100g: {
        macronutrients: { protein_g: 3 },
        minerals: { iron_mg: 2.7, selenium_mcg: 1 },
        vitamins: { thiamine_mg: 0.08, vitamin_a_iu: 1000, vitamin_k2_mcg: 5 },
        amino_acids: { lysine_g: 0.17 },
        fatty_acids: { omega_3_mg: 140 },
      } },
      nutrition_per_100g: { energy_kcal: 23, iron_mg: 9, folate_ug: 194, thiamin_mg: 1 },
    });
    expect(micros.iron_mg).toBe(2.7);          // curated value wins over USDA
    expect(micros.folate_mcg).toBe(194);       // USDA fills a gap, ug → mcg key
    expect(micros.thiamine_mg).toBe(0.08);     // thiamin/thiamine are one nutrient
    expect(micros.vitamin_a_mcg).toBeCloseTo(50); // IU → mcg RAE (beta-carotene factor)
    expect(micros.omega_3_g).toBeCloseTo(0.14); // mg → g
    expect(micros.lysine_g).toBe(0.17);
    expect(micros.protein_g).toBeUndefined();   // macros stay in the macro block
    expect(micros.energy_kcal).toBeUndefined();
  });
});

describe('tiers and coverage', () => {
  it('has 15 core and 30 extended nutrients, and 90 builds on them', () => {
    expect(nutrientsForTier(15)).toHaveLength(15);
    expect(nutrientsForTier(30)).toHaveLength(30);
    expect(nutrientsForTier(90).length).toBeGreaterThan(30);
  });
  it('gives % daily value per serving, null where no ingredient data exists', () => {
    const cov = coverage({ iron_mg: 9, vitamin_c_mg: 9 }, { protein_g: 25 }, 15);
    const pct = (k: string) => cov.find((c) => c.def.key === k)?.pct;
    expect(pct('iron_mg')).toBe(50);
    expect(pct('protein_g')).toBe(50);
    expect(pct('vitamin_c_mg')).toBe(10);
    expect(pct('vitamin_d_mcg')).toBeNull();
    expect(gaps(cov).map((d) => d.key)).toContain('vitamin_c_mg');
    expect(gaps(cov).map((d) => d.key)).not.toContain('iron_mg');
  });
});

describe('hazards', () => {
  const spinach = { elements_hazardous: {
    cadmium: { level: 'high', per_100g: 0.008, reason: 'Accumulates cadmium.', likelihood: 100, assessment_status: 'assessed_present', needs_curation: false },
    oxalates: { level: 'low', per_100g: 970, reason: 'Oxalates.', likelihood: 30, needs_curation: true, assessment_status: 'unassessed' },
  } };
  it('sums by grams, keeps the worst level and lists the source ingredients', () => {
    const hz = recipeHazards([
      { name: 'Spinach', grams: 200, hazards: ingredientHazards(spinach) },
      { name: 'Chard', grams: 100, hazards: [{ key: 'oxalates', label: 'Oxalates', per100: 645, level: 'moderate', likelihood: 50, reason: '', assessed: true }] },
    ], 2);
    expect(hz[0].key).toBe('cadmium');           // high first
    const ox = hz.find((h) => h.key === 'oxalates')!;
    expect(ox.level).toBe('moderate');
    expect(ox.total).toBe(2585);                  // 970×2 + 645
    expect(ox.perServing).toBe(1292.5);
    expect(ox.sources).toEqual(['Spinach', 'Chard']);
  });
});

describe('filters', () => {
  it('turns filters into the AI brief', () => {
    const brief = filtersToBrief({ diets: ['vegan'], useIngredients: ['lentils'], avoidIngredients: ['peanuts'], boost: ['iron_mg', 'vitamin_b12_mcg'], limit: ['added sugar'] });
    expect(brief).toMatch(/must be vegan/);
    expect(brief).toMatch(/Use these ingredients: lentils/);
    expect(brief).toMatch(/Never use .*peanuts/);
    expect(brief).toMatch(/rich in: Iron, Vitamin B12/);
    expect(brief).toMatch(/Keep these low: added sugar/);
  });
  it('flags drafted ingredients that break the avoid list', () => {
    expect(avoidViolations([{ name: 'peanut butter', catalog_name: 'Peanut Butter' }, { name: 'oats' }], ['peanut'])).toEqual(['Peanut Butter']);
  });
});

describe('fitness muscle groups', () => {
  it('files an exercise under its main muscle group', () => {
    expect(muscleGroupOf({ name: 'Bulgarian Split Squat', bodyParts: ['quadriceps', 'glutes', 'hamstrings'] })).toBe('Legs');
    expect(muscleGroupOf({ name: 'Archer Push-Up', bodyParts: ['chest', 'triceps', 'shoulders'] })).toBe('Chest');
    expect(muscleGroupOf({ name: 'Jaw Relaxation', bodyParts: ['jaw', 'mouth'] })).toBe('Face');
    expect(muscleGroupOf({ name: 'Face Pull', bodyParts: ['rear_deltoids', 'rhomboids', 'trapezius'] })).not.toBe('Face');
    expect(muscleGroupOf({ name: 'Treadmill Walk', category: 'Cardio' })).toBe('Cardio');
  });
  it('names a day from what it trains', () => {
    expect(dayNameFor([{ bodyParts: ['quadriceps'] }, { bodyParts: ['glutes'] }])).toBe('Leg day');
    expect(dayNameFor([{ bodyParts: ['chest'] }, { bodyParts: ['shoulders'] }, { bodyParts: ['triceps'] }])).toBe('Push day');
    expect(dayNameFor([{ bodyParts: ['latissimus_dorsi'] }, { bodyParts: ['biceps'] }])).toBe('Pull day');
    expect(dayNameFor([{ bodyParts: ['chest'] }, { bodyParts: ['back'] }])).toBe('Upper body day');
    expect(dayNameFor([{ bodyParts: ['quadriceps'] }, { bodyParts: ['chest'] }])).toBe('Full body day');
    expect(dayNameFor([{ name: 'Jaw Relaxation', bodyParts: ['jaw'] }])).toBe('Face workout');
  });
});
