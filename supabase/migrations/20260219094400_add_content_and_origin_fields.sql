-- Add content link fields (scientific papers + social content) to all catalog tables
-- Add origin/culinary history fields to catalog_ingredients
-- Add extra image URL variants to all catalog tables

-- catalog_elements
ALTER TABLE public.catalog_elements
  ADD COLUMN IF NOT EXISTS scientific_papers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_content    jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_url_raw     text  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url_powdered text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url_cut     text  DEFAULT NULL;

-- catalog_ingredients
ALTER TABLE public.catalog_ingredients
  ADD COLUMN IF NOT EXISTS scientific_papers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_content    jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS origin_country    text  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS origin_region     text  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS origin_city       text  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS culinary_history  text  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url_raw     text  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url_powdered text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url_cut     text  DEFAULT NULL;

-- catalog_recipes
ALTER TABLE public.catalog_recipes
  ADD COLUMN IF NOT EXISTS scientific_papers  jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_content     jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_url_raw      text  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url_plated   text  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url_closeup  text  DEFAULT NULL;
