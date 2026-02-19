-- Add 'reason' field to catalog_elements
-- Describes which ingredient the element comes from or what industrial process produces it
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS reason TEXT;
