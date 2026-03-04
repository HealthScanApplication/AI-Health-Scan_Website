-- ============================================================
-- Add new columns to catalog_elements
-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql
-- Date: 2026-03-01
-- ============================================================

-- name_scientific: scientific/IUPAC name for the element
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS name_scientific TEXT;

-- prevention_items: JSONB array of items that help prevent harm
-- e.g. [{"name":"Activated Charcoal","type":"binder","description":"..."}]
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS prevention_items JSONB DEFAULT '[]'::jsonb;

-- elimination_items: JSONB array of items for detox/elimination
-- e.g. [{"name":"Wormwood","type":"anti-parasitic herb","description":"..."}]
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS elimination_items JSONB DEFAULT '[]'::jsonb;

-- image_url_capsule: image showing the element in capsule form
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS image_url_capsule TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'catalog_elements' 
  AND column_name IN ('name_scientific', 'prevention_items', 'elimination_items', 'image_url_capsule')
ORDER BY column_name;
