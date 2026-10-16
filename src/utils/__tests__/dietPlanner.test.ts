import { describe, it, expect } from 'vitest';
import { hazardPenalty, ideasForGaps, planWeek, scoreFor, slotFit, type Candidate, type IdeaIngredient } from '../dietPlanner';
import { DIET_FRAMEWORKS, type DietConfig } from '../protocolBuilders';
import { nutrientsForTier, type RecipeHazard } from '../recipeNutrients';

let n = 0;
const recipe = (name: string, extra: Partial<Candidate> = {}): Candidate => ({
  source: 'catalog', id: extra.id || `r${++n}`, name, image: null, healthScore: 70, mealSlot: 'anytime', tags: [], micros: {}, hazards: [], ingredientIds: [],
  nutrition: { energy_kcal: 600, protein_g: 30, carbohydrates_g: 60, fats_g: 20, fiber_g: 8 }, ...extra,
});
const cfg = (extra: Partial<DietConfig> = {}): DietConfig => ({ framework: 'vegetarian', kcal: 1800, protein: 20, carbs: 50, fat: 30, slots: ['breakfast', 'lunch', 'dinner'], plan: {}, ...extra });
const high = (label: string): RecipeHazard => ({ key: label.toLowerCase(), label, total: 1, perServing: 1, level: 'high', sources: ['x'], reasons: [], assessed: true });

describe('slot fit', () => {
  it('keeps cake, shakes and sauces out of main meals', () => {
    expect(slotFit(recipe('Carrot Cake'), 'lunch')).toBeNull();
    expect(slotFit(recipe('Chocolate Protein Shake'), 'dinner')).toBeNull();
    expect(slotFit(recipe('Tahini Dressing'), 'snack')).toBeNull();
    expect(slotFit(recipe('Red Velvet Cake', { mealSlot: 'dessert' }), 'snack')).toBeGreaterThan(0);
  });
  it('prefers breakfast-type recipes at breakfast and keeps breakfast recipes out of lunch', () => {
    expect(slotFit(recipe('Overnight oats'), 'breakfast')).toBe(1);
    expect(slotFit(recipe('Saag aloo'), 'breakfast')!).toBeLessThan(0.5);
    expect(slotFit(recipe('Zero-Fat Breakfast Bowl'), 'lunch')).toBeNull();
    expect(slotFit(recipe('Kitchari Lunch Bowl'), 'breakfast')).toBeNull();
  });
});

