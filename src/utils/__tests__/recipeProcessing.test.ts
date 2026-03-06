import { describe, it, expect } from 'vitest';
import { stripProcessing, cleanIngredientName } from '../recipeProcessing';

describe('stripProcessing', () => {
  it('strips "Chopped" from "Chopped Tomatoes"', () => {
    const result = stripProcessing('Chopped Tomatoes');
    expect(result.cleanName).toBe('Tomatoes');
    expect(result.detectedProcessing).toBe('Chopped');
  });

  it('strips "Minced" from "Minced Garlic"', () => {
    const result = stripProcessing('Minced Garlic');
    expect(result.cleanName).toBe('Garlic');
    expect(result.detectedProcessing).toBe('Minced');
  });

  it('strips "Sliced" from "Sliced Red Onion"', () => {
    const result = stripProcessing('Sliced Red Onion');
    expect(result.cleanName).toBe('Red Onion');
    expect(result.detectedProcessing).toBe('Sliced');
  });

  it('strips "Diced" from "Diced Carrots"', () => {
    const result = stripProcessing('Diced Carrots');
    expect(result.cleanName).toBe('Carrots');
    expect(result.detectedProcessing).toBe('Diced');
  });

  it('does NOT strip from single-word names', () => {
    const result = stripProcessing('Chopped');
    expect(result.cleanName).toBe('Chopped');
    expect(result.detectedProcessing).toBeNull();
  });

  it('does NOT strip non-processing first words', () => {
    const result = stripProcessing('Olive Oil');
    expect(result.cleanName).toBe('Olive Oil');
    expect(result.detectedProcessing).toBeNull();
  });

  it('handles empty string', () => {
    const result = stripProcessing('');
    expect(result.cleanName).toBe('');
    expect(result.detectedProcessing).toBeNull();
  });

  it('is case-insensitive for detection', () => {
    const result = stripProcessing('chopped Tomatoes');
    expect(result.cleanName).toBe('Tomatoes');
    expect(result.detectedProcessing).toBe('Chopped');
  });

  it('strips "Grated" from "Grated Parmesan"', () => {
    const result = stripProcessing('Grated Parmesan');
    expect(result.cleanName).toBe('Parmesan');
    expect(result.detectedProcessing).toBe('Grated');
  });

  it('strips "Crushed" from "Crushed Red Pepper Flakes"', () => {
    const result = stripProcessing('Crushed Red Pepper Flakes');
    expect(result.cleanName).toBe('Red Pepper Flakes');
    expect(result.detectedProcessing).toBe('Crushed');
  });

  it('strips "Toasted" from "Toasted Sesame Seeds"', () => {
    const result = stripProcessing('Toasted Sesame Seeds');
    expect(result.cleanName).toBe('Sesame Seeds');
    expect(result.detectedProcessing).toBe('Toasted');
  });

  it('preserves multi-word names without processing prefix', () => {
    const result = stripProcessing('Extra Virgin Olive Oil');
    expect(result.cleanName).toBe('Extra Virgin Olive Oil');
    expect(result.detectedProcessing).toBeNull();
  });
});

describe('cleanIngredientName', () => {
  it('uses name_common when available', () => {
    expect(cleanIngredientName({ name_common: 'Chopped Basil', name: 'basil' })).toBe('Basil');
  });

  it('falls back to name when name_common is missing', () => {
    expect(cleanIngredientName({ name: 'Sliced Mushrooms' })).toBe('Mushrooms');
  });

  it('returns empty string for empty ingredient', () => {
    expect(cleanIngredientName({})).toBe('');
  });

  it('returns unchanged name when no processing prefix', () => {
    expect(cleanIngredientName({ name_common: 'Chicken Breast' })).toBe('Chicken Breast');
  });
});
