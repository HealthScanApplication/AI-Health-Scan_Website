-- Add cubed/diced and cooked image variants to catalog_ingredients
ALTER TABLE public.catalog_ingredients
  ADD COLUMN IF NOT EXISTS image_url_cubed  text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url_cooked text DEFAULT NULL;
