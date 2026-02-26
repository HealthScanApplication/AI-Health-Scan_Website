-- Migration: Add bidirectional relationship between cooking methods and equipment
-- This replaces equipment_needed text field with equipment_ids array
-- And adds cooking_methods_used_with array to equipment table

-- 1. Drop the text column from cooking methods if it exists
ALTER TABLE catalog_cooking_methods DROP COLUMN IF EXISTS equipment_needed;

-- 2. Add equipment_ids array to cooking methods (references catalog_equipment.id)
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS equipment_ids uuid[] DEFAULT '{}';

-- 3. Add cooking_methods_used_with array to equipment (references catalog_cooking_methods.id)
ALTER TABLE catalog_equipment ADD COLUMN IF NOT EXISTS cooking_methods_used_with uuid[] DEFAULT '{}';

-- 4. Create indexes for array queries
CREATE INDEX IF NOT EXISTS idx_cooking_methods_equipment_ids ON catalog_cooking_methods USING GIN(equipment_ids);
CREATE INDEX IF NOT EXISTS idx_equipment_cooking_methods ON catalog_equipment USING GIN(cooking_methods_used_with);

-- 5. Add comments for documentation
COMMENT ON COLUMN catalog_cooking_methods.equipment_ids IS 'Array of equipment IDs from catalog_equipment required for this cooking method';
COMMENT ON COLUMN catalog_equipment.cooking_methods_used_with IS 'Array of cooking method IDs from catalog_cooking_methods that use this equipment';
