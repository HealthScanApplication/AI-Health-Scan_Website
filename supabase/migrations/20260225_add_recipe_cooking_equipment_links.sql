-- Add cooking method and equipment UUID array fields to catalog_recipes
-- This enables direct linking between recipes, cooking methods, and equipment

-- Add cooking_method_ids array
ALTER TABLE catalog_recipes 
  ADD COLUMN IF NOT EXISTS cooking_method_ids uuid[] DEFAULT '{}';

-- Add equipment_ids array (separate from the existing 'equipment' jsonb field)
ALTER TABLE catalog_recipes 
  ADD COLUMN IF NOT EXISTS equipment_ids uuid[] DEFAULT '{}';

-- Create indexes for efficient array queries
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_method_ids 
  ON catalog_recipes USING GIN(cooking_method_ids);

CREATE INDEX IF NOT EXISTS idx_recipes_equipment_ids 
  ON catalog_recipes USING GIN(equipment_ids);

-- Add comments
COMMENT ON COLUMN catalog_recipes.cooking_method_ids IS 
  'Array of cooking method IDs from catalog_cooking_methods used in this recipe';

COMMENT ON COLUMN catalog_recipes.equipment_ids IS 
  'Array of equipment IDs from catalog_equipment needed for this recipe';
