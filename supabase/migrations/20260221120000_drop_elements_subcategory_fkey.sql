-- Drop the foreign key constraint on catalog_elements.subcategory
-- This field should be free-text, not constrained to a lookup table
ALTER TABLE catalog_elements DROP CONSTRAINT IF EXISTS catalog_elements_subcategory_fkey;
