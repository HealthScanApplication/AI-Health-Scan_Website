-- ============================================================
-- STEP 1: Add missing columns to both tables
-- STEP 2: Ensure symptoms table exists
-- STEP 3: Verify both tables have data
-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql
-- Date: 2026-02-28
-- ============================================================

-- ── STEP 1A: Add columns to catalog_activities ──
ALTER TABLE catalog_activities ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE catalog_activities ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ── STEP 1B: Create catalog_symptoms if missing ──
CREATE TABLE IF NOT EXISTS catalog_symptoms (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  slug          text UNIQUE,
  category      text,
  body_system   text,
  severity      text DEFAULT 'moderate',
  onset_type    text DEFAULT 'gradual',
  description         text,
  description_simple  text,
  linked_elements_deficiency  jsonb DEFAULT '[]'::jsonb,
  linked_elements_excess      jsonb DEFAULT '[]'::jsonb,
  common_causes       text[],
  related_symptoms    text[],
  reversible          boolean DEFAULT true,
  population_risk     text[],
  diagnostic_notes    text,
  icon_name           text,
  icon_url            text,
  image_url           text,
  video_url           text,
  tags                text[],
  health_score_impact integer DEFAULT 0,
  scientific_references jsonb,
  is_active           boolean DEFAULT true,
  sort_order          integer DEFAULT 100,
  ai_enriched_at      timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── STEP 1C: Add columns to catalog_symptoms ──
ALTER TABLE catalog_symptoms ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE catalog_symptoms ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ── STEP 2: RLS for symptoms ──
ALTER TABLE catalog_symptoms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for catalog_symptoms" ON catalog_symptoms;
CREATE POLICY "Public read access for catalog_symptoms"
  ON catalog_symptoms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access for catalog_symptoms" ON catalog_symptoms;
CREATE POLICY "Service role full access for catalog_symptoms"
  ON catalog_symptoms FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can manage symptoms" ON catalog_symptoms;
CREATE POLICY "Authenticated users can manage symptoms"
  ON catalog_symptoms FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_symptoms_category ON catalog_symptoms(category);
CREATE INDEX IF NOT EXISTS idx_symptoms_body_system ON catalog_symptoms(body_system);
CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON catalog_symptoms(slug);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_catalog_symptoms_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_catalog_symptoms_updated_at ON catalog_symptoms;
CREATE TRIGGER trg_catalog_symptoms_updated_at
  BEFORE UPDATE ON catalog_symptoms FOR EACH ROW
  EXECUTE FUNCTION update_catalog_symptoms_updated_at();

-- ── STEP 3: Verify ──
SELECT 'catalog_activities' AS tbl, count(*) AS rows FROM catalog_activities
UNION ALL
SELECT 'catalog_symptoms' AS tbl, count(*) AS rows FROM catalog_symptoms;
