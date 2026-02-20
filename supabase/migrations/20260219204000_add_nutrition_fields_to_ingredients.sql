-- Add nutrition_per_100g, nutrition_per_serving, and linked_ingredients to catalog_ingredients
ALTER TABLE public.catalog_ingredients
  ADD COLUMN IF NOT EXISTS nutrition_per_100g   jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nutrition_per_serving jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS linked_ingredients   jsonb DEFAULT '[]'::jsonb;
