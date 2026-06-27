import { describe, it, expect } from 'vitest';
import {
  mealSlotName, descriptiveMealSlot, slotDescriptors, parsePrepMinutes,
} from '../../protocolDomain/mealSlot';

describe('mealSlotName (strict gate — unchanged)', () => {
  it('matches only exact slot names (tolerating a Consume prefix)', () => {
    expect(mealSlotName('Lunch')).toBe('Lunch');
    expect(mealSlotName('Consume Breakfast')).toBe('Breakfast');
  });
  it('returns null for descriptive names (that is descriptiveMealSlot\'s job)', () => {
    expect(mealSlotName('Nutritious Lunch')).toBeNull();
    expect(mealSlotName('Outdoor Play')).toBeNull();
  });
});

describe('descriptiveMealSlot (broad — drives suggestions)', () => {
  it('extracts the base slot from adjective-prefixed names', () => {
    expect(descriptiveMealSlot('Nutritious Lunch')).toBe('Lunch');
    expect(descriptiveMealSlot('High-Protein Dinner')).toBe('Dinner');
    expect(descriptiveMealSlot('Quick Breakfast')).toBe('Breakfast');
    expect(descriptiveMealSlot('Light Evening Snack')).toBe('Snack');
  });
  it('still handles plain + Consume-prefixed names', () => {
    expect(descriptiveMealSlot('Lunch')).toBe('Lunch');
    expect(descriptiveMealSlot('Consume Dinner')).toBe('Dinner');
  });
  it('matches whole word tokens, never substrings, and returns null otherwise', () => {
    expect(descriptiveMealSlot('Outdoor Play')).toBeNull();
    expect(descriptiveMealSlot('Hydration')).toBeNull(); // no meal token
    expect(descriptiveMealSlot('')).toBeNull();
    expect(descriptiveMealSlot(null)).toBeNull();
  });
});

describe('slotDescriptors', () => {
  it('parses adjectives into ranking flags', () => {
    expect(slotDescriptors('Nutritious Lunch')).toEqual({ nutritious: true });
    expect(slotDescriptors('High-Protein Dinner')).toEqual({ protein: true });
    expect(slotDescriptors('Quick Vegan Snack')).toEqual({ quick: true, vegan: true });
    expect(slotDescriptors('Keto Dinner')).toEqual({ keto: true });
    expect(slotDescriptors('Plant-Based Lunch')).toEqual({ vegan: true });
  });
  it('returns no flags for a plain slot name', () => {
    expect(slotDescriptors('Lunch')).toEqual({});
  });
});

describe('parsePrepMinutes', () => {
  it('reads the first integer, or null when unparseable', () => {
    expect(parsePrepMinutes('15')).toBe(15);
    expect(parsePrepMinutes('10-15 min')).toBe(10);
    expect(parsePrepMinutes('')).toBeNull();
    expect(parsePrepMinutes(null)).toBeNull();
    expect(parsePrepMinutes('quick')).toBeNull();
  });
});
