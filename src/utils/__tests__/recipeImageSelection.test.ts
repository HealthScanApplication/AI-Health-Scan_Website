import { describe, it, expect } from 'vitest';
import { getStepImage, getAllStepImages, StepImageContext } from '../recipeImageSelection';

const makeIng = (id: string, name: string, imageUrl?: string, extras?: Record<string, string>) => ({
  id,
  name,
  name_common: name,
  image_url: imageUrl,
  ...extras,
});

const makeEq = (id: string, name: string, imageUrl?: string) => ({
  id,
  name,
  image_url: imageUrl,
});

const makeMethod = (id: string, name: string, imageUrl?: string) => ({
  id,
  name,
  image_url: imageUrl,
});

describe('getStepImage', () => {
  it('returns explicit step image as highest priority', () => {
    const ctx: StepImageContext = {
      step: { text: 'Chop the tomatoes', image_url: 'step-img.jpg', ingredient_ids: ['1'] },
      ingredients: [makeIng('1', 'Tomato', 'tomato.jpg')],
      equipment: [],
    };
    expect(getStepImage(ctx)).toBe('step-img.jpg');
  });

  it('returns ingredient processing variant (cut) when step text mentions slicing', () => {
    const ctx: StepImageContext = {
      step: { text: 'Slice the tomatoes thinly', ingredient_ids: ['1'] },
      ingredients: [makeIng('1', 'Tomato', 'tomato.jpg', { image_url_cut: 'tomato-cut.jpg' })],
      equipment: [],
    };
    expect(getStepImage(ctx)).toBe('tomato-cut.jpg');
  });

  it('returns ingredient processing variant (cooked) when step text mentions cooking', () => {
    const ctx: StepImageContext = {
      step: { text: 'Fry the onions until golden', ingredient_ids: ['1'] },
      ingredients: [makeIng('1', 'Onion', 'onion.jpg', { image_url_cooked: 'onion-cooked.jpg' })],
      equipment: [],
    };
    expect(getStepImage(ctx)).toBe('onion-cooked.jpg');
  });

  it('returns base ingredient image when no processing variant matches', () => {
    const ctx: StepImageContext = {
      step: { text: 'Add the tomatoes to the pan', ingredient_ids: ['1'] },
      ingredients: [makeIng('1', 'Tomato', 'tomato.jpg')],
      equipment: [],
    };
    expect(getStepImage(ctx)).toBe('tomato.jpg');
  });

  it('falls back to text-mention ingredient when no ingredient_ids', () => {
    const ctx: StepImageContext = {
      step: { text: 'Chop the tomato finely', ingredient_ids: [] },
      ingredients: [makeIng('1', 'Tomato', 'tomato.jpg', { image_url_cut: 'tomato-cut.jpg' })],
      equipment: [],
    };
    expect(getStepImage(ctx)).toBe('tomato-cut.jpg');
  });

  it('returns cooking method image when no ingredients match', () => {
    const ctx: StepImageContext = {
      step: { text: 'Heat the pan', ingredient_ids: [], cooking_method_ids: ['m1'] },
      ingredients: [],
      equipment: [],
      cookingMethods: [makeMethod('m1', 'Sautéing', 'saute.jpg')],
    };
    expect(getStepImage(ctx)).toBe('saute.jpg');
  });

  it('returns equipment image when no ingredients or methods match', () => {
    const ctx: StepImageContext = {
      step: { text: 'Place in the oven', ingredient_ids: [], equipment_ids: ['e1'] },
      ingredients: [],
      equipment: [makeEq('e1', 'Oven', 'oven.jpg')],
    };
    expect(getStepImage(ctx)).toBe('oven.jpg');
  });

  it('returns recipe hero image as fallback', () => {
    const ctx: StepImageContext = {
      step: { text: 'Serve immediately' },
      ingredients: [],
      equipment: [],
      recipeImageUrl: 'hero.jpg',
    };
    expect(getStepImage(ctx)).toBe('hero.jpg');
  });

  it('returns user profile image for user-added recipes as last resort', () => {
    const ctx: StepImageContext = {
      step: { text: 'My custom step' },
      ingredients: [],
      equipment: [],
      isUserRecipe: true,
      userProfileImageUrl: 'profile.jpg',
    };
    expect(getStepImage(ctx)).toBe('profile.jpg');
  });

  it('returns empty string when nothing available', () => {
    const ctx: StepImageContext = {
      step: { text: 'Do something' },
      ingredients: [],
      equipment: [],
    };
    expect(getStepImage(ctx)).toBe('');
  });

  it('does not return user profile image for non-user recipes', () => {
    const ctx: StepImageContext = {
      step: { text: 'Do something' },
      ingredients: [],
      equipment: [],
      isUserRecipe: false,
      userProfileImageUrl: 'profile.jpg',
    };
    expect(getStepImage(ctx)).toBe('');
  });

  it('skips ingredients without images and finds one with image', () => {
    const ctx: StepImageContext = {
      step: { text: 'Mix ingredients', ingredient_ids: ['1', '2'] },
      ingredients: [
        makeIng('1', 'Salt', undefined),
        makeIng('2', 'Pepper', 'pepper.jpg'),
      ],
      equipment: [],
    };
    expect(getStepImage(ctx)).toBe('pepper.jpg');
  });
});

describe('getAllStepImages', () => {
  it('returns an image for each step', () => {
    const steps = [
      { text: 'Step 1', image_url: 'step1.jpg' },
      { text: 'Step 2 with tomato', ingredient_ids: ['1'] },
      { text: 'Step 3' },
    ];
    const ingredients = [makeIng('1', 'Tomato', 'tomato.jpg')];
    const result = getAllStepImages(steps, ingredients, [], undefined, 'hero.jpg');
    expect(result).toEqual(['step1.jpg', 'tomato.jpg', 'hero.jpg']);
  });
});
