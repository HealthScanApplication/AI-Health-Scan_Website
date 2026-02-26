-- ============================================================
-- Migration: Create catalog_symptoms table
-- Links symptoms to element deficiency and excess
-- Date: 2026-02-26
-- ============================================================

CREATE TABLE IF NOT EXISTS catalog_symptoms (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  slug          text UNIQUE,
  category      text,                     -- neurological, dermatological, muscular, visual, digestive, cardiovascular, skeletal, immune, hormonal, psychological, respiratory, oral
  body_system   text,                     -- nervous system, skin, eyes, muscles, gut, heart, bones, immune, endocrine, brain, lungs, mouth
  severity      text DEFAULT 'moderate',  -- mild, moderate, severe
  onset_type    text DEFAULT 'gradual',   -- acute, gradual, chronic

  description         text,
  description_simple  text,

  -- Element linkage (JSONB arrays with element references)
  linked_elements_deficiency  jsonb DEFAULT '[]'::jsonb,   -- [{ "element_id": "uuid", "element_name": "Vitamin A", "strength": "strong" }]
  linked_elements_excess      jsonb DEFAULT '[]'::jsonb,   -- [{ "element_id": "uuid", "element_name": "Vitamin A", "strength": "moderate" }]

  -- Additional clinical data
  common_causes       text[],              -- other non-element causes
  related_symptoms    text[],              -- symptoms often co-occurring
  reversible          boolean DEFAULT true, -- reversible when element balanced
  population_risk     text[],              -- e.g. ['elderly', 'pregnant', 'vegans', 'children']
  diagnostic_notes    text,                -- how to confirm / test for this symptom

  -- Presentation
  image_url           text,
  icon_name           text,                -- lucide icon name
  tags                text[],

  -- Scoring
  health_score_impact integer DEFAULT 0,   -- negative impact on health score (0-100)

  -- References
  scientific_references jsonb,

  -- System
  is_active           boolean DEFAULT true,
  sort_order          integer DEFAULT 100,
  ai_enriched_at      timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_symptoms_category ON catalog_symptoms(category);
CREATE INDEX IF NOT EXISTS idx_symptoms_body_system ON catalog_symptoms(body_system);
CREATE INDEX IF NOT EXISTS idx_symptoms_severity ON catalog_symptoms(severity);
CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON catalog_symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_deficiency ON catalog_symptoms USING GIN (linked_elements_deficiency);
CREATE INDEX IF NOT EXISTS idx_symptoms_excess ON catalog_symptoms USING GIN (linked_elements_excess);

-- RLS
ALTER TABLE catalog_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for catalog_symptoms"
  ON catalog_symptoms FOR SELECT
  USING (true);

CREATE POLICY "Service role full access for catalog_symptoms"
  ON catalog_symptoms FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_catalog_symptoms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_catalog_symptoms_updated_at
  BEFORE UPDATE ON catalog_symptoms
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_symptoms_updated_at();
