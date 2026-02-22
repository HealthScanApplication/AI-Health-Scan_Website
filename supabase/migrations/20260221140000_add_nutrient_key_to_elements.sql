-- Add nutrient key mapping columns to catalog_elements
-- These allow each element to be mapped to its key in the elements_beneficial JSON structure
-- e.g. Vitamin C → nutrient_key: "vitamin_c_mg", nutrient_unit: "mg", nutrient_category: "vitamins"
ALTER TABLE catalog_elements
  ADD COLUMN IF NOT EXISTS nutrient_key text,
  ADD COLUMN IF NOT EXISTS nutrient_unit text,
  ADD COLUMN IF NOT EXISTS nutrient_category text;
