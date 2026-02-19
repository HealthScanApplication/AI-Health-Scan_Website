ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS elements_hazardous jsonb DEFAULT '{}'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS raw_ingredients jsonb DEFAULT '[]'::jsonb;
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS description_processing text DEFAULT '';
