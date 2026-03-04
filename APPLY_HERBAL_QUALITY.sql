-- ============================================================
-- APPLY: herbal_quality column on catalog_ingredients
--        + herbal_treatments column on catalog_symptoms
-- Run this in Supabase SQL Editor
-- Date: 2025-06-01
-- ============================================================

-- ── 1. Add herbal_quality JSONB column to catalog_ingredients ──
ALTER TABLE catalog_ingredients ADD COLUMN IF NOT EXISTS herbal_quality JSONB DEFAULT '{}'::jsonb;

-- ── 2. Add herbal_treatments JSONB column to catalog_symptoms (reverse linking) ──
ALTER TABLE catalog_symptoms ADD COLUMN IF NOT EXISTS herbal_treatments JSONB DEFAULT '[]'::jsonb;

-- ── 3. Index for faster herbal quality lookups ──
CREATE INDEX IF NOT EXISTS idx_ingredients_herbal_quality ON catalog_ingredients USING GIN (herbal_quality);
CREATE INDEX IF NOT EXISTS idx_symptoms_herbal_treatments ON catalog_symptoms USING GIN (herbal_treatments);

-- ── 4. Verify columns were added ──
SELECT column_name, data_type
FROM information_schema.columns
WHERE (table_name = 'catalog_ingredients' AND column_name = 'herbal_quality')
   OR (table_name = 'catalog_symptoms' AND column_name = 'herbal_treatments')
ORDER BY table_name, column_name;
