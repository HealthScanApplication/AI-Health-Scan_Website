-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql

-- Add equipment_ids column to catalog_cooking_methods
ALTER TABLE catalog_cooking_methods 
  ADD COLUMN IF NOT EXISTS equipment_ids uuid[] DEFAULT '{}';

-- Add cooking_methods_used_with column to catalog_equipment
ALTER TABLE catalog_equipment 
  ADD COLUMN IF NOT EXISTS cooking_methods_used_with uuid[] DEFAULT '{}';

-- Create indexes for efficient array queries
CREATE INDEX IF NOT EXISTS idx_cooking_methods_equipment_ids
  ON catalog_cooking_methods USING GIN(equipment_ids);

CREATE INDEX IF NOT EXISTS idx_equipment_cooking_methods
  ON catalog_equipment USING GIN(cooking_methods_used_with);

-- Add comments
COMMENT ON COLUMN catalog_cooking_methods.equipment_ids IS
  'Array of equipment IDs from catalog_equipment needed for this cooking method';

COMMENT ON COLUMN catalog_equipment.cooking_methods_used_with IS
  'Array of cooking method IDs from catalog_cooking_methods that use this equipment';
