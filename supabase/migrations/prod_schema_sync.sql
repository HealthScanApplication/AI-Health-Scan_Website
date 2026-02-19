-- Consolidated schema sync: apply all staging migrations to production
-- Run against: ermbkttsyvpenjjxaxcf (production)

-- 20260215073416_add_processing_methods
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS processing_methods jsonb DEFAULT '[]'::jsonb;

-- 20260215080300_add_ingredient_fields
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS elements_hazardous jsonb DEFAULT '{}'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS raw_ingredients jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS description_processing text DEFAULT '';

-- 20260215131600_add_elements_reason
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS reason TEXT;

-- 20260215230100_add_recipe_and_product_fields
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

-- 20260218100400_add_elements_food_strategy_detox
ALTER TABLE public.catalog_elements ADD COLUMN IF NOT EXISTS food_strategy jsonb DEFAULT NULL;
ALTER TABLE public.catalog_elements ADD COLUMN IF NOT EXISTS detox_strategy text DEFAULT NULL;

-- 20260219094400_add_content_and_origin_fields
ALTER TABLE public.catalog_elements ADD COLUMN IF NOT EXISTS scientific_papers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.catalog_elements ADD COLUMN IF NOT EXISTS social_content    jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.catalog_elements ADD COLUMN IF NOT EXISTS image_url_raw     text  DEFAULT NULL;
ALTER TABLE public.catalog_elements ADD COLUMN IF NOT EXISTS image_url_powdered text DEFAULT NULL;
ALTER TABLE public.catalog_elements ADD COLUMN IF NOT EXISTS image_url_cut     text  DEFAULT NULL;

ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS scientific_papers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS social_content    jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS origin_country    text  DEFAULT NULL;
ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS origin_region     text  DEFAULT NULL;
ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS origin_city       text  DEFAULT NULL;
ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS culinary_history  text  DEFAULT NULL;
ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS image_url_raw     text  DEFAULT NULL;
ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS image_url_powdered text DEFAULT NULL;
ALTER TABLE public.catalog_ingredients ADD COLUMN IF NOT EXISTS image_url_cut     text  DEFAULT NULL;

ALTER TABLE public.catalog_recipes ADD COLUMN IF NOT EXISTS scientific_papers  jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.catalog_recipes ADD COLUMN IF NOT EXISTS social_content     jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.catalog_recipes ADD COLUMN IF NOT EXISTS image_url_raw      text  DEFAULT NULL;
ALTER TABLE public.catalog_recipes ADD COLUMN IF NOT EXISTS image_url_plated   text  DEFAULT NULL;
ALTER TABLE public.catalog_recipes ADD COLUMN IF NOT EXISTS image_url_closeup  text  DEFAULT NULL;

-- 20260219113000_add_drv_and_ranges_to_elements
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS drv_by_population jsonb DEFAULT 'null'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS deficiency_ranges  jsonb DEFAULT 'null'::jsonb;
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS excess_ranges      jsonb DEFAULT 'null'::jsonb;

-- Also fix the 'Processed?' column issue in catalog_ingredients
-- This is likely a legacy column name with special chars — drop it if it exists and has no data
-- (safe because it's not in any migration, it's a bad column name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catalog_ingredients' AND column_name = 'Processed?'
  ) THEN
    ALTER TABLE catalog_ingredients RENAME COLUMN "Processed?" TO processed;
  END IF;
END $$;
