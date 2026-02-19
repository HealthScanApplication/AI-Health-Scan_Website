/**
 * ============================================================
 * SHARED CATALOG TYPES
 * ============================================================
 * Single source of truth for all catalog data contracts shared
 * between the React Native mobile app and the Website/Admin panel.
 *
 * Both projects: _AI-Health-Scan_Mobile and _AI-Health-Scan_Website
 *
 * HOW TO KEEP IN SYNC:
 *   1. Edit THIS file at /Users/john/05_Code/_AI-Health-Scan/shared-catalog-types.ts
 *   2. Copy to mobile:  src/types/catalog.ts
 *   3. Copy to website: src/types/catalog.ts
 *
 * Supabase Project: mofhvoudjxinvpplsytd (shared by both apps)
 * ============================================================
 */

// ─── Shared primitive types ────────────────────────────────────────────────

export interface ContentLink {
  id: string;
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  isPdf: boolean;
  votes: number;
  addedAt: string;
  contentType?: 'paper' | 'book' | 'social' | 'article';
  abstract?: string;
  aiSummary?: string;
}

export interface TasteProfile {
  sweetness?: number;
  saltiness?: number;
  sourness?: number;
  bitterness?: number;
  umami?: number;
  spiciness?: number;
  texture_crunch?: number;
  texture_creamy?: number;
  // legacy keys
  sweet?: number;
  sour?: number;
  salty?: number;
  bitter?: number;
}

export interface NutritionPer100g {
  calories?: number;
  energy_kcal?: number;
  protein_g?: number;
  protein?: number;
  carbohydrates_g?: number;
  carbs?: number;
  carbohydrates?: number;
  fats_g?: number;
  fat?: number;
  fats?: number;
  fiber_g?: number;
  fiber?: number;
  sugar_g?: number;
  sodium_mg?: number;
  [key: string]: number | undefined;
}

export interface NutritionPerServing extends NutritionPer100g {}

// ─── catalog_elements ──────────────────────────────────────────────────────

