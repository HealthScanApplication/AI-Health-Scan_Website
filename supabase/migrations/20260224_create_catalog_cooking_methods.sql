-- Migration: create catalog_cooking_methods table
-- Run via: supabase db push --project-ref mofhvoudjxinvpplsytd
-- Or paste into: https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql

CREATE TABLE IF NOT EXISTS catalog_cooking_methods (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL UNIQUE,
  slug            text        UNIQUE,
  category        text        NOT NULL,
  description     text,
  temperature     text,
  medium          text,
  typical_time    text,
  health_impact   text,
  nutrient_effect text,
  best_for        text,
  image_url       text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE catalog_cooking_methods ENABLE ROW LEVEL SECURITY;

-- Public read (catalog data is public)
CREATE POLICY "Public read access"
  ON catalog_cooking_methods FOR SELECT
  USING (true);

-- Service role full access (admin panel uses service role via edge function)
CREATE POLICY "Service role full access"
  ON catalog_cooking_methods
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_cooking_methods_category ON catalog_cooking_methods(category);
CREATE INDEX IF NOT EXISTS idx_cooking_methods_slug ON catalog_cooking_methods(slug);
