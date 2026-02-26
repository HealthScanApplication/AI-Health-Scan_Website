-- Drop elements_beneficial and elements_hazardous from catalog_elements
-- Elements should not contain other elements (illogical nesting)
-- These fields exist in catalog_ingredients, catalog_recipes, and catalog_foods where they make sense

ALTER TABLE catalog_elements 
  DROP COLUMN IF EXISTS elements_beneficial;

ALTER TABLE catalog_elements 
  DROP COLUMN IF EXISTS elements_hazardous;