describe('no repeats', () => {
  it('uses a recipe at most once a day and twice a week', () => {
    const pool = [recipe('Porridge'), recipe('Lentil soup'), recipe('Bean chilli'), recipe('Veg curry'), recipe('Tofu stir-fry'), recipe('Chickpea salad'), recipe('Muesli'), recipe('Omelette'), recipe('Risotto'), recipe('Falafel bowl'), recipe('Dal'), recipe('Shakshuka')];
    const { plan } = planWeek(cfg(), pool, 15);
    for (const day of [1, 2, 3, 4, 5, 6, 7]) {
      const ids = ['breakfast', 'lunch', 'dinner'].map((s) => plan[`${day}:${s}`]?.id).filter(Boolean);
      expect(new Set(ids).size).toBe(ids.length);
    }
    const counts = new Map<string, number>();
    for (const p of Object.values(plan)) if (p) counts.set(p.id, (counts.get(p.id) || 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
    for (const day of [1, 2, 3, 4, 5, 6]) for (const slot of ['breakfast', 'lunch', 'dinner']) {
      const today = plan[`${day}:${slot}`]?.id; const tomorrow = ['breakfast', 'lunch', 'dinner'].map((x) => plan[`${day + 1}:${x}`]?.id);
      expect(tomorrow).not.toContain(today); // never on consecutive days
    }
  });
  it('leaves a slot empty rather than repeat when the pool runs out', () => {
    const { plan } = planWeek(cfg({ slots: ['lunch'] }), [recipe('Lentil soup')], 15);
    expect(Object.values(plan).filter(Boolean)).toHaveLength(2);
    expect(Object.keys(plan).filter((k) => plan[k]).map((k) => k.split(':')[0])).toEqual(['1', '3']); // not back to back
  });
});

describe('coverage ranking and hazards', () => {
  const defs = nutrientsForTier(15);
  const day = { micros: {}, kcal: 0, protein: 0, fiber: 0 };
  it('ranks a nutrient-dense recipe above a plain one with the same health score', () => {
    const dense = recipe('Spinach lentil dal', { micros: { iron_mg: 9, folate_mcg: 300, magnesium_mg: 150, potassium_mg: 1500, vitamin_k_mcg: 200 } });
    const plain = recipe('White pasta');
    expect(scoreFor(dense, 'dinner', day, defs, 600)!.total).toBeGreaterThan(scoreFor(plain, 'dinner', day, defs, 600)!.total);
  });
  it('fills the day\'s gaps first: a nutrient already covered adds nothing', () => {
    const iron = recipe('Iron bowl', { micros: { iron_mg: 18 } });
    const covered = { micros: { iron_mg: 18 }, kcal: 600, protein: 30, fiber: 8 };
    expect(scoreFor(iron, 'dinner', covered, defs, 600)!.gain).toBeLessThan(scoreFor(iron, 'dinner', day, defs, 600)!.gain);
  });
  it('penalises hazards: assessed high > unassessed high > low', () => {
    expect(hazardPenalty([high('Cadmium')])).toBe(1);
    expect(hazardPenalty([{ ...high('Lead'), assessed: false }])).toBe(0.5);
    expect(hazardPenalty([{ ...high('Oxalates'), level: 'low' }])).toBeCloseTo(0.1);
    const clean = recipe('Bean stew');
    const risky = recipe('Rice and tuna', { hazards: [high('Arsenic'), high('Mercury')] });
    expect(scoreFor(clean, 'dinner', day, defs, 600)!.total).toBeGreaterThan(scoreFor(risky, 'dinner', day, defs, 600)!.total);
  });
  it('lands each day near the kcal target', () => {
    const pool = Array.from({ length: 30 }, (_, i) => recipe(`Meal ${i}`, { nutrition: { energy_kcal: 300 + i * 25, protein_g: 20 + i, carbohydrates_g: 50, fats_g: 15 } }));
    const { days } = planWeek(cfg(), pool, 15);
    for (const d of days) expect(Math.abs(d.kcal - 1800) / 1800).toBeLessThan(0.15);
  });
});

describe('recipe ideas', () => {
  it('suggests framework-safe ingredient combinations that cover the gaps, fewest hazards first', () => {
    const ing = (id: string, name: string, per100: Record<string, number>, kcal100: number, animal: IdeaIngredient['animal'] = 'none', hazards: RecipeHazard[] = []): IdeaIngredient => ({ id, name, per100, kcal100, hazards, animal });
    const pool = [
      ing('a', 'Pumpkin seeds', { zinc_mg: 7.8, magnesium_mg: 550 }, 560),
      ing('b', 'Spinach', { iron_mg: 2.7, folate_mcg: 194 }, 23, 'none', [high('Cadmium')]),
      ing('c', 'Lentils', { iron_mg: 3.3, folate_mcg: 181 }, 116),
      ing('d', 'Beef liver', { iron_mg: 6.5, vitamin_b12_mcg: 59 }, 135, 'meat'),
      ing('e', 'Kale', { vitamin_k_mcg: 390, calcium_mg: 150 }, 49),
    ];
    const gaps = nutrientsForTier(15).filter((d) => ['iron_mg', 'zinc_mg', 'folate_mcg', 'vitamin_k_mcg', 'vitamin_b12_mcg'].includes(d.key));
    const ideas = ideasForGaps(gaps, pool, DIET_FRAMEWORKS.find((f) => f.id === 'vegetarian')!);
    expect(ideas.length).toBeGreaterThan(0);
    expect(ideas.flatMap((i) => i.ingredients)).not.toContain('Beef liver');
    expect(ideas[0].brief).toMatch(/vegetarian recipe built around/);
    expect(ideas[0].covers.length).toBeGreaterThan(1);
  });
});
