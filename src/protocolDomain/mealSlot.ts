/*
 * protocolDomain/mealSlot — meal-slot detection + recipe↔slot bucket matching.
 * SHARED, portable. Mirrored BYTE-FOR-BYTE in both repos. Edit both together.
 *
 * Two layers:
 *   • mealSlotName(group_name) — is this item a Breakfast/Lunch/Dinner/Snack slot?
 *   • recipeMealBucket / slotNameToBucket / recipeMatchesSlot — does a recipe's
 *     (messy) meal_slot belong in a given protocol slot? Used by the empty-slot
 *     recipe suggester + recipe grouping so both agree on "a Lunch recipe".
 */

export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Supper' | 'Snack';
export type MealBucket = 'Morning' | 'Afternoon' | 'Evening' | 'Snacks' | 'Beverages' | 'Anytime';

/**
 * Returns the meal-slot name a Consume item belongs to, or null if it is NOT a
 * meal slot. A meal slot is authored via group_name (a leading "Consume " is
 * tolerated, e.g. "Consume Lunch"). This is the single gate that keeps ordinary
 * recipe-less consumables (drinks, seeds) from becoming empty-slot cards.
 */
export function mealSlotName(groupName?: string | null): MealSlot | null {
  const g = (groupName || '').toLowerCase().trim().replace(/^consume\s+/, '');
  if (/^(breakfast|lunch|dinner|supper|snack)$/.test(g)) {
    return (g.charAt(0).toUpperCase() + g.slice(1)) as MealSlot;
  }
  return null;
}

/** Normalise a recipe's raw meal_slot value (string | JSON-array string | array) → bucket. */
export function recipeMealBucket(rawMealSlot: unknown): MealBucket {
  let slot: any = rawMealSlot;
  if (typeof slot === 'string' && slot.trim().startsWith('[')) {
    try { slot = JSON.parse(slot); } catch { /* keep string */ }
  }
  if (Array.isArray(slot)) slot = slot[0];
  const s = String(slot || '').toLowerCase();
  if (/breakfast|morning/.test(s)) return 'Morning';
  if (/lunch|brunch|afternoon/.test(s)) return 'Afternoon';
  if (/dinner|supper|evening|main/.test(s)) return 'Evening';
  if (/snack|dessert|appetizer|side/.test(s)) return 'Snacks';
  if (/drink|beverage|smoothie|juice|tea|tonic/.test(s)) return 'Beverages';
  return 'Anytime';
}

/** Map a protocol meal-slot name ('Breakfast'|'Lunch'|'Dinner'|'Supper'|'Snack') → bucket. */
export function slotNameToBucket(slotName: string | null | undefined): MealBucket {
  const s = String(slotName || '').toLowerCase();
  if (/breakfast/.test(s)) return 'Morning';
  if (/lunch/.test(s)) return 'Afternoon';
  if (/dinner|supper/.test(s)) return 'Evening';
  if (/snack/.test(s)) return 'Snacks';
  return 'Anytime';
}

/** True when a recipe's meal_slot belongs to the same bucket as a protocol slot
 *  name. 'Anytime' is a WILDCARD on either side — an anytime recipe fits any
 *  slot, and an anytime/unknown slot accepts any recipe. */
export function recipeMatchesSlot(rawMealSlot: unknown, slotName: string | null | undefined): boolean {
  const recipeBucket = recipeMealBucket(rawMealSlot);
  const slotBucket = slotNameToBucket(slotName);
  if (recipeBucket === 'Anytime' || slotBucket === 'Anytime') return true;
  return recipeBucket === slotBucket;
}
