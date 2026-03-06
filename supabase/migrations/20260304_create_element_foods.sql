-- =============================================================================
-- Migration: Create element_foods table
-- Description: Top 10 food sources for each element (vitamins, minerals, amino acids)
-- Date: 2026-03-04
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.element_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES public.catalog_elements(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  food_category TEXT,
  amount_per_serving NUMERIC,
  unit TEXT,
  serving_size NUMERIC,
  serving_unit TEXT,
  emoji_icon TEXT,
  image_url TEXT,
  catalog_ingredient_id TEXT REFERENCES public.catalog_ingredients(id) ON DELETE SET NULL,
  rank INTEGER NOT NULL DEFAULT 1,
  bioavailability TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(element_id, food_name)
);

-- Index for fast lookups by element
CREATE INDEX IF NOT EXISTS idx_element_foods_element_id ON public.element_foods(element_id);
CREATE INDEX IF NOT EXISTS idx_element_foods_rank ON public.element_foods(element_id, rank);

-- RLS Policies
ALTER TABLE public.element_foods ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "element_foods_select_policy" ON public.element_foods
  FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "element_foods_insert_policy" ON public.element_foods
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "element_foods_update_policy" ON public.element_foods
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "element_foods_delete_policy" ON public.element_foods
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_element_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER element_foods_updated_at_trigger
  BEFORE UPDATE ON public.element_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_element_foods_updated_at();
