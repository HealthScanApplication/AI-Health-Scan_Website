-- Create the catalog_ingredient_elements junction table
-- Links ingredients to elements (micronutrients) with amount data
-- This is the PREFERRED way to store micronutrient data for the mobile app

-- Drop if partially created (e.g. missing columns from a failed earlier run)
DROP TABLE IF EXISTS catalog_ingredient_elements CASCADE;

CREATE TABLE catalog_ingredient_elements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id   TEXT NOT NULL REFERENCES catalog_ingredients(id) ON DELETE CASCADE,
  element_id      TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  amount_per_100g NUMERIC,
  unit_per_100g   TEXT,
  amount_per_serving NUMERIC,
  serving_type    TEXT,
  serving_weight_g NUMERIC,
  likelihood_percent NUMERIC DEFAULT 0,
  likelihood_reason TEXT,
  is_primary      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ingredient_id, element_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_cie_ingredient ON catalog_ingredient_elements(ingredient_id);
CREATE INDEX idx_cie_element ON catalog_ingredient_elements(element_id);
CREATE INDEX idx_cie_primary ON catalog_ingredient_elements(is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE catalog_ingredient_elements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access" ON catalog_ingredient_elements
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON catalog_ingredient_elements
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update" ON catalog_ingredient_elements
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert" ON catalog_ingredient_elements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON catalog_ingredient_elements
  FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON catalog_ingredient_elements TO service_role;
GRANT ALL ON catalog_ingredient_elements TO authenticated;
GRANT SELECT ON catalog_ingredient_elements TO anon;
