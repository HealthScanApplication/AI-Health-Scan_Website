-- ============================================================
-- ELEMENT-PRODUCT LINKING SYSTEM
-- Bidirectional links: elements ↔ supplements, tests, products
-- + cooking methods ↔ hazardous elements
-- ============================================================
-- NOTE: catalog_elements.id, hs_supplements.id, hs_tests.id,
--       hs_products.id are all TEXT (not UUID).
--       catalog_cooking_methods.id is UUID.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Create join tables for many-to-many relationships
-- ────────────────────────────────────────────────────────────

-- Drop if exist so this is re-runnable during dev
DROP TABLE IF EXISTS element_supplements CASCADE;
DROP TABLE IF EXISTS element_tests CASCADE;
DROP TABLE IF EXISTS element_products CASCADE;
DROP TABLE IF EXISTS cooking_method_elements CASCADE;

-- Link elements to supplements (many-to-many)
CREATE TABLE element_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  supplement_id TEXT NOT NULL REFERENCES hs_supplements(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, supplement_id)
);
COMMENT ON TABLE element_supplements IS 'Links elements to supplements - many-to-many';
CREATE INDEX idx_element_supplements_element ON element_supplements(element_id);
CREATE INDEX idx_element_supplements_supplement ON element_supplements(supplement_id);

-- Link elements to tests (many-to-many)
CREATE TABLE element_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES hs_tests(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, test_id)
);
COMMENT ON TABLE element_tests IS 'Links elements to tests - many-to-many';
CREATE INDEX idx_element_tests_element ON element_tests(element_id);
CREATE INDEX idx_element_tests_test ON element_tests(test_id);

-- Link elements to HS products (many-to-many) — air/water quality, kits, etc.
CREATE TABLE element_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES hs_products(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, product_id)
);
COMMENT ON TABLE element_products IS 'Links elements to HS products (kits, devices) - many-to-many';
CREATE INDEX idx_element_products_element ON element_products(element_id);
CREATE INDEX idx_element_products_product ON element_products(product_id);

-- Link cooking methods to hazardous elements (many-to-many)
-- e.g. deep frying → acrylamide, grilling → PAHs, charring → HCAs
CREATE TABLE cooking_method_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooking_method_id UUID NOT NULL REFERENCES catalog_cooking_methods(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'hazardous',  -- 'hazardous', 'beneficial', 'reduces', 'increases'
  severity TEXT DEFAULT 'moderate',                 -- 'low', 'moderate', 'high'
  mechanism TEXT,                                   -- how the cooking method affects the element
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cooking_method_id, element_id)
);
COMMENT ON TABLE cooking_method_elements IS 'Links cooking methods to elements they produce/affect (hazardous or beneficial)';
CREATE INDEX idx_cooking_method_elements_method ON cooking_method_elements(cooking_method_id);
CREATE INDEX idx_cooking_method_elements_element ON cooking_method_elements(element_id);

-- ────────────────────────────────────────────────────────────
-- STEP 1b: Add element JSONB columns to cooking methods
-- ────────────────────────────────────────────────────────────
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS elements_hazardous JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS elements_beneficial JSONB DEFAULT '{}'::jsonb;

-- ────────────────────────────────────────────────────────────
-- STEP 2: Add element image columns to all HS tables
-- ────────────────────────────────────────────────────────────
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS element_image_url TEXT;
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS element_images JSONB;
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS element_image_url TEXT;
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS element_images JSONB;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS element_image_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS element_images JSONB;

-- ────────────────────────────────────────────────────────────
-- STEP 3: Populate element images from catalog_elements
-- ────────────────────────────────────────────────────────────
UPDATE hs_supplements s SET
  element_image_url = e.image_url,
  element_images = jsonb_build_array(jsonb_build_object('element_key', COALESCE(e.nutrient_key, e.slug), 'image_url', e.image_url, 'name', e.name_common))
FROM catalog_elements e
WHERE (s.element_key = e.nutrient_key OR s.element_key = e.slug) AND e.image_url IS NOT NULL;

UPDATE hs_tests t SET
  element_image_url = e.image_url,
  element_images = jsonb_build_array(jsonb_build_object('element_key', COALESCE(e.nutrient_key, e.slug), 'image_url', e.image_url, 'name', e.name_common))
FROM catalog_elements e
WHERE (t.element_key = e.nutrient_key OR t.element_key = e.slug) AND e.image_url IS NOT NULL;

