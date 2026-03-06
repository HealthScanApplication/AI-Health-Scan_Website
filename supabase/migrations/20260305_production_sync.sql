-- ============================================================
-- PRODUCTION SYNC SCRIPT
-- Run this in the PRODUCTION Supabase SQL Editor
-- All statements use IF NOT EXISTS / IF EXISTS for idempotency
-- Safe to re-run
-- ============================================================

-- ─── SECTION 1: catalog_elements column additions ─────────────
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS food_strategy jsonb DEFAULT NULL;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS detox_strategy text DEFAULT NULL;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS scientific_papers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS social_content jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS image_url_raw text DEFAULT NULL;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS image_url_powdered text DEFAULT NULL;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS image_url_cut text DEFAULT NULL;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_by_population jsonb DEFAULT 'null'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS deficiency_ranges jsonb DEFAULT 'null'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS excess_ranges jsonb DEFAULT 'null'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS nutrient_key text;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS nutrient_unit text;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS nutrient_category text;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_infants_0_6m JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_infants_7_12m JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_children_1_3y JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_children_4_8y JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_children_9_13y JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_teens_14_18y JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_adults_19_30y JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_adults_31_50y JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_adults_51_70y JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_seniors_71y_plus JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_pregnancy JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_breastfeeding JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_menopause JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_menstruation JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS age_ranges JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS testing_or_diagnostics JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS interventions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS content_urls JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS regions_meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS daily_recommended_adult JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS other_names JSONB DEFAULT '[]'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS confidence TEXT DEFAULT 'draft';
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS key_interactions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS food_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS slug_path TEXT;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS qa_rules JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_elements DROP CONSTRAINT IF EXISTS catalog_elements_subcategory_fkey;
ALTER TABLE catalog_elements DROP COLUMN IF EXISTS elements_beneficial;
ALTER TABLE catalog_elements DROP COLUMN IF EXISTS elements_hazardous;

-- ─── SECTION 2: catalog_ingredients column additions ──────────
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS processing_methods jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS elements_hazardous jsonb DEFAULT '{}'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS raw_ingredients jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS description_processing text DEFAULT '';
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS scientific_papers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS social_content jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS origin_country text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS origin_region text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS origin_city text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS culinary_history text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS image_url_raw text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS image_url_powdered text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS image_url_cut text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS image_url_cubed text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS image_url_cooked text DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS nutrition_per_100g jsonb DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS nutrition_per_serving jsonb DEFAULT NULL;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS linked_ingredients jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS elements_content JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_catalog_ingredients_elements_content ON catalog_ingredients USING gin (elements_content);

-- ─── SECTION 3: catalog_recipes column additions ──────────────
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS video_url text DEFAULT '';
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS category_sub jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS prep_time text DEFAULT '';
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS cook_time text DEFAULT '';
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS servings integer DEFAULT 0;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS difficulty text DEFAULT '';
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS instructions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS linked_ingredients jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS description_technical text DEFAULT '';
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS health_benefits text DEFAULT '';
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS taste_profile jsonb DEFAULT '{}'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS elements_hazardous jsonb DEFAULT '{}'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS health_score numeric DEFAULT 0;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS scientific_references jsonb DEFAULT '{}'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS scientific_papers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS social_content jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS image_url_raw text DEFAULT NULL;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS image_url_plated text DEFAULT NULL;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS image_url_closeup text DEFAULT NULL;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS equipment jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS nutrition_per_100g jsonb DEFAULT NULL;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS nutrition_per_serving jsonb DEFAULT NULL;
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS cooking_method_ids uuid[] DEFAULT '{}';
ALTER TABLE catalog_recipes ADD COLUMN IF NOT EXISTS equipment_ids uuid[] DEFAULT '{}';
ALTER TABLE catalog_recipes ALTER COLUMN meal_slot TYPE text;
ALTER TABLE catalog_recipes ALTER COLUMN category TYPE text;
ALTER TABLE catalog_recipes ALTER COLUMN cuisine TYPE text;
ALTER TABLE catalog_recipes ALTER COLUMN difficulty TYPE text;
ALTER TABLE catalog_recipes ALTER COLUMN language TYPE text;
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_method_ids ON catalog_recipes USING GIN(cooking_method_ids);
CREATE INDEX IF NOT EXISTS idx_recipes_equipment_ids ON catalog_recipes USING GIN(equipment_ids);

