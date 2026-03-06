/**
 * Recipe Step Image Selection Utility
 * 
 * Implements a priority-based image selection system for recipe steps,
 * used by both the admin panel preview and mobile app rendering.
 * 
 * Priority order:
 * 1. Step-specific image (explicitly set/uploaded)
 * 2. Primary ingredient image matching processing variant
 * 3. First linked ingredient with any image
 * 4. Cooking method image (from catalog)
 * 5. Equipment image (from catalog)
 * 6. Recipe hero image (last resort)
 * 7. User profile picture (for user-added recipes)
 * 8. Empty string (placeholder)
 */

export interface StepImageContext {
  step: {
    text: string;
    image_url?: string;
    ingredient_ids?: string[];
    equipment_ids?: string[];
    cooking_method_ids?: string[];
  };
  ingredients: Array<{
    id: string;
    name?: string;
    name_common?: string;
    image_url?: string;
    image_url_cut?: string;
    image_url_cubed?: string;
    image_url_cooked?: string;
    image_url_powdered?: string;
  }>;
  equipment: Array<{
    id: string;
    name: string;
    image_url?: string;
  }>;
  cookingMethods?: Array<{
    id: string;
    name: string;
    image_url?: string;
  }>;
  recipeImageUrl?: string;
  userProfileImageUrl?: string;
  isUserRecipe?: boolean;
}

// Map processing keywords in step text to ingredient image variants
const PROCESSING_IMAGE_MAP: Array<{ keywords: string[]; field: string }> = [
  { keywords: ['cut', 'slice', 'chop'], field: 'image_url_cut' },
  { keywords: ['cube', 'dice'], field: 'image_url_cubed' },
  { keywords: ['cook', 'sauté', 'saute', 'fry', 'roast', 'bake', 'grill', 'steam'], field: 'image_url_cooked' },
  { keywords: ['powder', 'ground', 'grind'], field: 'image_url_powdered' },
];

/**
 * Get the best image for a recipe step based on the priority system.
 */
export function getStepImage(ctx: StepImageContext): string {
  const { step, ingredients, equipment, cookingMethods, recipeImageUrl, userProfileImageUrl, isUserRecipe } = ctx;

  // 1. Explicit step image (user-uploaded or manually set)
  if (step.image_url) return step.image_url;

  const lower = (step.text || '').toLowerCase();

  // 2. Primary ingredient with processing-variant match
  if (step.ingredient_ids && step.ingredient_ids.length > 0) {
    for (const ingId of step.ingredient_ids) {
      const ing = ingredients.find(i => i.id === ingId);
      if (!ing) continue;

      // Try processing-variant image first
      for (const mapping of PROCESSING_IMAGE_MAP) {
        if (mapping.keywords.some(kw => lower.includes(kw))) {
          const variantUrl = (ing as any)[mapping.field];
          if (variantUrl) return variantUrl;
        }
      }

      // Fall back to base ingredient image
      if (ing.image_url) return ing.image_url;
    }
  }

  // 3. Text-mention fallback: scan step text for ingredient names
  if (ingredients.length > 0) {
    for (const ing of ingredients) {
      const name = (ing.name_common || ing.name || '').toLowerCase();
      if (name.length > 2 && lower.includes(name)) {
        // Try processing variant
        for (const mapping of PROCESSING_IMAGE_MAP) {
          if (mapping.keywords.some(kw => lower.includes(kw))) {
            const variantUrl = (ing as any)[mapping.field];
            if (variantUrl) return variantUrl;
          }
        }
        if (ing.image_url) return ing.image_url;
      }
    }
  }

  // 4. Cooking method image
  if (step.cooking_method_ids && step.cooking_method_ids.length > 0 && cookingMethods) {
    for (const methodId of step.cooking_method_ids) {
      const method = cookingMethods.find(m => m.id === methodId);
      if (method?.image_url) return method.image_url;
    }
  }

  // 5. Equipment image
  if (step.equipment_ids && step.equipment_ids.length > 0) {
    for (const eqId of step.equipment_ids) {
      const eq = equipment.find(e => e.id === eqId);
      if (eq?.image_url) return eq.image_url;
    }
  }

  // 6. Recipe hero image
  if (recipeImageUrl) return recipeImageUrl;

  // 7. User profile picture (for user-added recipes)
  if (isUserRecipe && userProfileImageUrl) return userProfileImageUrl;

  // 8. No image available
  return '';
}

/**
 * Get all step images for a recipe at once.
 * Returns an array of image URLs in step order.
 */
export function getAllStepImages(
  steps: StepImageContext['step'][],
  ingredients: StepImageContext['ingredients'],
  equipment: StepImageContext['equipment'],
  cookingMethods?: StepImageContext['cookingMethods'],
  recipeImageUrl?: string,
  userProfileImageUrl?: string,
  isUserRecipe?: boolean,
): string[] {
  return steps.map(step =>
    getStepImage({
      step,
      ingredients,
      equipment,
      cookingMethods,
      recipeImageUrl,
      userProfileImageUrl,
      isUserRecipe,
    })
  );
}
