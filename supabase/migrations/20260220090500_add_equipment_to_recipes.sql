-- Add equipment list to catalog_recipes
ALTER TABLE public.catalog_recipes
  ADD COLUMN IF NOT EXISTS equipment jsonb DEFAULT '[]'::jsonb;