export interface CatalogElement {
  id: string;
  slug?: string;
  name_common: string;
  name_other?: string;
  category?: string;
  type_label?: string;
  subcategory?: string;
  health_role: 'beneficial' | 'hazardous' | 'both' | 'conditional';
  essential_90?: boolean;
  chemical_symbol?: string;
  molecular_formula?: string;
  cas_number?: string;
  description?: string;
  description_simple?: string;
  description_technical?: string;
  description_full?: string;
  functions?: string[];
  health_benefits?: Record<string, any>;
  risk_tags?: string[];
  thresholds?: Record<string, any>;
  deficiency_ranges?: Record<string, any>;
  excess_ranges?: Record<string, any>;
  drv_by_population?: Record<string, any>;
  found_in?: string[];
  food_sources_detailed?: Record<string, any>;
  food_strategy?: Record<string, any>;
  reason?: string;
  deficiency?: Record<string, any>;
  interactions?: Record<string, any>;
  detox_strategy?: string;
  health_score?: number;
  scientific_references?: Record<string, any>;
  info_sections?: Record<string, any>;
  image_url?: string;
  image_url_raw?: string;
  image_url_powdered?: string;
  image_url_cut?: string;
  video_url?: string;
  scientific_papers?: ContentLink[];
  social_content?: ContentLink[];
  ai_enriched_at?: string;
  ai_enrichment_version?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── catalog_ingredients ───────────────────────────────────────────────────

export interface CatalogIngredient {
  id: string;
  name_common: string;
  name_other?: string;
  name_scientific?: string;
  category?: string;
  category_sub?: string;
  processing_type?: string;
  processing_methods?: string[];
  processing_level?: string;
  raw_ingredients?: string[];
  description?: string;
  description_simple?: string;
  description_technical?: string;
  description_processing?: string;
  health_benefits?: Record<string, any>;
  taste_profile?: TasteProfile;
  elements_beneficial?: Record<string, any>;
  elements_hazardous?: Record<string, any>;
  health_score?: number;
  scientific_references?: Record<string, any>;
  origin_country?: string;
  origin_region?: string;
  origin_city?: string;
  culinary_history?: string;
  nutrition_per_100g?: NutritionPer100g;
  nutrition_per_serving?: NutritionPerServing;
  serving_size?: string;
  type_group?: string;
  tags?: string[];
  dietary_info?: Record<string, boolean>;
  image_url?: string;
  image_url_raw?: string;
  image_url_powdered?: string;
  image_url_cut?: string;
  video_url?: string;
  videos?: Record<string, string>;
  scientific_papers?: ContentLink[];
  social_content?: ContentLink[];
  created_at?: string;
  updated_at?: string;
}

// ─── catalog_recipes ───────────────────────────────────────────────────────

export interface RecipeIngredient {
  name?: string;
  amount_g?: number;
  unit?: string;
  note?: string;
  ingredient_id?: string;
}

export interface CatalogRecipe {
  id: string;
  name_common: string;
  category?: string;
  category_sub?: string;
  subcategory?: string;
  cuisine?: string;
  meal_slot?: string;
  language?: string;
  difficulty?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  serving_size?: string;
  instructions?: string[];
  cooking_instructions?: Record<string, any>;
  linked_ingredients?: Record<string, any>;
  ingredients?: RecipeIngredient[];
  description?: string;
  description_simple?: string;
  description_technical?: string;
  health_benefits?: Record<string, any>;
  taste_profile?: TasteProfile;
  flavor_profile?: Record<string, any>;
  texture_profile?: Record<string, any>;
  elements_beneficial?: Record<string, any>;
  elements_hazardous?: Record<string, any>;
  nutrition_per_100g?: NutritionPer100g;
  nutrition_per_serving?: NutritionPerServing;
  health_score?: number;
  scientific_references?: Record<string, any>;
  origin?: string;
  tags?: string[];
  allergens?: string[];
  dietary_info?: Record<string, boolean>;
  preparation_methods?: string[];
  culinary_uses?: string[];
  image_url?: string;
  image_url_raw?: string;
  image_url_plated?: string;
  image_url_closeup?: string;
  video_url?: string;
  videos?: Record<string, string>;
  scientific_papers?: ContentLink[];
  social_content?: ContentLink[];
  created_at?: string;
  updated_at?: string;
}

// ─── catalog_products ──────────────────────────────────────────────────────

export interface CatalogProduct {
  id: string;
  name_common?: string;
  name?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  ingredients_text?: string;
  allergen_info?: string;
  serving_size?: string;
  serving_unit?: string;
  description?: string;
  description_simple?: string;
  health_score?: number;
  nutrition_per_100g?: NutritionPer100g;
  nutrition_facts?: Record<string, any>;
  elements_beneficial?: Record<string, any>;
  elements_hazardous?: Record<string, any>;
  image_url?: string;
  image_url_raw?: string;
  video_url?: string;
  scientific_papers?: ContentLink[];
  social_content?: ContentLink[];
  created_at?: string;
  updated_at?: string;
}

// ─── Linked element entry (used in elements_beneficial / elements_hazardous) ─

export interface LinkedElement {
  element_id?: string;
  element_name?: string;
  health_role?: 'beneficial' | 'hazardous' | 'beneficial + hazardous';
  amount_per_100g?: number | null;
  amount_unit?: string | null;
  amount_per_serving?: number | null;
  serving_type?: string | null;
  serving_weight_g?: number | null;
  likelihood_percent?: number | null;
  likelihood_reason?: string | null;
  is_primary?: boolean;
}

// ─── Union type for any catalog record ─────────────────────────────────────

export type CatalogRecord =
  | CatalogElement
  | CatalogIngredient
  | CatalogRecipe
  | CatalogProduct;

export type CatalogTable =
  | 'catalog_elements'
  | 'catalog_ingredients'
  | 'catalog_recipes'
  | 'catalog_products';
