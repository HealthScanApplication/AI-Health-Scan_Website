-- Migration: create catalog_equipment table
-- Run via: supabase db push --project-ref mofhvoudjxinvpplsytd
-- Or paste into: https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql

CREATE TABLE IF NOT EXISTS catalog_equipment (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  category    text,
  description text,
  image_url   text,
  brand       text,
  material    text,
  size_notes  text,
  use_case    text,
  affiliate_url text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE catalog_equipment ENABLE ROW LEVEL SECURITY;

-- Public read (catalog data is public)
CREATE POLICY "Public read access"
  ON catalog_equipment FOR SELECT
  USING (true);

-- Service role full access (admin panel uses service role via edge function)
CREATE POLICY "Service role full access"
  ON catalog_equipment
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