UPDATE hs_products p SET
  element_image_url = e.image_url,
  element_images = jsonb_build_array(jsonb_build_object('element_key', COALESCE(e.nutrient_key, e.slug), 'image_url', e.image_url, 'name', e.name_common))
FROM catalog_elements e
WHERE (p.element_key = e.nutrient_key OR p.element_key = e.slug) AND e.image_url IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 4: Populate join tables from element_key
-- ────────────────────────────────────────────────────────────
INSERT INTO element_supplements (element_id, supplement_id, is_primary, notes)
SELECT e.id, s.id, true, 'Auto-linked via element_key: ' || s.element_key
FROM hs_supplements s
JOIN catalog_elements e ON (s.element_key = e.nutrient_key OR s.element_key = e.slug)
WHERE s.element_key IS NOT NULL
ON CONFLICT (element_id, supplement_id) DO NOTHING;

INSERT INTO element_tests (element_id, test_id, is_primary, notes)
SELECT e.id, t.id, true, 'Auto-linked via element_key: ' || t.element_key
FROM hs_tests t
JOIN catalog_elements e ON (t.element_key = e.nutrient_key OR t.element_key = e.slug)
WHERE t.element_key IS NOT NULL
ON CONFLICT (element_id, test_id) DO NOTHING;

INSERT INTO element_products (element_id, product_id, is_primary, notes)
SELECT e.id, p.id, true, 'Auto-linked via element_key: ' || p.element_key
FROM hs_products p
JOIN catalog_elements e ON (p.element_key = e.nutrient_key OR p.element_key = e.slug)
WHERE p.element_key IS NOT NULL
ON CONFLICT (element_id, product_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- STEP 5: Seed cooking method → hazardous element links
-- ────────────────────────────────────────────────────────────
-- Auto-link from elements_hazardous JSONB on cooking methods
INSERT INTO cooking_method_elements (cooking_method_id, element_id, relationship, notes)
SELECT
  cm.id,
  e.id,
  'hazardous',
  'Auto-linked from elements_hazardous: ' || haz_key
FROM catalog_cooking_methods cm,
     jsonb_object_keys(cm.elements_hazardous) AS haz_key
JOIN catalog_elements e ON (e.nutrient_key = haz_key OR e.slug = haz_key)
WHERE cm.elements_hazardous IS NOT NULL
  AND cm.elements_hazardous != 'null'::jsonb
  AND cm.elements_hazardous != '{}'::jsonb
ON CONFLICT (cooking_method_id, element_id) DO NOTHING;

-- Also link from elements_beneficial if present
INSERT INTO cooking_method_elements (cooking_method_id, element_id, relationship, notes)
SELECT
  cm.id,
  e.id,
  'beneficial',
  'Auto-linked from elements_beneficial: ' || ben_key
FROM catalog_cooking_methods cm,
     jsonb_object_keys(cm.elements_beneficial) AS ben_key
JOIN catalog_elements e ON (e.nutrient_key = ben_key OR e.slug = ben_key)
WHERE cm.elements_beneficial IS NOT NULL
  AND cm.elements_beneficial != 'null'::jsonb
  AND cm.elements_beneficial != '{}'::jsonb
ON CONFLICT (cooking_method_id, element_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- STEP 6: Grant permissions on all join tables
-- ────────────────────────────────────────────────────────────
GRANT SELECT ON element_supplements TO anon, authenticated;
GRANT SELECT ON element_tests TO anon, authenticated;
GRANT SELECT ON element_products TO anon, authenticated;
GRANT SELECT ON cooking_method_elements TO anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- STEP 7: Verify the links
-- ────────────────────────────────────────────────────────────
SELECT 'element_supplements' as join_table, COUNT(*) as total_links, COUNT(DISTINCT element_id) as elements, COUNT(DISTINCT supplement_id) as linked FROM element_supplements
UNION ALL
SELECT 'element_tests', COUNT(*), COUNT(DISTINCT element_id), COUNT(DISTINCT test_id) FROM element_tests
UNION ALL
SELECT 'element_products', COUNT(*), COUNT(DISTINCT element_id), COUNT(DISTINCT product_id) FROM element_products
UNION ALL
SELECT 'cooking_method_elements', COUNT(*), COUNT(DISTINCT cooking_method_id), COUNT(DISTINCT element_id) FROM cooking_method_elements;
