/**
 * Junction Table Helper Functions
 * ================================
 * Utility functions for querying junction tables in the admin panel.
 * These helpers abstract common patterns for fetching related data.
 */

import { getSupabaseClient } from './supabase/client';

// Use staging Supabase client (mofhvoudjxinvpplsytd)
const stagingSupabase = getSupabaseClient();

// ============================================================
// Type Definitions
// ============================================================

export interface JunctionLink {
  id: string;
  created_at?: string;
  [key: string]: any;
}

export interface ElementLink extends JunctionLink {
  element_id: string;
  element?: {
    id: string;
    name_common: string;
    category: string;
    type_label?: string;
    image_url?: string;
  };
}

export interface IngredientElementLink extends ElementLink {
  ingredient_id: string;
  amount_per_100g?: number;
  unit_per_100g?: string;
  amount_per_serving?: number;
  is_primary?: boolean;
  likelihood_percent?: number;
}

export interface RecipeIngredientLink extends JunctionLink {
  recipe_id: string;
  ingredient_id: string;
  qty_g?: number;
  unit?: string;
  sort_order?: number;
  ingredient?: {
    id: string;
    name_common: string;
    category: string;
    image_url?: string;
  };
}

export interface SymptomElementLink extends ElementLink {
  symptom_id: string;
  relationship: 'deficiency' | 'excess';
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  description?: string;
  symptom?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface CookingMethodElementLink extends ElementLink {
  cooking_method_id: string;
  relationship: 'hazardous' | 'beneficial';
  severity?: 'low' | 'moderate' | 'high';
  mechanism?: string;
}

// ============================================================
// Ingredient → Element Links
// ============================================================

/**
 * Get all elements for an ingredient with amounts
 */
export async function getIngredientElements(ingredientId: string) {
  const { data, error } = await stagingSupabase
    .from('catalog_ingredient_elements')
    .select(`
      id,
      amount_per_100g,
      unit_per_100g,
      amount_per_serving,
      is_primary,
      likelihood_percent,
      catalog_elements (
        id,
        name_common,
        category,
        type_label,
        image_url
      )
    `)
    .eq('ingredient_id', ingredientId)
    .order('amount_per_100g', { ascending: false, nullsFirst: false });

  if (error) throw error;

  // Map to interface with proper naming
  return (data || []).map((row: any) => ({
    ...row,
    element_id: row.catalog_elements?.id || '',
    element: row.catalog_elements,
    amount_unit: row.unit_per_100g, // Map DB column to TS interface
  })) as IngredientElementLink[];
}

/**
 * Get all ingredients containing a specific element
 */
export async function getIngredientsForElement(elementId: string, minAmount?: number) {
  let query = stagingSupabase
    .from('catalog_ingredient_elements')
    .select(`
      id,
      ingredient_id,
      amount_per_100g,
      unit_per_100g,
      is_primary,
      catalog_ingredients (
        id,
        name_common,
        category,
        image_url
      )
    `)
    .eq('element_id', elementId)
    .order('amount_per_100g', { ascending: false, nullsFirst: false });

  if (minAmount !== undefined) {
    query = query.gte('amount_per_100g', minAmount);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================
// Recipe → Ingredient Links
// ============================================================

/**
 * Get all ingredients for a recipe with quantities
 */
export async function getRecipeIngredients(recipeId: string) {
  const { data, error } = await stagingSupabase
    .from('recipe_ingredients')
    .select(`
      id,
      ingredient_id,
      qty_g,
      unit,
      sort_order,
      notes,
      catalog_ingredients (
        id,
        name_common,
        category,
        image_url
      )
    `)
    .eq('recipe_id', recipeId)
    .order('sort_order', { ascending: true, nullsFirst: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    ingredient: row.catalog_ingredients,
  })) as RecipeIngredientLink[];
}

/**
 * Get all recipes using a specific ingredient
 */
export async function getRecipesForIngredient(ingredientId: string) {
  const { data, error } = await stagingSupabase
    .from('recipe_ingredients')
    .select(`
      id,
      recipe_id,
      qty_g,
      unit,
      catalog_recipes (
        id,
        name_common,
        category,
        image_url
      )
    `)
    .eq('ingredient_id', ingredientId)
    .order('qty_g', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

// ============================================================
// Element → HS Items (Supplements, Tests, Products)
// ============================================================

/**
 * Get all HS supplements for an element
 */
export async function getSupplementsForElement(elementId: string) {
  const { data, error } = await stagingSupabase
    .from('element_supplements')
    .select(`
      id,
      is_primary,
      notes,
      hs_supplements (
        id,
        name,
        slug,
        icon_url,
        category
      )
    `)
    .eq('element_id', elementId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all HS tests for an element
 */
export async function getTestsForElement(elementId: string) {
  const { data, error } = await stagingSupabase
    .from('element_tests')
    .select(`
      id,
      is_primary,
      notes,
      hs_tests (
        id,
        name,
        slug,
        icon_url,
        category
      )
    `)
    .eq('element_id', elementId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all HS products for an element
 */
export async function getProductsForElement(elementId: string) {
  const { data, error } = await stagingSupabase
    .from('element_products')
    .select(`
      id,
      is_primary,
      notes,
      hs_products (
        id,
        name,
        slug,
        icon_url,
        category
      )
    `)
    .eq('element_id', elementId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get ALL HS coverage for an element (supplements + tests + products)
 * Uses the v_element_hs_coverage view for efficiency
 */
export async function getElementHSCoverage(elementId: string) {
  const { data, error } = await stagingSupabase
    .from('v_element_hs_coverage')
    .select('*')
    .eq('element_id', elementId);

  if (error) throw error;

  // Group by type
  const coverage = {
    supplements: data?.filter((d: any) => d.hs_type === 'supplement') || [],
    tests: data?.filter((d: any) => d.hs_type === 'test') || [],
    products: data?.filter((d: any) => d.hs_type === 'product') || [],
  };

  return coverage;
}

// ============================================================
// Symptom → Element Links
// ============================================================

/**
 * Get all elements linked to a symptom (deficiency or excess)
 */
export async function getSymptomElements(symptomId: string, relationship?: 'deficiency' | 'excess') {
  let query = stagingSupabase
    .from('symptom_elements')
    .select(`
      id,
      element_id,
      relationship,
      severity,
      description,
      onset_timeline,
      prevalence,
      reversible_with_correction,
      catalog_elements (
        id,
        name_common,
        category,
        type_label,
        image_url
      )
    `)
    .eq('symptom_id', symptomId);

  if (relationship) {
    query = query.eq('relationship', relationship);
  }

  const { data, error } = await query.order('severity', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    element: row.catalog_elements,
  })) as SymptomElementLink[];
}

/**
 * Get all symptoms caused by an element (deficiency or excess)
 */
export async function getSymptomsForElement(elementId: string, relationship?: 'deficiency' | 'excess') {
  let query = stagingSupabase
    .from('symptom_elements')
    .select(`
      id,
      symptom_id,
      relationship,
      severity,
      description,
      catalog_symptoms (
        id,
        name,
        category
      )
    `)
    .eq('element_id', elementId);

  if (relationship) {
    query = query.eq('relationship', relationship);
  }

  const { data, error } = await query.order('severity', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================
// Cooking Method → Element Links
// ============================================================

/**
 * Get hazardous or beneficial elements for a cooking method
 */
export async function getCookingMethodElements(
  cookingMethodId: string,
  relationship?: 'hazardous' | 'beneficial'
) {
  let query = stagingSupabase
    .from('cooking_method_elements')
    .select(`
      id,
      element_id,
      relationship,
      severity,
      mechanism,
      notes,
      catalog_elements (
        id,
        name_common,
        category,
        type_label,
        image_url
      )
    `)
    .eq('cooking_method_id', cookingMethodId);

  if (relationship) {
    query = query.eq('relationship', relationship);
  }

  const { data, error } = await query.order('severity', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    element: row.catalog_elements,
  })) as CookingMethodElementLink[];
}

// ============================================================
// Recipe → Cooking Methods
// ============================================================

/**
 * Get all cooking methods for a recipe
 */
export async function getRecipeCookingMethods(recipeId: string) {
  const { data, error } = await stagingSupabase
    .from('recipe_cooking_methods')
    .select(`
      id,
      cooking_method_id,
      is_primary,
      notes,
      catalog_cooking_methods (
        id,
        name,
        slug,
        category,
        image_url
      )
    `)
    .eq('recipe_id', recipeId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================
// Activity → Element Links
// ============================================================

/**
 * Get all elements affected by an activity (mineral depletion)
 */
export async function getActivityElements(activityId: string) {
  const { data, error } = await stagingSupabase
    .from('activity_elements')
    .select(`
      id,
      element_id,
      relationship,
      mechanism,
      notes,
      catalog_elements (
        id,
        name_common,
        category,
        type_label,
        image_url
      )
    `)
    .eq('activity_id', activityId);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    element: row.catalog_elements,
  }));
}

// ============================================================
// Nutrition Lookup via Views
// ============================================================

/**
 * Get full nutrition profile for an ingredient
 * Uses v_ingredient_nutrition view
 */
export async function getIngredientNutrition(ingredientId: string) {
  const { data, error } = await stagingSupabase
    .from('v_ingredient_nutrition')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('amount_per_100g', { ascending: false, nullsFirst: false });

  if (error) throw error;

  // Group by category
  const nutrition = {
    macronutrients: data?.filter((d: any) => d.element_category === 'Macronutrient') || [],
    vitamins: data?.filter((d: any) => d.element_category === 'Vitamin') || [],
    minerals: data?.filter((d: any) => d.element_category === 'Mineral') || [],
    hazardous: data?.filter((d: any) => d.element_category === 'Hazardous Element') || [],
  };

  return nutrition;
}

/**
 * Get calculated nutrition for a recipe
 * Uses v_recipe_nutrition view
 */
export async function getRecipeNutrition(recipeId: string) {
  const { data, error } = await stagingSupabase
    .from('v_recipe_nutrition')
    .select('*')
    .eq('recipe_id', recipeId);

  if (error) throw error;

  // Aggregate by element
  const aggregated = (data || []).reduce((acc: any, row: any) => {
    const key = row.element_id;
    if (!acc[key]) {
      acc[key] = {
        element_id: row.element_id,
        element_name: row.element_name,
        element_category: row.element_category,
        element_type: row.element_type,
        total_amount: 0,
        unit: row.unit_per_100g,
        ingredients: [],
      };
    }
    acc[key].total_amount += row.amount_in_recipe || 0;
    acc[key].ingredients.push({
      name: row.ingredient_name,
      amount: row.amount_in_recipe,
    });
    return acc;
  }, {} as Record<string, any>);

  return Object.values(aggregated);
}

/**
 * Get hazardous elements produced by recipe cooking methods
 * Uses v_recipe_hazards view
 */
export async function getRecipeHazards(recipeId: string) {
  const { data, error } = await stagingSupabase
    .from('v_recipe_hazards')
    .select('*')
    .eq('recipe_id', recipeId);

  if (error) throw error;
  return data || [];
}

/**
 * Get symptom care chain (symptom → elements → tests → supplements)
 * Uses v_symptom_care_chain view
 */
export async function getSymptomCareChain(symptomId: string) {
  const { data, error } = await stagingSupabase
    .from('v_symptom_care_chain')
    .select('*')
    .eq('symptom_id', symptomId);

  if (error) throw error;

  // Group by element
  const grouped = (data || []).reduce((acc: any, row: any) => {
    const key = row.element_id;
    if (!acc[key]) {
      acc[key] = {
        element_id: row.element_id,
        element_name: row.element_name,
        relationship: row.element_relationship,
        tests: [],
        supplements: [],
      };
    }
    if (row.test_id && !acc[key].tests.find((t: any) => t.id === row.test_id)) {
      acc[key].tests.push({ id: row.test_id, name: row.test_name });
    }
    if (row.supplement_id && !acc[key].supplements.find((s: any) => s.id === row.supplement_id)) {
      acc[key].supplements.push({ id: row.supplement_id, name: row.supplement_name });
    }
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
}

// ============================================================
// Bulk Operations
// ============================================================

/**
 * Add multiple element links to an ingredient
 */
export async function addIngredientElements(
  ingredientId: string,
  elements: Array<{
    element_id: string;
    amount_per_100g?: number;
    unit_per_100g?: string;
    is_primary?: boolean;
  }>
) {
  const records = elements.map(e => ({
    ingredient_id: ingredientId,
    ...e,
  }));

  const { data, error } = await stagingSupabase
    .from('catalog_ingredient_elements')
    .insert(records)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Remove element link from an ingredient
 */
export async function removeIngredientElement(ingredientId: string, elementId: string) {
  const { error } = await stagingSupabase
    .from('catalog_ingredient_elements')
    .delete()
    .eq('ingredient_id', ingredientId)
    .eq('element_id', elementId);

  if (error) throw error;
}

/**
 * Update element link amount
 */
export async function updateIngredientElementAmount(
  ingredientId: string,
  elementId: string,
  amount: number,
  unit: string
) {
  const { error } = await stagingSupabase
    .from('catalog_ingredient_elements')
    .update({
      amount_per_100g: amount,
      unit_per_100g: unit,
      updated_at: new Date().toISOString(),
    })
    .eq('ingredient_id', ingredientId)
    .eq('element_id', elementId);

  if (error) throw error;
}