-- ─── SECTION 4: catalog_equipment table ───────────────────────
CREATE TABLE IF NOT EXISTS catalog_equipment (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  category    text,
  description text,
  image_url   text,
  brand       text,
  material    text,
  size_notes  text,
  use_case    text,
  affiliate_url text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE catalog_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON catalog_equipment;
DROP POLICY IF EXISTS "Service role full access" ON catalog_equipment;
DROP POLICY IF EXISTS "Authenticated users can update" ON catalog_equipment;
CREATE POLICY "Public read access" ON catalog_equipment FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON catalog_equipment FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can update" ON catalog_equipment FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
GRANT ALL ON catalog_equipment TO service_role;
GRANT ALL ON catalog_equipment TO authenticated;
GRANT SELECT ON catalog_equipment TO anon;

-- Add bidirectional equipment columns (safe no-op if equipment already exists)
ALTER TABLE catalog_equipment ADD COLUMN IF NOT EXISTS cooking_methods_used_with uuid[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_equipment_cooking_methods ON catalog_equipment USING GIN(cooking_methods_used_with);

-- ─── SECTION 5: catalog_cooking_methods table ─────────────────
CREATE TABLE IF NOT EXISTS catalog_cooking_methods (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL UNIQUE,
  slug            text        UNIQUE,
  category        text        NOT NULL,
  description     text,
  temperature     text,
  medium          text,
  typical_time    text,
  health_impact   text,
  nutrient_effect text,
  best_for        text,
  image_url       text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE catalog_cooking_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON catalog_cooking_methods;
DROP POLICY IF EXISTS "Service role full access" ON catalog_cooking_methods;
DROP POLICY IF EXISTS "Authenticated users can update" ON catalog_cooking_methods;
CREATE POLICY "Public read access" ON catalog_cooking_methods FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON catalog_cooking_methods FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can update" ON catalog_cooking_methods FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
GRANT ALL ON catalog_cooking_methods TO service_role;
GRANT ALL ON catalog_cooking_methods TO authenticated;
GRANT SELECT ON catalog_cooking_methods TO anon;
CREATE INDEX IF NOT EXISTS idx_cooking_methods_category ON catalog_cooking_methods(category);
CREATE INDEX IF NOT EXISTS idx_cooking_methods_slug ON catalog_cooking_methods(slug);

-- Bidirectional cooking_methods ↔ equipment columns
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS equipment_ids uuid[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_cooking_methods_equipment_ids ON catalog_cooking_methods USING GIN(equipment_ids);

-- ─── SECTION 6: catalog_activities table ──────────────────────
CREATE TABLE IF NOT EXISTS catalog_activities (
  id                    text        PRIMARY KEY,
  name                  text        NOT NULL,
  description           text,
  category              text        NOT NULL,
  icon_name             text,
  icon_svg_path         text,
  image_url             text,
  sweat_level           text        DEFAULT 'none',
  default_duration_min  integer     DEFAULT 30,
  calories_per_minute   numeric(5,1) DEFAULT 5,
  intensity_levels      jsonb       DEFAULT '["Low","Moderate","High"]'::jsonb,
  mineral_impact        jsonb       DEFAULT '[]'::jsonb,
  toxin_loss            jsonb       DEFAULT '[]'::jsonb,
  benefits              jsonb       DEFAULT '[]'::jsonb,
  strava_types          jsonb       DEFAULT '[]'::jsonb,
  equipment_needed      text[],
  muscle_groups         text[],
  contraindications     text[],
  is_active             boolean     DEFAULT true,
  sort_order            integer     DEFAULT 100,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
ALTER TABLE catalog_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON catalog_activities;
DROP POLICY IF EXISTS "Service role full access" ON catalog_activities;
DROP POLICY IF EXISTS "Authenticated users can manage" ON catalog_activities;
CREATE POLICY "Public read access" ON catalog_activities FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON catalog_activities FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can manage" ON catalog_activities FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
GRANT ALL ON catalog_activities TO service_role;
GRANT ALL ON catalog_activities TO authenticated;
GRANT SELECT ON catalog_activities TO anon;
CREATE INDEX IF NOT EXISTS idx_activities_category ON catalog_activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON catalog_activities(is_active);
CREATE INDEX IF NOT EXISTS idx_activities_sort_order ON catalog_activities(sort_order);
ALTER TABLE catalog_activities ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE catalog_activities ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ─── SECTION 7: catalog_symptoms table ────────────────────────
CREATE TABLE IF NOT EXISTS catalog_symptoms (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  slug          text UNIQUE,
  category      text,
  body_system   text,
  severity      text DEFAULT 'moderate',
  onset_type    text DEFAULT 'gradual',
  description         text,
  description_simple  text,
  linked_elements_deficiency  jsonb DEFAULT '[]'::jsonb,
  linked_elements_excess      jsonb DEFAULT '[]'::jsonb,
  common_causes       text[],
  related_symptoms    text[],
  reversible          boolean DEFAULT true,
  population_risk     text[],
  diagnostic_notes    text,
  image_url           text,
  icon_name           text,
  tags                text[],
  health_score_impact integer DEFAULT 0,
  scientific_references jsonb,
  is_active           boolean DEFAULT true,
  sort_order          integer DEFAULT 100,
  ai_enriched_at      timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
ALTER TABLE catalog_symptoms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for catalog_symptoms" ON catalog_symptoms;
DROP POLICY IF EXISTS "Service role full access for catalog_symptoms" ON catalog_symptoms;
CREATE POLICY "Public read access for catalog_symptoms" ON catalog_symptoms FOR SELECT USING (true);
CREATE POLICY "Service role full access for catalog_symptoms" ON catalog_symptoms FOR ALL USING (auth.role() = 'service_role');
GRANT ALL ON catalog_symptoms TO service_role;
GRANT ALL ON catalog_symptoms TO authenticated;
GRANT SELECT ON catalog_symptoms TO anon;
CREATE INDEX IF NOT EXISTS idx_symptoms_category ON catalog_symptoms(category);
CREATE INDEX IF NOT EXISTS idx_symptoms_body_system ON catalog_symptoms(body_system);
CREATE INDEX IF NOT EXISTS idx_symptoms_severity ON catalog_symptoms(severity);
CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON catalog_symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_deficiency ON catalog_symptoms USING GIN (linked_elements_deficiency);
CREATE INDEX IF NOT EXISTS idx_symptoms_excess ON catalog_symptoms USING GIN (linked_elements_excess);
ALTER TABLE catalog_symptoms ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE catalog_symptoms ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ─── SECTION 8: catalog_ingredient_elements junction table ────
DROP TABLE IF EXISTS catalog_ingredient_elements CASCADE;
CREATE TABLE catalog_ingredient_elements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id   TEXT NOT NULL REFERENCES catalog_ingredients(id) ON DELETE CASCADE,
  element_id      TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  amount_per_100g NUMERIC,
  unit_per_100g   TEXT,
  amount_per_serving NUMERIC,
  serving_type    TEXT,
  serving_weight_g NUMERIC,
  likelihood_percent NUMERIC DEFAULT 0,
  likelihood_reason TEXT,
  is_primary      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ingredient_id, element_id)
);
ALTER TABLE catalog_ingredient_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON catalog_ingredient_elements FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON catalog_ingredient_elements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can update" ON catalog_ingredient_elements FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON catalog_ingredient_elements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON catalog_ingredient_elements FOR DELETE USING (auth.role() = 'authenticated');
CREATE INDEX idx_cie_ingredient ON catalog_ingredient_elements(ingredient_id);
CREATE INDEX idx_cie_element ON catalog_ingredient_elements(element_id);
CREATE INDEX idx_cie_primary ON catalog_ingredient_elements(is_primary) WHERE is_primary = true;
GRANT ALL ON catalog_ingredient_elements TO service_role;
GRANT ALL ON catalog_ingredient_elements TO authenticated;
GRANT SELECT ON catalog_ingredient_elements TO anon;

-- ─── SECTION 9: Schema-wide GRANT fixes ───────────────────────
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ─── SECTION 10: Backfill nutrition_per_100g from elements_beneficial ─
UPDATE catalog_ingredients
SET nutrition_per_100g = jsonb_build_object(
  'calories', COALESCE((elements_beneficial->'per_100g'->>'calories')::numeric, 0),
  'protein_g', COALESCE((elements_beneficial->'per_100g'->'macronutrients'->>'protein_g')::numeric, 0),
  'carbohydrates_g', COALESCE((elements_beneficial->'per_100g'->'macronutrients'->>'carbohydrates_g')::numeric, 0),
  'fats_g', COALESCE((elements_beneficial->'per_100g'->'macronutrients'->>'fat_g')::numeric, (elements_beneficial->'per_100g'->'macronutrients'->>'fats_g')::numeric, 0),
  'fiber_g', COALESCE((elements_beneficial->'per_100g'->'macronutrients'->>'fiber_g')::numeric, 0),
  'sugar_g', COALESCE((elements_beneficial->'per_100g'->'macronutrients'->>'sugars_g')::numeric, (elements_beneficial->'per_100g'->'macronutrients'->>'sugar_g')::numeric, 0),
  'water_g', COALESCE((elements_beneficial->'per_100g'->'macronutrients'->>'water_g')::numeric, (elements_beneficial->'per_100g'->'macronutrients'->>'water_content_g')::numeric, 0),
  'sodium_mg', COALESCE((elements_beneficial->'per_100g'->'minerals'->>'sodium_mg')::numeric, 0)
),
updated_at = now()
WHERE
  (nutrition_per_100g IS NULL OR nutrition_per_100g = '{}'::jsonb OR nutrition_per_100g = 'null'::jsonb)
  AND elements_beneficial IS NOT NULL
  AND elements_beneficial != '{}'::jsonb
  AND elements_beneficial->'per_100g' IS NOT NULL
  AND (
    (elements_beneficial->'per_100g'->>'calories')::numeric > 0
    OR (elements_beneficial->'per_100g'->'macronutrients'->>'protein_g')::numeric > 0
  );

-- Fix any water_content_g keys → water_g in nutrition_per_100g
UPDATE catalog_ingredients
SET nutrition_per_100g = nutrition_per_100g - 'water_content_g' || jsonb_build_object('water_g', nutrition_per_100g->'water_content_g'),
    updated_at = now()
WHERE nutrition_per_100g ? 'water_content_g'
  AND NOT nutrition_per_100g ? 'water_g';

-- ─── VERIFY ───────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'catalog_equipment', 'catalog_cooking_methods',
    'catalog_activities', 'catalog_symptoms',
    'catalog_ingredient_elements'
  )
ORDER BY table_name;
