import { describe, it, expect } from 'vitest';
import { fitsSlot, mealPlacementIssues, nameSlotHint, planMealItems, reviewDiet, slotForTime, type DietConfig, type MealPick } from '../protocolBuilders';

const pick = (name: string, id = name): MealPick => ({ source: 'catalog', id, name, image: null, nutrition: { energy_kcal: 500, protein_g: 25, carbohydrates_g: 50, fats_g: 20 } });
const diet = (plan: DietConfig['plan'], extra: Partial<DietConfig> = {}): DietConfig => ({ framework: 'balanced', kcal: 2000, protein: 20, carbs: 50, fat: 30, slots: ['breakfast', 'lunch', 'dinner'], plan, ...extra });

describe('a lunch recipe assigned to breakfast', () => {
  it('is recognised by its name and kept out of the breakfast slot by auto-fill', () => {
    expect(nameSlotHint('Kitchari Lunch Bowl')).toBe('lunch');
    expect(fitsSlot('Kitchari Lunch Bowl', 'breakfast')).toBe(false);
    expect(fitsSlot('Kitchari Lunch Bowl', 'lunch')).toBe(true);
    expect(fitsSlot('Stuffed capsicum', 'breakfast')).toBe(true);
  });
  it('is flagged in the diet review when a Guardian puts it there anyway', () => {
    const review = reviewDiet(diet({ '1:breakfast': pick('Kitchari Lunch Bowl') }));
    expect(review.conflicts.some((c) => c.item === 'Kitchari Lunch Bowl' && /lunch recipe filed under Breakfast/.test(c.reason))).toBe(true);
  });
});

describe('a meal saved into a non-consume group', () => {
  it('is flagged and moved to the consume slot its time falls in', () => {
    const issues = mealPlacementIssues([{ display_name: 'Stuffed capsicum', category: 'consume', item_type: 'recipe', group_name: 'Wellness', scheduled_time: '08:00:00', kind: 'action' }]);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix).toEqual({ group_name: 'Breakfast', category: 'consume' });
  });
  it('leaves meals already in their slot, rules and non-consume steps alone', () => {
    expect(mealPlacementIssues([
      { display_name: 'Vegetable soup', category: 'consume', item_type: 'recipe', group_name: 'Lunch', scheduled_time: '13:00:00', kind: 'action' },
      { display_name: 'Added sugar', category: 'consume', item_type: 'activity', group_name: 'Meal', kind: 'rule_dont' },
      { display_name: 'Walk 20 minutes', category: 'do', item_type: 'activity', group_name: 'Wellness', kind: 'action' },
    ])).toEqual([]);
  });
  it('maps times to slots like the app (breakfast after wake, lunch midday, snack between, dinner evening)', () => {
    expect([slotForTime('08:00'), slotForTime('13:00'), slotForTime('16:00'), slotForTime('19:00')]).toEqual(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
  });
});

describe('a meal with a drink in the slot', () => {
  it('saves one slot item per day with the meal and the drink as separate checkable children', () => {
    const plans = planMealItems(diet({ '1:breakfast': pick('Overnight oats', 'r1') }, { drinks: { breakfast: ['Drink water', 'Green tea'] } }));
    expect(plans).toHaveLength(1);
    const [slot] = plans;
    expect(slot.label).toBe('Breakfast');
    expect(slot.time).toBe('08:00');
    expect(slot.children.map((c) => [c.role, c.title, c.recipeId])).toEqual([
      ['meal', 'Overnight oats', 'r1'],
      ['drink', 'Water', null], // shared checker: drinks are named by the drink, no verb
      ['drink', 'Green tea', null],
    ]);
  });
  it('gives each slot its own time instead of one fixed time for every meal', () => {
    const plans = planMealItems(diet({ '1:breakfast': pick('Porridge'), '1:lunch': pick('Vegetable soup'), '1:dinner': pick('Lentil curry') }));
    expect(plans.map((p) => [p.label, p.time])).toEqual([['Breakfast', '08:00'], ['Lunch', '13:00'], ['Dinner', '19:00']]);
  });
});
